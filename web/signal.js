/* Shared pure audio/timing calculations, also exercised by Node's test runner. */
(function (root) {

    'use strict';

    const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
    
    function frequencyBands(bytes, sampleRate, fftSize, count = 72) {
        const bands = [];
        for (let i = 0; i < count; i++) {
            const lo = Math.max(1, Math.floor(35 * Math.pow(16000 / 35, i / count) * fftSize / sampleRate));
            const hi = Math.min(bytes.length, Math.max(lo + 1, Math.ceil(35 * Math.pow(16000 / 35, (i + 1) / count) * fftSize / sampleRate)));
            let sum = 0, peak = 0; for (let j = lo; j < hi; j++) { const v = bytes[j] || 0; sum += v; peak = Math.max(peak, v); }
            bands.push(hi > lo ? (.82 * peak + .18 * sum / (hi - lo)) / 255 : 0);
        }
        return bands;
    }


    function rms(bytes) { if (!bytes.length) return 0; let sum = 0; for (const b of bytes) sum += ((b - 128) / 128) ** 2; return Math.sqrt(sum / bytes.length); }


    function lyricFrame(lines, time, delayMs = 0) {
        const t = Math.round(((Number.isFinite(time) ? time : 0) - (Number.isFinite(delayMs) ? delayMs : 0) / 1000) * 1e6) / 1e6;
        const candidates = []; let focus = -1;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]; if (!Number.isFinite(line.start) || !Number.isFinite(line.end) || !line.text) continue;
            if (line.start <= t) focus = i;
            if (line.start <= t && t < line.end) candidates.push(i);
        }
        // A repeated phrase is a new occurrence, never another copy to illuminate.
        // Preserve distinct overlapping duet lines; resolve identical overlapping text
        // to the latest timestamp (and one stable occurrence on timestamp ties).
        const phrases = new Map();
        for (const i of candidates) { const key = lines[i].text.normalize('NFKC').trim().replace(/\s+/g, ' '); const previous = phrases.get(key); if (previous === undefined || lines[i].start >= lines[previous].start) phrases.set(key, i); }
        const active = [...phrases.values()].sort((a, b) => a - b);
        return { time: t, active, focus: active.length ? active.reduce((a, b) => lines[b].start >= lines[a].start ? b : a) : focus };
    }
    function floatSlot(index) { return Math.max(0, index) % 4; }
    function wordProgress(word, t) {
        if (!Number.isFinite(word.start) || !Number.isFinite(word.end)) return null;
        return word.end === word.start ? (t >= word.start ? 1 : 0) : clamp((t - word.start) / (word.end - word.start));
    }
    // Fast attack, slower release: preserve impacts without visual chatter.
    function follow(value, target, dt, attack = .025, release = .17) { return value + (target - value) * (1 - Math.exp(-dt / (target > value ? attack : release))); }


    function floatRms(data) { if (!data.length) return 0; let sum = 0; for (const v of data) sum += v * v; return Math.sqrt(sum / data.length); }


    function createDynamics(count = 72) {
        let previous = new Array(count).fill(0), smooth = new Array(count).fill(0), reference = .025, fluxMean = 0, bassMean = 0, level = 0, pulse = 0, spring = 0, velocity = 0, cooldown = 0, waveGain = 1;
        const reset = () => { previous.fill(0); smooth.fill(0); reference = .025; fluxMean = bassMean = level = pulse = spring = velocity = cooldown = 0; waveGain = 1; };
        function update(raw, loudness, dt = 1 / 60, intensity = 1, response = 'punchy') {
            dt = clamp(dt, 1 / 240, .05); const drive = { calm: .65, punchy: 1.2, explosive: 1.65 }[response] || 1.2;
            const alive = Number.isFinite(loudness) && loudness > .00035;
            reference = follow(reference, alive ? loudness : .025, dt, .045, 2.2);
            const relative = alive ? clamp(loudness / Math.max(.012, reference)) : 0;
            const absolute = alive ? Math.sqrt(clamp(loudness * 7)) : 0;
            level = follow(level, alive ? clamp((relative * .72 + absolute * .28) * Math.sqrt(intensity) * drive) : 0, dt, .018, .15);
            waveGain = follow(waveGain, alive ? clamp(.23 / Math.max(reference, .012), .7, 16) : 1, dt, .04, .75);
            let sumDelta = 0, maxDelta = 0, bassNow = 0, midNow = 0, trebleNow = 0;
            const target = raw.map((v, i) => {
                const clean = alive ? Math.pow(clamp((v - .08) / .92), 1.4) : 0;
                const weighted = clamp(clean * (.95 + .28 * i / Math.max(1, count - 1)) * Math.sqrt(intensity) * drive);
                const delta = Math.max(0, weighted - previous[i]); sumDelta += delta; maxDelta = Math.max(maxDelta, delta);
                if (i < 23) bassNow = Math.max(bassNow, weighted); else if (i < 49) midNow = Math.max(midNow, weighted); else trebleNow = Math.max(trebleNow, weighted);
                return weighted;
            });
            const flux = sumDelta / count * .65 + maxDelta * .35;
            cooldown = Math.max(0, cooldown - dt);
            const novelty = Math.max(0, flux - fluxMean * 1.4 - .025) * 4.5 + Math.max(0, bassNow - bassMean * 1.3 - .09) * .85;
            const onset = alive && cooldown === 0 ? clamp(novelty) : 0;
            if (onset > .1) cooldown = .105;
            fluxMean = follow(fluxMean, flux, dt, .12, .4); bassMean = follow(bassMean, bassNow, dt, .14, .5);
            pulse = Math.max(onset, pulse * Math.exp(-dt / .18));
            // Semi-implicit damped spring, in radius-relative units.
            const targetSpring = alive ? (bassNow * .16 + pulse * .28) * drive : 0;
            velocity += (190 * (targetSpring - spring) - 17 * velocity) * dt;
            spring = clamp(spring + velocity * dt, -.06, .7);
            smooth = smooth.map((v, i) => follow(v, target[i], dt, .014, .14)); previous = target;
            return { bands: smooth.slice(), level, bass: bassNow, mid: midNow, treble: trebleNow, pulse, onset, spring, waveGain: alive ? waveGain : 0, alive };
        }
        return { update, reset };
    }

    function stepParticle(p, band, onset, level, dt, seed = 0) {
        dt = clamp(dt, 0, .05);
        const target = band * (.18 + seed * .48);
        p.velocity += (34 * (target - p.offset) - 6.8 * p.velocity) * dt;
        p.velocity += onset * (1.4 + seed * 3.6);
        p.offset = clamp(p.offset + p.velocity * dt, -.3, 2.2);
        p.angle += dt * level * (.08 + seed * .12) * (seed > .5 ? 1 : -1);
        return p;
    }

    const api = { clamp, frequencyBands, rms, lyricFrame, wordProgress, floatSlot, follow, floatRms, createDynamics, stepParticle };

    if (typeof module === 'object' && module.exports) module.exports = api; else root.SpiceSignal = Object.freeze(api);
})(globalThis);
