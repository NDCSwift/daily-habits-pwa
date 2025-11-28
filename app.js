/* ==========================================================
   PLATFORM DETECTION
========================================================== */
function detectPlatform() {
  const ua = navigator.userAgent.toLowerCase();

  const isIOS = /iphone|ipod/.test(ua);
  const isIpadOS =
    !isIOS &&
    navigator.platform === "MacIntel" &&
    navigator.maxTouchPoints > 1;

  const isMac = /macintosh/.test(ua) && !isIpadOS;
  const isAndroid = /android/.test(ua);

  const isChrome = /chrome|crios/.test(ua) && !/edge|edgios/.test(ua);
  const isEdge = /edg/.test(ua);
  const isFirefox = /firefox/.test(ua);
  const isSafari =
    /safari/.test(ua) &&
    !isChrome &&
    !isEdge &&
    !/android/.test(ua);

  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    navigator.standalone === true;

  return {
    isIOS,
    isIpadOS,
    isMac,
    isAndroid,
    isChrome,
    isEdge,
    isFirefox,
    isSafari,
    standalone
  };
}

/* ==========================================================
   INSTALL INSTRUCTION ENGINE
========================================================== */
function getInstallInstructions(p) {
  if (p.standalone) return { message: null };

  if (p.isIOS)
    return { message: "On iPhone, tap Share (↑) → “Add to Home Screen”." };

  if (p.isIpadOS)
    return { message: "On iPad, tap Share → “Add to Home Screen”." };

  if (p.isMac && p.isSafari)
    return { message: "On macOS Safari, go to File → “Add to Dock…”" };

  if (p.isAndroid && p.isChrome)
    return { message: "In Chrome on Android, tap ⋮ → “Install App”." };

  if (p.isChrome && p.isMac)
    return { message: "In Chrome on macOS, tap ⋮ → “Install Daily Habits…”" };

  if (p.isEdge)
    return { message: "In Edge, go to ⋯ → Apps → Install this site." };

  if (p.isFirefox)
    return { message: "Firefox does not support installation. Try Chrome or Safari." };

  return { message: "Look for the install option in your browser address bar or menu." };
}

/* ==========================================================
   MOTIVATION MESSAGES
========================================================== */
function motivationalMessage(count) {
  if (count === 1) return "Great start! 🌱";
  if (count === 3) return "You're building momentum! 💡";
  if (count === 5) return "Habit forming! 🔥";
  if (count === 10) return "Double digits! Amazing work! 💪";
  if (count % 20 === 0) return `🔥 ${count} completions! You're unstoppable.`;
  return null;
}

/* ==========================================================
   CONFETTI BURST
========================================================== */
function confettiBurst() {
  const emoji = ["✨", "🌱", "🔥", "💪"];
  const el = document.createElement("div");
  el.textContent = emoji[Math.floor(Math.random() * emoji.length)];
  el.style.position = "fixed";
  el.style.left = (Math.random() * 80 + 10) + "%";
  el.style.top = "50%";
  el.style.fontSize = "2rem";
  el.style.animation = "confettiPop 700ms ease";
  el.style.pointerEvents = "none";

  document.body.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

/* ==========================================================
   HAPTIC FEEDBACK
========================================================== */
function tapFeedback() {
  if (navigator.vibrate) navigator.vibrate(10);
}

/* ==========================================================
   HABIT STORAGE
========================================================== */
const STORAGE_KEY = "daily-habits-v1";
let habits = [];

function loadHabits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) habits = parsed;
  } catch {}
}

function saveHabits() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  } catch {}
}

function formatDate(dateString) {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}

/* ==========================================================
   DOM ELEMENTS
========================================================== */
const habitForm = document.getElementById("habit-form");
const habitNameInput = document.getElementById("habit-name");
const habitList = document.getElementById("habit-list");
const emptyState = document.getElementById("empty-state");

/* ==========================================================
   RENDER HABITS
========================================================== */
function renderHabits() {
  habitList.innerHTML = "";

  if (habits.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  habits.forEach(habit => {
    const li = document.createElement("li");
    li.className = "habit-item fade-in";

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
    doneButton.textContent = "Done today";
    doneButton.addEventListener("click", () => {
      tapFeedback();
      markHabitDone(habit.id);
    });

    const deleteButton = document.createElement("button");
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
    lastDone: null
  };

  habits.unshift(newHabit);
  saveHabits();
  renderHabits();
}

function markHabitDone(id) {
  const index = habits.findIndex(h => h.id === id);
  if (index === -1) return;

  habits[index].count++;
  habits[index].lastDone = new Date().toISOString();

  saveHabits();
  renderHabits();
  confettiBurst();

  const msg = motivationalMessage(habits[index].count);
  if (msg) alert(msg);
}

function deleteHabit(id) {
  habits = habits.filter(h => h.id !== id);
  saveHabits();
  renderHabits();
}

/* ==========================================================
   INSTALL MODAL + FOOTER BUTTON
========================================================== */
(function () {
  const platform = detectPlatform();
  const { message } = getInstallInstructions(platform);

  const hint = document.getElementById("install-hint");
  const hintText = document.getElementById("hint-text");
  const dismiss = document.getElementById("hint-dismiss");

  if (!hint || !hintText) return;

  if (!localStorage.getItem("install-hint-dismissed") && message) {
    hintText.textContent = message;
    hint.classList.remove("hidden");
  }

  dismiss.addEventListener("click", () => {
    hint.classList.add("hidden");
    localStorage.setItem("install-hint-dismissed", "1");
  });

  document.getElementById("open-install-hint").addEventListener("click", () => {
    localStorage.removeItem("install-hint-dismissed");
    hintText.textContent = getInstallInstructions(detectPlatform()).message;
    hint.classList.remove("hidden");
  });
})();

/* ==========================================================
   DARK MODE TOGGLE
========================================================== */
(function () {
  const toggle = document.getElementById("theme-toggle");
  const root = document.documentElement;

  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (saved === "dark" || (!saved && prefersDark)) {
    root.classList.add("dark");
    toggle.textContent = "☀️";
  }

  toggle.addEventListener("click", () => {
    const isDark = root.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    toggle.textContent = isDark ? "☀️" : "🌙";
  });
})();

/* ==========================================================
   INIT
========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  loadHabits();
  renderHabits();
});
