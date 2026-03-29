/* ===== Data Model ===== */
const GENRES = [
  { id: '街歩き', icon: '🚶', color: '#5B8C5A' },
  { id: 'ファミリーヒストリー', icon: '👪', color: '#C4843E' },
  { id: '未解決事件', icon: '🔎', color: '#333333' },
  { id: 'UFO・オカルト', icon: '🛸', color: '#6B5B8A' },
];

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

const PRESET_SHOWS = [
  { name: 'ブラタモリ', channel: 'NHK総合', genre: '街歩き', day: '6', time: '19:30', memo: 'タモリさんが街の歴史と地形を探索' },
  { name: '出没!アド街ック天国', channel: 'テレビ東京', genre: '街歩き', day: '6', time: '21:00', memo: '関東の街のベスト30を紹介' },
  { name: 'モヤモヤさまぁ〜ず2', channel: 'テレビ東京', genre: '街歩き', day: '0', time: '21:00', memo: 'さまぁ〜ずが街をぶらり散歩' },
  { name: 'ファミリーヒストリー', channel: 'NHK総合', genre: 'ファミリーヒストリー', day: '1', time: '19:57', memo: '著名人の家族の歴史を紐解く' },
  { name: 'NHKスペシャル 未解決事件', channel: 'NHK総合', genre: '未解決事件', day: '', time: '', memo: '日本の未解決事件を徹底追跡（不定期放送）' },
  { name: '世界の何だコレ!?ミステリー', channel: 'フジテレビ', genre: 'UFO・オカルト', day: '3', time: '19:00', memo: '世界中の不思議な映像やミステリーを調査' },
];

const SEARCH_ENGINES = [
  { id: 'google', label: 'Google検索', icon: '🔍', url: q => `https://www.google.com/search?q=${encodeURIComponent(q)}` },
  { id: 'yahoo-tv', label: 'Yahoo!テレビ', icon: '📺', url: q => `https://tv.yahoo.co.jp/search/?q=${encodeURIComponent(q)}`, desc: '番組表から検索' },
  { id: 'google-tv', label: 'Google TV番組表', icon: '📡', url: q => `https://www.google.com/search?q=${encodeURIComponent(q + ' 番組表 放送予定')}`, desc: '放送予定を検索' },
  { id: 'tver', label: 'TVer検索', icon: '▶️', url: q => `https://tver.jp/search?keyword=${encodeURIComponent(q)}`, desc: '見逃し配信を検索' },
  { id: 'wiki', label: 'Wikipedia', icon: '📖', url: q => `https://ja.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`, desc: '番組の詳細情報' },
];

const GENRE_SEARCHES = [
  { genre: '街歩き', keywords: '関東 街歩き 番組', desc: '関東の街を探索する番組を探す' },
  { genre: 'ファミリーヒストリー', keywords: 'ファミリーヒストリー NHK 放送予定', desc: '家族の歴史を辿る番組' },
  { genre: '未解決事件', keywords: '未解決事件 テレビ 特集', desc: '未解決事件を扱う番組を探す' },
  { genre: 'UFO・オカルト', keywords: 'UFO オカルト ミステリー 番組', desc: 'UFO・オカルト系番組を探す' },
];

/* ===== State ===== */
let state = {
  shows: [],
  episodes: [],
  customGenres: [],
  calendarMonth: new Date().getMonth(),
  calendarYear: new Date().getFullYear(),
};

function loadState() {
  try {
    const saved = localStorage.getItem('tv-watcher-data');
    if (saved) {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
    } else {
      initPresets();
    }
  } catch {
    initPresets();
  }
}

function saveState() {
  localStorage.setItem('tv-watcher-data', JSON.stringify({
    shows: state.shows,
    episodes: state.episodes,
    customGenres: state.customGenres,
  }));
}

function initPresets() {
  state.shows = PRESET_SHOWS.map((s, i) => ({
    id: 'preset-' + i,
    ...s,
    favorite: false,
    createdAt: Date.now(),
  }));
  saveState();
}

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function allGenres() {
  return [...GENRES, ...state.customGenres.map(g => ({ id: g, icon: '📌', color: '#2B4B6F' }))];
}

