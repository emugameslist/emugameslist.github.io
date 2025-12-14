const fs = require('fs');
const path = require('path');
const ini = require('ini');

// --- Configuration ---
const BASE_URL = 'https://imadering.github.io/emugames-list/';
const PAGES_DIR = path.join(__dirname, 'pages');
const SYSTEMS_INI_PATH = path.join(__dirname, 'Systems.ini');
const SYSTEMS_SRC_DIR = path.join(__dirname, 'Systems');

// --- HTML Template ---
const HTML_TEMPLATE = `
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<title>EmuGames List</title>
<meta name="description" content="Retro games catalog" />
<link rel="icon" type="image/x-icon" href="favicon.ico">
<meta name="theme-color" content="#12181e" />
<style>
  :root{
    color-scheme: dark;
    --bg: #12181e;         
    --bg-subtle: #1a222a;  
    --panel: #1e2732;      
    --muted: #7a8c9e;      
    --accent: #4da6ff;
    --card: #25303b;       
    --text-primary: #e6edf5;
    --text-secondary: #94aabf;
    --border: #304050;     
    --scrollbar-thumb: #3e4e5e; 
    --scrollbar-hover: #52667a; 
    font-family: Arial, sans-serif;
  }
  
  * { box-sizing: border-box; }

  ::-webkit-scrollbar { width: 16px; height: 16px; }
  
  ::-webkit-scrollbar-track { 
    background: var(--bg); 
    border-radius: 6px; 
    margin: 0px;
  }
  
  ::-webkit-scrollbar-thumb { 
    background: var(--scrollbar-thumb); 
    border: 3px solid var(--bg);
    background-clip: padding-box;
    border-radius: 6px; 
  }
  ::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-hover); }

  ::-webkit-scrollbar-corner { background: var(--bg); }
    
  html, body {
    height: 100%;
    margin: 0; padding: 0;
    background: linear-gradient(180deg, #0e141a 0%, #12181e 100%);
    color: var(--text-primary);
    overflow: hidden; 
    font-size: 16px; 
  }
  
  .wrap {
    width: 100%;
    height: 100vh; 
    height: 100dvh; 
    max-width: 1400px; 
    margin: 0 auto;
    padding: 14px 14px 14px 14px; 
    display: grid;
    grid-template-rows: auto minmax(0, 1fr); 
    grid-template-columns: 500px 1fr; 
    gap: 12px; 
  }
  
  header {
    grid-column: 1 / -1;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 4px;
  }
  header h1 { margin: 0; font-size: 18px; font-weight: 500; line-height: 1; letter-spacing: -0.5px; }

  .panel {
    background: var(--panel);
    border: 1px solid var(--border);
    display: flex; flex-direction: column;
    overflow: hidden; height: 100%; position: relative;
    border-radius: 6px; 
  }

  aside.panel { padding: 10px; }

  .filters-row {
    display: flex;
    gap: 10px; 
    margin-bottom: 12px;
    align-items: flex-end; 
    flex-shrink: 0;
  }

  .filter-group { display: flex; flex-direction: column; }
  .fg-system { flex: 1; min-width: 0; }
  .fg-search { width: 150px; flex-shrink: 0; }

  .lbl { 
    color: var(--text-secondary); 
    font-size: 14px; 
    margin-bottom: 6px; 
    display: block; 
    font-weight: 500; 
    margin-left: 2px; 
  }
  
  .search {
    width: 100%; 
    padding: 0 10px; 
    border: 1px solid var(--border);
    background: var(--card); color: var(--text-primary);
    font-size: 15px; 
    height: 31px;   
    border-radius: 4px; 
    outline: none; 
    font-family: inherit;
  }
  .search:focus { border-color: var(--accent); }

  select option[disabled] { display: none; }

  #system-select {
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238a9ba8' stroke-width='2' stroke-linecap='square' stroke-linejoin='miter'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-size: 14px 14px;
    appearance: none;
  }
  
  .list-header {
    margin-top: 4px;
    margin-bottom: 1px;
    display: flex; justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  }

  #games-count { font-size: 13px; color:var(--text-secondary); margin-right: 3px; margin-bottom: 6px; }

  #game-list-container { flex: 1; position: relative; min-height: 0; }

  #game-list {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    overflow-y: auto; 
  }

  .game-item {
    padding: 4px 10px; 
    margin-bottom: 6px; 
    background: var(--card);
    cursor: pointer;
    border: 1px solid var(--border); 
    white-space: normal;
    word-wrap: break-word; word-break: break-word; 
    display: flex; flex-direction: column; justify-content: center;
    transition: background 0.15s;
    border-radius: 4px;
  }
  
  @media (hover: hover) and (pointer: fine) {
    .game-item:hover { 
      background: var(--bg-subtle); 
      border-color: var(--accent); 
    }
  }
  .game-item.selected { background: rgba(77, 166, 255, 0.15); border-color: var(--accent); }

  .g-name { font-weight: 500; font-size: 15px; line-height: 1.4; color: var(--text-primary);}
  
  #details { padding: 0; }
  
  .content-pad {
    padding: 10px; height: 100%; display: flex; flex-direction: column; overflow: hidden;
  }

  .game-header {
    flex-shrink: 0; margin-bottom: 8px; padding: 0px 2px;
  }
  .gh-title { font-size: 16px; font-weight: 500; color: var(--text-primary); }

  .tabs-bar {
    display: flex; justify-content: space-between; align-items: flex-end;
    margin-bottom: 0; flex-shrink: 0; gap: 10px;
  }

  .tabs { display: flex; gap: 6px; }
  
  .tab {
    padding: 7px 12px; 
    background: var(--bg-subtle); border: 1px solid var(--border); border-bottom: none;
    color: var(--text-secondary); 
    font-size: 14px; font-weight: 500; 
    cursor: pointer;
    border-top-left-radius: 4px; border-top-right-radius: 4px;
  }
  .tab:hover { color: var(--text-primary); background: var(--card); }
  .tab.active { background: var(--accent); color: #fff; border-color: var(--accent); }
  .tab[style*="display: none"] { display: none !important; }

  .sc-controls { 
    display: flex; gap: 8px; align-items: center; 
    padding-bottom: 4px;
  }
  .btn-icon {
    width: 32px; height: 32px; 
    display: flex; align-items: center; justify-content: center;
    background: var(--card); border: 1px solid var(--border); color: var(--text-primary);
    cursor: pointer; padding: 0;
    border-radius: 4px;
    font-size: 18px;
  }
  .btn-icon:hover { border-color: var(--accent); color: var(--accent); }
  .btn-icon:disabled { opacity: 0.3; cursor: default; border-color: var(--border); color: var(--text-secondary); }

  .tab-body {
    flex: 1; border: 1px solid var(--border);
    background: var(--bg);
    position: relative; overflow: hidden;
    display: flex; flex-direction: column; min-height: 0;
    border-radius: 0 4px 4px 4px; 
  }

  #tab-screens { height: 100%; display: flex; flex-direction: column; }
  
  #screenshot-area {
    flex: 1; position: relative; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    background: var(--bg); 
  }
  .screen-img {
    max-width: 100%; max-height: 100%; width: auto; height: auto;
    object-fit: contain; cursor: pointer;
  }
  
  #tab-info { padding: 12px; overflow-y: auto; }
  
  #tab-youtube { padding: 0px; overflow-y: auto; }
  
  .info-block { font-size: 16px; line-height: 1.6; white-space: pre-wrap; margin-top: 0; color: var(--text-primary); }
  
  .embed-container {
    position: relative;
    padding-bottom: 56.25%; 
    height: 0;
    overflow: hidden;
    max-width: 100%;
    background: #000;
  }
  .embed-container iframe {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;
  }
  
  /* Link styling for placeholder */
  .ph-link { color: var(--accent); text-decoration: none; transition: opacity 0.2s; }
  .ph-link:hover { opacity: 0.8; text-decoration: none; }

  @media(max-width: 900px){
    .wrap {
      grid-template-columns: 1fr;
      grid-template-rows: auto 38vh 1fr; 
      height: 100dvh; overflow: hidden;
      padding: 8px; gap: 8px;
    }
    header { min-height: auto; }
    header h1 { font-size: 18px; }
    aside.panel { padding: 10px; }
    .content-pad { padding: 10px; }
    
    .filters-row { 
      flex-wrap: nowrap; 
      gap: 8px;
    }
    .fg-search { width: 150px; min-width: 150px; }
    .fg-system { flex: 1; width: auto; }
  }
</style>
</head>
<body>

<div class="wrap">
  <header>
    <h1>EmuGames List</h1>
    <div style="font-size:14px; color:var(--text-secondary); text-align:right; line-height:1.4;">
      Subscribe to <a href="https://www.youtube.com/@EmuGamesList" target="_blank" class="ph-link">YouTube</a> 
      & <a href="https://boosty.to/topretrogames" target="_blank" class="ph-link">Donate</a>
    </div>
  </header>

  <aside class="panel">
    <div style="flex-shrink: 0;">
      
      <div class="filters-row">
        <div class="filter-group fg-system">
          <label class="lbl" for="system-select">System</label>
          <select id="system-select" class="search">
            <option value="" disabled selected hidden>Loading...</option>
          </select>
        </div>

        <div class="filter-group fg-search">
          <label class="lbl">Search</label>
          <input id="search" class="search" placeholder="Filter games..." autocomplete="off" />
        </div>
      </div>

      <div class="list-header">
        <span class="lbl">Games List</span>
        <span id="games-count"></span>
      </div>
    </div>

    <div id="game-list-container">
      <div id="game-list"></div>
    </div>
  </aside>

  <main class="panel" id="details">
    <div id="placeholder" style="height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:20px;">
      <div style="font-size:20px; font-weight:500; color:var(--text-primary); margin-bottom:12px;">EmuGames List</div>
      <div style="font-size:16px; color:var(--text-secondary); max-width:400px; line-height:1.5;">
        This is a private initiative project to compile a list of old video games runnable on emulators.
        <br><br>
        If you want to support the project:<br>
        Subscribe to YouTube: <a href="https://www.youtube.com/@EmuGamesList" target="_blank" class="ph-link">@EmuGamesList</a><br>
        Donate: <a href="https://boosty.to/topretrogames" target="_blank" class="ph-link">Boosty</a>
      </div>
      
      <hr style="width: 60%; border: 0; border-top: 1px solid var(--border); margin: 20px 0;">
      
      <div style="font-size:16px; color:var(--text-primary); font-weight:500;">
        Select a system and a game from the list.
      </div>
    </div>

    <div id="game-area" style="display:none;" class="content-pad">
      
      <div class="game-header">
        <div id="game-title" class="gh-title"></div>
      </div>

      <div class="tabs-bar">
        <div class="tabs" id="tabs">
          <div class="tab active" data-tab="screens">Image</div>
          <div class="tab" data-tab="info">Info</div>
          <div class="tab" data-tab="youtube" id="tab-btn-yt">Video</div>
        </div>

        <div class="sc-controls" id="sc-controls">
          <button id="prev-btn" class="btn-icon">‹</button>
          <span id="screen-counter" style="font-size:14px; min-width:40px; text-align:center; tabular-nums:true;">0 / 0</span>
          <button id="next-btn" class="btn-icon">›</button>
        </div>
      </div>

      <div class="tab-body">
        <div id="tab-screens">
          <div id="screenshot-area">
             <div id="img-container" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;"></div>
             <div id="screens-msg" style="position:absolute; color:var(--text-secondary); font-size:16px;">Loading...</div>
          </div>
        </div>

        <div id="tab-info" style="display:none;">
          <div id="game-description" class="info-block"></div>
        </div>

        <div id="tab-youtube" style="display:none;">
          <div id="yt-container" style="height:100%"></div>
        </div>
      </div>
    </div>
  </main>
</div>

<script>
function parseIni(text){
  const result = {}; let section = null;
  text = text.replace(/\ufeff/g, '').replace(/\r\n/g,'\n').replace(/\r/g,'\n');
  const lines = text.split('\n');
  for (let raw of lines){
    const line = raw.trim();
    if (!line || line.startsWith(';') || line.startsWith('#')) continue;
    const sect = line.match(/^\[(.+?)\]$/);
    if (sect){ section = sect[1]; result[section] = {}; continue; }
    if (!section) continue; 
    const kv = line.split('=');
    if (kv.length >= 2){
      const key = kv[0].trim();
      const val = kv.slice(1).join('=').trim();
      result[section][key] = val;
    }
  }
  return result;
}

const collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});

async function fetchFile(path, type='text'){
  try {
    const r = await fetch(path, {cache:'no-cache'});
    if(!r.ok) return null;
    const buf = await r.arrayBuffer();
    const decoder = new TextDecoder(type==='ini'?'utf-16le':'utf-8');
    return type==='ini' ? parseIni(decoder.decode(buf)) : decoder.decode(buf);
  } catch(e) { console.warn('Fetch error:', path); return null; }
}

const els = {
  sysSelect: document.getElementById('system-select'),
  list: document.getElementById('game-list'),
  search: document.getElementById('search'),
  count: document.getElementById('games-count'),
  placeholder: document.getElementById('placeholder'),
  gameArea: document.getElementById('game-area'),
  tabs: document.getElementById('tabs'),
  tabBtnYt: document.getElementById('tab-btn-yt'),
  
  title: document.getElementById('game-title'),
  desc: document.getElementById('game-description'),
  yt: document.getElementById('yt-container'),
  
  screenWrap: document.getElementById('img-container'),
  screenMsg: document.getElementById('screens-msg'),
  screenCounter: document.getElementById('screen-counter'),
  prev: document.getElementById('prev-btn'),
  next: document.getElementById('next-btn'),
  scControls: document.getElementById('sc-controls')
};

let appState = {
  games: [],
  filtered: [],
  currentG: null,
  screens: [],
  screenIdx: 0,
  activeTab: 'screens'
};

async function init(){
  const sysData = await fetchFile('Systems.ini', 'ini');
  els.sysSelect.innerHTML = '<option value="" disabled selected hidden>Select System</option>';
  
  if(sysData){
    for(const key of Object.keys(sysData)){
      const opt = document.createElement('option');
      opt.value = sysData[key]['Dir'] || key;
      opt.textContent = key;
      els.sysSelect.appendChild(opt);
    }
  }
  
  els.sysSelect.addEventListener('change', e => {
    if(e.target.value) loadSystem(e.target.value);
  });

  els.search.addEventListener('input', renderList);
  els.prev.onclick = () => navScreen(-1);
  els.next.onclick = () => navScreen(1);
  
  els.tabs.addEventListener('click', e => {
    const t = e.target.closest('.tab');
    if(!t) return;
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    appState.activeTab = t.dataset.tab;
    updateTabContent();
  });
}

function updateTabContent(){
  const mode = appState.activeTab;
  document.getElementById('tab-screens').style.display = mode==='screens'?'flex':'none';
  document.getElementById('tab-info').style.display = mode==='info'?'block':'none';
  document.getElementById('tab-youtube').style.display = mode==='youtube'?'block':'none';
  els.scControls.style.visibility = mode==='screens' ? 'visible' : 'hidden';
}

function clearGameView(){
  appState.currentG = null;
  appState.screens = [];
  appState.screenIdx = 0;
  
  els.title.innerHTML = '';
  els.desc.textContent = '';
  els.yt.innerHTML = '';
  els.screenWrap.innerHTML = '';
  els.screenCounter.textContent = '0 / 0';
  els.screenMsg.style.display = 'block';
  els.screenMsg.textContent = 'Loading...';
  
  els.tabBtnYt.style.display = 'none';
}

async function loadSystem(dir){
  clearGameView();
  if (appState.activeTab === 'youtube') {
      appState.activeTab = 'screens';
      document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
      document.querySelector('[data-tab="screens"]').classList.add('active');
      updateTabContent();
  }
  
  document.getElementById('tab-info').scrollTop = 0;
  document.getElementById('tab-youtube').scrollTop = 0;

  els.placeholder.style.display = 'flex';
  els.gameArea.style.display = 'none';
  els.list.innerHTML = '<div style="padding:15px; color:var(--muted)">Loading...</div>';

  const selectedOpt = [...els.sysSelect.options].find(o => o.value === dir);
  if(selectedOpt) {
    els.sysSelect.options[0].textContent = selectedOpt.textContent;
    els.sysSelect.value = "";
  }
  
  const order = ['Emulators', 'Games', 'Demos'];
  let tempGames = [];

  for(const type of order){
    // ИСПРАВЛЕНО: Замена шаблонного литерала на конкатенацию строк для устранения SyntaxError
    const data = await fetchFile('Systems/' + encodeURIComponent(dir) + '/' + type + '.ini', 'ini');
    if(!data) continue;
    
    let group = Object.values(data).map((obj, idx) => ({
      rawId: idx,
      name: obj['Name'] || obj['NAME'] || obj['name'] || '',
      dir: obj['Dir'] || obj['DIR'] || obj['dir'] || '',
      year: obj['Year'] || obj['year'] || '',
      rating: obj['Rating'] || obj['rating'] || '',
      comment: obj['Comment'] || obj['COMMENT'] || '',
      found: obj['Found'] || obj['found'] || '',
      source: type
    })).filter(g => g.name || g.dir);

    group.sort((a, b) => collator.compare(a.name, b.name));
    tempGames = tempGames.concat(group);
  }

  appState.games = tempGames.map((g, i) => ({...g, id: i})); 
  renderList();

  // ИСПРАВЛЕНО: Замена шаблонного литерала на конкатенацию строк
  const sysDirEnc = encodeURIComponent(dir);
  const sysInfoPath = 'Systems/' + sysDirEnc + '/Info';
  const sysInfoTxt = await fetchFile(sysInfoPath + '/Info.txt', 'text');
  
  if(sysInfoTxt) {
    els.placeholder.style.display = 'none';
    els.gameArea.style.display = 'flex';
    
    els.title.innerHTML = els.sysSelect.options[0].textContent;
    els.desc.textContent = sysInfoTxt;
    loadScreens(null, sysInfoPath);
  } else {
    els.placeholder.style.display = 'flex';
    els.gameArea.style.display = 'none';
    
    const phTitle = document.querySelector('#placeholder div:first-child');
    const phBody = document.querySelector('#placeholder div:nth-child(2)');
    if(phTitle) phTitle.textContent = els.sysSelect.options[0].textContent;
    
    if(phBody) phBody.innerHTML = 'Select a game from the list.';
    
    const phHr = document.querySelector('#placeholder hr');
    const phInstr = document.querySelector('#placeholder div:last-child');
    if(phHr) phHr.style.display = 'none';
    if(phInstr) phInstr.style.display = 'none';
  }
}

function getGameDisplayText(g) {
  let suffix = '';
  if (g.source === 'Emulators') suffix = ' *Emulator';
  else if (g.source === 'Demos') suffix = ' *Demo';
  
  let html = escapeHtml(g.name) + suffix;
  if(g.year) html += ` (${escapeHtml(g.year)})`;
  if(g.rating) html += ` ⭐ ${escapeHtml(g.rating)}`;
  return html;
}

function renderList(){
  const q = (els.search.value || '').toLowerCase();
  appState.filtered = appState.games.filter(g => g.name.toLowerCase().includes(q));
  
  els.list.innerHTML = '';
  els.count.textContent = appState.filtered.length;

  if(appState.filtered.length === 0){
    els.list.innerHTML = '<div style="padding:15px; text-align:center; color:var(--muted)">No games found</div>';
    return;
  }

  const frag = document.createDocumentFragment();
  appState.filtered.forEach(g => {
    const el = document.createElement('div');
    el.className = 'game-item';
    if(appState.currentG && appState.currentG.id === g.id) el.classList.add('selected');
    el.innerHTML = `<div class="g-name">${getGameDisplayText(g)}</div>`;
    el.onclick = () => loadGame(g, el);
    frag.appendChild(el);
  });
  els.list.appendChild(frag);
}

async function loadGame(g, elBtn){
  clearGameView();

  appState.currentG = g;
  document.querySelectorAll('.game-item').forEach(x => x.classList.remove('selected'));
  if(elBtn) elBtn.classList.add('selected');

  els.placeholder.style.display = 'none';
  els.gameArea.style.display = 'flex';
  els.title.innerHTML = getGameDisplayText(g);
  
  els.desc.textContent = 'Loading info...';
  const sysName = els.sysSelect.options[0].textContent;
  const sysOpt = [...els.sysSelect.options].find(o => o.textContent === sysName && !o.disabled);
  const sysDir = sysOpt ? sysOpt.value : sysName; 

  // ИСПРАВЛЕНО: Замена шаблонного литерала на конкатенацию строк для finalPath
  const finalPath = 'Systems/' + sysDir + '/' + g.source + '/' + g.dir + '/Info.txt';

  const infoTxt = await fetchFile(finalPath, 'text');
  const safeInfo = infoTxt || g.comment || 'No description available.';
  els.desc.textContent = safeInfo;

  let videoId = null;
  if (safeInfo) {
    const match = safeInfo.match(/(?:Gameplay|Video):\s*(https?:\/\/[^\s]+)/);
    if (match && match[1]) {
      const idMatch = match[1].match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
      if (idMatch && idMatch[1]) videoId = idMatch[1];
    }
  }

  if (videoId) {
    els.tabBtnYt.style.display = 'block'; 
    // ИСПРАВЛЕНО: Замена шаблонного литерала на конкатенацию строк для innerHTML
    els.yt.innerHTML = '<div class="embed-container"><iframe src="https://www.youtube.com/embed/' + videoId + '" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>';
  } else {
    els.tabBtnYt.style.display = 'none';
    els.yt.innerHTML = '';
    if (appState.activeTab === 'youtube') appState.activeTab = 'screens';
  }

  loadScreens(g, null, sysDir);
  
  document.querySelectorAll('.tab').forEach(x => {
    if(x.dataset.tab === appState.activeTab) x.classList.add('active');
    else x.classList.remove('active');
  });
  updateTabContent();
}

async function loadScreens(g, customPath = null, sysDirOverride = null){
  appState.screens = [];
  appState.screenIdx = 0;
  els.screenWrap.innerHTML = '';
  els.screenMsg.style.display = 'block';
  els.screenMsg.textContent = 'Checking images...';

  let basePath;
  if (customPath) {
    basePath = customPath;
  } else {
    let sDir = sysDirOverride;
    if(!sDir){
        const sysName = els.sysSelect.options[0].textContent;
        const sysOpt = [...els.sysSelect.options].find(o => o.textContent === sysName && !o.disabled);
        sDir = sysOpt ? sysOpt.value : sysName; 
    }
    
    const sysDirEnc = encodeURIComponent(sDir);
    const typeDir = encodeURIComponent(g.source);
    const gameDir = encodeURIComponent(g.dir);
    // ИСПРАВЛЕНО: Замена шаблонного литерала на конкатенацию строк для basePath
    basePath = 'Systems/' + sysDirEnc + '/' + typeDir + '/' + gameDir;
  }
  
  // ИСПРАВЛЕНО: Замена шаблонного литерала на конкатенацию строк для jsonPath
  const jsonPath = basePath + '/images.json';

  try {
    const r = await fetch(jsonPath);
    if(r.ok){
      const list = await r.json();
      if(Array.isArray(list) && list.length > 0){
        // ИСПРАВЛЕНО: Замена шаблонного литерала на конкатенацию строк внутри map
        appState.screens = list.map(f => basePath + '/' + f); 
        els.screenMsg.style.display = 'none';
        showScreen(0);
        return;
      }
    }
  } catch(e){ console.log('No images.json', e); }
  
  els.screenMsg.textContent = 'No screenshots found';
  els.screenCounter.textContent = '0 / 0';
  els.prev.disabled = true;
  els.next.disabled = true;
}

function showScreen(idx){
  if(!appState.screens.length) return;
  appState.screenIdx = idx;
  if(appState.screenIdx < 0) appState.screenIdx = appState.screens.length - 1;
  if(appState.screenIdx >= appState.screens.length) appState.screenIdx = 0;

  const url = appState.screens[appState.screenIdx];
  els.screenCounter.textContent = `${appState.screenIdx+1} / ${appState.screens.length}`;
  
  els.screenWrap.innerHTML = '';
  const img = new Image();
  img.className = 'screen-img';
  img.src = url;
  img.onclick = () => window.open(url, '_blank');
  els.screenWrap.appendChild(img);
  
  const single = appState.screens.length <= 1;
  els.prev.disabled = single; 
  els.next.disabled = single;
}

function navScreen(d) { showScreen(appState.screenIdx + d); }

function resetView(){
  els.placeholder.style.display = 'flex';
  els.gameArea.style.display = 'none';
  appState.games = [];
  appState.currentG = null;
  els.list.innerHTML = '';
  els.count.textContent = '';
}

function escapeHtml(s){
  if(!s) return '';
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

init();
</script>
</body>
</html>
`; 

