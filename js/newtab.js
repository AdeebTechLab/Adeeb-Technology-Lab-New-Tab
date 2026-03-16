// Externalized script for new-tab page

// Helper to open links from data-href attributes
function attachDataHrefHandlers() {
  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-href]');
    if (!el) return;
    const url = el.getAttribute('data-href');
    // open in same tab
    window.location.href = url;
  });
}

/* CLOCK */
function updateClock() {
  let now = new Date();
  const hrs = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const sec = String(now.getSeconds()).padStart(2, '0');
  const hrsEl = document.getElementById("hrs");
  const minEl = document.getElementById("min");
  const secEl = document.getElementById("sec");
  if (hrsEl) hrsEl.innerText = hrs;
  if (minEl) minEl.innerText = min;
  if (secEl) secEl.innerText = sec;

  const dateEl = document.getElementById("todayDate");
  if (dateEl) {
    dateEl.innerText = now.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }
}

/* SEARCH FUNCTION */
function attachSearchHandlers() {
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  if (!searchInput) return;

  function runSearch() {
    const q = searchInput.value.trim();
    if (q) window.location.href = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', runSearch);
  }

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      runSearch();
    }
  });
}

/* VOICE SEARCH */
function attachVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const voiceBtn = document.getElementById("voiceBtn");
  const searchInput = document.getElementById("searchInput");
  if (!voiceBtn || !searchInput) return;

  if (SpeechRecognition) {
    const recog = new SpeechRecognition();
    recog.lang = 'en-US';
    voiceBtn.addEventListener('click', () => recog.start());
    recog.onresult = (e) => {
      searchInput.value = e.results[0][0].transcript;
      const q = searchInput.value.trim();
      if (q) window.location.href = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    };
  } else {
    voiceBtn.style.display = "none";
  }
}

/* CAMERA SEARCH + AI MODE */
function attachCameraAndAiMode() {
  const cameraBtn = document.getElementById('cameraBtn');
  const aiModeBtn = document.getElementById('aiModeBtn');
  const searchInput = document.getElementById('searchInput');

  if (cameraBtn) {
    cameraBtn.addEventListener('click', function () {
      // Google Lens web entry point
      window.location.href = 'https://lens.google.com/';
    });
  }

  if (aiModeBtn) {
    aiModeBtn.addEventListener('click', function () {
      const q = searchInput ? searchInput.value.trim() : '';
      if (q) {
        // AI-style Google results with query
        window.location.href = `https://www.google.com/search?q=${encodeURIComponent(q)}&udm=50`;
      } else {
        window.location.href = 'https://gemini.google.com/';
      }
    });
  }
}

/* LOCATION & WEATHER */
function fetchOpenMeteoWeather() {
  const url = "https://api.open-meteo.com/v1/forecast?latitude=29.3956&longitude=71.6833&current_weather=true";
  fetch(url)
    .then(res => res.json())
    .then(data => {
      const w = data.current_weather;
      const tv = document.getElementById("tempVal");
      if (tv) tv.innerText = Math.round(w.temperature) + "Â°C";
    })
    .catch(err => {
      console.error(err);
      const loc = document.getElementById("location");
      if (loc) loc.innerText = "Weather error";
    });
}

/* INIT on DOM ready */
function initNewTab() {
  attachDataHrefHandlers();
  attachSearchHandlers();
  attachVoice();
  attachCameraAndAiMode();
  fetchOpenMeteoWeather();
  updateClock();
  setInterval(updateClock, 1000);
  loadPhoneUI();
  initTheme();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNewTab);
} else {
  initNewTab();
}