function getGenre(id) {
  return allGenres().find(g => g.id === id) || { id, icon: '📌', color: '#2B4B6F' };
}

/* ===== Tab Navigation ===== */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'calendar') renderCalendar();
    if (btn.dataset.tab === 'watchlist') renderWatchlist();
    if (btn.dataset.tab === 'search') renderSearchPresets();
    if (btn.dataset.tab === 'dashboard') renderDashboard();
  });
});

/* ===== Dashboard ===== */
function renderDashboard() {
  renderGenreFilter();
  renderCards('all');
}

function renderGenreFilter() {
  const container = document.querySelector('.genre-filter');
  container.innerHTML = '<button class="filter-chip active" data-genre="all">すべて</button>';
  allGenres().forEach(g => {
    const btn = document.createElement('button');
    btn.className = 'filter-chip';
    btn.dataset.genre = g.id;
    btn.textContent = g.icon + ' ' + g.id;
    container.appendChild(btn);
  });
  container.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderCards(chip.dataset.genre);
    });
  });
}

function renderCards(genre) {
  const container = document.getElementById('dashboard-cards');
  const shows = genre === 'all' ? state.shows : state.shows.filter(s => s.genre === genre);

  if (!shows.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📺</div>番組が登録されていません</div>';
    return;
  }

  container.innerHTML = shows.map(s => {
    const g = getGenre(s.genre);
    const genreClass = GENRES.find(x => x.id === s.genre) ? `genre-${s.genre}` : 'genre-custom';
    const dayStr = s.day !== '' ? DAY_NAMES[parseInt(s.day)] + '曜' : '';
    const timeStr = s.time || '';
    const schedule = [dayStr, timeStr].filter(Boolean).join(' ');
    return `
      <div class="show-card" data-genre="${s.genre}">
        <span class="card-genre ${genreClass}">${g.icon} ${s.genre}</span>
        <div class="card-title">${esc(s.name)}</div>
        <div class="card-info">${esc(s.channel || '')}${schedule ? ' ・ ' + schedule : ''}</div>
        ${s.memo ? `<div class="card-memo">${esc(s.memo)}</div>` : ''}
        <div class="card-actions">
          <button class="btn btn-secondary btn-sm" onclick="searchShow('${esc(s.name)}')">🔍 調査</button>
          <button class="btn btn-secondary btn-sm" onclick="editShow('${s.id}')">✏️ 編集</button>
          <button class="btn btn-danger btn-sm" onclick="deleteShow('${s.id}')">🗑</button>
        </div>
      </div>`;
  }).join('');
}

/* ===== Calendar ===== */
function renderCalendar() {
  const { calendarYear: year, calendarMonth: month } = state;
  document.getElementById('calendar-title').textContent = `${year}年 ${month + 1}月`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const today = new Date();

  let html = '';

  // Previous month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="cal-day other-month"><div class="cal-day-num">${prevDays - i}</div></div>`;
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dayOfWeek = date.getDay();
    const isToday = date.toDateString() === today.toDateString();
    const showsOnDay = state.shows.filter(s => s.day !== '' && parseInt(s.day) === dayOfWeek);

    html += `<div class="cal-day${isToday ? ' today' : ''}">
      <div class="cal-day-num">${d}</div>
      ${showsOnDay.map(s => {
        const g = getGenre(s.genre);
        return `<div class="cal-show" style="background:${g.color}22;color:${g.color}" title="${esc(s.name)} ${s.time || ''}">${esc(s.name)}</div>`;
      }).join('')}
    </div>`;
  }

  // Next month padding
  const totalCells = firstDay + daysInMonth;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remaining; i++) {
    html += `<div class="cal-day other-month"><div class="cal-day-num">${i}</div></div>`;
  }

  document.getElementById('calendar-days').innerHTML = html;
}

