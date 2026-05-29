const config = window.CAMPUS_BITES_CONFIG || {};
const storedApiUrl = localStorage.getItem("campus-bites-api-url");

const state = {
  apiBaseUrl: normalizeBaseUrl(storedApiUrl || config.apiBaseUrl || "http://127.0.0.1:8000"),
  meals: [],
  query: "",
  sort: "name-asc",
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
  searchInput: document.querySelector("#searchInput"),
  sortSelect: document.querySelector("#sortSelect"),
  messageBox: document.querySelector("#messageBox"),
  menuGrid: document.querySelector("#menuGrid"),
  emptyState: document.querySelector("#emptyState"),
  template: document.querySelector("#mealCardTemplate"),
};

elements.apiBaseUrl.value = state.apiBaseUrl;

elements.refreshButton.addEventListener("click", () => loadMeals());
elements.searchInput.addEventListener("input", (event) => {
  state.query = event.target.value.trim().toLowerCase();
  renderMeals();
});
elements.sortSelect.addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderMeals();
});
elements.saveApiButton.addEventListener("click", () => {
  state.apiBaseUrl = normalizeBaseUrl(elements.apiBaseUrl.value);
  elements.apiBaseUrl.value = state.apiBaseUrl;
  localStorage.setItem("campus-bites-api-url", state.apiBaseUrl);
  loadMeals();
});
elements.cancelEditButton.addEventListener("click", resetForm);
elements.mealForm.addEventListener("submit", submitMeal);

loadMeals();

async function loadMeals() {
  setStatus("Checking API", "pending");
  hideMessage();

  try {
    const response = await fetch(apiPath("/api/v1/meals/"));
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    state.meals = await response.json();
    setStatus("API connected", "online");
    renderMeals();
  } catch (error) {
    state.meals = [];
    setStatus("API offline", "offline");
    renderMeals();
    showMessage(
      `Could not load meals from ${state.apiBaseUrl}. Start the FastAPI backend or update the API URL.`,
      "error",
    );
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
  elements.mealName.focus();
}

function resetForm() {
  elements.mealForm.reset();
  elements.mealId.value = "";
  elements.submitButton.textContent = "Add meal";
  elements.cancelEditButton.hidden = true;
}

function renderMeals() {
  const meals = filteredMeals();
  elements.menuGrid.innerHTML = "";

  meals.forEach((meal) => {
    const card = elements.template.content.firstElementChild.cloneNode(true);
    card.querySelector(".meal-name").textContent = meal.name;
    card.querySelector(".meal-price").textContent = formatCurrency(meal.price);
    card.querySelector(".meal-note").textContent = mealNote(meal);
    card.querySelector(".edit-button").addEventListener("click", () => editMeal(meal));
    card.querySelector(".delete-button").addEventListener("click", () => deleteMeal(meal));
    elements.menuGrid.append(card);
  });

  elements.emptyState.hidden = meals.length > 0;
  updateMetrics();
}

function filteredMeals() {
  const meals = state.meals.filter((meal) => meal.name.toLowerCase().includes(state.query));

  return meals.sort((a, b) => {
    if (state.sort === "price-asc") return a.price - b.price;
    if (state.sort === "price-desc") return b.price - a.price;
    return a.name.localeCompare(b.name);
  });
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

function mealNote(meal) {
  if (meal.price < 8) return "Budget-friendly option for quick campus stops.";
  if (meal.price < 10) return "Balanced pick for lunch between classes.";
  return "Premium meal option for a fuller dining break.";
}

function apiPath(path) {
  return `${state.apiBaseUrl}${path}`;
}

function normalizeBaseUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
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
