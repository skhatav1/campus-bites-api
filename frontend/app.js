const config = window.CAMPUS_BITES_CONFIG || {};
const defaultApiUrl = normalizeBaseUrl(config.apiBaseUrl || "http://127.0.0.1:8000");
const storedApiUrl = localStorage.getItem("campus-bites-api-url");

const state = {
  apiBaseUrl: normalizeBaseUrl(storedApiUrl || defaultApiUrl),
  meals: [],
  loading: false,
  query: "",
  sort: "recommended",
  filter: "all",
  favorites: readStoredIds("campus-bites-favorites"),
  plan: readStoredIds("campus-bites-plan"),
};

const el = {
  apiStatus:       document.querySelector("#apiStatus"),
  refreshButton:   document.querySelector("#refreshButton"),
  mealCount:       document.querySelector("#mealCount"),
  averagePrice:    document.querySelector("#averagePrice"),
  lowestPrice:     document.querySelector("#lowestPrice"),
  mealForm:        document.querySelector("#mealForm"),
  mealId:          document.querySelector("#mealId"),
  mealName:        document.querySelector("#mealName"),
  mealNameError:   document.querySelector("#mealNameError"),
  mealPrice:       document.querySelector("#mealPrice"),
  mealPriceError:  document.querySelector("#mealPriceError"),
  mealDescription: document.querySelector("#mealDescription"),
  mealCategory:    document.querySelector("#mealCategory"),
  submitButton:    document.querySelector("#submitButton"),
  cancelEditButton:document.querySelector("#cancelEditButton"),
  apiBaseUrl:      document.querySelector("#apiBaseUrl"),
  saveApiButton:   document.querySelector("#saveApiButton"),
  resetApiButton:  document.querySelector("#resetApiButton"),
  searchInput:     document.querySelector("#searchInput"),
  sortSelect:      document.querySelector("#sortSelect"),
  filterButtons:   document.querySelectorAll("[data-filter]"),
  messageBox:      document.querySelector("#messageBox"),
  menuGrid:        document.querySelector("#menuGrid"),
  emptyState:      document.querySelector("#emptyState"),
  planList:        document.querySelector("#planList"),
  planTotal:       document.querySelector("#planTotal"),
  clearPlanButton: document.querySelector("#clearPlanButton"),
  adminTools:      document.querySelector(".admin-tools"),
  cardTemplate:    document.querySelector("#mealCardTemplate"),
  skeletonTemplate:document.querySelector("#skeletonCardTemplate"),
  confirmOverlay:  document.querySelector("#confirmOverlay"),
  confirmTitle:    document.querySelector("#confirmTitle"),
  confirmBody:     document.querySelector(".confirm-body"),
  confirmOk:       document.querySelector("#confirmOk"),
  confirmCancel:   document.querySelector("#confirmCancel"),
  toastContainer:  document.querySelector("#toastContainer"),
};

el.apiBaseUrl.value = state.apiBaseUrl;

// ── Event listeners ──────────────────────────────────────────────────────────

el.refreshButton.addEventListener("click", () => loadMeals());

el.searchInput.addEventListener("input", (e) => {
  state.query = e.target.value.trim().toLowerCase();
  render();
});

el.sortSelect.addEventListener("change", (e) => {
  state.sort = e.target.value;
  render();
});

el.filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.filter = btn.dataset.filter;
    el.filterButtons.forEach((b) => b.classList.toggle("active", b === btn));
    render();
  });
});

el.saveApiButton.addEventListener("click", () => {
  state.apiBaseUrl = normalizeBaseUrl(el.apiBaseUrl.value);
  el.apiBaseUrl.value = state.apiBaseUrl;
  localStorage.setItem("campus-bites-api-url", state.apiBaseUrl);
  loadMeals();
});

el.resetApiButton.addEventListener("click", () => {
  useDefaultApiUrl();
  loadMeals();
});

el.cancelEditButton.addEventListener("click", resetForm);

el.adminTools.addEventListener("toggle", () => {
  document.body.classList.toggle("admin-mode", el.adminTools.open);
});

el.clearPlanButton.addEventListener("click", () => {
  state.plan = [];
  persistIds("campus-bites-plan", state.plan);
  renderPlan();
});

el.mealForm.addEventListener("submit", submitMeal);

// Close confirm on overlay click or Escape
el.confirmOverlay.addEventListener("click", (e) => {
  if (e.target === el.confirmOverlay) resolveConfirm(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !el.confirmOverlay.hidden) resolveConfirm(false);
});

