const DEFAULTS = {
  libraries: { 'My Photos': [] },
  selectedLibrary: 'My Photos',
  baseRate: 1,
  currentRate: 1,
  autoIncrease: { enabled: false, amount: 10, count: 1, interval: 'hour' }
};

let settings = {};

function loadSettings() {
  return new Promise(resolve => {
    chrome.storage.local.get(null, data => {
      settings = data.libraries ? data : JSON.parse(JSON.stringify(DEFAULTS));
      resolve();
    });
  });
}

// --- Render helpers ---

function renderLibraryDropdown() {
  const sel = document.getElementById('library-select');
  sel.innerHTML = '';
  Object.keys(settings.libraries).forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    opt.selected = name === settings.selectedLibrary;
    sel.appendChild(opt);
  });
}

function renderUrlArea() {
  const urls = settings.libraries[settings.selectedLibrary] || [];
  document.getElementById('url-textarea').value = urls.join('\n');
  setUrlCount(urls.length);
}

function setUrlCount(n) {
  document.getElementById('url-count').textContent = n + ' image' + (n !== 1 ? 's' : '');
}

function renderRate() {
  document.getElementById('rate-slider').value = settings.baseRate;
  document.getElementById('rate-display').textContent = settings.baseRate + '%';
}

function renderAutoIncrease() {
  const ai = settings.autoIncrease;
  document.getElementById('auto-increase-toggle').checked = ai.enabled;
  document.getElementById('increase-amount').value = ai.amount;
  document.getElementById('increase-count').value = ai.count;
  document.getElementById('increase-interval').value = ai.interval;
  setAutoIncreaseVisible(ai.enabled);
}

function renderCurrentRate() {
  document.getElementById('current-rate-display').textContent = settings.currentRate + '%';
}

function setAutoIncreaseVisible(on) {
  document.getElementById('auto-increase-fields').classList.toggle('active', on);
  document.getElementById('current-rate-row').classList.toggle('active', on);
}

function render() {
  renderLibraryDropdown();
  renderUrlArea();
  renderRate();
  renderAutoIncrease();
  renderCurrentRate();
}

// --- Persist URL textarea to in-memory settings ---

function flushUrlTextarea() {
  const lib = settings.selectedLibrary;
  const raw = document.getElementById('url-textarea').value;
  settings.libraries[lib] = raw.split('\n').map(u => u.trim()).filter(Boolean);
}

// --- Event wiring ---

document.getElementById('library-select').addEventListener('change', e => {
  flushUrlTextarea();
  settings.selectedLibrary = e.target.value;
  renderUrlArea();
});

document.getElementById('add-library').addEventListener('click', () => {
  const name = prompt('Library name:');
  if (!name || !name.trim()) return;
  const n = name.trim();
  if (settings.libraries[n]) { alert('"' + n + '" already exists.'); return; }
  flushUrlTextarea();
  settings.libraries[n] = [];
  settings.selectedLibrary = n;
  render();
});

document.getElementById('delete-library').addEventListener('click', () => {
  const lib = settings.selectedLibrary;
  if (Object.keys(settings.libraries).length <= 1) {
    alert('Cannot delete the only library.');
    return;
  }
  if (!confirm('Delete library "' + lib + '"?')) return;
  delete settings.libraries[lib];
  settings.selectedLibrary = Object.keys(settings.libraries)[0];
  render();
});

document.getElementById('url-textarea').addEventListener('input', () => {
  flushUrlTextarea();
  setUrlCount(settings.libraries[settings.selectedLibrary].length);
});

document.getElementById('rate-slider').addEventListener('input', e => {
  settings.baseRate = parseInt(e.target.value);
  document.getElementById('rate-display').textContent = settings.baseRate + '%';
  if (!settings.autoIncrease.enabled) {
    settings.currentRate = settings.baseRate;
    renderCurrentRate();
  }
});

document.getElementById('auto-increase-toggle').addEventListener('change', e => {
  settings.autoIncrease.enabled = e.target.checked;
  if (!e.target.checked) {
    settings.currentRate = settings.baseRate;
    renderCurrentRate();
  }
  setAutoIncreaseVisible(e.target.checked);
});

document.getElementById('increase-amount').addEventListener('input', e => {
  settings.autoIncrease.amount = Math.max(1, parseInt(e.target.value) || 10);
});

document.getElementById('increase-count').addEventListener('input', e => {
  settings.autoIncrease.count = Math.max(1, parseInt(e.target.value) || 1);
});

document.getElementById('increase-interval').addEventListener('change', e => {
  settings.autoIncrease.interval = e.target.value;
});

document.getElementById('reset-rate').addEventListener('click', () => {
  settings.currentRate = settings.baseRate;
  renderCurrentRate();
});

document.getElementById('save-btn').addEventListener('click', () => {
  flushUrlTextarea();
  chrome.storage.local.set(settings, () => {
    chrome.runtime.sendMessage({
      action: 'setAlarm',
      enabled: settings.autoIncrease.enabled,
      interval: settings.autoIncrease.interval,
      count: settings.autoIncrease.count
    });
    const btn = document.getElementById('save-btn');
    btn.textContent = '✓ Saved!';
    btn.classList.add('success');
    setTimeout(() => {
      btn.textContent = 'Save Settings';
      btn.classList.remove('success');
    }, 1500);
  });
});

// --- Init ---
loadSettings().then(render);