/* Load Phone UI (inject Phone/index.html into #phone-root) */
function loadPhoneUI() {
  const root = document.getElementById('phone-root');
  if (!root) return;

  // Add Phone stylesheet
  const phoneCss = document.createElement('link');
  phoneCss.rel = 'stylesheet';
  phoneCss.href = 'Phone/index.css';
  document.head.appendChild(phoneCss);

  fetch('Phone/index.html')
    .then(r => r.text())
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const appContent = doc.querySelector('.app-content') || doc.body;

      // Rewrite relative asset paths inside the injected content
      const elements = appContent.querySelectorAll('[src], [href], [style]');
      elements.forEach(el => {
        if (el.hasAttribute('src')) {
          const v = el.getAttribute('src');
          if (v && !v.match(/^https?:|^\//) && !v.startsWith('Phone/')) el.setAttribute('src', 'Phone/' + v);
        }
        if (el.hasAttribute('href')) {
          const v = el.getAttribute('href');
          if (v && !v.match(/^https?:|^\//) && !v.startsWith('Phone/')) el.setAttribute('href', 'Phone/' + v);
        }
        if (el.hasAttribute('style')) {
          let s = el.getAttribute('style');
          s = s.replace(/url\((?:"|'|)([^)"']+)(?:"|'|)\)/g, (m, p1) => {
            if (p1.match(/^https?:|^\//) || p1.startsWith('Phone/')) return `url(${p1})`;
            return `url(Phone/${p1})`;
          });
          el.setAttribute('style', s);
        }
      });

      // Also fix inline img/backgrounds by walking innerHTML for url(...) occurrences
      let contentHTML = appContent.innerHTML.replace(/url\((?:"|'|)([^)"']+)(?:"|'|)\)/g, (m, p1) => {
        if (p1.match(/^https?:|^\//) || p1.startsWith('Phone/')) return `url(${p1})`;
        return `url(Phone/${p1})`;
      });

      // Set injected content
      root.innerHTML = contentHTML;

      // Load Phone script (index.js) after injection
      const phoneScript = document.createElement('script');
      phoneScript.src = 'Phone/index.js';
      phoneScript.defer = true;
      document.body.appendChild(phoneScript);
    })
    .catch(err => {
      console.error('Failed to load Phone UI:', err);
      root.innerText = 'Phone UI failed to load.';
    });
}





/* THEME TOGGLE AND SETTINGS */
function applyTheme(pref) {
  // pref can be 'auto', 'light', or 'dark'
  let useLight;
  if (pref === 'auto' || !pref) {
    useLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  } else {
    useLight = pref === 'light';
  }

  if (useLight) document.body.classList.add('light-theme');
  else document.body.classList.remove('light-theme');

  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.classList.toggle('fa-sun', !useLight);
    icon.classList.toggle('fa-moon', useLight);
  }
}

function initTheme() {
  const btn = document.getElementById('themeToggleBtn');

  // Apply saved theme on load (default auto)
  const saved = localStorage.getItem('preferred_theme') || 'auto';
  applyTheme(saved);

  if (btn) {
    btn.addEventListener('click', () => {
      // manual toggle cycles between light/dark and clears 'auto'
      const current = document.body.classList.contains('light-theme') ? 'light' : 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      localStorage.setItem('preferred_theme', next);
      applyTheme(next);
    });
  }

  // listen to system preference changes when in auto mode
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', () => {
    const pref = localStorage.getItem('preferred_theme') || 'auto';
    if (pref === 'auto') {
      applyTheme('auto');
    }
  });
}

// SETTINGS MODAL
function openSettings() {
  const modal = document.getElementById('settingsModal');
  if (!modal) return;
  loadSettings();
  modal.classList.add('active');
  // close when clicking outside content
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeSettings();
  }, { once: true });
}

function closeSettings() {
  const modal = document.getElementById('settingsModal');
  if (!modal) return;
  modal.classList.remove('active');
}

function loadSettings() {
  const pref = localStorage.getItem('preferred_theme') || 'auto';
  const radios = document.querySelectorAll('input[name="themePref"]');
  radios.forEach(r => r.checked = (r.value === pref));
}

function saveSettings() {
  const radios = document.querySelectorAll('input[name="themePref"]');
  let chosen = 'auto';
  radios.forEach(r => { if (r.checked) chosen = r.value; });
  localStorage.setItem('preferred_theme', chosen);
  applyTheme(chosen);
  closeSettings();
}

function initGoogleAppsMenu() {
  const btn = document.getElementById('googleBtn');
  const menu = document.getElementById('googleAppsMenu');
  if (!btn || !menu) return;

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    menu.classList.toggle('active');
  });

  menu.addEventListener('click', function (e) {
    const item = e.target.closest('.google-app-item');
    if (!item) return;
    const url = item.getAttribute('data-url');
    if (url) window.location.href = url;
  });

  document.addEventListener('click', function (e) {
    if (!menu.classList.contains('active')) return;
    if (!e.target.closest('.google-apps-wrap')) {
      menu.classList.remove('active');
    }
  });
}