// ── Init ─────────────────────────────────────────────────────────────────────

loadMeals();

// ── Data loading ─────────────────────────────────────────────────────────────

async function loadMeals(allowSavedUrlFallback = true) {
  state.loading = true;
  setStatus("Checking API", "pending");
  hideAlert();
  renderSkeletons();

  try {
    const response = await fetch(apiPath("/api/v1/meals/"));
    if (!response.ok) throw new Error(`API returned ${response.status}`);

    state.meals = await response.json();
    state.plan = state.plan.filter((id) => state.meals.some((m) => m.id === id));
    persistIds("campus-bites-plan", state.plan);
    setStatus("API connected", "online");
  } catch (error) {
    if (allowSavedUrlFallback && hasSavedApiOverride()) {
      useDefaultApiUrl();
      showAlert("Saved API URL failed — switched back to the deployed API.");
      state.loading = false;
      return loadMeals(false);
    }
    state.meals = [];
    setStatus("API offline", "offline");
    showAlert(
      `Could not load meals from ${state.apiBaseUrl}. Open Admin tools to reset the API URL or check the backend.`,
      "error",
    );
  } finally {
    state.loading = false;
    el.refreshButton.classList.remove("loading");
    render();
  }
}

// ── Mutations ─────────────────────────────────────────────────────────────────