// --- Helper Functions: Encoding Fix ---
/**
 * Reads and parses an INI file using the required UTF-16 LE encoding.
 * The 'ucs2' encoding in Node.js handles UTF-16 Little Endian (LE) correctly, 
 * which fixes the garbled character issue.
 * @param {string} filePath - Path to the INI file.
 * @returns {object|null} The parsed INI object or null on failure.
 */
function readIniFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) return null;
        // Ключевое изменение: использование 'ucs2' для UTF-16 LE
        const fileContent = fs.readFileSync(filePath, 'ucs2');
        return ini.parse(fileContent);
    } catch (e) {
        console.error(`Error reading INI file ${filePath}:`, e.message);
        return null;
    }
}

/**
 * Reads a text file (like Info.txt) using UTF-8 encoding (which handles BOM).
 * @param {string} filePath - Path to the text file.
 * @returns {string|null} The file content or null on failure.
 */
function readTextFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) return null;
        // 'utf8' для Info.txt
        return fs.readFileSync(filePath, 'utf8').trim();
    } catch (e) {
        console.error(`Error reading TXT file ${filePath}:`, e.message);
        return null;
    }
}

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// --- Main Generation Logic ---
function generatePages() {
    console.log('Starting static site generation...');
    ensureDir(PAGES_DIR);

    // 1. Read Systems.ini
    const systemsData = readIniFile(SYSTEMS_INI_PATH);
    if (!systemsData) {
        console.error(`FATAL: Could not read Systems.ini at ${SYSTEMS_INI_PATH}. Aborting.`);
        writeIndexPage(HTML_TEMPLATE); // Still write the index file so the action succeeds
        return;
    }

    const systemEntries = Object.entries(systemsData);
    let sitemapEntries = [];

    // --- System Loop ---
    for (const [sysName, sysConfig] of systemEntries) {
        const sysDir = sysConfig['Dir'] || sysName;
        if (!sysDir) continue; 
        
        console.log(`Processing System: ${sysName} (${sysDir})`);

        // Путь для всех статических файлов системы
        const staticSysPath = path.join(PAGES_DIR, 'Systems', sysDir);
        
        ensureDir(staticSysPath);
        
        // A. Copy System Info.txt
        const systemInfoPath = path.join(SYSTEMS_SRC_DIR, sysDir, 'Info.txt');
        const systemInfoContent = readTextFile(systemInfoPath);
        
        if (systemInfoContent) {
            const finalSysInfoPath = path.join(staticSysPath, 'Info.txt');
            fs.writeFileSync(finalSysInfoPath, systemInfoContent, 'utf8');
            console.log(`  Copied System Info.txt to: ${finalSysInfoPath}`);
        }

        // Add the system index page (main view) to sitemap
        sitemapEntries.push({ loc: `${BASE_URL}?system=${encodeURIComponent(sysDir)}` });

        // B. Process Game Pages (Emulators, Games, Demos)
        const gameTypes = ['Emulators', 'Games', 'Demos'];
        
        for (const type of gameTypes) {
            const gamesIniPath = path.join(SYSTEMS_SRC_DIR, sysDir, type + '.ini');
            const gamesData = readIniFile(gamesIniPath);
            if (!gamesData) continue;

            for (const gameConfig of Object.values(gamesData)) {
                const gameDir = gameConfig['Dir'] || gameConfig['dir'] || gameConfig['Name'] || gameConfig['name'];
                if (!gameDir) continue;

                const gameBaseSrcPath = path.join(SYSTEMS_SRC_DIR, sysDir, type, gameDir);
                const gameBaseFinalPath = path.join(staticSysPath, type, gameDir);
                
                ensureDir(gameBaseFinalPath);

                // I. Copy Game Info.txt (UTF-8)
                const gameInfoPath = path.join(gameBaseSrcPath, 'Info.txt');
                const gameInfoContent = readTextFile(gameInfoPath);
                
                if (gameInfoContent) {
                    const finalInfoPath = path.join(gameBaseFinalPath, 'Info.txt');
                    fs.writeFileSync(finalInfoPath, gameInfoContent, 'utf8');
                    // console.log(`  - Copied Game Info.txt for: ${gameDir}`);
                }
                
                // II. Copy Screenshots and create images.json
                const gameScreensPath = path.join(gameBaseSrcPath, 'Screens');
                if (fs.existsSync(gameScreensPath)) {
                    const finalScreensPath = path.join(gameBaseFinalPath, 'Screens');
                    ensureDir(finalScreensPath);
                    const imageFiles = fs.readdirSync(gameScreensPath).filter(f => /\.(jpe?g|png)$/i.test(f));
                    
                    if (imageFiles.length > 0) {
                        const imagesJsonPath = path.join(gameBaseFinalPath, 'images.json');
                        // images.json should store relative path to the image file
                        fs.writeFileSync(imagesJsonPath, JSON.stringify(imageFiles.map(f => `Screens/${f}`)), 'utf8');
                        
                        // Copy image files
                        imageFiles.forEach(file => {
                            fs.copyFileSync(path.join(gameScreensPath, file), path.join(finalScreensPath, file));
                        });
                        // console.log(`  - Copied ${imageFiles.length} screenshots for: ${gameDir}`);
                    }
                }
                
                // Add the game page to sitemap
                const gameUrl = `${BASE_URL}?system=${encodeURIComponent(sysDir)}&game=${encodeURIComponent(gameDir)}`;
                sitemapEntries.push({ loc: gameUrl });
            }
        }
    }
    
    // 2. Final files (Systems.ini, index.html, sitemap.xml)
    
    // Copy Systems.ini to the root of the 'pages' directory (needed by client-side JS)
    fs.copyFileSync(SYSTEMS_INI_PATH, path.join(PAGES_DIR, 'Systems.ini'));
    
    // Write the main index.html
    writeIndexPage(HTML_TEMPLATE);

    // Write Sitemap
    writeSitemap(sitemapEntries);

    console.log('\nStatic site generation complete.');
}

function writeIndexPage(htmlContent) {
    fs.writeFileSync(path.join(PAGES_DIR, 'index.html'), htmlContent, 'utf8');
    console.log('Generated index.html');
}

function writeSitemap(entries) {
    const today = new Date().toISOString().split('T')[0];
    let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Always include the root index
    sitemapXml += `  <url>
    <loc>${BASE_URL}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>\n`;

    entries.forEach(entry => {
        sitemapXml += `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
    });

    sitemapXml += `</urlset>`;

    fs.writeFileSync(path.join(PAGES_DIR, 'sitemap.xml'), sitemapXml, 'utf8');
    console.log(`Generated sitemap.xml with ${entries.length + 1} entries.`);
}

// --- Execution ---
generatePages();