function initTaskDrawer() {
  const openBtn = document.getElementById('todoBtn');
  const overlay = document.getElementById('taskDrawerOverlay');
  const closeBtn = document.getElementById('closeTaskDrawer');
  const input = document.getElementById('taskInput');
  const addBtn = document.getElementById('addTaskBtn');
  const list = document.getElementById('taskList');
  const storageKey = 'daily_tasks_v1';

  if (!openBtn || !overlay || !input || !addBtn || !list) return;

  function loadLocalTasks() {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function useChromeStorage() {
    return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  }

  function loadTasks(callback) {
    const localTasks = loadLocalTasks();
    if (!useChromeStorage()) {
      callback(localTasks);
      return;
    }

    chrome.storage.local.get([storageKey], function (result) {
      const chromeTasks = result && Array.isArray(result[storageKey]) ? result[storageKey] : null;
      const tasks = chromeTasks || localTasks;
      localStorage.setItem(storageKey, JSON.stringify(tasks));
      callback(tasks);
    });
  }

  function saveTasks(tasks, callback) {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
    if (!useChromeStorage()) {
      if (callback) callback();
      return;
    }
    chrome.storage.local.set({ [storageKey]: tasks }, function () {
      if (callback) callback();
    });
  }

  function renderTasks() {
    loadTasks(function (tasks) {
      if (!tasks.length) {
        list.innerHTML = '<div class="task-text" style="text-align:center; opacity:.7; padding:10px 0;">No tasks yet.</div>';
        return;
      }

      list.innerHTML = tasks.map(task => {
        const safeText = String(task.text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const doneClass = task.done ? 'done' : '';
        const doneIcon = task.done ? 'fa-check' : 'fa-circle';
        return `
          <div class="task-item" data-id="${task.id}">
            <button class="task-check-btn ${doneClass}" type="button" title="Complete"><i class="fa-solid ${doneIcon}"></i></button>
            <div class="task-text ${doneClass}">${safeText}</div>
            <button class="task-delete-btn" type="button" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>
        `;
      }).join('');
    });
  }

  function addTask() {
    const text = input.value.trim();
    if (!text) return;
    loadTasks(function (tasks) {
      tasks.unshift({ id: Date.now(), text, done: false });
      saveTasks(tasks, function () {
        input.value = '';
        renderTasks();
        input.focus();
      });
    });
  }

  function toggleTask(id) {
    loadTasks(function (tasks) {
      const updated = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
      saveTasks(updated, renderTasks);
    });
  }

  function deleteTask(id) {
    loadTasks(function (tasks) {
      const updated = tasks.filter(t => t.id !== id);
      saveTasks(updated, renderTasks);
    });
  }

  function openDrawer() {
    overlay.classList.add('active');
    input.focus();
  }

  function closeDrawer() {
    overlay.classList.remove('active');
  }

  openBtn.addEventListener('click', function (e) {
    e.preventDefault();
    openDrawer();
  });

  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeDrawer();
  });

  addBtn.addEventListener('click', addTask);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') addTask();
  });

  list.addEventListener('click', function (e) {
    const item = e.target.closest('.task-item');
    if (!item) return;
    const id = Number(item.getAttribute('data-id'));
    if (!id) return;
    if (e.target.closest('.task-check-btn')) toggleTask(id);
    if (e.target.closest('.task-delete-btn')) deleteTask(id);
  });

  renderTasks();
}

