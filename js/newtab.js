// Externalized script for new-tab page

// Helper to open links from data-href attributes
function attachDataHrefHandlers() {
  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-href]');
    if (!el) return;
    const url = el.getAttribute('data-href');
    // open in new tab
    window.open(url, '_blank');
  });
}

/* CLOCK */
function updateClock(){
    let now = new Date();
    const hrs = String(now.getHours()).padStart(2,'0');
    const min = String(now.getMinutes()).padStart(2,'0');
    const sec = String(now.getSeconds()).padStart(2,'0');
    const hrsEl = document.getElementById("hrs");
    const minEl = document.getElementById("min");
    const secEl = document.getElementById("sec");
    if (hrsEl) hrsEl.innerText = hrs;
    if (minEl) minEl.innerText = min;
    if (secEl) secEl.innerText = sec;

    const dateEl = document.getElementById("todayDate");
    if (dateEl) {
        dateEl.innerText = now.toLocaleDateString('en-GB', {
            weekday:'long',
            day:'2-digit',
            month:'long',
            year:'numeric'
        });
    }
}

/* SEARCH FUNCTION */
function attachSearchHandlers(){
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  if (!searchInput || !searchBtn) return;

  searchBtn.addEventListener('click', () => {
    const q = searchInput.value.trim();
    if (q) window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_self");
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const q = searchInput.value.trim();
      if (q) window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_self");
    }
  });
}

/* VOICE SEARCH */
function attachVoice(){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const voiceBtn = document.getElementById("voiceBtn");
  const searchInput = document.getElementById("searchInput");
  if (!voiceBtn || !searchInput) return;

  if (SpeechRecognition) {
    const recog = new SpeechRecognition();
    voiceBtn.addEventListener('click', () => recog.start());
    recog.onresult = (e) => {
      searchInput.value = e.results[0][0].transcript;
    };
  } else {
    voiceBtn.style.display = "none";
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
      if (tv) tv.innerText = Math.round(w.temperature) + "°C";
    })
    .catch(err => {
      console.error(err);
      const loc = document.getElementById("location");
      if (loc) loc.innerText = "Weather error";
    });
}

/* INIT on DOM ready */
function initNewTab(){
  attachDataHrefHandlers();
  attachSearchHandlers();
  attachVoice();
  fetchOpenMeteoWeather();
  updateClock();
  setInterval(updateClock, 1000);
  loadPhoneUI();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNewTab);
} else {
  initNewTab();
}

/* Load Phone UI (inject Phone/index.html into #phone-root) */
function loadPhoneUI(){
  const root = document.getElementById('phone-root');
  if(!root) return;

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
        if(el.hasAttribute('src')){
          const v = el.getAttribute('src');
          if(v && !v.match(/^https?:|^\//) && !v.startsWith('Phone/')) el.setAttribute('src', 'Phone/' + v);
        }
        if(el.hasAttribute('href')){
          const v = el.getAttribute('href');
          if(v && !v.match(/^https?:|^\//) && !v.startsWith('Phone/')) el.setAttribute('href', 'Phone/' + v);
        }
        if(el.hasAttribute('style')){
          let s = el.getAttribute('style');
          s = s.replace(/url\((?:"|'|)([^)"']+)(?:"|'|)\)/g, (m, p1) => {
            if(p1.match(/^https?:|^\//) || p1.startsWith('Phone/')) return `url(${p1})`;
            return `url(Phone/${p1})`;
          });
          el.setAttribute('style', s);
        }
      });

      // Also fix inline img/backgrounds by walking innerHTML for url(...) occurrences
      let contentHTML = appContent.innerHTML.replace(/url\((?:"|'|)([^)"']+)(?:"|'|)\)/g, (m,p1)=>{
        if(p1.match(/^https?:|^\//) || p1.startsWith('Phone/')) return `url(${p1})`;
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








document.addEventListener("DOMContentLoaded", function(){

  const links = {
    googleBtn: "https://google.com",
    todoBtn: "https://tasks.google.com/tasks",
    liveChatBtn: "https://salmanadeeb.wixsite.com/livechat",
    aiToolsBtn: "https://chat.openai.com/",
    extensionBtn: "https://adeeb-technology-lab.blogspot.com/search/label/Extension",
    softwareBtn: "https://adeeb-technology-lab.blogspot.com/search/label/Software",
    mobileBtn: "https://adeeb-technology-lab.blogspot.com/search/label/Application"
  };

  Object.keys(links).forEach(function(id){
    const el = document.getElementById(id);
    if(!el) return;

  el.addEventListener("click", function(){
  chrome.tabs.create({ url: links[id] });
});

  });

});
