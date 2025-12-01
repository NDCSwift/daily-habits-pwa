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
   INSTALL INSTRUCTIONS
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
    return { message: "In Edge, open ⋯ → Apps → Install." };

  if (p.isFirefox)
    return { message: "Firefox doesn’t support installing PWAs yet." };

  return { message: "Check your browser menu for an Install option." };
}

/* ==========================================================
   INDEXEDDB STORAGE ENGINE (Safari-safe)
========================================================== */
let habits = [];
const DB_NAME = "daily-habits-db";
const STORE_NAME = "habits";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadHabits() {
  const db = await openDB();

  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      habits = request.result || [];
      resolve();
    };
  });
}

async function saveHabits() {
  const db = await openDB();

  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    store.clear();
    habits.forEach((h) => store.put(h));
    tx.oncomplete = resolve;
  });
}

/* ==========================================================
   CONFETTI & HAPTICS
========================================================== */
function confettiBurst() {
  const emoji = ["✨", "🌱", "🔥", "💪"];
  const el = document.createElement("div");

  el.textContent = emoji[Math.floor(Math.random() * emoji.length)];
  el.className = "confetti";
  el.style.left = (Math.random() * 80 + 10) + "%";

  document.body.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

function tapFeedback() {
  if (navigator.vibrate) navigator.vibrate(10);
}

/* ==========================================================
   HABIT HELPERS
========================================================== */
function formatDate(dateString) {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}

/* ==========================================================
   RENDER UI
========================================================== */
const habitForm = document.getElementById("habit-form");
const habitNameInput = document.getElementById("habit-name");
const habitList = document.getElementById("habit-list");
const emptyState = document.getElementById("empty-state");

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
    doneButton.addEventListener("click", async () => {
      tapFeedback();
      await markHabitDone(habit.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "✕";
    deleteButton.className = "delete-btn";
    deleteButton.addEventListener("click", async () => {
      await deleteHabit(habit.id);
    });

    actions.appendChild(doneButton);
    actions.appendChild(deleteButton);

    li.appendChild(meta);
    li.appendChild(actions);

    habitList.appendChild(li);
  });
}

/* ==========================================================
   HABIT CRUD
========================================================== */
async function addHabit(name) {
  const trimmed = name.trim();
  if (!trimmed) return;

  const newHabit = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    name: trimmed,
    count: 0,
    lastDone: null
  };

  habits.unshift(newHabit);
  await saveHabits();
  renderHabits();
}

async function markHabitDone(id) {
  const index = habits.findIndex((h) => h.id === id);
  if (index === -1) return;

  habits[index].count++;
  habits[index].lastDone = new Date().toISOString();

  await saveHabits();
  renderHabits();
  confettiBurst();
}

async function deleteHabit(id) {
  habits = habits.filter(h => h.id !== id);
  await saveHabits();
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

  if (!message) return;

  if (!localStorage.getItem("install-hint-dismissed")) {
    hintText.textContent = message;
    hint.classList.remove("hidden");
  }

  dismiss.addEventListener("click", () => {
    hint.classList.add("hidden");
    localStorage.setItem("install-hint-dismissed", "1");
  });

  document.getElementById("open-install-hint")
    .addEventListener("click", () => {
      localStorage.removeItem("install-hint-dismissed");

      const fresh = getInstallInstructions(detectPlatform()).message;
      hintText.textContent = fresh;
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
document.addEventListener("DOMContentLoaded", async () => {
  await loadHabits();
  renderHabits();
});