async function submitMeal(event) {
  event.preventDefault();
  if (!validateForm()) return;

  hideAlert();

  const id = el.mealId.value;
  const isEditing = Boolean(id);
  const payload = {
    name: el.mealName.value.trim(),
    price: Number(el.mealPrice.value),
    description: el.mealDescription.value.trim() || null,
    category: el.mealCategory.value.trim() || null,
  };

  el.submitButton.disabled = true;
  el.submitButton.textContent = isEditing ? "Saving…" : "Adding…";

  try {
    const response = await fetch(
      apiPath(isEditing ? `/api/v1/meals/${id}` : "/api/v1/meals/"),
      {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) throw new Error(`API returned ${response.status}`);

    resetForm();
    await loadMeals();
    toast(isEditing ? "Meal updated." : "Meal added.");
  } catch {
    showAlert("The meal could not be saved. Check the backend connection and try again.", "error");
  } finally {
    el.submitButton.disabled = false;
    el.submitButton.textContent = el.mealId.value ? "Save meal" : "Add meal";
  }
}

async function deleteMeal(meal) {
  const confirmed = await confirm(`Delete "${meal.name}"?`, "This action cannot be undone.");
  if (!confirmed) return;

  hideAlert();

  try {
    const response = await fetch(apiPath(`/api/v1/meals/${meal.id}`), { method: "DELETE" });
    if (!response.ok && response.status !== 204) throw new Error(`API returned ${response.status}`);

    state.plan = state.plan.filter((id) => id !== meal.id);
    state.favorites = state.favorites.filter((id) => id !== meal.id);
    persistIds("campus-bites-plan", state.plan);
    persistIds("campus-bites-favorites", state.favorites);
    await loadMeals();
    toast("Meal deleted.");
  } catch {
    showAlert("The meal could not be deleted. Check the backend connection and try again.", "error");
  }
}

function editMeal(meal) {
  el.mealId.value = meal.id;
  el.mealName.value = meal.name;
  el.mealPrice.value = meal.price;
  el.mealDescription.value = meal.description || "";
  el.mealCategory.value = meal.category || "";
  el.submitButton.textContent = "Save meal";
  el.cancelEditButton.hidden = false;
  document.querySelector(".admin-tools").open = true;
  document.body.classList.add("admin-mode");
  el.mealName.focus();
  clearFieldErrors();
}

function resetForm() {
  el.mealForm.reset();
  el.mealId.value = "";
  el.submitButton.textContent = "Add meal";
  el.cancelEditButton.hidden = true;
  clearFieldErrors();
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function render() {
  renderMeals();
  renderPlan();
  updateMetrics();
}

function renderSkeletons(count = 6) {
  el.menuGrid.setAttribute("aria-busy", "true");
  el.menuGrid.innerHTML = "";
  el.emptyState.hidden = true;
  for (let i = 0; i < count; i++) {
    const skeleton = el.skeletonTemplate.content.firstElementChild.cloneNode(true);
    el.menuGrid.append(skeleton);
  }
}

function renderMeals() {
  if (state.loading) return;
  el.menuGrid.setAttribute("aria-busy", "false");
  const meals = filteredMeals();
  el.menuGrid.innerHTML = "";

  meals.forEach((meal) => {
    const card = el.cardTemplate.content.firstElementChild.cloneNode(true);
    const favorite = state.favorites.includes(meal.id);
    const inPlan = state.plan.includes(meal.id);

    card.querySelector(".meal-badge").textContent = mealBadge(meal);
    card.querySelector(".meal-name").textContent = meal.name;
    card.querySelector(".meal-price").textContent = formatCurrency(meal.price);
    card.querySelector(".meal-note").textContent = meal.description || mealNote(meal);
    card.querySelector(".meal-tags").replaceChildren(...mealTags(meal).map(renderTag));

    const planButton = card.querySelector(".add-plan-button");
    planButton.textContent = inPlan ? "In picks" : "Add to picks";
    planButton.disabled = inPlan;
    planButton.setAttribute("aria-pressed", String(inPlan));
    planButton.addEventListener("click", () => addToPlan(meal));

    const favoriteButton = card.querySelector(".favorite-button");
    favoriteButton.textContent = favorite ? "♥" : "♡";
    favoriteButton.classList.toggle("saved", favorite);
    favoriteButton.setAttribute("aria-label", favorite ? "Remove favorite" : "Save favorite");
    favoriteButton.addEventListener("click", () => toggleFavorite(meal));

    card.querySelector(".edit-button").addEventListener("click", () => editMeal(meal));
    card.querySelector(".delete-button").addEventListener("click", () => deleteMeal(meal));

    el.menuGrid.append(card);
  });

  el.emptyState.hidden = meals.length > 0;
}

function renderPlan() {
  const planned = state.plan
    .map((id) => state.meals.find((m) => m.id === id))
    .filter(Boolean);

  el.planList.innerHTML = "";

  if (planned.length === 0) {
    const empty = document.createElement("p");
    empty.className = "plan-empty";
    empty.textContent = "Add meals you are considering and compare the total here.";
    el.planList.append(empty);
  } else {
    planned.forEach((meal) => {
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
      el.planList.append(item);
    });
  }

  const total = planned.reduce((sum, m) => sum + Number(m.price), 0);
  el.planTotal.textContent = formatCurrency(total);
  el.clearPlanButton.disabled = planned.length === 0;
}

// ── Filtering & sorting ───────────────────────────────────────────────────────

function filteredMeals() {
  const meals = state.meals.filter((meal) => {
    if (!meal.name.toLowerCase().includes(state.query)) return false;
    if (state.filter === "budget")    return meal.price < 8;
    if (state.filter === "quick")     return meal.price >= 8 && meal.price <= 10;
    if (state.filter === "hearty")    return meal.price > 10;
    if (state.filter === "favorites") return state.favorites.includes(meal.id);
    return true;
  });

  return meals.sort((a, b) => {
    if (state.sort === "price-asc")  return a.price - b.price;
    if (state.sort === "price-desc") return b.price - a.price;
    if (state.sort === "name-asc")   return a.name.localeCompare(b.name);
    return recommendationScore(b) - recommendationScore(a);
  });
}

// ── Plan & favorites ──────────────────────────────────────────────────────────

function addToPlan(meal) {
  if (!state.plan.includes(meal.id)) {
    state.plan.push(meal.id);
    persistIds("campus-bites-plan", state.plan);
    render();
  }
}

function removeFromPlan(meal) {
  state.plan = state.plan.filter((id) => id !== meal.id);
  persistIds("campus-bites-plan", state.plan);
  render();
}

function toggleFavorite(meal) {
  if (state.favorites.includes(meal.id)) {
    state.favorites = state.favorites.filter((id) => id !== meal.id);
  } else {
    state.favorites.push(meal.id);
  }
  persistIds("campus-bites-favorites", state.favorites);
  render();
}

// ── Metrics ───────────────────────────────────────────────────────────────────

function updateMetrics() {
  const prices = state.meals.map((m) => Number(m.price));
  const total   = prices.reduce((s, p) => s + p, 0);
  const average = prices.length ? total / prices.length : 0;
  const lowest  = prices.length ? Math.min(...prices) : 0;

  el.mealCount.textContent   = state.meals.length || "0";
  el.averagePrice.textContent = formatCurrency(average);
  el.lowestPrice.textContent  = formatCurrency(lowest);
}

// ── Meal helpers ──────────────────────────────────────────────────────────────

function mealBadge(meal) {
  if (meal.category) return meal.category;
  if (meal.price < 8)  return "Budget pick";
  if (meal.price <= 10) return "Quick bite";
  return "Hearty meal";
}

function mealNote(meal) {
  if (meal.price < 8)   return "A lighter option when you want to keep lunch affordable.";
  if (meal.price <= 10) return "Easy to fit between classes without overthinking it.";
  return "A fuller meal for longer study sessions or late afternoons.";
}

function mealTags(meal) {
  const tags = [];
  if (meal.price < 8)   tags.push("Budget");
  if (meal.price <= 10) tags.push("Quick");
  if (meal.price > 10)  tags.push("Filling");
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

// ── Custom confirm dialog ─────────────────────────────────────────────────────

let _resolveConfirm = null;

function confirm(title, body = "") {
  el.confirmTitle.textContent = title;
  el.confirmBody.textContent  = body;
  el.confirmOverlay.hidden = false;
  el.confirmOk.focus();

  return new Promise((resolve) => {
    _resolveConfirm = resolve;
    el.confirmOk.onclick     = () => resolveConfirm(true);
    el.confirmCancel.onclick  = () => resolveConfirm(false);
  });
}

function resolveConfirm(value) {
  el.confirmOverlay.hidden = true;
  if (_resolveConfirm) {
    _resolveConfirm(value);
    _resolveConfirm = null;
  }
}

// ── Toast notifications ───────────────────────────────────────────────────────

function toast(message, type = "success") {
  const t = document.createElement("div");
  t.className = `toast${type === "error" ? " error" : ""}`;
  t.setAttribute("role", "status");

  const icon = document.createElement("span");
  icon.className = "toast-icon";
  icon.textContent = type === "error" ? "✕" : "✓";

  const msg = document.createElement("span");
  msg.className = "toast-msg";
  msg.textContent = message;

  t.append(icon, msg);
  el.toastContainer.append(t);

  const remove = () => {
    t.classList.add("exiting");
    t.addEventListener("animationend", () => t.remove(), { once: true });
  };

  setTimeout(remove, 4000);
}

// ── Alert banner (persistent, for errors that need action) ────────────────────

function showAlert(message, type = "success") {
  el.messageBox.hidden = false;
  el.messageBox.textContent = message;
  el.messageBox.classList.toggle("error", type === "error");
}

function hideAlert() {
  el.messageBox.hidden = true;
  el.messageBox.textContent = "";
  el.messageBox.classList.remove("error");
}

// ── Form validation ───────────────────────────────────────────────────────────

function validateForm() {
  clearFieldErrors();
  let valid = true;

  const name = el.mealName.value.trim();
  if (!name) {
    setFieldError(el.mealName, el.mealNameError, "Meal name is required.");
    valid = false;
  }

  const price = Number(el.mealPrice.value);
  if (!Number.isFinite(price) || price <= 0) {
    setFieldError(el.mealPrice, el.mealPriceError, "Enter a price greater than $0.00.");
    valid = false;
  }

  return valid;
}

function setFieldError(input, errorEl, message) {
  input.classList.add("invalid");
  errorEl.textContent = message;
}

function clearFieldErrors() {
  [el.mealName, el.mealPrice].forEach((inp) => inp.classList.remove("invalid"));
  [el.mealNameError, el.mealPriceError].forEach((el) => (el.textContent = ""));
}

// ── API helpers ───────────────────────────────────────────────────────────────

function setStatus(label, status) {
  el.apiStatus.classList.remove("online", "offline");
  if (status === "online" || status === "offline") {
    el.apiStatus.classList.add(status);
  }
  el.apiStatus.lastChild.textContent = ` ${label}`;
  if (status === "pending") {
    el.refreshButton.classList.add("loading");
  }
}

function apiPath(path) {
  return `${state.apiBaseUrl}${path}`;
}

function normalizeBaseUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function hasSavedApiOverride() {
  return Boolean(localStorage.getItem("campus-bites-api-url")) &&
    state.apiBaseUrl !== defaultApiUrl;
}

function useDefaultApiUrl() {
  state.apiBaseUrl = defaultApiUrl;
  el.apiBaseUrl.value = defaultApiUrl;
  localStorage.removeItem("campus-bites-api-url");
}

// ── Local storage ─────────────────────────────────────────────────────────────

function readStoredIds(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.map(Number).filter(Number.isFinite) : [];
  } catch {
    return [];
  }
}

function persistIds(key, ids) {
  localStorage.setItem(key, JSON.stringify([...new Set(ids)]));
}

// ── Formatting ────────────────────────────────────────────────────────────────

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(value || 0),
  );
}
