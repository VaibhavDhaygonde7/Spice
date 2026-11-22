'use strict';


const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const paths = {
    glass: 'M7 3h10l4 5-9 13L3 8zM3 8h18M7 3l5 18 5-18',
    home: 'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
    search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    library: 'M4 4v16M9 4v16M14 5l5-1 3 15-5 1z',
    music: 'M9 18V5l12-2v13M9 8l12-2M9 18c0 1.7-1.8 3-4 3s-3-1-3-2.5S4 16 6 16s3 .8 3 2M21 16c0 1.7-1.8 3-4 3s-3-1-3-2.5S16 14 18 14s3 .8 3 2',
    disc: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6 8l2-2m8 12 2-2',
    artist: 'M17 7a5 5 0 1 1-10 0 5 5 0 0 1 10 0M3 22v-2a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v2',
    heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
    plus: 'M12 5v14M5 12h14',
    'folder-plus': 'M3 7V5a1 1 0 0 1 1-1h6l2 3h8a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM12 11v6m-3-3h6',
    folder: 'M3 7V5a1 1 0 0 1 1-1h6l2 3h8a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z',
    settings: 'm9 3-1 3-3 1-2 3 2 2-1 3 3 3 3-1 2 2 3-1 1-3 3-1 1-4-2-2V6l-4-1-1-2zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    'chevron-left': 'm14 6-6 6 6 6', 'chevron-right': 'm10 6 6 6-6 6',
    offline: 'M8 8a9 9 0 0 1 12 2M4 10l2-1M8 14a6 6 0 0 1 4-2m3 1 1 1M11 18h2M3 3l18 18',
    palette: 'M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-4 1.5 1.5 0 0 1 1-3h3a3 3 0 0 0 3-3 9 9 0 0 0-9-8M7 10h.01M10 6.5h.01M15 7h.01M18 10h.01',
    play: 'm8 4 12 8-12 8z', pause: 'M8 5v14M16 5v14', previous: 'M5 5v14M19 5l-10 7 10 7z', next: 'M19 5v14M5 5l10 7-10 7z',
    shuffle: 'M3 6h3l12 12h3M18 15l3 3-3 3M3 18h3l4-4M14 10l4-4h3m-3-3 3 3-3 3',
    repeat: 'M20 8H6a3 3 0 0 0-3 3v2M17 5l3 3-3 3M4 16h14a3 3 0 0 0 3-3v-2M7 19l-3-3 3-3',
    queue: 'M3 5h17M3 10h17M3 15h9M3 20h9m5-5 5 3-5 3z',
    volume: 'M11 4 6 8H2v8h4l5 4zM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14',
    mute: 'M11 4 6 8H2v8h4l5 4zM16 9l6 6m0-6-6 6',
    expand: 'M9 3H3v6M15 3h6v6M3 15v6h6M21 15v6h-6',
    close: 'm6 6 12 12M6 18 18 6', clock: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M12 6v6l4 2',
    more: 'M5 12h.01M12 12h.01M19 12h.01', check: 'm5 12 4 4L20 5',
    leaf: 'M20 3C6 2 1 10 6 16s15 1 14-13ZM4 21 16 8',
    headphones: 'M3 14v-3a9 9 0 0 1 18 0v3M3 13h4v8H4a1 1 0 0 1-1-1zm18 0h-4v8h3a1 1 0 0 0 1-1z',
    trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
    info: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M12 11v6M12 7h.01',
    refresh: 'M21 3v6h-6M3 21v-6h6M20 9A8 8 0 0 0 5 6M4 15a8 8 0 0 0 15 3'
};


function icon(name, filled = false) { return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" 
stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.music}"/></svg>`; }
$$('[data-icon]').forEach(el => el.replaceWith(new DOMParser().parseFromString(icon(el.dataset.icon), 'image/svg+xml').documentElement));


const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const time = s => Number.isFinite(+s) && +s > 0 ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00';

const audio = $('#audio'), main = $('#main'), modal = $('#modal');

let tracks = [], byId = new Map(), state = { liked: [], playlists: [], recent: [], theme: 'spice', volume: .7 }, folders = [], token = '', defaultFolder = '', capabilities = {}, scanTimer, saveTimer, toastTimer;

let view = 'home', viewKey = '', query = '', filter = 'all', sort = 'default', tableLimit = 150, shown = [], queue = [], qi = -1, current = null, shuffled = false, repeat = 0, hasFallback = false, playVersion = 0, scanBusy = false, previousVolume = .7;

let historyStack = [], historyAt = -1, restoring = false;


const themes = {
    spice: { label: 'Spice', colors: { text: 'f4f5f1', subtext: 'a0a49b', main: '131512', sidebar: '0d0f0d', player: '10120f', card: '1c1f1a', highlight: '292d25', button: 'c0f078' } },
    spotify: { label: 'Classic green', colors: { text: 'ffffff', subtext: 'a7a7a7', main: '121212', sidebar: '090909', player: '090909', card: '242424', highlight: '333333', button: '1ed760' } },
    nord: { label: 'Nord', colors: { text: 'eceff4', subtext: 'b2bccd', main: '2e3440', sidebar: '252b35', player: '252b35', card: '3b4252', highlight: '434c5e', button: '88c0d0' } },
    dracula: { label: 'Dracula', colors: { text: 'f8f8f2', subtext: 'bdb9d0', main: '282a36', sidebar: '20212c', player: '20212c', card: '343746', highlight: '44475a', button: 'bd93f9' } },
    rose: { label: 'Rose pine', colors: { text: 'e0def4', subtext: 'aaa5be', main: '191724', sidebar: '13111c', player: '13111c', card: '26233a', highlight: '393552', button: 'ebbcba' } },
    midnight: { label: 'Midnight', colors: { text: 'e5e9f0', subtext: '99a7bc', main: '101620', sidebar: '0b1018', player: '0b1018', card: '1b2534', highlight: '2b384c', button: '8ebaf5' } }
};


function applyTheme(name) {
    const palette = name === 'custom' ? state.customTheme?.colors : themes[name]?.colors;
    if (!palette) return;
    for (const [k, v] of Object.entries(palette)) if (/^[0-9a-f]{6}$/i.test(v)) document.documentElement.style.setProperty(`--spice-${k}`, '#' + v);
    state.theme = name;
}


function applyGlass(enabled, save = false) {
    state.glass = !!enabled; document.body.classList.toggle('glass-on', state.glass);
    $$('[data-glass-toggle]').forEach(b => b.setAttribute('aria-pressed', String(state.glass)));
    if ($('#settings-glass')) $('#settings-glass').checked = state.glass;
    if (save) persist();
}