document.getElementById('cal-prev').addEventListener('click', () => {
  state.calendarMonth--;
  if (state.calendarMonth < 0) { state.calendarMonth = 11; state.calendarYear--; }
  renderCalendar();
});
document.getElementById('cal-next').addEventListener('click', () => {
  state.calendarMonth++;
  if (state.calendarMonth > 11) { state.calendarMonth = 0; state.calendarYear++; }
  renderCalendar();
});
document.getElementById('cal-today').addEventListener('click', () => {
  const now = new Date();
  state.calendarMonth = now.getMonth();
  state.calendarYear = now.getFullYear();
  renderCalendar();
});

/* ===== Watchlist ===== */
function renderWatchlist() {
  const container = document.getElementById('watchlist-items');
  const filter = document.querySelector('.watchlist-filters .filter-chip.active')?.dataset.watch || 'all';

  if (!state.shows.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div>番組を登録してください</div>';
    return;
  }

  container.innerHTML = state.shows.map(s => {
    const g = getGenre(s.genre);
    const genreClass = GENRES.find(x => x.id === s.genre) ? `genre-${s.genre}` : 'genre-custom';
    const eps = state.episodes.filter(e => e.showId === s.id).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    // Filter
    if (filter === 'watched' && !eps.some(e => e.watched)) return '';
    if (filter === 'unwatched' && eps.length > 0 && eps.every(e => e.watched)) return '';

    return `
      <div class="watch-item">
        <div class="watch-item-header">
          <div>
            <span class="card-genre ${genreClass}">${g.icon} ${s.genre}</span>
            <div class="watch-item-title">${esc(s.name)}</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="searchShow('${esc(s.name)}')">🔍</button>
        </div>
        <div class="watch-episodes">
          ${eps.map(ep => `
            <div class="episode-row${ep.watched ? ' watched' : ''}">
              <input type="checkbox" class="episode-checkbox" ${ep.watched ? 'checked' : ''}
                onchange="toggleEpisode('${ep.id}', this.checked)">
              <div class="episode-info">
                <div class="episode-title">${esc(ep.title || '(タイトル未設定)')}</div>
                <div class="episode-date">${ep.date || ''}</div>
                ${ep.rating ? `<div class="episode-stars">${'★'.repeat(ep.rating)}${'☆'.repeat(5 - ep.rating)}</div>` : ''}
                ${ep.comment ? `<div class="episode-comment">${esc(ep.comment)}</div>` : ''}
              </div>
              <div class="episode-actions">
                <button class="btn btn-secondary btn-sm" onclick="editEpisode('${s.id}','${ep.id}')">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="deleteEpisode('${ep.id}')">🗑</button>
              </div>
            </div>
          `).join('')}
          <button class="btn-add-episode" onclick="addEpisode('${s.id}')">＋ 視聴記録を追加</button>
        </div>
      </div>`;
  }).filter(Boolean).join('');

  if (!container.innerHTML.trim()) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✅</div>該当する番組はありません</div>';
  }
}

document.querySelectorAll('.watchlist-filters .filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.watchlist-filters .filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    renderWatchlist();
  });
});

