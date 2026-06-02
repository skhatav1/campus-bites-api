const config = window.CAMPUS_BITES_CONFIG || {};
const defaultApiUrl = normalizeBaseUrl(config.apiBaseUrl || "http://127.0.0.1:8000");
const storedApiUrl = localStorage.getItem("campus-bites-api-url");

const state = {
  apiBaseUrl: normalizeBaseUrl(storedApiUrl || defaultApiUrl),
  meals: [],
  query: "",
  sort: "recommended",
  filter: "all",
  favorites: readStoredIds("campus-bites-favorites"),
  plan: readStoredIds("campus-bites-plan"),
};

const elements = {
  apiStatus: document.querySelector("#apiStatus"),
  refreshButton: document.querySelector("#refreshButton"),
  mealCount: document.querySelector("#mealCount"),
  averagePrice: document.querySelector("#averagePrice"),
  lowestPrice: document.querySelector("#lowestPrice"),
  mealForm: document.querySelector("#mealForm"),
  mealId: document.querySelector("#mealId"),
  mealName: document.querySelector("#mealName"),
  mealPrice: document.querySelector("#mealPrice"),
  submitButton: document.querySelector("#submitButton"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
  apiBaseUrl: document.querySelector("#apiBaseUrl"),
  saveApiButton: document.querySelector("#saveApiButton"),
  resetApiButton: document.querySelector("#resetApiButton"),
  searchInput: document.querySelector("#searchInput"),
  sortSelect: document.querySelector("#sortSelect"),
  filterButtons: document.querySelectorAll("[data-filter]"),
  messageBox: document.querySelector("#messageBox"),
  menuGrid: document.querySelector("#menuGrid"),
  emptyState: document.querySelector("#emptyState"),
  planList: document.querySelector("#planList"),
  planTotal: document.querySelector("#planTotal"),
  clearPlanButton: document.querySelector("#clearPlanButton"),
  adminTools: document.querySelector(".admin-tools"),
  template: document.querySelector("#mealCardTemplate"),
};

elements.apiBaseUrl.value = state.apiBaseUrl;

elements.refreshButton.addEventListener("click", () => loadMeals());
elements.searchInput.addEventListener("input", (event) => {
  state.query = event.target.value.trim().toLowerCase();
  render();
});
elements.sortSelect.addEventListener("change", (event) => {
  state.sort = event.target.value;
  render();
});
elements.filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    elements.filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    render();
  });
});
elements.saveApiButton.addEventListener("click", () => {
  state.apiBaseUrl = normalizeBaseUrl(elements.apiBaseUrl.value);
  elements.apiBaseUrl.value = state.apiBaseUrl;
  localStorage.setItem("campus-bites-api-url", state.apiBaseUrl);
  loadMeals();
});
elements.resetApiButton.addEventListener("click", () => {
  useDefaultApiUrl();
  loadMeals();
});
elements.cancelEditButton.addEventListener("click", resetForm);
elements.adminTools.addEventListener("toggle", () => {
  document.body.classList.toggle("admin-mode", elements.adminTools.open);
});
elements.clearPlanButton.addEventListener("click", () => {
  state.plan = [];
  persistIds("campus-bites-plan", state.plan);
  renderPlan();
});
elements.mealForm.addEventListener("submit", submitMeal);

loadMeals();

async function loadMeals(allowSavedUrlFallback = true) {
  setStatus("Checking API", "pending");
  hideMessage();

  try {
    const response = await fetch(apiPath("/api/v1/meals/"));
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    state.meals = await response.json();
    state.plan = state.plan.filter((mealId) => state.meals.some((meal) => meal.id === mealId));
    persistIds("campus-bites-plan", state.plan);
    setStatus("API connected", "online");
    render();
  } catch (error) {
    if (allowSavedUrlFallback && hasSavedApiOverride()) {
      useDefaultApiUrl();
      showMessage("Saved API URL failed, so Campus Bites switched back to the deployed API.");
      return loadMeals(false);
    }

    state.meals = [];
    setStatus("API offline", "offline");
    render();
    showMessage(`Could not load meals from ${state.apiBaseUrl}. Open Admin tools to reset the API URL or check the backend.`, "error");
  }
}

