const STORAGE_KEY = "daily-habits-v1";

const habitForm = document.getElementById("habit-form");
const habitNameInput = document.getElementById("habit-name");
const habitList = document.getElementById("habit-list");
const emptyState = document.getElementById("empty-state");

let habits = [];

function loadHabits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      habits = parsed;
    }
  } catch (err) {
    console.error("Failed to load habits", err);
  }
}

function saveHabits() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  } catch (err) {
    console.error("Failed to save habits", err);
  }
}

function formatDate(dateString) {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function renderHabits() {
  habitList.innerHTML = "";

  if (habits.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  habits.forEach((habit) => {
    const li = document.createElement("li");
    li.className = "habit-item";

    const meta = document.createElement("div");
    meta.className = "habit-meta";

    const name = document.createElement("span");
    name.className = "habit-name";
    name.textContent = habit.name;

    const stats = document.createElement("span");
    stats.className = "habit-stats";
    stats.textContent = `Done ${habit.count} time${
      habit.count === 1 ? "" : "s"
    } • Last: ${formatDate(habit.lastDone)}`;

    meta.appendChild(name);
    meta.appendChild(stats);

    const actions = document.createElement("div");
    actions.className = "habit-actions";

    const doneButton = document.createElement("button");
    doneButton.type = "button";
    doneButton.textContent = "Done today";
    doneButton.addEventListener("click", () => markHabitDone(habit.id));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "✕";
    deleteButton.className = "delete-btn";
    deleteButton.addEventListener("click", () => deleteHabit(habit.id));

    actions.appendChild(doneButton);
    actions.appendChild(deleteButton);

    li.appendChild(meta);
    li.appendChild(actions);

    habitList.appendChild(li);
  });
}

function addHabit(name) {
  const trimmed = name.trim();
  if (!trimmed) return;

  const newHabit = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    name: trimmed,
    count: 0,
    lastDone: null,
  };

  habits.unshift(newHabit);
  saveHabits();
  renderHabits();
}

function markHabitDone(id) {
  const index = habits.findIndex((h) => h.id === id);
  if (index === -1) return;

  const now = new Date().toISOString();
  habits[index] = {
    ...habits[index],
    count: habits[index].count + 1,
    lastDone: now,
  };

  saveHabits();
  renderHabits();
}

function deleteHabit(id) {
  habits = habits.filter((h) => h.id !== id);
  saveHabits();
  renderHabits();
}

habitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addHabit(habitNameInput.value);
  habitNameInput.value = "";
  habitNameInput.focus();
});

document.addEventListener("DOMContentLoaded", () => {
  loadHabits();
  renderHabits();
});

(function () {
  const hint = document.getElementById("install-hint");
  const hintText = document.getElementById("hint-text");
  const dismissBtn = document.getElementById("hint-dismiss");

  // Only show once
  if (localStorage.getItem("install-hint-dismissed")) return;

  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;

  if (isStandalone) return; // Already installed

  // Show correct instruction based on platform
  if (isIOS) {
    hintText.textContent = "On iPhone, tap the Share button and choose 'Add to Home Screen'.";
    hint.classList.remove("hidden");
  } else if (navigator.userAgent.includes("Chrome")) {
    hintText.textContent = "In Chrome, open the menu and tap 'Install app'.";
    hint.classList.remove("hidden");
  } else {
    hintText.textContent = "Look for the Install button in your browser’s address bar.";
    hint.classList.remove("hidden");
  }

  dismissBtn.addEventListener("click", () => {
    hint.classList.add("hidden");
    localStorage.setItem("install-hint-dismissed", "1");
  });
})();
// Footer button to manually open the install hint
document.getElementById("open-install-hint")?.addEventListener("click", () => {
  localStorage.removeItem("install-hint-dismissed"); // ensure it always opens
  const hint = document.getElementById("install-hint");
  const hintText = document.getElementById("hint-text");

  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);

  if (isIOS) {
    hintText.textContent =
      "On iPhone, tap the Share button and choose 'Add to Home Screen'.";
  } else if (navigator.userAgent.includes("Chrome")) {
    hintText.textContent =
      "In Chrome, open the browser menu and tap 'Install app'.";
  } else {
    hintText.textContent =
      "Look for the install button in your browser’s address bar.";
  }

  hint.classList.remove("hidden");
});
