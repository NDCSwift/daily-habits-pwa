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
// Theme (Dark / Light) handling
// --------------------
function applyPreferredTheme() {
  try {
    const storedTheme = localStorage.getItem("theme");
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const theme = storedTheme || (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (err) {
    console.error("Failed to apply theme", err);
  }
}

function setupThemeListener() {
  if (!window.matchMedia) return;

  const mq = window.matchMedia("(prefers-color-scheme: dark)");

  const handler = (event) => {
    // Only auto-switch if the user hasn't explicitly chosen a theme
    if (localStorage.getItem("theme")) return;
    document.documentElement.setAttribute(
      "data-theme",
      event.matches ? "dark" : "light"
    );
  };

  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", handler);
  } else if (typeof mq.addListener === "function") {
    mq.addListener(handler);
  }
}

applyPreferredTheme();
setupThemeListener();

// --------------------
// Theme toggle button (manual override)
// --------------------
const themeToggleBtn = document.getElementById("theme-toggle");
if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);

    themeToggleBtn.textContent = next === "dark" ? "☀️" : "🌙";
  });

  const initial = document.documentElement.getAttribute("data-theme") || "light";
  themeToggleBtn.textContent = initial === "dark" ? "☀️" : "🌙";
}

// --------------------
// Install Hint Logic
// --------------------
function detectInstallEnvironment() {
  const ua = navigator.userAgent || "";
  const uaLower = ua.toLowerCase();

  const isStandalone =
    (window.matchMedia &&
      window.matchMedia("(display-mode: standalone)").matches) ||
    navigator.standalone === true;

  const isSafari =
    /safari/.test(uaLower) &&
    !/chrome/.test(uaLower) &&
    !/crios/.test(uaLower) &&
    !/fxios/.test(uaLower);

  const iosLike = /iphone|ipad|ipod/.test(uaLower);

  // iPadOS 13+ can masquerade as macOS (MacIntel + touch)
  const isIPadOSDesktopUA =
    !iosLike &&
    isSafari &&
    navigator.platform === "MacIntel" &&
    navigator.maxTouchPoints > 1;

  const isIOS = iosLike || isIPadOSDesktopUA;
  const isAndroid = /android/.test(uaLower);
  const isMac = /macintosh/.test(uaLower) && !isIPadOSDesktopUA;
  const isWindows = /windows/.test(uaLower);

  const isChromium =
    /chrome/.test(uaLower) ||
    /crios/.test(uaLower) ||
    /edg\//.test(uaLower);

  const isFirefox = /firefox/.test(uaLower) || /fxios/.test(uaLower);

  let platform = "other";

  if (isIOS && isSafari) {
    platform = "ios-safari";
  } else if (isAndroid && isChromium) {
    platform = "android-chrome";
  } else if (isAndroid && isFirefox) {
    platform = "android-firefox";
  } else if (isMac && isSafari) {
    platform = "mac-safari";
  } else if ((isMac || isWindows) && isChromium) {
    platform = "desktop-chromium"; // Chrome / Edge / Brave, etc.
  } else if ((isMac || isWindows) && isFirefox) {
    platform = "desktop-firefox";
  }

  return {
    platform,
    isStandalone,
  };
}

window.addEventListener("load", () => {
  const hint = document.getElementById("install-hint");
  const hintText = document.getElementById("hint-text");
  const dismissBtn = document.getElementById("hint-dismiss");
  const footerBtn = document.getElementById("open-install-hint");

  if (!hint || !hintText || !dismissBtn) return;

  const { platform, isStandalone } = detectInstallEnvironment();

  if (!isStandalone) {
    let message;

    switch (platform) {
      case "ios-safari":
        message =
          "On iPhone/iPad: tap the Share button, then choose ‘Add to Home Screen’.";
        break;
      case "android-chrome":
        message =
          "On Android Chrome: open the ⋮ menu, then tap ‘Install app’ or ‘Add to Home screen’.";
        break;
      case "android-firefox":
        message =
          "On Android Firefox: open the ⋮ menu, then tap ‘Install’ or ‘Add to Home screen’.";
        break;
      case "mac-safari":
        message =
          "On macOS Safari: open the File menu, then choose ‘Add to Dock’.";
        break;
      case "desktop-chromium":
        message =
          "On desktop Chrome/Edge: use the install icon in the address bar or the ⋮ menu → ‘Install app’.";
        break;
      case "desktop-firefox":
        message =
          "On Firefox: look for an install option in the address bar or use the menu → ‘More tools’ → ‘Install’.";
        break;
      default:
        message =
          "Look for an Install or Add to Home Screen option in your browser.";
        break;
    }

    hintText.textContent = message;

    // Make sure the hint doesn’t dominate the screen on tablets/desktop
    hint.style.maxWidth = "420px";
    hint.style.margin = "0 auto";
    hint.style.padding = "0.75rem 1rem";

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