async function submitMeal(event) {
  event.preventDefault();
  hideMessage();

  const payload = {
    name: elements.mealName.value.trim(),
    price: Number(elements.mealPrice.value),
  };

  const id = elements.mealId.value;
  const isEditing = Boolean(id);

  if (!payload.name || !Number.isFinite(payload.price) || payload.price <= 0) {
    showMessage("Enter a meal name and a price greater than zero.", "error");
    return;
  }

  elements.submitButton.disabled = true;
  elements.submitButton.textContent = isEditing ? "Saving..." : "Adding...";

  try {
    const response = await fetch(apiPath(isEditing ? `/api/v1/meals/${id}` : "/api/v1/meals/"), {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    resetForm();
    await loadMeals();
    showMessage(isEditing ? "Meal updated." : "Meal added.");
  } catch (error) {
    showMessage("The meal could not be saved. Check the backend connection and try again.", "error");
  } finally {
    elements.submitButton.disabled = false;
    elements.submitButton.textContent = elements.mealId.value ? "Save meal" : "Add meal";
  }
}

async function deleteMeal(meal) {
  const confirmed = window.confirm(`Delete ${meal.name}?`);
  if (!confirmed) return;

  hideMessage();

  try {
    const response = await fetch(apiPath(`/api/v1/meals/${meal.id}`), { method: "DELETE" });
    if (!response.ok && response.status !== 204) {
      throw new Error(`API returned ${response.status}`);
    }

    state.plan = state.plan.filter((mealId) => mealId !== meal.id);
    state.favorites = state.favorites.filter((mealId) => mealId !== meal.id);
    persistIds("campus-bites-plan", state.plan);
    persistIds("campus-bites-favorites", state.favorites);
    await loadMeals();
    showMessage("Meal deleted.");
  } catch (error) {
    showMessage("The meal could not be deleted. Check the backend connection and try again.", "error");
  }
}

function editMeal(meal) {
  elements.mealId.value = meal.id;
  elements.mealName.value = meal.name;
  elements.mealPrice.value = meal.price;
  elements.submitButton.textContent = "Save meal";
  elements.cancelEditButton.hidden = false;
  document.querySelector(".admin-tools").open = true;
  elements.mealName.focus();
}

function resetForm() {
  elements.mealForm.reset();
  elements.mealId.value = "";
  elements.submitButton.textContent = "Add meal";
  elements.cancelEditButton.hidden = true;
}

function render() {
  renderMeals();
  renderPlan();
  updateMetrics();
}

function renderMeals() {
  const meals = filteredMeals();
  elements.menuGrid.innerHTML = "";

  meals.forEach((meal) => {
    const card = elements.template.content.firstElementChild.cloneNode(true);
    const favorite = state.favorites.includes(meal.id);
    const inPlan = state.plan.includes(meal.id);

    card.querySelector(".meal-badge").textContent = mealBadge(meal);
    card.querySelector(".meal-name").textContent = meal.name;
    card.querySelector(".meal-price").textContent = formatCurrency(meal.price);
    card.querySelector(".meal-note").textContent = mealNote(meal);
    card.querySelector(".meal-tags").replaceChildren(...mealTags(meal).map(renderTag));

    const planButton = card.querySelector(".add-plan-button");
    planButton.textContent = inPlan ? "In picks" : "Add to picks";
    planButton.disabled = inPlan;
    planButton.addEventListener("click", () => addToPlan(meal));

    const favoriteButton = card.querySelector(".favorite-button");
    favoriteButton.textContent = favorite ? "♥" : "♡";
    favoriteButton.classList.toggle("saved", favorite);
    favoriteButton.setAttribute("aria-label", favorite ? "Remove favorite" : "Save favorite");
    favoriteButton.addEventListener("click", () => toggleFavorite(meal));

    card.querySelector(".edit-button").addEventListener("click", () => editMeal(meal));
    card.querySelector(".delete-button").addEventListener("click", () => deleteMeal(meal));
    elements.menuGrid.append(card);
  });

  elements.emptyState.hidden = meals.length > 0;
}

function renderPlan() {
  const plannedMeals = state.plan.map((mealId) => state.meals.find((meal) => meal.id === mealId)).filter(Boolean);
  elements.planList.innerHTML = "";

  if (plannedMeals.length === 0) {
    const empty = document.createElement("p");
    empty.className = "plan-empty";
    empty.textContent = "Add meals you are considering and compare the total here.";
    elements.planList.append(empty);
  }

  plannedMeals.forEach((meal) => {
    const item = document.createElement("article");
    item.className = "plan-item";

    const name = document.createElement("strong");
    name.textContent = meal.name;

    const price = document.createElement("span");
    price.textContent = formatCurrency(meal.price);

    const remove = document.createElement("button");
    remove.className = "icon-button";
    remove.type = "button";
    remove.title = "Remove from picks";
    remove.setAttribute("aria-label", `Remove ${meal.name} from picks`);
    remove.textContent = "×";
    remove.addEventListener("click", () => removeFromPlan(meal));

    item.append(name, price, remove);
    elements.planList.append(item);
  });

  const total = plannedMeals.reduce((sum, meal) => sum + Number(meal.price), 0);
  elements.planTotal.textContent = formatCurrency(total);
  elements.clearPlanButton.disabled = plannedMeals.length === 0;
}

function filteredMeals() {
  const meals = state.meals.filter((meal) => {
    const matchesSearch = meal.name.toLowerCase().includes(state.query);
    if (!matchesSearch) return false;
    if (state.filter === "budget") return meal.price < 8;
    if (state.filter === "quick") return meal.price < 10;
    if (state.filter === "hearty") return meal.price >= 9;
    if (state.filter === "favorites") return state.favorites.includes(meal.id);
    return true;
  });

  return meals.sort((a, b) => {
    if (state.sort === "price-asc") return a.price - b.price;
    if (state.sort === "price-desc") return b.price - a.price;
    if (state.sort === "name-asc") return a.name.localeCompare(b.name);
    return recommendationScore(b) - recommendationScore(a);
  });
}

function addToPlan(meal) {
  if (!state.plan.includes(meal.id)) {
    state.plan.push(meal.id);
    persistIds("campus-bites-plan", state.plan);
    render();
  }
}

function removeFromPlan(meal) {
  state.plan = state.plan.filter((mealId) => mealId !== meal.id);
  persistIds("campus-bites-plan", state.plan);
  render();
}

function toggleFavorite(meal) {
  if (state.favorites.includes(meal.id)) {
    state.favorites = state.favorites.filter((mealId) => mealId !== meal.id);
  } else {
    state.favorites.push(meal.id);
  }

  persistIds("campus-bites-favorites", state.favorites);
  render();
}

function updateMetrics() {
  const prices = state.meals.map((meal) => Number(meal.price));
  const total = prices.reduce((sum, price) => sum + price, 0);
  const average = prices.length ? total / prices.length : 0;
  const lowest = prices.length ? Math.min(...prices) : 0;

  elements.mealCount.textContent = state.meals.length;
  elements.averagePrice.textContent = formatCurrency(average);
  elements.lowestPrice.textContent = formatCurrency(lowest);
}

function mealBadge(meal) {
  if (meal.price < 8) return "Budget pick";
  if (meal.price >= 10) return "Hearty meal";
  return "Quick bite";
}

function mealNote(meal) {
  if (meal.price < 8) return "A lighter option when you want to keep lunch affordable.";
  if (meal.price < 10) return "Easy to fit between classes without overthinking it.";
  return "A fuller meal for longer study sessions or late afternoons.";
}

function mealTags(meal) {
  const tags = [];
  if (meal.price < 8) tags.push("Budget");
  if (meal.price < 10) tags.push("Quick");
  if (meal.price >= 9) tags.push("Filling");
  if (/\bwrap|garden|pasta|bowl|salad|primavera\b/i.test(meal.name)) tags.push("Veg-friendly");
  return tags.slice(0, 3);
}

function renderTag(label) {
  const tag = document.createElement("span");
  tag.className = "meal-tag";
  tag.textContent = label;
  return tag;
}

function recommendationScore(meal) {
  const price = Number(meal.price);
  let score = 100 - price * 4;
  if (state.favorites.includes(meal.id)) score += 20;
  if (price >= 7 && price <= 10) score += 8;
  return score;
}

function apiPath(path) {
  return `${state.apiBaseUrl}${path}`;
}

function normalizeBaseUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function hasSavedApiOverride() {
  return Boolean(localStorage.getItem("campus-bites-api-url")) && state.apiBaseUrl !== defaultApiUrl;
}

function useDefaultApiUrl() {
  state.apiBaseUrl = defaultApiUrl;
  elements.apiBaseUrl.value = defaultApiUrl;
  localStorage.removeItem("campus-bites-api-url");
}

function readStoredIds(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.map(Number).filter(Number.isFinite) : [];
  } catch (error) {
    return [];
  }
}

function persistIds(key, ids) {
  localStorage.setItem(key, JSON.stringify([...new Set(ids)]));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function setStatus(label, status) {
  elements.apiStatus.classList.remove("online", "offline");
  if (status === "online" || status === "offline") {
    elements.apiStatus.classList.add(status);
  }
  elements.apiStatus.lastChild.textContent = ` ${label}`;
}

function showMessage(message, type = "success") {
  elements.messageBox.hidden = false;
  elements.messageBox.textContent = message;
  elements.messageBox.classList.toggle("error", type === "error");
}

function hideMessage() {
  elements.messageBox.hidden = true;
  elements.messageBox.textContent = "";
  elements.messageBox.classList.remove("error");
}