function toast(message) { clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').classList.add('show'); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 4500); }


async function api(path, data) {
    const response = await fetch(path, data === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Spice-Token': token }, body: JSON.stringify(data) });
    let result; try { result = await response.json(); } catch { throw new Error('The local player is unavailable. Restart Spice and refresh this window.'); }
    if (!response.ok) { if (result.error === 'Unknown action.') throw new Error('The running Spice service is outdated. Restart it with the updated launcher, then refresh this window. Your lyric file is not the problem.'); throw new Error(result.error || `Request failed (${response.status}).`); }
    return result;
}


function persist() { clearTimeout(saveTimer); saveTimer = setTimeout(() => api('/api/state', state).catch(e => toast(e.message)), 250); }


function liked(id) { return state.liked.includes(id); }

function toggleLike(id) {
    state.liked = liked(id) ? state.liked.filter(x => x !== id) : [...state.liked, id]; persist();
    $$(`[data-like="${id}"]`).forEach(b => { b.innerHTML = icon('heart', liked(id)); b.classList.toggle('active', liked(id)); b.setAttribute('aria-label', (liked(id) ? 'Unlike ' : 'Like ') + (byId.get(id)?.title || 'song')); b.title = liked(id) ? 'Remove from liked songs' : 'Like song'; });
    updatePlayer(); if (view === 'liked') render();
}
function art(t, cls = '') { return `<img class="${cls}" src="/api/art/${t.id}" alt="" loading="lazy">`; }

function albumKey(t) { return `${t.albumArtist}\u001f${t.album}`; }


function grouped(mode, source = tracks) {
    const groups = new Map(); for (const t of source) { const key = mode === 'artists' ? t.artist : albumKey(t); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(t); } return groups;
}


function albumCards(entries, mode = 'albums', limit = entries.size) { return `<div class="album-grid">${[...entries].slice(0, limit).map(([key, list]) => `<button class="album-card ${mode === 'artists' ? 'artist' : ''}" data-open="${mode === 'artists' ? 'artist' : 'album'}" data-key="${esc(key)}">${art(list[0])}<span class="card-play">${icon('play', true)}</span><h3>${esc(mode === 'artists' ? key : list[0].album)}</h3><p>${esc(mode === 'artists' ? `${grouped('albums', list).size} albums · ${list.length} songs` : list[0].albumArtist)}${mode !== 'artists' && list[0].year ? ` · ${esc(list[0].year)}` : ''}</p></button>`).join('')}</div>`; }


function playlistNav() {
    $('#side-count').textContent = tracks.length.toLocaleString();
    $('#playlist-nav').innerHTML = state.playlists.length ? state.playlists.map(p => `<button class="nav-item ${view === 'playlist' && viewKey === p.id ? 'active' : ''}" data-open="playlist" data-key="${esc(p.id)}">${icon('queue')}${esc(p.name)}</button>`).join('') : '<div class="playlist-empty">A place for every mood.<br>Make your first playlist.</div>';
    $$('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === view));
}


function navigate(next, key = '') {
    if (next !== view || key !== viewKey) { query = ''; sort = 'default'; filter = 'all'; tableLimit = 150; }
    view = next; viewKey = key;
    if (!restoring) { historyStack = historyStack.slice(0, historyAt + 1); historyStack.push([view, viewKey]); historyAt = historyStack.length - 1; }
    render(); main.scrollTop = 0;
}


function empty(iconName, title, description, action = 'import', button = 'Add music folder') {
    return `<div class="empty-page">${icon(iconName)}<h2>${esc(title)}</h2><p>${esc(description)}</p>${action ? `<button class="primary-button" data-action="${action}">${icon(action === 'import' ? 'folder-plus' : 'plus')}${esc(button)}</button>` : ''}</div>`;
}


function home() {
    const hour = new Date().getHours(), greeting = hour < 12 ? 'Good morning.' : hour < 18 ? 'Good afternoon.' : 'Good evening.';
    const recent = state.recent.map(id => byId.get(id)).filter(Boolean);
    const newest = [...tracks].sort((a, b) => b.added - a.added);
    const days = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date());
    return `<div class="page-eyebrow">
    MADE FOR YOUR KIND OF LISTENING</div>
    <div class="welcome-heading">
    <h1>${greeting}</h1><span class="date-label">${esc(days)}</span></div>
 <section class="hero"><div class="hero-copy"><div class="overline">YOUR FILES. YOUR FREQUENCY.</div><h2>Good music.<br>Closer to home.</h2><p>${tracks.length ? 'Rediscover the records you love. No algorithms, no interruptions. Just press play.' : 'All the music you love. None of the noise.<br>A little space for your own collection.'}</p><button class="primary-button" data-action="${tracks.length ? 'play-all' : 'import'}">${icon(tracks.length ? 'play' : 'folder-plus', !!tracks.length)}${tracks.length ? 'Play your collection' : 'Bring your music home'}</button></div><div class="hero-art" aria-hidden="true"><div class="record"><div class="record-label"><span>SPICE · SIDE A</span></div></div><div class="sleeve"><div class="sleeve-top"><span>THE LOCAL SESSIONS</span><span>33⅓ RPM</span></div><div class="sleeve-landscape"></div><div class="sleeve-title">closer<br>to home.</div></div><div class="hero-art-note">AN ENTIRE WORLD. ON YOUR LAPTOP.</div></div></section>
 <div class="quick-links"><button class="quick-link" data-view="liked"><span class="quick-cover purple">${icon('heart', true)}</span><span><strong>Liked songs</strong><small>${state.liked.filter(id => byId.has(id)).length} ${state.liked.filter(id => byId.has(id)).length === 1 ? 'favorite' : 'favorites'}, all yours</small></span></button><button class="quick-link" data-view="tracks"><span class="quick-cover green">${icon('music')}</span><span><strong>Your collection</strong><small>${tracks.length ? `${tracks.length.toLocaleString()} ${tracks.length === 1 ? 'song' : 'songs'}, zero limits` : 'Waiting for your first song'}</small></span></button><button class="quick-link" data-view="recent"><span class="quick-cover brown">${icon('clock')}</span><span><strong>Recently played</strong><small>${recent.length ? 'Pick up where you left off' : 'Find your way back'}</small></span></button></div>
 <section><div class="section-heading"><div><h2>${recent.length ? 'Back in rotation' : tracks.length ? 'Fresh in your collection' : 'Your collection starts here'}</h2><p class="section-subtitle">${recent.length ? 'Some things are worth another listen.' : 'Old favorites. New discoveries. Every song has a home.'}</p></div>${tracks.length ? '<button class="text-button" data-view="albums">View all</button>' : ''}</div>
 ${tracks.length ? albumCards(grouped('albums', recent.length ? recent : newest), 'albums', 5) : `<div class="empty-collection"><div class="empty-discs" aria-hidden="true"></div><div><h3>A great collection is a personal thing.</h3><p>Connect a music folder and we’ll take care of the details.<br>Your albums, artwork, and artists — beautifully in place.</p></div><button class="secondary-button" data-action="import">Add a folder</button></div>`}</section>
 <div class="bottom-note">${icon('leaf')}<div><strong>Less connected. More in tune.</strong><p>No account. No ads. No streaming. Just you and your music.</p></div><span class="overline">BUILT FOR LINUX. MADE FOR YOU.</span></div>`;
}


function listForView() {
    if (view === 'liked') return state.liked.map(id => byId.get(id)).filter(Boolean);
    if (view === 'recent') return state.recent.map(id => byId.get(id)).filter(Boolean);
    if (view === 'playlist') return (state.playlists.find(p => p.id === viewKey)?.tracks || []).map(id => byId.get(id)).filter(Boolean);
    if (view === 'album') return tracks.filter(t => albumKey(t) === viewKey);
    if (view === 'artist') return tracks.filter(t => t.artist === viewKey);
    return tracks;
}


function sorted(list) {
    let result = list.filter(t => `${t.title} ${t.artist} ${t.album} ${t.genre}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
    if (sort === 'title') result.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'artist') result.sort((a, b) => a.artist.localeCompare(b.artist) || a.album.localeCompare(b.album) || a.number - b.number);
    else if (sort === 'album') result.sort((a, b) => a.album.localeCompare(b.album) || a.disc - b.disc || a.number - b.number);
    else if (sort === 'added') result.sort((a, b) => b.added - a.added);
    else if (sort === 'duration') result.sort((a, b) => b.duration - a.duration);
    else if (view === 'album') result.sort((a, b) => a.disc - b.disc || a.number - b.number);
    return result;
}


function table(list) {
    shown = list;
    if (!list.length) return empty('search', 'Nothing here just yet.', query ? 'Try another title, artist, or album.' : view === 'liked' ? 'Tap a heart beside any song to keep it close.' : view === 'playlist' ? 'Add songs using the three-dot menu beside a track.' : 'Your collection is waiting. Add a folder to get started.', tracks.length ? '' : 'import');
    return `<table class="track-table"><thead><tr><th scope="col">#</th><th scope="col">TITLE</th><th scope="col">ALBUM</th><th scope="col"><span class="sr-only">Favorite</span></th><th scope="col"><span class="sr-only">Duration</span>${icon('clock')}</th><th scope="col"><span class="sr-only">Options</span></th></tr></thead><tbody>${list.slice(0, tableLimit).map((t, i) => `<tr data-track="${t.id}" class="${current?.id === t.id ? 'current' : ''}"><td><button data-play="${t.id}" aria-label="Play ${esc(t.title)}"><span class="row-number">${current?.id === t.id && !audio.paused ? '♫' : i + 1}</span><span class="row-play">${icon('play', true)}</span></button></td><td><div class="track-title-cell">${art(t)}<div><strong>${esc(t.title)}</strong><small>${esc(t.artist)}</small></div></div></td><td class="album-cell">${esc(t.album)}</td><td><button class="icon-button ${liked(t.id) ? 'active' : ''}" data-like="${t.id}" aria-label="${liked(t.id) ? 'Unlike' : 'Like'} ${esc(t.title)}" title="${liked(t.id) ? 'Remove from liked songs' : 'Like song'}">${icon('heart', liked(t.id))}</button></td><td class="duration-cell">${t.duration ? time(t.duration) : '—'}</td><td><button class="icon-button" data-more="${t.id}" aria-label="Options for ${esc(t.title)}" title="Song options">${icon('more')}</button></td></tr>`).join('')}</tbody></table>${list.length > tableLimit ? `<button class="secondary-button load-more" data-action="load-more">Show more songs (${Math.min(tableLimit, list.length)} of ${list.length})</button>` : ''}`;
}


function viewHeader(title, description, iconName = 'music', image = null) { return `<div class="view-header"><div class="view-art ${view === 'liked' ? 'liked' : ''}">${image ? art(image) : icon(iconName, view === 'liked')}</div><div><div class="page-eyebrow">${esc(view === 'album' ? 'ALBUM' : view === 'artist' ? 'ARTIST' : view === 'playlist' ? 'YOUR PLAYLIST' : 'YOUR LIBRARY')}</div><h1>${esc(title)}</h1><p>${esc(description)}</p></div></div>`; }


function trackPage() {
    const list = listForView(), p = state.playlists.find(p => p.id === viewKey);
    let title = { tracks: 'All songs', liked: 'Liked songs', recent: 'Recently played', playlist: p?.name, album: list[0]?.album, artist: viewKey }[view] || 'Your collection';
    const total = list.reduce((a, t) => a + t.duration, 0);
    const description = `${list.length.toLocaleString()} ${list.length === 1 ? 'song' : 'songs'}${total ? ` · ${total >= 3600 ? `${Math.floor(total / 3600)} hr ` : ''}${Math.floor(total % 3600 / 60)} min` : ''}${view === 'album' && list[0] ? ` · ${list[0].albumArtist}${list[0].year ? ' · ' + list[0].year : ''}` : ''}`;
    return viewHeader(title, description, view === 'liked' ? 'heart' : view === 'recent' ? 'clock' : view === 'playlist' ? 'queue' : view === 'artist' ? 'artist' : 'music', ['album', 'artist'].includes(view) ? list[0] : null) +
        `<div class="toolbar"><button class="primary-button" data-action="play-view" ${!list.length ? 'disabled' : ''}>${icon('play', true)}Play</button>${view === 'playlist' ? `<button class="icon-button" data-action="edit-playlist" title="Rename playlist" aria-label="Rename playlist">${icon('settings')}</button><button class="icon-button" data-action="delete-playlist" title="Delete playlist" aria-label="Delete playlist">${icon('trash')}</button>` : ''}<div class="toolbar-spacer"></div><label class="search-field">${icon('search')}<input id="list-search" placeholder="Search in ${view === 'playlist' ? 'playlist' : 'collection'}" value="${esc(query)}" aria-label="Search this collection"></label><select id="sort" class="sort-select" aria-label="Sort songs"><option value="default">${view === 'playlist' ? 'Playlist order' : view === 'recent' ? 'Recently played' : 'Default order'}</option><option value="title">Title</option><option value="artist">Artist</option><option value="album">Album</option><option value="added">Recently added</option><option value="duration">Duration</option></select></div><div id="results">${table(sorted(list))}</div>`;
}


function gridPage() {
    const isArtists = view === 'artists', groups = grouped(view);
    return viewHeader(isArtists ? 'Artists' : 'Albums', `${groups.size} ${isArtists ? 'artists' : 'albums'} in your collection`, isArtists ? 'artist' : 'disc') + `<div class="toolbar"><label class="search-field">${icon('search')}<input id="grid-search" placeholder="Find ${isArtists ? 'an artist' : 'an album'}" value="${esc(query)}" aria-label="Search ${view}"></label></div><div id="results">${gridResults()}</div>`;
}


function gridResults() {
    const list = tracks.filter(t => `${view === 'artists' ? t.artist : t.album + ' ' + t.albumArtist}`.toLowerCase().includes(query.toLowerCase()));
    return list.length ? albumCards(new Map([...grouped(view, list)].sort((a, b) => (view === 'artists' ? a[0] : a[1][0].album).localeCompare(view === 'artists' ? b[0] : b[1][0].album))), view) : empty(view === 'artists' ? 'artist' : 'disc', query ? 'No matches.' : 'The whole record, all in one place.', query ? 'Try a different search.' : 'Add your music folder. Albums and artists will appear here automatically.', tracks.length ? '' : 'import');
}


function searchResults() {
    if (!query.trim()) return empty('search', 'Find that feeling.', 'Search your collection by song, artist, album, or genre.', '');
    const list = sorted(tracks);
    if (!list.length) return empty('search', 'No songs found.', 'Try another title, artist, or album.', '');
    return filter === 'albums' ? albumCards(grouped('albums', list)) : filter === 'artists' ? albumCards(grouped('artists', list), 'artists') : table(list);
}


function searchPage() { return `<div class="search-hero"><div class="page-eyebrow">SOMEWHERE IN YOUR COLLECTION</div><h1>What’s on your mind?</h1><label class="search-field">${icon('search')}<input id="global-search" type="search" autocomplete="off" placeholder="Songs, artists, albums…" value="${esc(query)}" aria-label="Search your music"></label><div class="filter-chips">${['all', 'songs', 'albums', 'artists'].map(f => `<button class="chip ${filter === f ? 'active' : ''}" data-filter="${f}">${f[0].toUpperCase() + f.slice(1)}</button>`).join('')}</div></div><div id="results">${searchResults()}</div>`; }


function playlistsPage() { return viewHeader('Your playlists', `${state.playlists.length} ${state.playlists.length === 1 ? 'little world' : 'little worlds'} of your own`, 'queue') + `<div class="toolbar"><button class="primary-button" data-action="new-playlist">${icon('plus')}Create playlist</button></div>${state.playlists.length ? `<div class="album-grid">${state.playlists.map(p => `<button class="album-card" data-open="playlist" data-key="${esc(p.id)}"><div class="playlist-card-image">${icon('queue')}</div><h3>${esc(p.name)}</h3><p>${p.tracks.filter(id => byId.has(id)).length} ${p.tracks.filter(id => byId.has(id)).length === 1 ? 'song' : 'songs'}</p></button>`).join('')}</div>` : empty('queue', 'A place for every mood.', 'Create your first playlist. Add songs from their three-dot menu.', '')}`; }


function render() {
    playlistNav();
    $('#breadcrumb').textContent = { home: 'Your listening space', search: 'Find your music', tracks: 'Your library / All songs', albums: 'Your library / Albums', artists: 'Your library / Artists', liked: 'Your library / Liked songs', recent: 'Your library / Recently played', playlist: 'Your playlists', album: 'Your library / Album', artist: 'Your library / Artist' }[view] || 'Your library';
    $('#back').disabled = historyAt <= 0; $('#forward').disabled = historyAt >= historyStack.length - 1;
    main.innerHTML = (scanBusy ? '<div class="scan-strip" id="scan-strip"><span class="spinner"></span><span>Finding the good stuff…</span></div>' : '') + (view === 'home' ? home() : view === 'search' ? searchPage() : view === 'playlists' ? playlistsPage() : ['albums', 'artists'].includes(view) ? gridPage() : trackPage());
    if ($('#sort')) $('#sort').value = sort;
    if (view === 'search') setTimeout(() => $('#global-search')?.focus(), 0);
}


function showModal(title, body, actions = '') {
    $('#modal-content').innerHTML = `<div class="modal-heading"><h2>${esc(title)}</h2><button class="icon-button" data-action="close-modal" aria-label="Close dialog">${icon('close')}</button></div>${body}${actions ? `<div class="modal-actions">${actions}</div>` : ''}`;
    if (!modal.open) modal.showModal();
}


function modalError(message) { let el = $('.modal-error', modal); if (!el) { el = document.createElement('div'); el.className = 'modal-error'; el.setAttribute('role', 'alert'); $('#modal-content').append(el); } el.textContent = message; }


function importDialog() {
    showModal('Bring your music home.', `<p class="modal-description">Choose a folder on your laptop. We’ll find the music inside it, including subfolders, and leave your files exactly where they are.</p><label class="field-label" for="folder-path">Music folder path</label><input id="folder-path" class="text-input" value="${esc(defaultFolder)}" placeholder="/home/you/Music" spellcheck="false">${capabilities.folderPicker ? '<button class="secondary-button" data-action="browse-folder" style="margin-top:12px">Browse folders</button>' : ''}<p class="hint">Organize each song in its own subfolder with its audio and optional lyrics.lrc. Add the parent Music folder once. Tip: copy its location from Files with Ctrl+L. MP3, FLAC, Ogg, Opus, WAV, M4A, and more.</p>${folders.length ? `<label class="field-label">Connected folders</label><div class="folder-list">${folders.map((f, i) => `<div class="folder-row">${icon('folder')}<span>${esc(f)}</span><button class="icon-button" data-remove-folder="${i}" aria-label="Disconnect ${esc(f)}" title="Disconnect folder">${icon('close')}</button></div>`).join('')}</div>` : ''}`, `<button class="secondary-button" data-action="close-modal">Cancel</button><button id="connect-folder" class="primary-button" data-action="connect-folder">${icon('folder-plus')}Add folder</button>`);
    setTimeout(() => $('#folder-path')?.select(), 0);
}


async function scan(newFolders) {
    try { await api('/api/scan', newFolders === undefined ? {} : { folders: newFolders }); if (newFolders) folders = newFolders; scanBusy = true; modal.close(); render(); pollScan(); }
    catch (e) { modal.open ? modalError(e.message) : toast(e.message); }
}


function pollScan() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(async () => {
        try {
            const status = await api('/api/status'); const strip = $('#scan-strip span:last-child'); if (strip) strip.textContent = status.progress.total ? `Reading your collection · ${status.progress.done} of ${status.progress.total} songs` : 'Finding the good stuff…';
            if (status.scanning) { pollScan(); return; }
            scanBusy = false; await refresh(); render();
            toast(status.error ? `Scan stopped: ${status.error}` : `Collection updated. ${tracks.length.toLocaleString()} songs, all yours.${status.progress.errors ? ' Some files could not be read.' : ''}`);
        } catch (e) { scanBusy = false; render(); toast(e.message); }
    }, 750);
}


async function refresh() {
    const data = await api('/api/bootstrap'); if (data.apiVersion !== 4) throw new Error('The running Spice service is outdated. Restart it with the updated launcher, then refresh this window. Your library will be kept.'); token = data.token; tracks = data.tracks; byId = new Map(tracks.map(t => [t.id, t]));
    if (current && !byId.has(current.id)) { audio.pause(); audio.removeAttribute('src'); audio.load(); current = null; queue = []; qi = -1; state.lastTrack = null; state.lastTime = 0; $('#player-cover').classList.add('idle-cover'); $('#player-cover').innerHTML = icon('music'); $('#player-title').textContent = 'A little silence, for now.'; $('#player-artist').textContent = 'Choose another song from your collection.'; $('#player-like').disabled = true; $('#player-like').classList.remove('active'); if ('mediaSession' in navigator) navigator.mediaSession.metadata = null; persist(); renderQueue(); progress(); window.dispatchEvent(new CustomEvent('spice:track')); }
    else if (current) { current = byId.get(current.id); queue = queue.filter(id => byId.has(id)); qi = queue.indexOf(current.id); updatePlayer(); renderQueue(); }
    folders = data.folders; defaultFolder = data.defaultFolder; capabilities = { ffmpeg: data.ffmpeg, ffprobe: data.ffprobe, folderPicker: data.folderPicker }; return data;
}


function settingsDialog() {
    showModal('Make yourself at home.', `<p class="modal-description">A player that feels like yours. Every preference stays on this laptop.</p><div class="glass-setting"><label for="settings-glass"><strong>Glass appearance</strong><span>Frosted panels, translucent controls, a softer listening space.</span></label><input id="settings-glass" type="checkbox" role="switch" ${state.glass ? 'checked' : ''} aria-label="Glass appearance"></div><label class="field-label">Color palette</label><div class="theme-grid">${Object.entries(themes).map(([id, t]) => `<button class="theme-swatch ${state.theme === id ? 'active' : ''}" data-theme="${id}"><div class="swatch-colors"><i style="background:#${t.colors.main}"></i><i style="background:#${t.colors.card}"></i><i style="background:#${t.colors.button}"></i></div><span>${t.label}</span></button>`).join('')}${state.customTheme ? `<button class="theme-swatch ${state.theme === 'custom' ? 'active' : ''}" data-theme="custom"><div class="swatch-colors"><i style="background:#${esc(state.customTheme.colors.main)}"></i><i style="background:#${esc(state.customTheme.colors.button)}"></i></div><span>${esc(state.customTheme.name)}</span></button>` : ''}</div><div class="settings-section"><h3>Your Spicetify colors</h3><p class="hint">Import a color.ini file to use one of its palettes. Spotify-specific CSS and extensions require Spotify and cannot run here.</p><label class="secondary-button" for="theme-file" style="cursor:pointer">Import color.ini</label><input id="theme-file" type="file" accept=".ini,.txt" class="sr-only"></div><div class="settings-section"><h3>Music folders</h3><p class="hint">${folders.length ? folders.map(esc).join('<br>') : 'No folders connected yet.'}</p><div class="settings-links"><button class="secondary-button" data-action="import">${icon('folder-plus')}Manage folders</button><button class="secondary-button" data-action="rescan" ${scanBusy ? 'disabled' : ''}>${icon('refresh')}Rescan library</button></div></div><div class="settings-section"><h3>Keyboard shortcuts</h3><div class="keyboard-list"><span>Play / pause</span><kbd>Space</kbd></div><div class="keyboard-list"><span>Search your music</span><kbd>/</kbd></div><div class="keyboard-list"><span>Seek 5 seconds</span><kbd>← / →</kbd></div><div class="keyboard-list"><span>Previous / next song</span><kbd>Alt + ← / →</kbd></div><div class="keyboard-list"><span>Volume</span><kbd>↑ / ↓</kbd></div><div class="keyboard-list"><span>Like current song</span><kbd>L</kbd></div><div class="keyboard-list"><span>Play queue</span><kbd>Q</kbd></div></div><div class="settings-section"><h3>Made for your laptop.</h3><p class="hint">Spice 1.3.1 · Independent local music player.<br>Metadata: ${capabilities.ffprobe ? 'FFprobe ready' : 'filename mode — install FFmpeg for full tags'}<br>Extra audio codecs: ${capabilities.ffmpeg ? 'FFmpeg ready' : 'install FFmpeg for conversion'}<br>Only 127.0.0.1. No tracking. No external services.</p></div>`);
}


async function importTheme(file) {
    try {
        if (file.size > 262144) throw new Error('Choose a color.ini file smaller than 256 KB.');
        const text = await file.text(), sections = {}; let section;
        for (const raw of text.split(/\r?\n/)) { const line = raw.trim(); if (!line || /^[;#]/.test(line)) continue; const group = line.match(/^\[([^\]]+)\]$/); if (group) { section = group[1]; sections[section] = {}; continue; } const m = line.match(/^([\w-]+)\s*=\s*#?([0-9a-f]{6})\s*(?:;.*)?$/i); if (m && section) sections[section][m[1]] = m[2]; }
        const entries = Object.entries(sections).filter(([, p]) => Object.keys(p).length);
        if (!entries.length) throw new Error('No hex color palettes found. Use a color.ini with six-digit hex colors.');
        showModal('Choose your palette.', `<p class="modal-description">Palettes from ${esc(file.name)}. Your current palette stays available in Settings.</p>${entries.map(([name], i) => `<button class="playlist-choice" data-import-palette="${i}">${icon('palette')}${esc(name)}</button>`).join('')}`);
        $$('[data-import-palette]').forEach(b => b.onclick = () => { const [name, colors] = entries[+b.dataset.importPalette]; state.customTheme = { name, colors: { ...themes.spice.colors, ...Object.fromEntries(Object.entries(colors).filter(([key]) => key in themes.spice.colors)) } }; applyTheme('custom'); persist(); settingsDialog(); toast('Your colors, beautifully at home.'); });
    } catch (e) { toast(e.message); }
}


function playlistDialog(edit = false) {
    const p = edit ? state.playlists.find(p => p.id === viewKey) : null;
    showModal(edit ? 'A new name. Same feeling.' : 'A place for your favorites.', `<p class="modal-description">${edit ? 'Give this playlist a name that fits.' : 'For late nights, long walks, and everything in between.'}</p><label class="field-label" for="playlist-name">Playlist name</label><input id="playlist-name" class="text-input" placeholder="A little bit of everything" maxlength="100" value="${esc(p?.name || '')}">`, `<button class="secondary-button" data-action="close-modal">Cancel</button><button class="primary-button" id="save-playlist">${edit ? 'Save name' : 'Create playlist'}</button>`);
    $('#save-playlist').onclick = () => { const name = $('#playlist-name').value.trim(); if (!name) { modalError('Give your playlist a name.'); return; } if (p) p.name = name; else { const id = crypto.randomUUID(); state.playlists.push({ id, name, tracks: [] }); viewKey = id; } persist(); modal.close(); navigate('playlist', viewKey); };
    setTimeout(() => $('#playlist-name')?.focus(), 0);
}


function addToPlaylist(id) {
    if (!state.playlists.length) { showModal('Your first playlist.', `<p class="modal-description">Create a playlist to keep your favorite tracks together.</p><label class="field-label" for="playlist-name">Playlist name</label><input class="text-input" id="playlist-name" maxlength="100" placeholder="My favorites">`, `<button id="create-and-add" class="primary-button">Create & add song</button>`); $('#create-and-add').onclick = () => { const name = $('#playlist-name').value.trim(); if (!name) { modalError('Give your playlist a name.'); return; } state.playlists.push({ id: crypto.randomUUID(), name, tracks: [id] }); persist(); playlistNav(); modal.close(); toast('Song added to your new playlist.'); }; return; }
    showModal('Add to a playlist.', state.playlists.map(p => `<button class="playlist-choice" data-add-playlist="${esc(p.id)}">${icon('queue')}<span>${esc(p.name)}</span>${p.tracks.includes(id) ? icon('check') : ''}</button>`).join(''));
    $$('[data-add-playlist]').forEach(b => b.onclick = () => { const p = state.playlists.find(p => p.id === b.dataset.addPlaylist); if (!p.tracks.includes(id)) { p.tracks.push(id); persist(); toast(`Added to ${p.name}.`); } else toast('Already in this playlist.'); modal.close(); });
}


function contextMenu(id, anchor) {
    $('.context-menu')?.remove(); const t = byId.get(id); if (!t) return;
    const menu = document.createElement('div'); menu.className = 'context-menu'; menu.setAttribute('role', 'menu');
    menu.innerHTML = `<button data-command="next" role="menuitem">${icon('next')}Play next</button><button data-command="queue" role="menuitem">${icon('queue')}Add to queue</button><button data-command="playlist" role="menuitem">${icon('plus')}Add to playlist</button>${view === 'playlist' ? `<button data-command="up" role="menuitem">${icon('chevron-left')}Move earlier</button><button data-command="down" role="menuitem">${icon('chevron-right')}Move later</button><button data-command="remove" role="menuitem">${icon('close')}Remove from playlist</button>` : ''}<button data-command="album" role="menuitem">${icon('disc')}Go to album</button><button data-command="details" role="menuitem">${icon('info')}File details</button>`;
    document.body.append(menu); const r = anchor.getBoundingClientRect(); menu.style.left = Math.max(8, Math.min(r.right - 210, innerWidth - 220)) + 'px'; menu.style.top = Math.max(8, Math.min(r.bottom + 4, innerHeight - menu.offsetHeight - 110)) + 'px';
    $$('button', menu).forEach(b => b.onclick = () => {
        menu.remove(); const command = b.dataset.command;
        if (command === 'next' || command === 'queue') { if (!current) { queue = [id]; qi = 0; loadTrack(id); } else queue.splice(command === 'next' ? qi + 1 : queue.length, 0, id); renderQueue(); toast(command === 'next' ? 'Playing next.' : 'Added to queue.'); }
        if (command === 'playlist') addToPlaylist(id);
        if (command === 'remove') { const p = state.playlists.find(p => p.id === viewKey); p.tracks = p.tracks.filter(x => x !== id); persist(); render(); toast('Removed from playlist.'); }
        if (command === 'up' || command === 'down') { const p = state.playlists.find(p => p.id === viewKey), index = p.tracks.indexOf(id), target = index + (command === 'up' ? -1 : 1); if (target >= 0 && target < p.tracks.length) { [p.tracks[index], p.tracks[target]] = [p.tracks[target], p.tracks[index]]; persist(); render(); } }
        if (command === 'album') navigate('album', albumKey(t));
        if (command === 'details') showModal('A closer look.', `<div class="np-title">${esc(t.title)}</div><p class="np-artist">${esc(t.artist)}</p><div class="details-list"><b>Album</b><br>${esc(t.album)}<br><br><b>Audio</b><br>${esc(t.format)}${t.codec ? ' · ' + esc(t.codec) : ''}${t.sampleRate ? ' · ' + (t.sampleRate / 1000) + ' kHz' : ''}${t.bitrate ? ' · ' + Math.round(t.bitrate / 1000) + ' kbps' : ''}<br>${(t.size / 1048576).toFixed(1)} MB · ${time(t.duration)}<br><br><b>File</b><br>${esc(t.folder + '/' + t.filename)}</div>`);
    }); menu.querySelector('button').focus();
}


async function loadTrack(id, autoplay = true, resumeAt = 0) {
    const t = byId.get(id); if (!t) return; const version = ++playVersion; current = t; hasFallback = false;
    window.dispatchEvent(new CustomEvent('spice:track'));
    audio.src = '/api/audio/' + id; audio.load();
    if (resumeAt) audio.addEventListener('loadedmetadata', () => { if (current?.id === id && Number.isFinite(audio.duration)) audio.currentTime = Math.min(resumeAt, audio.duration); }, { once: true });
    state.lastTrack = id; state.lastTime = resumeAt; state.recent = [id, ...state.recent.filter(x => x !== id)].slice(0, 150); persist(); updatePlayer(); renderQueue(); markCurrent();
    if ('mediaSession' in navigator) { navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist, album: t.album, artwork: [{ src: location.origin + '/api/art/' + id, sizes: '600x600' }] }); }
    if (autoplay) { try { await audio.play(); } catch (e) { if (version === playVersion && e.name === 'NotAllowedError') toast('Press play to start listening.'); else if (version === playVersion && e.name !== 'AbortError' && e.name !== 'NotSupportedError') toast('This file could not be played. Open its details to check the location.'); } }
}


function startList(id, list) {
    const ids = list.map(t => t.id); const index = ids.indexOf(id); if (index < 0) return;
    if (shuffled) { const rest = ids.filter(x => x !== id); fisherYates(rest); queue = [id, ...rest]; qi = 0; } else { queue = ids; qi = index; }
    loadTrack(id);
}


function fisherYates(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[array[i], array[j]] = [array[j], array[i]]; } return array; }
async function togglePlay() {
    if (!current) { if (tracks.length) startList(tracks[0].id, tracks); else importDialog(); return; }
    if (audio.paused) { try { await audio.play(); } catch (e) { if (e.name !== 'AbortError') toast('Unable to play. Rescan if the file has moved.'); } } else audio.pause();
}


function nextTrack(manual = true) {
    if (!queue.length) return;
    if (!manual && repeat === 2) { audio.currentTime = 0; audio.play().catch(() => { }); return; }
    if (qi + 1 < queue.length) { qi++; loadTrack(queue[qi]); }
    else if (repeat === 1) { qi = 0; loadTrack(queue[qi]); }
    else if (manual) toast('You’ve reached the end of the queue.');
    else { audio.pause(); updatePlayer(); }
}


function previousTrack() { if (audio.currentTime > 3) { audio.currentTime = 0; return; } if (qi > 0) { qi--; loadTrack(queue[qi]); } else if (current) audio.currentTime = 0; }


function markCurrent() { $$('[data-track]').forEach(row => { row.classList.toggle('current', row.dataset.track === current?.id); const n = $('.row-number', row); if (n) n.textContent = row.dataset.track === current?.id && !audio.paused ? '♫' : shown.findIndex(t => t.id === row.dataset.track) + 1; }); }
function updatePlayer() {
    $('#play').innerHTML = icon(audio.paused ? 'play' : 'pause', audio.paused); $('#play').setAttribute('aria-label', audio.paused ? 'Play' : 'Pause');
    if (current) { $('#player-cover').classList.remove('idle-cover'); $('#player-cover').innerHTML = art(current); $('#player-title').textContent = current.title; $('#player-artist').textContent = current.artist; $('#player-like').disabled = false; $('#player-like').innerHTML = icon('heart', liked(current.id)); $('#player-like').classList.toggle('active', liked(current.id)); $('#player-like').setAttribute('aria-label', liked(current.id) ? 'Unlike current song' : 'Like current song'); }
    $('#duration').textContent = time(Number.isFinite(audio.duration) ? audio.duration : current?.duration || 0);
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = audio.paused ? 'paused' : 'playing';
}
function progress() { const duration = Number.isFinite(audio.duration) ? audio.duration : 0; $('#elapsed').textContent = time(audio.currentTime); $('#duration').textContent = time(duration); const seek = $('#seek'); seek.disabled = !duration; seek.max = duration || 100; seek.value = audio.currentTime; seek.style.setProperty('--progress', (duration ? audio.currentTime / duration * 100 : 0) + '%'); if (current) { state.lastTime = audio.currentTime; } }


function renderQueue() {
    $('#queue-content').innerHTML = current ? `<div class="queue-label">Now playing</div>${queueItem(current, qi, true)}<div class="queue-label">Next up · ${Math.max(0, queue.length - qi - 1)} ${queue.length - qi - 1 === 1 ? 'song' : 'songs'}</div>${queue.slice(qi + 1).map((id, i) => byId.has(id) ? queueItem(byId.get(id), qi + 1 + i) : '').join('') || '<p class="queue-hint">Room for one more? Add a song with its three-dot menu.</p>'}` : `<p class="queue-hint">Your next listening session starts with a song. Play something from your collection to build a queue.</p>`;
}


function queueItem(t, i, now = false) { return `<div class="queue-track ${now ? 'current' : ''}"><button data-queue-play="${i}">${art(t)}<div><strong>${esc(t.title)}</strong><small>${esc(t.artist)}</small></div></button>${!now ? `<button class="icon-button" data-queue-remove="${i}" aria-label="Remove ${esc(t.title)} from queue">${icon('close')}</button>` : ''}</div>`; }


function toggleQueue() { const panel = $('#queue-panel'); panel.hidden = !panel.hidden; $('.app-shell').classList.toggle('queue-open', !panel.hidden); $('#queue-toggle').classList.toggle('active', !panel.hidden); renderQueue(); }


function nowPlaying() { if (window.openStudio) { window.openStudio(); return; } if (!current) { toast('Play a song to see it here.'); return; } showModal('Now playing.', `${art(current, 'np-art')}<h3 class="np-title">${esc(current.title)}</h3><p class="np-artist">${esc(current.artist)} · ${esc(current.album)}</p><span class="quality-label">${esc(current.format)}${current.sampleRate ? ' · ' + current.sampleRate / 1000 + ' kHz' : ''}${current.bitrate ? ' · ' + Math.round(current.bitrate / 1000) + ' kbps' : ''}</span>`); }


function setVolume(value) { audio.volume = Math.max(0, Math.min(1, value)); state.volume = audio.volume; audio.muted = false; $('#volume').value = audio.volume; $('#volume').style.setProperty('--progress', audio.volume * 100 + '%'); $('#mute').innerHTML = icon(audio.volume ? 'volume' : 'mute'); persist(); }

// All user-generated strings are inserted as text or escaped before rendering.
document.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) { if (!e.target.closest('.context-menu')) $('.context-menu')?.remove(); return; }
    if (!b.closest('.context-menu')) $('.context-menu')?.remove();
    if (b.hasAttribute('data-glass-toggle')) { applyGlass(!state.glass, true); return; }
    if (b.dataset.view) { navigate(b.dataset.view); return; }
    if (b.dataset.open) { navigate(b.dataset.open, b.dataset.key); return; }
    if (b.dataset.play) { startList(b.dataset.play, shown); return; }
    if (b.dataset.like) { toggleLike(b.dataset.like); return; }
    if (b.dataset.more) { contextMenu(b.dataset.more, b); return; }
    if (b.dataset.theme) { applyTheme(b.dataset.theme); persist(); settingsDialog(); return; }
    if (b.dataset.filter) { filter = b.dataset.filter; $$('[data-filter]').forEach(x => x.classList.toggle('active', x.dataset.filter === filter)); $('#results').innerHTML = searchResults(); return; }
    if (b.dataset.queuePlay !== undefined) { qi = +b.dataset.queuePlay; loadTrack(queue[qi]); return; }
    if (b.dataset.queueRemove !== undefined) { queue.splice(+b.dataset.queueRemove, 1); renderQueue(); return; }
    if (b.dataset.removeFolder !== undefined) { const index = +b.dataset.removeFolder; const pending = folders.filter((_, i) => i !== index); showModal('Disconnect this folder?', `<p class="modal-description">Its songs will leave your library. Your original music files stay exactly where they are.</p><p class="hint">${esc(folders[index])}</p>`, `<button class="secondary-button" data-action="import">Keep folder</button><button class="primary-button" id="disconnect-folder">Disconnect</button>`); $('#disconnect-folder').onclick = () => scan(pending); return; }
    const action = b.dataset.action;
    if (action === 'close-modal') modal.close();
    if (action === 'import') importDialog();
    if (action === 'connect-folder') { const f = $('#folder-path').value.trim(); if (!f) { modalError('Enter a music folder path.'); return; } b.disabled = true; await scan([...new Set([...folders, f])]); b.disabled = false; }
    if (action === 'browse-folder') { b.disabled = true; b.textContent = 'Choosing folder…'; try { const result = await api('/api/browse', {}); if (result.folder && $('#folder-path')) $('#folder-path').value = result.folder; } catch (e) { modalError(e.message); } finally { b.disabled = false; b.textContent = 'Browse folders'; } }
    if (action === 'rescan') scan();
    if (action === 'play-all' && tracks.length) startList(tracks[0].id, tracks);
    if (action === 'play-view') { const list = sorted(listForView()); if (list.length) startList(list[0].id, list); }
    if (action === 'load-more') { tableLimit += 150; $('#results').innerHTML = view === 'search' ? searchResults() : table(sorted(listForView())); }
    if (action === 'new-playlist') playlistDialog();
    if (action === 'edit-playlist') playlistDialog(true);
    if (action === 'delete-playlist') { const p = state.playlists.find(p => p.id === viewKey); showModal('Delete this playlist?', `<p class="modal-description">“${esc(p.name)}” will be removed. The songs in your library stay with you.</p>`, `<button class="secondary-button" data-action="close-modal">Keep playlist</button><button class="primary-button" id="confirm-delete">Delete playlist</button>`); $('#confirm-delete').onclick = () => { state.playlists = state.playlists.filter(p => p.id !== viewKey); persist(); modal.close(); navigate('home'); toast('Playlist deleted.'); }; }
});
document.addEventListener('dblclick', e => { const row = e.target.closest('[data-track]'); if (row && !e.target.closest('button')) startList(row.dataset.track, shown); });
document.addEventListener('input', e => {
    if (['global-search', 'list-search', 'grid-search'].includes(e.target.id)) { query = e.target.value; tableLimit = 150; $('#results').innerHTML = view === 'search' ? searchResults() : ['albums', 'artists'].includes(view) ? gridResults() : table(sorted(listForView())); }
});
document.addEventListener('change', e => { if (e.target.id === 'settings-glass') applyGlass(e.target.checked, true); if (e.target.id === 'sort') { sort = e.target.value; $('#results').innerHTML = table(sorted(listForView())); } if (e.target.id === 'theme-file' && e.target.files[0]) importTheme(e.target.files[0]); });
$('#sidebar-import').onclick = importDialog; $('#settings').onclick = settingsDialog; $('#theme-shortcut').onclick = settingsDialog; $('#new-playlist').onclick = () => playlistDialog();
$('#back').onclick = () => { if (historyAt > 0) { historyAt--; restoring = true; navigate(...historyStack[historyAt]); restoring = false; } };
$('#forward').onclick = () => { if (historyAt < historyStack.length - 1) { historyAt++; restoring = true; navigate(...historyStack[historyAt]); restoring = false; } };
$('.brand').onclick = e => { e.preventDefault(); navigate('home'); };
$('#play').onclick = togglePlay; $('#previous').onclick = previousTrack; $('#next').onclick = () => nextTrack();
$('#player-like').onclick = () => current && toggleLike(current.id);
$('#queue-toggle').onclick = toggleQueue; $('#close-queue').onclick = toggleQueue; $('#focus-player').onclick = nowPlaying;
$('#player-cover').onclick = nowPlaying;
$('#shuffle').onclick = () => { shuffled = !shuffled; $('#shuffle').classList.toggle('active', shuffled); $('#shuffle').setAttribute('aria-pressed', shuffled); if (shuffled && current) { const upcoming = queue.slice(qi + 1); fisherYates(upcoming); queue.splice(qi + 1, upcoming.length, ...upcoming); renderQueue(); } toast(shuffled ? 'Shuffle on. A different kind of familiar.' : 'Shuffle off.'); };
$('#repeat').onclick = () => { repeat = (repeat + 1) % 3; $('#repeat').classList.toggle('active', repeat > 0); $('#repeat').setAttribute('aria-pressed', repeat > 0); $('#repeat').setAttribute('aria-label', ['Repeat off', 'Repeat all', 'Repeat one'][repeat]); $('#repeat').title = ['Repeat: off', 'Repeat: all', 'Repeat: one'][repeat]; toast(['Repeat off.', 'Repeat collection.', 'One song, on repeat.'][repeat]); };
$('#volume').oninput = e => setVolume(+e.target.value);
$('#mute').onclick = () => { if (audio.volume) { previousVolume = audio.volume; setVolume(0); } else setVolume(previousVolume || .7); };
$('#seek').oninput = e => { if (Number.isFinite(audio.duration)) audio.currentTime = +e.target.value; progress(); };
audio.addEventListener('timeupdate', progress); audio.addEventListener('loadedmetadata', () => { progress(); updatePlayer(); });
for (const event of ['play', 'pause']) audio.addEventListener(event, () => { updatePlayer(); markCurrent(); if (event === 'pause') persist(); });
audio.addEventListener('ended', () => nextTrack(false));
audio.addEventListener('error', async () => {
    if (!current) return;
    if (!hasFallback && capabilities.ffmpeg) { hasFallback = true; toast('Preparing this audio format for playback…'); const id = current.id; audio.src = `/api/audio/${id}?format=wav`; audio.load(); try { await audio.play(); } catch { } return; }
    toast('This file could not be played. Check its location and audio format in File details.');
});
modal.addEventListener('click', e => { if (e.target === modal) { const r = modal.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) modal.close(); } });
modal.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'file') { e.preventDefault(); $('#connect-folder, #save-playlist, #create-and-add', modal)?.click(); } });
document.addEventListener('keydown', e => {
    const menu = $('.context-menu'); if (menu && e.key === 'Escape') { menu.remove(); return; }
    if (menu && ['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); const buttons = $$('button', menu), index = buttons.indexOf(document.activeElement); buttons[(index + (e.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length].focus(); return; }
    if (modal.open || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.ctrlKey || e.metaKey) return;
    if (e.key === ' ') { e.preventDefault(); togglePlay(); }
    if (e.key === '/') { e.preventDefault(); navigate('search'); }
    if (e.key.toLowerCase() === 'q') toggleQueue();
    if (e.key.toLowerCase() === 'l' && current) toggleLike(current.id);
    if (e.key === 'ArrowRight') { e.preventDefault(); if (e.altKey) nextTrack(); else if (Number.isFinite(audio.duration)) audio.currentTime = Math.min(audio.duration, audio.currentTime + 5); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); if (e.altKey) previousTrack(); else if (current) audio.currentTime = Math.max(0, audio.currentTime - 5); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setVolume(audio.volume + .05); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setVolume(audio.volume - .05); }
});
if ('mediaSession' in navigator) { for (const [name, fn] of Object.entries({ play: togglePlay, pause: () => audio.pause(), previoustrack: previousTrack, nexttrack: () => nextTrack(), seekto: d => { if (Number.isFinite(audio.duration)) audio.currentTime = d.seekTime; }, seekbackward: () => { audio.currentTime = Math.max(0, audio.currentTime - 5); }, seekforward: () => { if (Number.isFinite(audio.duration)) audio.currentTime = Math.min(audio.duration, audio.currentTime + 5); } })) try { navigator.mediaSession.setActionHandler(name, fn); } catch { } }
document.addEventListener('visibilitychange', () => { if (document.hidden && token) fetch('/api/state', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Spice-Token': token }, body: JSON.stringify(state), keepalive: true }).catch(() => { }); });
window.addEventListener('pagehide', () => { if (token) fetch('/api/state', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Spice-Token': token }, body: JSON.stringify(state), keepalive: true }).catch(() => { }); });
async function boot() {
    try {
        const data = await refresh(); state = { ...state, ...data.state }; state.liked = Array.isArray(state.liked) ? state.liked : []; state.playlists = Array.isArray(state.playlists) ? state.playlists : []; state.recent = Array.isArray(state.recent) ? state.recent : []; applyTheme(state.theme); applyGlass(typeof state.glass === 'boolean' ? state.glass : !matchMedia('(prefers-reduced-transparency: reduce)').matches); audio.volume = typeof state.volume === 'number' ? Math.max(0, Math.min(1, state.volume)) : .7; $('#volume').value = audio.volume; $('#volume').style.setProperty('--progress', audio.volume * 100 + '%'); scanBusy = data.scanning; navigate('home'); renderQueue(); if (scanBusy) pollScan();
        if (state.lastTrack && byId.has(state.lastTrack)) { queue = [state.lastTrack]; qi = 0; loadTrack(state.lastTrack, false, state.lastTime || 0); }
    } catch (e) { main.innerHTML = empty('offline', 'Let’s reconnect.', e.message, ''); }
}

boot();