/* ===== Episode CRUD ===== */
function addEpisode(showId) {
  document.getElementById('ep-show-id').value = showId;
  document.getElementById('ep-id').value = '';
  document.getElementById('ep-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('ep-title').value = '';
  document.getElementById('ep-comment').value = '';
  document.getElementById('ep-watched').checked = true;
  setStarRating(0);
  const show = state.shows.find(s => s.id === showId);
  document.getElementById('episode-modal-title').textContent = `${show?.name || ''} - 視聴記録`;
  document.getElementById('episode-modal-overlay').classList.add('open');
}

function editEpisode(showId, epId) {
  const ep = state.episodes.find(e => e.id === epId);
  if (!ep) return;
  document.getElementById('ep-show-id').value = showId;
  document.getElementById('ep-id').value = epId;
  document.getElementById('ep-date').value = ep.date || '';
  document.getElementById('ep-title').value = ep.title || '';
  document.getElementById('ep-comment').value = ep.comment || '';
  document.getElementById('ep-watched').checked = ep.watched || false;
  setStarRating(ep.rating || 0);
  document.getElementById('episode-modal-title').textContent = '視聴記録を編集';
  document.getElementById('episode-modal-overlay').classList.add('open');
}

function deleteEpisode(epId) {
  if (!confirm('この視聴記録を削除しますか？')) return;
  state.episodes = state.episodes.filter(e => e.id !== epId);
  saveState();
  renderWatchlist();
}

function toggleEpisode(epId, watched) {
  const ep = state.episodes.find(e => e.id === epId);
  if (ep) { ep.watched = watched; saveState(); renderWatchlist(); }
}

let currentRating = 0;
function setStarRating(val) {
  currentRating = val;
  document.querySelectorAll('#ep-rating .star').forEach(s => {
    s.classList.toggle('active', parseInt(s.dataset.val) <= val);
  });
}
document.querySelectorAll('#ep-rating .star').forEach(s => {
  s.addEventListener('click', () => setStarRating(parseInt(s.dataset.val)));
});

document.getElementById('episode-form').addEventListener('submit', e => {
  e.preventDefault();
  const showId = document.getElementById('ep-show-id').value;
  const epId = document.getElementById('ep-id').value;
  const data = {
    showId,
    date: document.getElementById('ep-date').value,
    title: document.getElementById('ep-title').value,
    rating: currentRating,
    comment: document.getElementById('ep-comment').value,
    watched: document.getElementById('ep-watched').checked,
  };
  if (epId) {
    const idx = state.episodes.findIndex(e => e.id === epId);
    if (idx >= 0) state.episodes[idx] = { ...state.episodes[idx], ...data };
  } else {
    state.episodes.push({ id: genId(), ...data });
  }
  saveState();
  document.getElementById('episode-modal-overlay').classList.remove('open');
  renderWatchlist();
});

document.getElementById('episode-modal-close').addEventListener('click', () => {
  document.getElementById('episode-modal-overlay').classList.remove('open');
});
document.getElementById('ep-cancel').addEventListener('click', () => {
  document.getElementById('episode-modal-overlay').classList.remove('open');
});

/* ===== Search ===== */
function renderSearchPresets() {
  const container = document.getElementById('search-presets-list');
  container.innerHTML = GENRE_SEARCHES.map(gs => {
    const g = getGenre(gs.genre);
    return `<div class="preset-card" style="border-left-color:${g.color}" onclick="performSearch('${esc(gs.keywords)}')">
      <div class="preset-card-title">${g.icon} ${gs.genre}</div>
      <div class="preset-card-desc">${esc(gs.desc)}</div>
    </div>`;
  }).join('');
}

function performSearch(query) {
  document.getElementById('search-input').value = query;
  renderSearchLinks(query);
}

function renderSearchLinks(query) {
  if (!query) {
    document.getElementById('search-links').innerHTML = '';
    return;
  }
  document.getElementById('search-links').innerHTML = SEARCH_ENGINES.map(se => `
    <a class="search-link-item" href="${se.url(query)}" target="_blank" rel="noopener">
      <span class="search-link-icon">${se.icon}</span>
      <div>
        <div class="search-link-label">${se.label}</div>
        ${se.desc ? `<div class="search-link-desc">${se.desc}</div>` : ''}
      </div>
    </a>
  `).join('');
}

function searchShow(name) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector('[data-tab="search"]').classList.add('active');
  document.getElementById('search').classList.add('active');
  performSearch(name);
  renderSearchPresets();
}

document.getElementById('btn-search').addEventListener('click', () => {
  renderSearchLinks(document.getElementById('search-input').value.trim());
});
document.getElementById('search-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') renderSearchLinks(e.target.value.trim());
});

