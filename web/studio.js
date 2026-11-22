/* The listening room consumes only the player's own local audio element. */
(function () {
    'use strict';
    const S = SpiceSignal;
    let room, canvas, ctx2d, artImage, context, source, analyser, freq, wave, raf = 0, lastDraw = 0, phase = 0;
    let width = 0, height = 0, cx = 0, cy = 0, coverSize = 200, bands = new Array(72).fill(0), energy = 0, bass = 0;
    let mode = 'ambient', style = 'halo', intensity = 1, response = 'punchy', reduced = false, ownedFullscreen = false;
    const dynamics = S.createDynamics(72);
    let reaction = { bands: new Array(72).fill(0), level: 0, bass: 0, mid: 0, treble: 0, pulse: 0, onset: 0, spring: 0, waveGain: 0, alive: false };
    let peaks = new Array(72).fill(0), shockwaves = [];
    const particles = Array.from({ length: 160 }, (_, i) => { const n = Math.sin(i * 183.12 + 1) * 43758.5453, seed = n - Math.floor(n); return { seed, angle: i * 2.39996, offset: 0, velocity: 0, x: null, y: null }; });
    function resetReaction() { dynamics.reset(); bands.fill(0); peaks.fill(0); shockwaves = []; energy = bass = 0; reaction = { ...reaction, bands, level: 0, bass: 0, mid: 0, treble: 0, pulse: 0, onset: 0, spring: 0, waveGain: 0, alive: false }; particles.forEach(p => { p.offset = p.velocity = 0; p.x = p.y = null; }); }
    let followReader = false, readerScroll = 0;
    let lyricData = { lines: [], timing: null, source: null }, lyricNodes = [], activeIds = [], focus = -2, trackId = undefined, requestId = 0;
    let palette = [192, 240, 120], secondary = [119, 173, 142], preferencesLoaded = false;
    const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    const initialMessage = 'Your sound, in motion.';
    const qs = s => room.querySelector(s);
    function createRoom() {
        room = document.createElement('section'); room.className = 'listening-room'; room.hidden = true; room.id = 'listening-room'; room.setAttribute('aria-label', 'Listening room');
        room.innerHTML = `<div class="studio-backdrop"></div><div class="studio-noise"></div><header class="studio-header"><button class="studio-back" id="studio-close" title="Back to library (Esc)">${icon('chevron-left')}<span>Back to library</span></button><div class="studio-wordmark">${icon('headphones')}SPICE <span>LISTENING ROOM</span></div><div class="studio-modes" role="group" aria-label="Listening experience">${['flow', 'float', 'ambient', 'lyrics'].map(m => `<button class="studio-mode" data-studio-mode="${m}" aria-pressed="${m === 'ambient'}">${m[0].toUpperCase() + m.slice(1)}</button>`).join('')}</div></header>
  <div class="studio-main"><canvas class="visual-canvas" aria-hidden="true"></canvas><div class="studio-notice" role="status" hidden></div><div class="studio-art-block"><div class="studio-art"><img id="studio-art-image" alt="Album artwork" hidden></div><div class="studio-track-info"><h2 id="studio-title">A room for your music.</h2><p id="studio-artist">Pick a song from your collection.</p><span class="studio-quality">LOCAL AUDIO · ALWAYS YOURS</span></div></div><div class="studio-reader-tools"><div><span class="overline">THE WORDS, AT YOUR PACE</span><h2>Lyrics</h2></div><button id="studio-follow" class="reader-follow" aria-pressed="false">Follow playback</button></div><div class="studio-lyrics" role="region" aria-label="Song lyrics" hidden><div class="lyric-scroller"></div></div><div class="studio-lyric-welcome"><div class="overline">LISTEN A LITTLE CLOSER</div><h2>${initialMessage}</h2><p>The frequencies, the quiet details, the feeling. All coming from the song you play.</p><button class="studio-import" id="studio-import-welcome">${icon('plus')}Add local lyrics</button></div><div class="studio-lyrics-note" hidden></div></div>
  <footer class="studio-footer"><div class="studio-signal"><div class="signal-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><span id="studio-audio-status">Ready when you are</span></div><div class="studio-controls"><label class="studio-control-label">Visualizer <select class="studio-select" id="studio-style" aria-label="Visualizer style"><option value="halo">Halo</option><option value="spectrum">Spectrum</option><option value="wave">Waveform</option><option value="particles">Particles</option></select></label><label class="studio-control-label">Intensity <input class="studio-sensitivity" id="studio-intensity" aria-label="Visualizer intensity" type="range" min=".3" max="3" step=".1" value="1"></label><label class="studio-control-label">Response <select class="studio-select" id="studio-response" aria-label="Visualizer response"><option value="calm">Calm</option><option value="punchy" selected>Punchy</option><option value="explosive">Explosive</option></select></label></div><div class="studio-prefs"><button class="icon-button" data-glass-toggle aria-label="Glass appearance" aria-pressed="false" title="Glass appearance">${icon('glass')}</button><button class="studio-lyrics-button" id="studio-import">${icon('music')}<span>Add lyrics</span></button><button class="icon-button" id="studio-options" title="Lyrics timing and motion" aria-label="Lyrics timing and motion" aria-expanded="false">${icon('settings')}</button><button class="icon-button" id="studio-fullscreen" title="Full screen (F)" aria-label="Full screen">${icon('expand')}</button></div></footer>
  <div class="studio-timing" hidden><h3>Keep the words in time.</h3><p id="studio-lyric-source">Add LRC or TTML for timing, or TXT for reading. No account is needed.</p><div class="timing-row"><button id="studio-earlier" aria-label="Highlight lyrics 100 milliseconds earlier">Earlier</button><span class="timing-value" id="studio-offset">0 ms</span><button id="studio-later" aria-label="Highlight lyrics 100 milliseconds later">Later</button><button id="studio-reset-offset">Reset</button></div><p class="hint" style="margin-top:12px">Positive delay highlights later. Saved for this song.</p><div class="timing-options"><label><input type="checkbox" id="studio-reduced">Reduce motion</label><button class="text-button" id="studio-reload-lyrics">Reload lyrics</button><button class="text-button" id="studio-original-lyrics">Use song’s sidecar</button></div></div><input type="file" class="studio-import-input" id="studio-lyric-file" accept=".lrc,.ttml,.txt">`;
        document.body.append(room); canvas = qs('canvas'); ctx2d = canvas.getContext('2d'); artImage = qs('#studio-art-image');
        qs('#studio-close').onclick = closeStudio;
        room.querySelectorAll('[data-studio-mode]').forEach(b => b.onclick = () => setMode(b.dataset.studioMode, true));
        qs('#studio-response').onchange = e => { response = e.target.value; savePreferences(); drawOnce(); };
        qs('#studio-style').onchange = e => { style = e.target.value; room.dataset.visualizer = style; savePreferences(); resize(); };
        qs('#studio-intensity').oninput = e => { intensity = +e.target.value; savePreferences(); drawOnce(); };
        qs('#studio-import').onclick = chooseLyrics; qs('#studio-import-welcome').onclick = () => { if (lyricData.timing === 'plain' && mode !== 'lyrics') { setMode('lyrics', true); return; } chooseLyrics(); };
        qs('#studio-follow').onclick = () => setFollow(!followReader);
        const viewport = qs('.studio-lyrics');
        viewport.addEventListener('wheel', () => { if (mode === 'lyrics' && followReader) setFollow(false); }, { passive: true });
        viewport.addEventListener('touchstart', () => { if (mode === 'lyrics' && followReader) setFollow(false); }, { passive: true });
        viewport.addEventListener('pointerdown', e => { if (mode === 'lyrics' && e.target === viewport && followReader) setFollow(false); });
        viewport.addEventListener('keydown', e => { if (mode === 'lyrics' && ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) { e.stopPropagation(); if (followReader) setFollow(false); } }, { capture: true });
        qs('#studio-lyric-file').onchange = e => { if (e.target.files[0]) importLyrics(e.target.files[0]); e.target.value = ''; };
        qs('#studio-options').onclick = () => { const panel = qs('.studio-timing'); panel.hidden = !panel.hidden; qs('#studio-options').setAttribute('aria-expanded', !panel.hidden); };
        qs('#studio-earlier').onclick = () => setOffset(offset() - 100); qs('#studio-later').onclick = () => setOffset(offset() + 100); qs('#studio-reset-offset').onclick = () => setOffset(0);
        qs('#studio-reduced').onchange = e => { reduced = e.target.checked; room.classList.toggle('is-reduced', reduced); savePreferences(); drawOnce(); };
        qs('#studio-reload-lyrics').onclick = () => refreshTrack(true);
        qs('#studio-original-lyrics').onclick = async () => { if (!current) return; try { await api('/api/lyrics/' + current.id, { reset: true }); await refreshTrack(true); toast('Using the song’s matching lyric file.'); } catch (e) { toast(e.message); } };
        qs('#studio-fullscreen').onclick = toggleFullscreen;
        applyGlass(state.glass); new ResizeObserver(resize).observe(qs('.studio-main'));
    }
    function readPreferences() {
        if (preferencesLoaded) return; preferencesLoaded = true;
        const p = state.studio || {};
        mode = ['flow', 'float', 'ambient', 'lyrics'].includes(p.mode) ? p.mode : 'ambient'; style = ['halo', 'spectrum', 'wave', 'particles'].includes(p.style) ? p.style : 'halo';
        response = ['calm', 'punchy', 'explosive'].includes(p.response) ? p.response : 'punchy'; intensity = typeof p.intensity === 'number' ? S.clamp(p.intensity, .3, 3) : 1; reduced = typeof p.reduced === 'boolean' ? p.reduced : motionQuery.matches;
        followReader = p.followReader === true; qs('#studio-follow').setAttribute('aria-pressed', String(followReader)); qs('#studio-follow').textContent = followReader ? 'Following' : 'Follow playback'; qs('#studio-response').value = response; qs('#studio-style').value = style; qs('#studio-intensity').value = intensity; qs('#studio-reduced').checked = reduced; room.classList.toggle('is-reduced', reduced);
    }
    function savePreferences() { state.studio = { mode, style, intensity, response, reduced, followReader }; persist(); }
    async function ensureAudio() {
        try {
            if (!context) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (!AudioContextClass) throw new Error('Web Audio is unavailable in this browser.');
                context = new AudioContextClass(); analyser = context.createAnalyser(); analyser.fftSize = 2048; analyser.smoothingTimeConstant = .15; analyser.minDecibels = -90; analyser.maxDecibels = -16;
                source = context.createMediaElementSource(audio); source.connect(analyser); analyser.connect(context.destination);
                freq = new Uint8Array(analyser.frequencyBinCount); wave = new Float32Array(analyser.fftSize);
            }
            if (context.state === 'suspended') await context.resume();
            if (context.state !== 'running') notice('Press play to activate audio analysis.');
        } catch (e) {
            if (source && context) { try { source.disconnect(); source.connect(context.destination); } catch { } }
            notice('Audio analysis is unavailable. Playback and timed lyrics remain available.');
        }
    }
    function notice(text) { if (!room) return; const el = qs('.studio-notice'); el.textContent = text; el.hidden = !text; }
    async function openStudio() {
        if (!room) createRoom(); readPreferences(); room.hidden = false; $('.app-shell').classList.add('studio-open'); $('.sidebar').inert = true; $('.main-shell').inert = true;
        setMode(mode, false); resize(); qs('#studio-close').focus();
        ensureAudio(); await refreshTrack(); startLoop();
    }
    function closeStudio() {
        if (!room) return; room.hidden = true; $('.app-shell').classList.remove('studio-open'); $('.sidebar').inert = false; $('.main-shell').inert = false; cancelAnimationFrame(raf); raf = 0;
        qs('.studio-timing').hidden = true; qs('#studio-options').setAttribute('aria-expanded', 'false');
        if (ownedFullscreen && document.fullscreenElement) { document.exitFullscreen().catch(() => { }); ownedFullscreen = false; }
        $('#open-studio')?.focus();
    }
    function setFollow(value) {
        followReader = !!value && lyricData.timing !== 'plain';
        qs('#studio-follow').setAttribute('aria-pressed', String(followReader)); qs('#studio-follow').textContent = followReader ? 'Following' : 'Follow playback'; savePreferences(); focus = -2; syncLyrics();
    }
    function setMode(next, changeStyle) {
        if (mode === 'lyrics') readerScroll = qs('.studio-lyrics').scrollTop;
        mode = next; room.dataset.mode = mode;
        room.querySelectorAll('[data-studio-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.studioMode === mode));
        if (changeStyle) { if (mode !== 'lyrics') { style = mode === 'flow' ? 'spectrum' : mode === 'float' ? 'particles' : 'halo'; qs('#studio-style').value = style; } savePreferences(); }
        room.dataset.visualizer = style;
        const plain = lyricData.timing === 'plain', hasText = lyricData.lines.some(l => l.text);
        qs('.studio-lyrics').hidden = !hasText || (plain && mode !== 'lyrics'); qs('.studio-lyric-welcome').hidden = hasText && (!plain || mode === 'lyrics');
        qs('.studio-lyrics').tabIndex = mode === 'lyrics' ? 0 : -1;
        lyricNodes.forEach((node, i) => node.hidden = !lyricData.lines[i].text && mode !== 'lyrics');
        qs('.studio-reader-tools').hidden = mode !== 'lyrics'; qs('#studio-follow').disabled = plain || !hasText;
        if (plain && mode !== 'lyrics') { qs('.studio-lyric-welcome h2').textContent = 'The words, at your pace.'; qs('.studio-lyric-welcome p').textContent = 'These lyrics have no timestamps. Read them in Lyrics mode while your visualizer follows the audio.'; qs('#studio-import-welcome').innerHTML = icon('library') + 'Read lyrics'; }
        focus = -2; resize(); syncLyrics();
        if (mode === 'lyrics' && !followReader) qs('.studio-lyrics').scrollTop = readerScroll;
        // Ordinary lyrics are a reading surface: skip GPU drawing and audio analysis.
        if (mode === 'lyrics') { cancelAnimationFrame(raf); raf = 0; }
        startLoop();
    }
    function offset() { const value = state.lyricOffsets?.[current?.id]; return Number.isFinite(value) ? S.clamp(value, -10000, 10000) : 0; }
    function setOffset(value) { if (!current) { toast('Choose a song first.'); return; } state.lyricOffsets = { ...(state.lyricOffsets || {}), [current.id]: S.clamp(value, -10000, 10000) }; persist(); updateOffset(); focus = -2; syncLyrics(); drawOnce(); }
    function updateOffset() { qs('#studio-offset').textContent = `${offset() > 0 ? '+' : ''}${offset()} ms`; }
    async function refreshTrack(force = false) {
        if (!room || room.hidden) return;
        updateStatus(); updateOffset();
        const id = current?.id || null; if (id === trackId && !force) return;
        trackId = id; resetReaction(); const request = ++requestId; focus = -2; lyricData = { lines: [], timing: null, source: null }; renderLyrics(); notice('');
        room.classList.toggle('no-track', !current); qs('#studio-title').textContent = current?.title || 'A room for your music.'; qs('#studio-artist').textContent = current?.artist || 'Pick a song from your collection.';
        qs('.studio-quality').textContent = current ? `${current.format} · ${current.sampleRate ? current.sampleRate / 1000 + ' kHz' : 'LOCAL AUDIO'}` : 'LOCAL AUDIO · ALWAYS YOURS';
        if (!current) { artImage.hidden = true; artImage.removeAttribute('src'); drawOnce(); return; }
        artImage.hidden = false; artImage.onload = () => { if (trackId === id) { extractPalette(); resize(); } }; artImage.src = '/api/art/' + id;
        try { const result = await api('/api/lyrics/' + id); if (request !== requestId || current?.id !== id) return; lyricData = result; renderLyrics(); }
        catch (e) { if (request === requestId) { notice(e.message); renderLyrics(); } }
        resize(); drawOnce();
    }
    function extractPalette() {
        try {
            const tiny = document.createElement('canvas'); tiny.width = tiny.height = 24; const c = tiny.getContext('2d', { willReadFrequently: true }); c.drawImage(artImage, 0, 0, 24, 24); const data = c.getImageData(0, 0, 24, 24).data;
            const picks = []; for (let i = 0; i < data.length; i += 4) { const v = [data[i], data[i + 1], data[i + 2]], max = Math.max(...v), min = Math.min(...v); if (max > 40 && max < 247 && max - min > 15) picks.push({ v, weight: (max - min) * (1 - Math.abs(max - 155) / 255) }); }
            picks.sort((a, b) => b.weight - a.weight); if (picks.length) { palette = picks[Math.floor(picks.length * .1)].v.map(v => Math.min(235, Math.round(v * .75 + 55))); secondary = picks[Math.floor(picks.length * .6)].v; } else { palette = [192, 240, 120]; secondary = [119, 173, 142]; }
            room.style.setProperty('--viz-rgb', palette.join(',')); room.style.setProperty('--viz-secondary-rgb', secondary.join(',')); drawOnce();
        } catch { /* Local deterministic artwork is still usable without pixel extraction. */ }
    }
    function renderLyrics() {
        const lines = lyricData.lines || [], hasText = lines.some(l => l.text), plain = lyricData.timing === 'plain';
        if (plain) { followReader = false; qs('#studio-follow').setAttribute('aria-pressed', 'false'); qs('#studio-follow').textContent = 'Follow playback'; }
        const hasTrack = !!current; qs('.studio-lyric-welcome h2').textContent = hasTrack ? initialMessage : 'Pick a song. Make some waves.';
        qs('.studio-lyric-welcome p').textContent = hasTrack ? 'The visualizer is ready. Add local lyrics if you’d like the words to follow along.' : 'Your collection is waiting. Start a song, then return here to see its sound.';
        qs('#studio-import-welcome').innerHTML = icon(hasTrack ? 'plus' : 'library') + (hasTrack ? 'Add local lyrics' : 'Choose a song');
        const scroller = qs('.lyric-scroller'); scroller.replaceChildren(); lyricNodes = []; readerScroll = 0; qs('.studio-lyrics').scrollTop = 0;
        lines.forEach((line, index) => {
            const timed = Number.isFinite(line.start), node = document.createElement(line.text && timed ? 'button' : line.text ? 'p' : 'div');
            node.className = 'lyric-line' + (!line.text ? ' lyric-gap' : ''); node.dataset.line = index; node.dataset.floatSlot = S.floatSlot(index);
            if (timed && line.text) { node.type = 'button'; node.setAttribute('aria-label', `Seek to ${time(line.start)}: ${line.text}`); }
            if (!line.text) { node.hidden = mode !== 'lyrics'; node.setAttribute('aria-hidden', 'true'); }
            if (line.words.length) { for (const word of line.words) { const el = document.createElement('span'); el.className = Number.isFinite(word.start) ? 'lyric-word' : 'untimed-word'; el.textContent = word.text; node.append(el); } }
            else node.textContent = line.text;
            if (timed && line.text) node.onclick = () => { if (Number.isFinite(audio.duration)) { audio.currentTime = S.clamp(line.start + offset() / 1000, 0, audio.duration); focus = -2; syncLyrics(); } };
            scroller.append(node); lyricNodes.push(node);
        });
        qs('.studio-lyrics-note').hidden = !hasText; qs('.studio-lyrics-note').textContent = plain ? 'PLAIN TEXT · READ AT YOUR PACE' : lyricData.timing === 'word' ? 'WORD TIMING · TAP A LINE TO SEEK' : 'LINE TIMING · TAP A LINE TO SEEK';
        qs('#studio-lyric-source').textContent = lyricData.source ? `${lyricData.source} · ${plain ? 'Plain text, no timed highlighting' : lyricData.timing === 'word' ? 'Word-timed where provided' : 'Line-timed lyrics'}` : 'No local lyric file for this song. Add LRC, TTML, or plain TXT.';
        qs('#studio-import').innerHTML = icon('music') + `<span>${hasText ? 'Replace lyrics' : 'Add lyrics'}</span>`;
        for (const id of ['studio-earlier', 'studio-later', 'studio-reset-offset']) qs('#' + id).disabled = plain;
        activeIds = []; focus = -2;
        if (plain && mode !== 'lyrics') { setMode('lyrics', false); savePreferences(); } else setMode(mode, false);
    }
    function syncLyrics() {
        if (!room || room.hidden || !lyricData.lines.length) return;
        const frame = S.lyricFrame(lyricData.lines, audio.currentTime, offset());
        const changed = frame.focus !== focus || frame.active.join(',') !== activeIds.join(',');
        if (changed) {
            focus = frame.focus; activeIds = frame.active;
            lyricNodes.forEach((node, i) => {
                const active = activeIds.includes(i), floatVisible = mode === 'float' && i === focus && active;
                node.tabIndex = mode === 'lyrics' ? (node.tagName === 'BUTTON' ? 0 : -1) : mode === 'float' ? (floatVisible ? 0 : -1) : Math.abs(i - focus) <= 1 ? 0 : -1;
                node.classList.toggle('is-before', i < focus); node.classList.toggle('is-active', active); node.classList.toggle('float-current', floatVisible); node.classList.remove('float-previous', 'float-next');
                if (mode === 'float') node.setAttribute('aria-hidden', String(!floatVisible)); else if (lyricData.lines[i].text) node.removeAttribute('aria-hidden');
                node.querySelectorAll('.lyric-word').forEach(word => { word.style.setProperty('--word-pct', i < focus ? '100%' : '0%'); word.classList.remove('singing'); });
            });
            const node = lyricNodes[Math.max(0, focus)], viewport = qs('.studio-lyrics');
            if (node && mode === 'flow') qs('.lyric-scroller').style.transform = `translateY(${viewport.clientHeight * .43 - node.offsetTop - node.offsetHeight / 2}px)`;
            if (node && mode === 'lyrics' && followReader && focus >= 0) { viewport.scrollTo({ top: Math.max(0, node.offsetTop - viewport.clientHeight * .35), behavior: reduced || room.classList.contains('is-seeking') ? 'auto' : 'smooth' }); }
        }
        for (const i of activeIds) {
            const line = lyricData.lines[i], nodes = lyricNodes[i].children;
            line.words.forEach((word, j) => { const pct = S.wordProgress(word, frame.time); if (pct !== null && nodes[j]) { nodes[j].style.setProperty('--word-pct', (pct * 100).toFixed(2) + '%'); nodes[j].classList.toggle('singing', pct > 0 && pct < 1); } });
        }
    }
    function chooseLyrics() { if (!current) { closeStudio(); navigate('tracks'); return; } qs('#studio-lyric-file').click(); }
    async function importLyrics(file) {
        const id = current?.id; if (!id) return;
        if (file.size > 1048576) { toast('Choose a lyric file smaller than 1 MB.'); return; }
        const request = ++requestId;
        try { const text = await file.text(); if (current?.id !== id) return; const result = await api('/api/lyrics/' + id, { filename: file.name, text }); if (request !== requestId || current?.id !== id) return; lyricData = result; renderLyrics(); toast(result.timing === 'plain' ? 'Lyrics added. Scroll at your own pace.' : 'Lyrics added. Use timing controls if they run early or late.'); }
        catch (e) { toast(e.message); }
    }
    function updateStatus() {
        if (!room) return; qs('#studio-audio-status').textContent = !current ? 'Ready when you are' : audio.paused ? 'Paused' : audio.readyState < 3 ? 'Buffering…' : context?.state === 'suspended' ? 'Audio sleeping' : 'Live audio';
    }
    function resize() {
        if (!room || room.hidden) return;
        const rect = qs('.studio-main').getBoundingClientRect(), cover = qs('.studio-art').getBoundingClientRect();
        width = rect.width; height = rect.height; cx = cover.left - rect.left + cover.width / 2; cy = cover.top - rect.top + cover.height / 2; coverSize = cover.width;
        const dpr = Math.min(devicePixelRatio || 1, 1.5); canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0); focus = -2; syncLyrics(); drawOnce();
    }
    function sample(dt = 1 / 60) {
        if (analyser && context?.state === 'running' && !audio.paused && !audio.ended && audio.readyState >= 3) {
            analyser.getByteFrequencyData(freq); analyser.getFloatTimeDomainData(wave);
            const raw = S.frequencyBands(freq, context.sampleRate, analyser.fftSize, 72);
            reaction = dynamics.update(raw, S.floatRms(wave), dt, intensity, response); bands = reaction.bands; energy = reaction.level; bass = reaction.bass;
            peaks = peaks.map((v, i) => Math.max(bands[i], v * Math.exp(-dt / .32)));
            if (!reduced) {
                particles.forEach((p, i) => S.stepParticle(p, bands[i % 72] || 0, reaction.onset, energy, dt, p.seed));
                if (reaction.onset > .14) { shockwaves.push({ travel: 0, life: 1, strength: reaction.onset }); if (shockwaves.length > 5) shockwaves.shift(); }
                shockwaves.forEach(p => { p.travel += dt * (110 + p.strength * 180); p.life -= dt * 1.7; }); shockwaves = shockwaves.filter(p => p.life > 0);
            }
        } else { resetReaction(); if (wave) wave.fill(0); }
    }
    function color(a = 1, second = false) { return `rgba(${(second ? secondary : palette).join(',')},${S.clamp(a)})`; }
    function draw() {
        if (!ctx2d || !width || !height) return; ctx2d.clearRect(0, 0, width, height);
        const drive = { calm: .6, punchy: 1.2, explosive: 1.8 }[response] || 1.2;
        const level = reduced ? 0 : energy, pulse = reduced ? 0 : reaction.pulse;
        const baseRadius = coverSize * .68;
        const available = Math.max(baseRadius + 5, Math.min(cx, width - cx, cy, height - cy) - 8);
        const radius = Math.min(available - 2, baseRadius + (reduced ? 0 : Math.min(baseRadius * .3, Math.max(0, reaction.spring) * baseRadius)));
        const reach = Math.min(coverSize * .5 + 24, 145) * drive;
        const bloom = ctx2d.createRadialGradient(cx, cy, coverSize * .2, cx, cy, baseRadius * 2.8); bloom.addColorStop(0, color(.07 + level * .13 + pulse * .06)); bloom.addColorStop(.55, color(.025 + level * .055)); bloom.addColorStop(1, color(0)); ctx2d.fillStyle = bloom; ctx2d.fillRect(0, 0, width, height);
        ctx2d.lineCap = 'round';
        if (style === 'halo') {
            const count = 180, points = [];
            for (let i = 0; i < count; i++) {
                const angle = i / count * Math.PI * 2 - Math.PI / 2, index = (i < count / 2 ? i : count - i - 1) / (count / 2) * (bands.length - 1);
                const lo = Math.floor(index), blend = index - lo, band = (bands[lo] || 0) * (1 - blend) + (bands[Math.min(lo + 1, 71)] || 0) * blend;
                const cos = Math.cos(angle), sin = Math.sin(angle), edgeX = (cos >= 0 ? width - cx - 8 : cx - 8) / Math.max(.001, Math.abs(cos)), edgeY = (sin >= 0 ? height - cy - 8 : cy - 8) / Math.max(.001, Math.abs(sin));
                const r = Math.min(edgeX, edgeY, radius + (reduced ? 0 : Math.pow(band, .85) * reach));
                points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
                ctx2d.strokeStyle = color(.14 + (reduced ? 0 : band * .48)); ctx2d.lineWidth = 1.5; ctx2d.beginPath(); ctx2d.moveTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius); ctx2d.lineTo(points[i][0], points[i][1]); ctx2d.stroke();
            }
            // An unbroken, bass-driven contour makes the ring read as a moving surface.
            ctx2d.beginPath(); ctx2d.moveTo((points[points.length - 1][0] + points[0][0]) / 2, (points[points.length - 1][1] + points[0][1]) / 2); points.forEach((p, i) => { const next = points[(i + 1) % points.length]; ctx2d.quadraticCurveTo(p[0], p[1], (p[0] + next[0]) / 2, (p[1] + next[1]) / 2); }); ctx2d.closePath(); ctx2d.strokeStyle = color(.38 + level * .45); ctx2d.lineWidth = 2 + pulse * 2; ctx2d.shadowColor = color(.6); ctx2d.shadowBlur = reduced ? 0 : 8 + pulse * 12; ctx2d.stroke(); ctx2d.shadowBlur = 0;
            ctx2d.beginPath(); ctx2d.arc(cx, cy, radius - 6, 0, Math.PI * 2); ctx2d.strokeStyle = color(.1 + level * .15); ctx2d.lineWidth = 1; ctx2d.stroke();
            if (!reduced) for (const shock of shockwaves) { const r = Math.min(available, baseRadius + shock.travel); ctx2d.beginPath(); ctx2d.arc(cx, cy, r, 0, Math.PI * 2); ctx2d.strokeStyle = color(shock.life * shock.strength * .22); ctx2d.lineWidth = 1; ctx2d.stroke(); }
        } else if (style === 'spectrum') {
            const flow = mode === 'flow' && width > 760, barWidth = flow ? Math.min(width * .34, 405) : width * .78;
            const x = flow ? cx - barWidth / 2 : (width - barWidth) / 2, y = flow ? Math.min(height - 8, cy + coverSize / 2 + 139) : height * (width < 760 ? .68 : .86);
            const maxHeight = flow ? Math.min(95, height * .2) : width < 760 ? 80 : Math.min(height * .32, 170), count = 72, gap = barWidth / count;
            for (let i = 0; i < count; i++) {
                const h = reduced ? 2 : Math.max(2, Math.min(maxHeight * 1.2, Math.pow(bands[i], .9) * maxHeight * (.8 + drive * .35)));
                ctx2d.fillStyle = color(.16 + (reduced ? 0 : bands[i] * .8)); ctx2d.beginPath(); ctx2d.roundRect(x + i * gap, y - h, Math.max(1, gap * .62), h, 2); ctx2d.fill();
                if (!reduced && peaks[i] > .05) { ctx2d.fillStyle = color(.6); ctx2d.fillRect(x + i * gap, y - Math.min(maxHeight * 1.2, Math.pow(peaks[i], .9) * maxHeight * (.8 + drive * .35)) - 3, Math.max(1, gap * .62), 2); }
                ctx2d.fillStyle = color(.03 + (reduced ? 0 : bands[i] * .12)); if (width >= 760) ctx2d.fillRect(x + i * gap, y + 5, Math.max(1, gap * .62), h * .22);
            }
        } else if (style === 'wave') {
            const flow = mode === 'flow' && width > 760, w = flow ? width * .34 : width * .78, x = flow ? cx - w / 2 : (width - w) / 2, y = flow ? Math.min(height - 15, cy + coverSize / 2 + 140) : height * (width < 760 ? .60 : .82);
            const amplitude = flow ? Math.min(60, height * .12) : width < 760 ? 38 : Math.min(130, height * .23), gain = reaction.waveGain * intensity * (.8 + drive * .3);
            for (let layer = 0; layer < 3; layer++) {
                ctx2d.beginPath(); ctx2d.strokeStyle = color(layer === 0 ? .85 : layer === 1 ? .17 : .07, layer === 1); ctx2d.lineWidth = layer === 0 ? 2 : layer === 1 ? 5 : 10;
                // Peak-preserving downsampling keeps short high-frequency transients visible.
                for (let i = 0; i <= 400; i++) {
                    let v = 0; if (!reduced && wave) { const a = Math.floor(i / 401 * wave.length), b = Math.min(wave.length, Math.max(a + 1, Math.floor((i + 1) / 401 * wave.length))); for (let j = a; j < b; j++)if (Math.abs(wave[j]) > Math.abs(v)) v = wave[j]; }
                    const py = y + S.clamp(v * gain, -1, 1) * amplitude; if (i === 0) ctx2d.moveTo(x, py); else ctx2d.lineTo(x + i / 400 * w, py);
                } ctx2d.stroke();
            }
        } else if (style === 'particles') {
            const count = width < 760 ? 110 : particles.length;
            ctx2d.save(); ctx2d.globalCompositeOperation = 'lighter';
            for (let i = 0; i < count; i++) {
                const p = particles[i], band = reduced ? 0 : bands[i % 72] || 0;
                const r = baseRadius * (1.05 + p.seed * .95 + (reduced ? 0 : p.offset * drive));
                const angle = reduced ? i * 2.39996 : p.angle, x = cx + Math.cos(angle) * r, y = cy + Math.sin(angle) * r * .84;
                const size = .7 + p.seed * 1.8 + band * 3.6 + (reduced ? 0 : pulse * 2.4);
                if (!reduced && p.x !== null && p.y !== null) { ctx2d.beginPath(); ctx2d.moveTo(p.x, p.y); ctx2d.lineTo(x, y); ctx2d.strokeStyle = color(.12 + band * .35, i % 4 === 0); ctx2d.lineWidth = Math.max(1, size * .55); ctx2d.stroke(); }
                ctx2d.fillStyle = color(.12 + p.seed * .2 + band * .5, i % 4 === 0); ctx2d.beginPath(); ctx2d.arc(x, y, size, 0, Math.PI * 2); ctx2d.fill(); p.x = x; p.y = y;
            }
            ctx2d.restore();
            if (!reduced) for (const shock of shockwaves) { ctx2d.strokeStyle = color(shock.life * shock.strength * .25); ctx2d.lineWidth = 1; ctx2d.beginPath(); ctx2d.ellipse(cx, cy, baseRadius + shock.travel, (baseRadius + shock.travel) * .84, 0, 0, Math.PI * 2); ctx2d.stroke(); }
        }
        qs('.studio-backdrop').style.transform = reduced ? 'none' : `translate3d(${Math.sin(phase * .025) * level * 12}px,${Math.cos(phase * .02) * level * 10}px,0) scale(${1 + level * .025 + pulse * .018})`;
        qs('.signal-bars').querySelectorAll('i').forEach((bar, i) => bar.style.height = (3 + (reduced ? 0 : (bands[6 + i * 10] || 0) * 18)) + 'px');
        // Visible DOM metrics support deterministic QA without exposing audio or track data.
        canvas.dataset.audioContext = context?.state || 'uninitialized'; canvas.dataset.waveRmsPixels = (wave ? S.floatRms(wave) * reaction.waveGain * intensity * (.8 + drive * .3) * Math.min(130, height * .23) : 0).toFixed(1); canvas.dataset.signalLevel = energy.toFixed(3); canvas.dataset.bass = bass.toFixed(3); canvas.dataset.treble = reaction.treble.toFixed(3); canvas.dataset.pulse = reaction.pulse.toFixed(3); canvas.dataset.excursion = (radius - baseRadius + Math.max(...bands) * reach).toFixed(1); canvas.dataset.particleTravel = Math.max(...particles.map(p => Math.abs(p.offset) * baseRadius * drive)).toFixed(1);
    }
    function frame(stamp) {
        raf = 0; if (room.hidden || document.hidden) return;
        const interval = mode === 'lyrics' ? 100 : reduced ? 125 : 1000 / 60;
        if (stamp - lastDraw >= interval) { const dt = Math.min(.1, (stamp - lastDraw) / 1000); lastDraw = stamp; if (mode !== 'lyrics') { sample(dt); if (!reduced) phase += dt * energy; draw(); } syncLyrics(); updateStatus(); }
        if (!audio.paused && !audio.ended) raf = requestAnimationFrame(frame);
    }
    function startLoop() { if (!room || room.hidden || document.hidden) return; cancelAnimationFrame(raf); lastDraw = 0; raf = requestAnimationFrame(frame); }
    function drawOnce() { if (!room || room.hidden) return; if (mode !== 'lyrics') { sample(); draw(); } syncLyrics(); }
    async function toggleFullscreen() { try { if (document.fullscreenElement) { await document.exitFullscreen(); ownedFullscreen = false; } else { await document.documentElement.requestFullscreen(); ownedFullscreen = true; } } catch { toast('Full screen is unavailable in this window. Maximize it instead.'); } }
    // Resume Web Audio in the trusted input event itself, before async playback events.
    function wakeAudio() { if (context?.state === 'suspended') context.resume().then(() => { drawOnce(); startLoop(); }).catch(() => { }); }
    document.addEventListener('pointerdown', wakeAudio, { capture: true });
    document.addEventListener('keydown', wakeAudio, { capture: true });
    window.openStudio = openStudio;
    $('#open-studio').onclick = openStudio; $('#sidebar-studio').onclick = openStudio;
    for (const event of ['play', 'pause', 'ended', 'waiting', 'playing', 'seeking', 'seeked', 'loadedmetadata', 'emptied']) audio.addEventListener(event, () => {
        if (!room || room.hidden) return;
        if (event === 'play') { ensureAudio(); startLoop(); }
        if (event === 'loadedmetadata') refreshTrack();
        updateStatus(); if (event === 'pause' || event === 'ended') { cancelAnimationFrame(raf); raf = 0; }
        if (event === 'seeking') room.classList.add('is-seeking');
        if (event === 'seeked') { focus = -2; resetReaction(); } drawOnce();
        if (event === 'seeked') requestAnimationFrame(() => requestAnimationFrame(() => room.classList.remove('is-seeking')));
    });
    window.addEventListener('spice:track', () => { if (room && !room.hidden) { refreshTrack(); startLoop(); } });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (room && !room.hidden) { focus = -2; syncLyrics(); drawOnce(); startLoop(); } });
    document.addEventListener('fullscreenchange', () => { if (room && !room.hidden) resize(); });
    document.addEventListener('keydown', e => {
        if (modal.open || ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key.toLowerCase() === 'v') { e.preventDefault(); room && !room.hidden ? closeStudio() : openStudio(); }
        if (!room || room.hidden) return;
        if (e.key === '/') { closeStudio(); $('#global-search')?.focus(); return; }
        if (e.key === 'Escape') { if (!qs('.studio-timing').hidden) { qs('.studio-timing').hidden = true; qs('#studio-options').setAttribute('aria-expanded', 'false'); } else closeStudio(); }
        if (e.key.toLowerCase() === 'f') { e.preventDefault(); toggleFullscreen(); }
    });
    motionQuery.addEventListener('change', e => { if (!room) return; reduced = e.matches; qs('#studio-reduced').checked = reduced; room.classList.toggle('is-reduced', reduced); savePreferences(); drawOnce(); });
})();