function initAiToolsDrawer() {
  const openBtn = document.getElementById('aiToolsBtn');
  const overlay = document.getElementById('aiDrawerOverlay');
  const closeBtn = document.getElementById('closeAiDrawer');
  const nameInput = document.getElementById('aiToolName');
  const urlInput = document.getElementById('aiToolUrl');
  const addBtn = document.getElementById('addAiToolBtn');
  const resetBtn = document.getElementById('resetAiToolsBtn');
  const list = document.getElementById('aiToolList');
  const storageKey = 'ai_tools_v1';

  if (!openBtn || !overlay || !nameInput || !urlInput || !addBtn || !list) return;

  const defaults = [
    { name: 'ChatGPT', url: 'https://chat.openai.com' },
    { name: 'Google Gemini', url: 'https://gemini.google.com' },
    { name: 'Claude', url: 'https://claude.ai' },
    { name: 'Perplexity', url: 'https://www.perplexity.ai' },
    { name: 'Microsoft Copilot', url: 'https://copilot.microsoft.com' },
    { name: 'Midjourney', url: 'https://www.midjourney.com' },
    { name: 'Canva AI', url: 'https://www.canva.com/ai-image-generator/' },
    { name: 'Notion AI', url: 'https://www.notion.so/product/ai' }
  ];

  function useChromeStorage() {
    return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  }

  function loadLocalTools() {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return defaults.slice();
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : defaults.slice();
    } catch {
      return defaults.slice();
    }
  }

  function loadTools(callback) {
    const localTools = loadLocalTools();
    if (!useChromeStorage()) {
      callback(localTools);
      return;
    }
    chrome.storage.local.get([storageKey], function (result) {
      const tools = result && Array.isArray(result[storageKey]) ? result[storageKey] : localTools;
      localStorage.setItem(storageKey, JSON.stringify(tools));
      callback(tools);
    });
  }

  function saveTools(tools, callback) {
    localStorage.setItem(storageKey, JSON.stringify(tools));
    if (!useChromeStorage()) {
      if (callback) callback();
      return;
    }
    chrome.storage.local.set({ [storageKey]: tools }, function () {
      if (callback) callback();
    });
  }

  function getToolIcon(url) {
    try {
      const host = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
    } catch {
      return `https://www.google.com/s2/favicons?domain=google.com&sz=64`;
    }
  }

  function renderTools() {
    loadTools(function (tools) {
      list.innerHTML = tools.map(tool => {
        const safeName = String(tool.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const safeIcon = String(tool.icon || getToolIcon(tool.url || 'https://google.com')).replace(/"/g, '&quot;');
        return `
          <div class="ai-item" data-id="${tool.id}">
            <img class="ai-tool-icon" src="${safeIcon}" alt="${safeName}">
            <button class="ai-open-btn" type="button">
              <span class="ai-open-name">${safeName}</span>
            </button>
            <button class="ai-delete-btn" type="button" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>
        `;
      }).join('');
    });
  }

  function normalizeTool(name, url) {
    const trimmedName = name.trim();
    let trimmedUrl = url.trim();
    if (!trimmedName || !trimmedUrl) return null;
    if (!/^https?:\/\//i.test(trimmedUrl)) trimmedUrl = 'https://' + trimmedUrl;
    return { id: Date.now(), name: trimmedName, url: trimmedUrl, icon: getToolIcon(trimmedUrl) };
  }

  function addTool() {
    const tool = normalizeTool(nameInput.value, urlInput.value);
    if (!tool) return;
    loadTools(function (tools) {
      tools.unshift(tool);
      saveTools(tools, function () {
        nameInput.value = '';
        urlInput.value = '';
        renderTools();
        nameInput.focus();
      });
    });
  }

  function deleteTool(id) {
    loadTools(function (tools) {
      const updated = tools.filter(t => t.id !== id);
      saveTools(updated, renderTools);
    });
  }

  function resetTools() {
    const seeded = defaults.map((t, i) => ({
      id: Date.now() + i,
      name: t.name,
      url: t.url,
      icon: getToolIcon(t.url)
    }));
    saveTools(seeded, renderTools);
  }

  function openDrawer() {
    overlay.classList.add('active');
    nameInput.focus();
  }

  function closeDrawer() {
    overlay.classList.remove('active');
  }

  openBtn.addEventListener('click', function (e) {
    e.preventDefault();
    openDrawer();
  });

  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeDrawer();
  });

  addBtn.addEventListener('click', addTool);
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      if (confirm('Reset AI tools to default list?')) resetTools();
    });
  }
  urlInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') addTool();
  });
  nameInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') addTool();
  });

  list.addEventListener('click', function (e) {
    const item = e.target.closest('.ai-item');
    if (!item) return;
    const id = Number(item.getAttribute('data-id'));
    if (!id) return;
    if (e.target.closest('.ai-delete-btn')) {
      deleteTool(id);
      return;
    }
    if (e.target.closest('.ai-open-btn')) {
      loadTools(function (tools) {
        const tool = tools.find(t => t.id === id);
        if (tool && tool.url) window.location.href = tool.url;
      });
    }
  });

  loadTools(function (tools) {
    if (!tools.length) {
      const seeded = defaults.map((t, i) => ({ ...t, id: Date.now() + i }));
      saveTools(seeded, renderTools);
      return;
    }
    const normalized = tools.map((t, i) => ({
      id: typeof t.id === 'number' ? t.id : Date.now() + i,
      name: t.name || 'AI Tool',
      url: t.url || 'https://google.com',
      icon: t.icon || getToolIcon(t.url || 'https://google.com')
    }));
    saveTools(normalized, renderTools);
  });
}

