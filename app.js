console.log("APP.JS — LocalStorage Stable Version");

const STORAGE_KEY = "daily-habits-v1";

// --------------------
// UI References
// --------------------
const habitForm = document.getElementById("habit-form");
const habitNameInput = document.getElementById("habit-name");
const habitList = document.getElementById("habit-list");
const emptyState = document.getElementById("empty-state");

let habits = [];

// --------------------
// Local Storage Engine
// --------------------
function loadHabits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) habits = parsed;
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

// --------------------
// Helpers
// --------------------
function formatDate(dateString) {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// --------------------
// Rendering
// --------------------
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
    stats.textContent = `Done ${habit.count} time${habit.count === 1 ? "" : "s"} • Last: ${formatDate(habit.lastDone)}`;

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

// --------------------
// Habit Logic
// --------------------
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

// --------------------
// Form Handler
// --------------------
habitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addHabit(habitNameInput.value);
  habitNameInput.value = "";
  habitNameInput.focus();
});

// --------------------
// Install Hint Logic
// --------------------
// --------------------
// Improved Install Hint Logic (Safari + macOS + iOS + Chrome)
// --------------------
window.addEventListener("load", () => {
  const hint = document.getElementById("install-hint");
  const hintText = document.getElementById("hint-text");
  const dismissBtn = document.getElementById("hint-dismiss");
  const footerBtn = document.getElementById("open-install-hint");

  if (!hint || !hintText || !dismissBtn) return;

  // Only show once
  if (localStorage.getItem("install-hint-dismissed")) return;

  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isMacSafari =
    /macintosh/.test(ua) &&
    /safari/.test(ua) &&
    !/chrome/.test(ua) &&
    !/firefox/.test(ua);
  const isChrome =
    /chrome/.test(ua) && !/edge/.test(ua) && !/opera/.test(ua);

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    navigator.standalone === true;

  if (!isStandalone) {
    if (isIOS) {
      hintText.textContent =
        "On iPhone/iPad: tap the Share button → Add to Home Screen.";
    } else if (isMacSafari) {
      hintText.textContent =
        "On macOS Safari: use the menu File → Add to Dock.";
    } else if (isChrome) {
      hintText.textContent =
        "In Chrome: open the ⋮ menu → Install App.";
    } else {
      hintText.textContent =
        "Look for an Install or Add to Home Screen option in your browser.";
    }

    hint.classList.remove("hidden");
  }

  dismissBtn.addEventListener("click", () => {
    hint.classList.add("hidden");
    localStorage.setItem("install-hint-dismissed", "1");
  });

  if (footerBtn) {
    footerBtn.addEventListener("click", () => {
      localStorage.removeItem("install-hint-dismissed");
      hint.classList.remove("hidden");
    });
  }
});

// --------------------
// FORCE RELOADS ON UPDATE
// --------------------
document.addEventListener("DOMContentLoaded", () => {
  loadHabits();
  renderHabits();
});