/* ===== Show CRUD (Add/Edit Modal) ===== */
function openAddModal() {
  document.getElementById('form-id').value = '';
  document.getElementById('form-name').value = '';
  document.getElementById('form-channel').value = '';
  document.getElementById('form-day').value = '';
  document.getElementById('form-time').value = '';
  document.getElementById('form-memo').value = '';
  populateGenreSelect();
  document.getElementById('modal-title').textContent = '番組を追加';
  document.getElementById('modal-overlay').classList.add('open');
}

function editShow(id) {
  const s = state.shows.find(x => x.id === id);
  if (!s) return;
  document.getElementById('form-id').value = s.id;
  document.getElementById('form-name').value = s.name;
  document.getElementById('form-channel').value = s.channel || '';
  document.getElementById('form-day').value = s.day || '';
  document.getElementById('form-time').value = s.time || '';
  document.getElementById('form-memo').value = s.memo || '';
  populateGenreSelect(s.genre);
  document.getElementById('modal-title').textContent = '番組を編集';
  document.getElementById('modal-overlay').classList.add('open');
}

function deleteShow(id) {
  if (!confirm('この番組を削除しますか？')) return;
  state.shows = state.shows.filter(s => s.id !== id);
  state.episodes = state.episodes.filter(e => e.showId !== id);
  saveState();
  renderDashboard();
}

function populateGenreSelect(selected) {
  const sel = document.getElementById('form-genre');
  sel.innerHTML = allGenres().map(g =>
    `<option value="${g.id}" ${g.id === selected ? 'selected' : ''}>${g.icon} ${g.id}</option>`
  ).join('') + '<option value="__new__">＋ 新しいジャンルを追加</option>';
}

document.getElementById('form-genre').addEventListener('change', function () {
  if (this.value === '__new__') {
    const name = prompt('新しいジャンル名を入力:');
    if (name && name.trim()) {
      const trimmed = name.trim();
      if (!state.customGenres.includes(trimmed)) {
        state.customGenres.push(trimmed);
        saveState();
      }
      populateGenreSelect(trimmed);
    } else {
      this.value = allGenres()[0]?.id || '';
    }
  }
});

document.getElementById('show-form').addEventListener('submit', e => {
  e.preventDefault();
  const id = document.getElementById('form-id').value;
  const data = {
    name: document.getElementById('form-name').value.trim(),
    channel: document.getElementById('form-channel').value.trim(),
    genre: document.getElementById('form-genre').value,
    day: document.getElementById('form-day').value,
    time: document.getElementById('form-time').value,
    memo: document.getElementById('form-memo').value.trim(),
  };
  if (id) {
    const idx = state.shows.findIndex(s => s.id === id);
    if (idx >= 0) state.shows[idx] = { ...state.shows[idx], ...data };
  } else {
    state.shows.push({ id: genId(), ...data, favorite: false, createdAt: Date.now() });
  }
  saveState();
  document.getElementById('modal-overlay').classList.remove('open');
  renderDashboard();
});

document.getElementById('btn-add-show').addEventListener('click', openAddModal);
document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('modal-overlay').classList.remove('open');
});
document.getElementById('btn-cancel').addEventListener('click', () => {
  document.getElementById('modal-overlay').classList.remove('open');
});
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
});
document.getElementById('episode-modal-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
});

/* ===== Import / Export ===== */
document.getElementById('btn-export').addEventListener('click', () => {
  const data = JSON.stringify({ shows: state.shows, episodes: state.episodes, customGenres: state.customGenres }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'tv-watcher-backup.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('btn-import').addEventListener('click', () => {
  document.getElementById('import-file').click();
});
document.getElementById('import-file').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.shows) state.shows = data.shows;
      if (data.episodes) state.episodes = data.episodes;
      if (data.customGenres) state.customGenres = data.customGenres;
      saveState();
      renderDashboard();
      alert('インポートが完了しました！');
    } catch {
      alert('ファイルの読み込みに失敗しました。');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

/* ===== Utils ===== */
function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* ===== Service Worker ===== */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

/* ===== Init ===== */
loadState();
renderDashboard();