function initLiveChatPopup() {
  const btn = document.getElementById('liveChatBtn');
  const overlay = document.getElementById('liveChatOverlay');
  const closeBtn = document.getElementById('closeLiveChat');
  const frame = document.getElementById('liveChatFrame');
  const url = 'https://salmanadeeb.wixsite.com/livechat';

  if (!btn || !overlay || !frame) return;

  function openPopup() {
    frame.src = url;
    overlay.classList.add('active');
  }

  function closePopup() {
    overlay.classList.remove('active');
    frame.src = 'about:blank';
  }

  btn.addEventListener('click', function (e) {
    e.preventDefault();
    openPopup();
  });

  if (closeBtn) closeBtn.addEventListener('click', closePopup);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closePopup();
  });
}

document.addEventListener("DOMContentLoaded", function () {

  const links = {
    extensionBtn: "https://chromewebstore.google.com/search/Adeeb%20Technology%20Lab",
    softwareBtn: "https://apps.microsoft.com/search/publisher?name=Adeeb+Technology+Lab&hl=en-GB&gl=PK",
    mobileBtn: "https://play.google.com/store/apps/dev?id=6026600562723209564"
  };

  Object.keys(links).forEach(function (id) {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("click", function () {
      window.location.href = links[id];
    });

  });

  // settings button
  const settingsBtnEl = document.getElementById('settingsBtn');
  if (settingsBtnEl) settingsBtnEl.addEventListener('click', openSettings);

  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
  if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', saveSettings);
  if (cancelSettingsBtn) cancelSettingsBtn.addEventListener('click', closeSettings);
  initGoogleAppsMenu();
  initTaskDrawer();
  initAiToolsDrawer();
  initLiveChatPopup();

  /* SHORTCUTS LOGIC */
  const shortcutsGrid = document.querySelector('.shortcuts-grid');
  const shortcutModal = document.getElementById('shortcutModal');
  const saveShortcutBtn = document.getElementById('saveShortcutBtn');
  const cancelShortcutBtn = document.getElementById('cancelShortcutBtn');
  const nameInput = document.getElementById('shortcutName');
  const urlInput = document.getElementById('shortcutUrl');
  let isEditing = false;
  let editingIndex = -1;

  // Initial Default Shortcuts
  const defaultShortcuts = [
    { name: "Free PSD", url: "https://salmanadeeb.wixsite.com/photoshop", iconClass: "fa-solid fa-paintbrush", color: "#2563eb" },
    { name: "Free Softwares", url: "https://adeeb-technology-lab.blogspot.com/?m=1", iconClass: "fa-solid fa-blog", color: "#f97316" },
    { name: "AutoCAD", url: "https://salmanadeeb.wixsite.com/autocad", iconClass: "fa-solid fa-drafting-compass", color: "#22c55e" },
    { name: "Arduino Kit", url: "https://arduinokituse.blogspot.com/", iconClass: "fa-solid fa-microchip", color: "#0ea5e9" },
    { name: "MS Office Data", url: "https://microsoft-office-data.blogspot.com/?m=1", iconClass: "fa-solid fa-file-lines", color: "#a855f7" }
  ];

  const SHORTCUTS_VERSION = 'v3';

  // Reset to defaults if version mismatch (ensures new defaults always apply)
  if (localStorage.getItem('shortcuts_version') !== SHORTCUTS_VERSION) {
    localStorage.setItem('my_shortcuts', JSON.stringify(defaultShortcuts));
    localStorage.setItem('shortcuts_version', SHORTCUTS_VERSION);
  }

  // Load from local storage
  function loadShortcuts() {
    let saved = localStorage.getItem('my_shortcuts');
    if (!saved) {
      saved = JSON.stringify(defaultShortcuts);
      localStorage.setItem('my_shortcuts', saved);
    }
    return JSON.parse(saved);
  }

  function saveShortcuts(shortcuts) {
    localStorage.setItem('my_shortcuts', JSON.stringify(shortcuts));
  }

  function getFaviconUrl(url) {
    try {
      let domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return null;
    }
  }

  function renderShortcuts() {
    if (!shortcutsGrid) return;
    const shortcuts = loadShortcuts();

    // Clear current grid except the Add block
    shortcutsGrid.innerHTML = '';

    shortcuts.forEach((sc, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'shortcut-wrapper';

      const link = document.createElement('a');
      link.href = sc.url;
      link.target = '_self';
      link.className = 'shortcut-item';

      let iconHtml = '';
      if (sc.iconClass) {
        iconHtml = `<i class="${sc.iconClass}" style="color: ${sc.color || '#fff'};"></i>`;
      } else {
        let fav = getFaviconUrl(sc.url);
        if (fav) {
          iconHtml = `<img src="${fav}" alt="">`;
        } else {
          iconHtml = `<i class="fa-solid fa-globe" style="color: #b0c4de;"></i>`;
        }
      }

      link.innerHTML = `
        <div class="shortcut-icon">${iconHtml}</div>
        <span class="shortcut-label">${sc.name}</span>
      `;

      const delBtn = document.createElement('div');
      delBtn.className = 'delete-shortcut-btn';
      delBtn.title = 'Delete shortcut';
      delBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      delBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        deleteShortcut(index);
      };

      wrapper.appendChild(link);
      wrapper.appendChild(delBtn);
      shortcutsGrid.appendChild(wrapper);
    });

    // Add the "Add Shortcut" button
    const addBtn = document.createElement('div');
    addBtn.className = 'shortcut-item';
    addBtn.style.cursor = 'pointer';
    addBtn.innerHTML = `
      <div class="shortcut-icon"><i class="fa-solid fa-plus"></i></div>
      <span class="shortcut-label">Add shortcut</span>
    `;
    addBtn.onclick = openModal;
    shortcutsGrid.appendChild(addBtn);
  }

  function openModal() {
    if (!shortcutModal) return;
    shortcutModal.classList.add('active');
    nameInput.value = '';
    urlInput.value = '';
    nameInput.focus();
    shortcutModal.addEventListener('click', function (e) {
      if (e.target === shortcutModal) closeModal();
    }, { once: true });
  }

  function closeModal() {
    if (!shortcutModal) return;
    shortcutModal.classList.remove('active');
  }

  function addShortcut() {
    let name = nameInput.value.trim();
    let url = urlInput.value.trim();

    if (!name || !url) {
      alert("Name and URL are required.");
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const shortcuts = loadShortcuts();
    shortcuts.push({ name, url });
    saveShortcuts(shortcuts);

    closeModal();
    renderShortcuts();
  }

  function deleteShortcut(index) {
    if (confirm("Are you sure you want to delete this shortcut?")) {
      const shortcuts = loadShortcuts();
      shortcuts.splice(index, 1);
      saveShortcuts(shortcuts);
      renderShortcuts();
    }
  }

  if (saveShortcutBtn) saveShortcutBtn.addEventListener('click', addShortcut);
  if (cancelShortcutBtn) cancelShortcutBtn.addEventListener('click', closeModal);

  // Reset shortcuts button
  const resetShortcutsBtn = document.getElementById('resetShortcutsBtn');
  if (resetShortcutsBtn) {
    resetShortcutsBtn.addEventListener('click', function () {
      if (confirm('Kya aap shortcuts ko default par reset karna chahte hain?')) {
        saveShortcuts(defaultShortcuts);
        localStorage.setItem('shortcuts_version', SHORTCUTS_VERSION);
        renderShortcuts();
      }
    });
  }

  renderShortcuts();

});