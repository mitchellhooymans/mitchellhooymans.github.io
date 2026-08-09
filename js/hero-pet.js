/**
 * Hidden Hero Desk Buddy Easter Egg
 * ------------------------------------
 * Triggered via the shared combo router (js/hero-combos.js):
 *   Computational Astrophysics x1  ->  OzGrav x1  ->  PhD x2
 *
 * A stellar-evolution desk buddy: dust core -> protostar -> main sequence
 * (by mass) -> late remnant. Fuel, accretion, winds, and localStorage save.
 */

document.addEventListener('DOMContentLoaded', () => {
    const glassCard = document.getElementById('hero-glass-card');
    const petPanel = document.getElementById('hero-pet');
    if (!glassCard || !petPanel) return;

    const profileFrame = glassCard.querySelector('.profile-frame');
    const heroContent = glassCard.querySelector('.hero-content-glass');
    const canvas = document.getElementById('pet-canvas');
    const closeBtn = document.getElementById('pet-close');
    const titleEl = document.getElementById('pet-title');
    const statusEl = document.getElementById('pet-status');
    const metersEl = document.getElementById('pet-meters');
    const ctx = canvas.getContext('2d');

    const SAVE_KEY = 'stellarBuddySave';
    const LEGACY_SAVE_KEYS = ['deskBuddySave', 'deskDigipetSave'];
    const MAX_OFFLINE_MS = 8 * 60 * 60 * 1000;
    const FLOOR_Y = 0.78; // normalized height of the floor surface

    // Stage age thresholds (seconds of pet life)
    const STAGE_AGE = {
        egg: 0,
        fresh: 40,
        training: 180,
        rookie: 480,
        champion: 1200,
    };

    const FORMS = {
        egg: { name: 'Dust Core', stage: 'Prestellar', blurb: 'A cold molecular-cloud core' },
        fresh: { name: 'Protostar', stage: 'Class 0', blurb: 'Collapsing, not yet fusing' },
        training: { name: 'T Tauri', stage: 'Pre-MS', blurb: 'Young, still contracting' },
        rookie_fire: { name: 'Blue Sequence', stage: 'Main Sequence', blurb: 'Hot, massive, short-lived' },
        rookie_fluff: { name: 'G Dwarf', stage: 'Main Sequence', blurb: 'Sun-like hydrogen burner' },
        rookie_junk: { name: 'Red Dwarf', stage: 'Main Sequence', blurb: 'Cool, thrifty, long-lived' },
        champ_fire: { name: 'Black Hole', stage: 'Remnant', blurb: 'Collapsed past the NS limit' },
        champ_fluff: { name: 'Red Giant', stage: 'Post-MS', blurb: 'H shell burning, puffed envelope' },
        champ_junk: { name: 'White Dwarf', stage: 'Remnant', blurb: 'Electron-degenerate core' },
        ghost: { name: 'Fadeout', stage: 'Gone', blurb: 'No signal left' },
    };

    let petActive = false;
    let animId = null;
    let lastTs = 0;
    let showStatus = false;
    let saveTimer = null;
    let saveAccum = 0;

    /** @type {ReturnType<typeof defaultState>} */
    let S = defaultState();

    // Visual / FX (not persisted)
    const fx = {
        bob: 0,
        blink: 0,
        blinkTimer: 2,
        frame: 0,
        hearts: [],
        sparks: [],
        zzz: [],
        evolveFlash: 0,
        message: '',
        messageTimer: 0,
    };

    const btns = {
        feed: document.getElementById('pet-feed'),
        play: document.getElementById('pet-play'),
        train: document.getElementById('pet-train'),
        clean: document.getElementById('pet-clean'),
        meds: document.getElementById('pet-meds'),
        light: document.getElementById('pet-light'),
        status: document.getElementById('pet-status-btn'),
        restart: document.getElementById('pet-restart'),
    };

    document.addEventListener('hero-combo:pet', activatePet);
    closeBtn.addEventListener('click', deactivatePet);
    btns.feed?.addEventListener('click', actionFeed);
    btns.play?.addEventListener('click', actionPlay);
    btns.train?.addEventListener('click', actionTrain);
    btns.clean?.addEventListener('click', actionClean);
    btns.meds?.addEventListener('click', actionMeds);
    btns.light?.addEventListener('click', actionLight);
    btns.status?.addEventListener('click', () => {
        showStatus = !showStatus;
        syncMeters();
        setBanner(showStatus ? 'Status panel open' : 'Status panel closed');
    });
    btns.restart?.addEventListener('click', actionRestart);
    canvas.addEventListener('click', onCanvasClick);
    canvas.addEventListener('mousemove', (e) => {
        if (!petActive || !S.alive) { canvas.style.cursor = 'default'; return; }
        const rect = canvas.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width;
        const ny = (e.clientY - rect.top) / rect.height;
        canvas.style.cursor = hitTestPet(nx, ny) ? 'pointer' : 'default';
    });

    // ---------------------------------------------------------------
    // State
    // ---------------------------------------------------------------
    function defaultState() {
        return {
            alive: true,
            form: 'egg',
            age: 0, // seconds
            hunger: 0.5,
            happy: 0.7,
            strength: 0.1,
            discipline: 0.5,
            health: 1,
            weight: 5,
            sick: false,
            lightsOn: true,
            sleeping: false,
            careMistakes: 0,
            trainCount: 0,
            feedCount: 0,
            playCount: 0,
            poops: [], // {x}
            food: [], // {x,y,vy,life,eaten}
            state: 'idle', // idle|walk|seek|eat|happy|train|sleep|sick|dead|hatch
            stateTimer: 2,
            facing: 1,
            x: 0.5,
            targetX: null,
            evolvedTo: null,
            lastSavedAt: Date.now(),
            bornAt: Date.now(),
        };
    }

    function loadState() {
        try {
            let raw = localStorage.getItem(SAVE_KEY);
            if (!raw) {
                for (const key of LEGACY_SAVE_KEYS) {
                    raw = localStorage.getItem(key);
                    if (raw) {
                        localStorage.setItem(SAVE_KEY, raw);
                        localStorage.removeItem(key);
                        break;
                    }
                }
            }
            if (!raw) return defaultState();
            const data = JSON.parse(raw);
            const base = defaultState();
            Object.keys(base).forEach((k) => {
                if (data[k] !== undefined) base[k] = data[k];
            });
            applyOfflineProgress(base);
            // Drop in-flight food between sessions; keep poops/stats
            base.food = [];
            if (base.state === 'seek' || base.state === 'eat') {
                base.state = 'idle';
                base.stateTimer = 1;
                base.targetX = null;
            }
            return base;
        } catch (e) {
            return defaultState();
        }
    }

    function saveState() {
        S.lastSavedAt = Date.now();
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(S));
        } catch (e) { /* ignore quota */ }
    }

    function scheduleSave() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveState, 400);
    }

    function applyOfflineProgress(state) {
        const now = Date.now();
        const elapsed = Math.min(MAX_OFFLINE_MS, Math.max(0, now - (state.lastSavedAt || now)));
        const sec = elapsed / 1000;
        if (sec < 2 || !state.alive) {
            state.lastSavedAt = now;
            return;
        }

        // Accelerated but capped care simulation while away
        state.age += sec;
        if (!state.lightsOn) {
            state.sleeping = true;
            state.hunger = Math.min(1, state.hunger + sec * 0.0008);
            state.happy = Math.max(0, state.happy - sec * 0.0004);
        } else {
            state.sleeping = false;
            state.hunger = Math.min(1, state.hunger + sec * 0.0025);
            state.happy = Math.max(0, state.happy - sec * 0.0015);
            // Chance of poops accumulating
            const poopAdds = Math.min(3, Math.floor(sec / 180));
            for (let i = 0; i < poopAdds; i++) {
                if (state.poops.length < 4) {
                    state.poops.push({ x: 0.2 + Math.random() * 0.6 });
                }
            }
            if (state.poops.length >= 3 || state.hunger > 0.9) {
                if (Math.random() < Math.min(0.7, sec / 600)) state.sick = true;
            }
            if (state.hunger > 0.95 && state.happy < 0.15) {
                state.careMistakes += Math.min(3, Math.floor(sec / 900));
            }
        }

        if (state.careMistakes >= 8 || (state.hunger >= 1 && state.happy <= 0 && sec > 3600)) {
            killPet(state, true);
        } else {
            maybeEvolve(state, true);
        }
        state.lastSavedAt = now;
    }

    // ---------------------------------------------------------------
    // Activate / deactivate
    // ---------------------------------------------------------------
    function activatePet() {
        if (petActive) return;
        if (window.HeroCombos && window.HeroCombos.isOverlayActive()) return;
        petActive = true;
        if (window.HeroCombos) window.HeroCombos.setOverlayActive(true);

        S = loadState();
        fx.frame = 0;
        fx.hearts = [];
        fx.sparks = [];
        fx.zzz = [];
        showStatus = false;
        updateTitle();
        syncMeters();
        syncActionButtons();
        setBanner(S.alive ? statusLine() : 'Signal lost — remnant faded');

        glassCard.classList.add('terminal-flash');
        setTimeout(() => glassCard.classList.remove('terminal-flash'), 550);

        setTimeout(() => {
            if (profileFrame) profileFrame.classList.add('hero-fade-out');
            if (heroContent) heroContent.classList.add('hero-fade-out');

            petPanel.style.display = 'block';
            petPanel.setAttribute('aria-hidden', 'false');
            requestAnimationFrame(() => {
                requestAnimationFrame(() => petPanel.classList.add('pet-visible'));
            });

            setTimeout(() => {
                if (!petActive) return;
                if (profileFrame) profileFrame.style.display = 'none';
                if (heroContent) heroContent.style.display = 'none';
                requestAnimationFrame(() => {
                    resizeCanvas();
                    lastTs = performance.now();
                    animId = requestAnimationFrame(tick);
                });
            }, 360);
        }, 150);

        document.addEventListener('keydown', onGlobalKeydown);
        window.addEventListener('resize', onResize);
    }

    function deactivatePet() {
        if (!petActive) return;
        petActive = false;
        if (window.HeroCombos) window.HeroCombos.setOverlayActive(false);
        saveState();
        clearTimeout(saveTimer);

        document.removeEventListener('keydown', onGlobalKeydown);
        window.removeEventListener('resize', onResize);
        if (animId) cancelAnimationFrame(animId);
        animId = null;

        petPanel.classList.remove('pet-visible');
        setTimeout(() => {
            petPanel.style.display = 'none';
            petPanel.setAttribute('aria-hidden', 'true');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }, 380);

        if (profileFrame) profileFrame.style.display = '';
        if (heroContent) heroContent.style.display = '';
        void glassCard.offsetWidth;
        requestAnimationFrame(() => {
            if (profileFrame) profileFrame.classList.remove('hero-fade-out');
            if (heroContent) heroContent.classList.remove('hero-fade-out');
        });
    }

    function onGlobalKeydown(e) {
        if (e.key === 'Escape') deactivatePet();
    }

    function onResize() {
        if (!petActive) return;
        resizeCanvas();
    }

    // ---------------------------------------------------------------
    // UI helpers
    // ---------------------------------------------------------------
    function updateTitle() {
        const f = FORMS[S.form] || FORMS.egg;
        if (titleEl) {
            titleEl.textContent = S.alive
                ? `${f.name} · ${f.stage}`
                : 'Stellar buddy · Empty';
        }
    }

    function setBanner(text) {
        fx.message = text;
        fx.messageTimer = 2.2;
        if (statusEl) statusEl.textContent = text;
    }

    function statusLine() {
        if (!S.alive) return 'Press Restart for a new Dust Core';
        if (S.form === 'egg') return 'A Dust Core is collapsing…';
        if (S.sick) return 'Unstable! Needs quenching';
        if (S.sleeping || !S.lightsOn) return 'Observatory night — dormant';
        if (S.poops.length >= 2) return 'Stellar wind debris building up…';
        if (S.hunger > 0.75) return 'Fuel running low — needs hydrogen';
        if (S.happy < 0.3) return 'Magnetic activity rising…';
        if (S.state === 'train') return 'Accreting mass!';
        if (S.state === 'eat') return 'Fuel accreted!';
        if (S.state === 'happy') return 'Flare! Activity up!';
        if (S.state === 'walk' || S.state === 'seek') return 'Drifting on the HR track…';
        return 'Stable on the main sequence';
    }

    function syncMeters() {
        if (!metersEl) return;
        metersEl.hidden = !showStatus;
        if (!showStatus) return;
        const bar = (label, v, invert) => {
            const pct = Math.round(clamp(invert ? 1 - v : v, 0, 1) * 100);
            const tone = pct < 30 ? 'is-low' : pct < 60 ? 'is-mid' : 'is-high';
            return `<div class="pet-meter"><span>${label}</span><div class="pet-meter-track"><i class="${tone}" style="width:${pct}%"></i></div></div>`;
        };
        metersEl.innerHTML = [
            bar('Fuel', S.hunger, true),
            bar('Activity', S.happy, false),
            bar('Mass', S.strength, false),
            bar('Stability', S.health, false),
            `<div class="pet-meter-meta">Age ${formatAge(S.age)} · ~${(0.08 + S.strength * 24).toFixed(2)} M☉ · Care slips ${S.careMistakes}</div>`,
        ].join('');
    }

    function syncActionButtons() {
        if (!btns.feed) return;
        const dead = !S.alive;
        const egg = S.form === 'egg';
        btns.feed.disabled = dead || egg || S.sleeping;
        btns.play.disabled = dead || egg || S.sleeping;
        btns.train.disabled = dead || egg || S.sleeping || S.form === 'fresh';
        btns.clean.disabled = dead || egg || S.poops.length === 0;
        btns.meds.disabled = dead || egg || !S.sick;
        btns.light.disabled = dead || egg;
        btns.restart.hidden = !dead;
        btns.light.textContent = S.lightsOn ? 'Dome' : 'Dome ✦';
        btns.light.classList.toggle('is-active', !S.lightsOn);
    }

    function formatAge(sec) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
        return `${m}m ${s}s`;
    }

    function clamp(n, lo, hi) {
        return Math.min(hi, Math.max(lo, n));
    }

    // ---------------------------------------------------------------
    // Actions
    // ---------------------------------------------------------------
    function busy() {
        return ['eat', 'train', 'hatch', 'dead'].includes(S.state) || !S.alive;
    }

    function actionFeed() {
        if (btns.feed.disabled || !S.alive || S.form === 'egg' || S.sleeping) return;
        if (S.state === 'eat' || S.state === 'train' || S.state === 'hatch') return;
        S.food = (S.food || []).filter((f) => f && !f.eaten);
        if (S.food.length >= 2) {
            setBanner('Accrete what is already there first!');
            return;
        }
        if (S.hunger < 0.12) {
            setBanner('Fuel tank saturated');
            return;
        }
        const x = clamp(0.2 + Math.random() * 0.6, 0.18, 0.82);
        S.food.push({
            x,
            y: 0.2,
            vy: 0,
            eaten: false,
            settled: false,
            life: 30,
        });
        beginSeekFood();
        setBanner('Hydrogen pellet incoming!');
        scheduleSave();
        syncActionButtons();
    }

    function beginSeekFood() {
        const target = nearestFood();
        if (!target) return;
        S.state = 'seek';
        S.targetX = target.x;
        S.stateTimer = 12;
        S.facing = target.x >= S.x ? 1 : -1;
    }

    function nearestFood() {
        let best = null;
        let bestDist = Infinity;
        (S.food || []).forEach((f) => {
            if (!f || f.eaten) return;
            const d = Math.abs(f.x - S.x);
            if (d < bestDist) {
                bestDist = d;
                best = f;
            }
        });
        return best;
    }

    function actionPlay() {
        if (btns.play.disabled || busy()) return;
        doPet();
    }

    function doPet() {
        if (!S.alive || S.form === 'egg' || S.sleeping) return;
        if (S.state === 'eat' || S.state === 'train' || S.state === 'seek') return;
        S.state = 'happy';
        S.stateTimer = 1.4;
        S.happy = clamp(S.happy + 0.18, 0, 1);
        S.playCount += 1;
        S.discipline = clamp(S.discipline + 0.02, 0, 1);
        spawnHearts(3);
        setBanner('Flare! Activity up!');
        scheduleSave();
        syncMeters();
    }

    function actionTrain() {
        if (btns.train.disabled || busy()) return;
        S.state = 'train';
        S.stateTimer = 1.8;
        S.strength = clamp(S.strength + 0.08 + Math.random() * 0.04, 0, 1);
        S.hunger = clamp(S.hunger + 0.06, 0, 1);
        S.happy = clamp(S.happy - 0.03, 0, 1);
        S.trainCount += 1;
        S.weight = Math.max(3, S.weight - 0.05);
        spawnSparks(8);
        setBanner('Mass up! (accretion)');
        maybeEvolve(S, false);
        scheduleSave();
        syncMeters();
        updateTitle();
    }

    function actionClean() {
        if (btns.clean.disabled) return;
        if (!S.poops.length) {
            setBanner('Already swept!');
            syncActionButtons();
            return;
        }
        // Sweep one wind-debris clump at a time (closest to the object)
        let idx = 0;
        let best = Infinity;
        S.poops.forEach((p, i) => {
            const d = Math.abs(p.x - S.x);
            if (d < best) {
                best = d;
                idx = i;
            }
        });
        S.poops.splice(idx, 1);
        S.happy = clamp(S.happy + 0.06, 0, 1);
        S.health = clamp(S.health + 0.08, 0, 1);
        setBanner(S.poops.length ? `Swept! ${S.poops.length} clumps left` : 'Wind debris cleared!');
        scheduleSave();
        syncMeters();
        syncActionButtons();
    }

    function actionMeds() {
        if (btns.meds.disabled) return;
        S.sick = false;
        S.health = clamp(S.health + 0.25, 0, 1);
        S.happy = clamp(S.happy - 0.05, 0, 1);
        setBanner('Instability quenched. Stable again.');
        if (S.state === 'sick') {
            S.state = 'idle';
            S.stateTimer = 1;
        }
        scheduleSave();
        syncMeters();
        syncActionButtons();
    }

    function actionLight() {
        if (btns.light.disabled) return;
        S.lightsOn = !S.lightsOn;
        if (!S.lightsOn) {
            S.sleeping = true;
            S.state = 'sleep';
            S.stateTimer = 999;
            setBanner('Dome closed. Night mode.');
        } else {
            S.sleeping = false;
            S.state = 'idle';
            S.stateTimer = 1.5;
            setBanner('Dome open. Observing…');
        }
        scheduleSave();
        syncActionButtons();
    }

    function actionRestart() {
        if (S.alive) return;
        S = defaultState();
        fx.evolveFlash = 0.6;
        setBanner('A new Dust Core condensed!');
        updateTitle();
        syncMeters();
        syncActionButtons();
        saveState();
    }

    function onCanvasClick(e) {
        if (!S.alive) return;
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const nx = (e.clientX - rect.left) / rect.width;
        const ny = (e.clientY - rect.top) / rect.height;
        if (!hitTestPet(nx, ny)) return;

        if (S.form === 'egg') {
            S.age += 8;
            setBanner('The core twitched — collapse continues…');
            maybeEvolve(S, false);
            scheduleSave();
            return;
        }
        if (!S.sleeping) doPet();
    }

    function hitTestPet(nx, ny) {
        const scale = S.form === 'egg' ? 0.11 : S.form.startsWith('champ') ? 0.15 : 0.13;
        const cx = S.x;
        const cy = FLOOR_Y - scale * 0.55;
        const hw = Math.max(0.08, scale * 0.95);
        const hh = Math.max(0.1, scale * 1.2);
        const dx = (nx - cx) / hw;
        const dy = (ny - cy) / hh;
        return dx * dx + dy * dy <= 1;
    }

    function spawnHearts(n) {
        for (let i = 0; i < n; i++) {
            fx.hearts.push({
                x: S.x + (Math.random() - 0.5) * 0.1,
                y: 0.52,
                vy: -0.16 - Math.random() * 0.1,
                life: 0.9,
                age: 0,
            });
        }
    }

    function spawnSparks(n) {
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2;
            fx.sparks.push({
                x: S.x,
                y: 0.58,
                vx: Math.cos(a) * 0.15,
                vy: Math.sin(a) * 0.15 - 0.05,
                life: 0.5 + Math.random() * 0.3,
                age: 0,
            });
        }
    }

    // ---------------------------------------------------------------
    // Evolution / death
    // ---------------------------------------------------------------
    function maybeEvolve(state, silent) {
        if (!state.alive || state.form === 'ghost') return;

        const prev = state.form;
        if (state.form === 'egg' && state.age >= STAGE_AGE.fresh) {
            state.form = 'fresh';
            state.state = 'hatch';
            state.stateTimer = 1.2;
            state.hunger = 0.4;
            state.happy = 0.8;
        } else if (state.form === 'fresh' && state.age >= STAGE_AGE.training) {
            state.form = 'training';
        } else if (state.form === 'training' && state.age >= STAGE_AGE.rookie) {
            state.form = chooseRookie(state);
        } else if (isRookie(state.form) && state.age >= STAGE_AGE.champion) {
            state.form = chooseChampion(state);
        }

        if (state.form !== prev) {
            state.evolvedTo = state.form;
            fx.evolveFlash = 0.9;
            if (!silent) {
                const f = FORMS[state.form];
                setBanner(`Evolution! ${f.name} · ${f.stage}`);
                updateTitle();
            }
        }
    }

    function chooseRookie(state) {
        // Mass track at ZAMS: neglect/low activity -> M dwarf;
        // high accretion/training -> massive blue MS; else Sun-like G dwarf.
        if (state.careMistakes >= 4 || state.happy < 0.25 || state.strength < 0.2) return 'rookie_junk';
        if (state.strength >= 0.45 || state.trainCount >= 6) return 'rookie_fire';
        return 'rookie_fluff';
    }

    function chooseChampion(state) {
        // Late stages: massive -> black hole, solar -> red giant, low-mass -> white dwarf.
        if (state.form === 'rookie_fire') return 'champ_fire';
        if (state.form === 'rookie_fluff') return 'champ_fluff';
        return 'champ_junk';
    }

    function isRookie(form) {
        return form.startsWith('rookie_');
    }

    function killPet(state, silent) {
        state.alive = false;
        state.form = 'ghost';
        state.state = 'dead';
        state.sleeping = false;
        state.food = [];
        state.poops = [];
        if (!silent) setBanner('Collapse complete — no recoverable signal');
        updateTitle();
        syncActionButtons();
    }

    // ---------------------------------------------------------------
    // Simulation tick
    // ---------------------------------------------------------------
    function tick(ts) {
        if (!petActive) return;
        const dt = Math.min(0.05, (ts - lastTs) / 1000);
        lastTs = ts;
        update(dt);
        draw();
        animId = requestAnimationFrame(tick);
    }

    function update(dt) {
        fx.frame += dt;
        if (fx.messageTimer > 0) {
            fx.messageTimer -= dt;
            if (fx.messageTimer <= 0 && statusEl) statusEl.textContent = statusLine();
        }
        if (fx.evolveFlash > 0) fx.evolveFlash -= dt;

        fx.blinkTimer -= dt;
        if (fx.blinkTimer <= 0) {
            fx.blink = 0.12;
            fx.blinkTimer = 2 + Math.random() * 3;
        }
        if (fx.blink > 0) fx.blink -= dt;

        updateParticles(fx.hearts, dt, false);
        updateParticles(fx.sparks, dt, true);
        updateParticles(fx.zzz, dt, false);

        if (!S.alive) {
            syncActionButtons();
            return;
        }

        S.age += dt;
        maybeEvolve(S, false);

        // Needs drift
        if (S.form !== 'egg') {
            if (S.sleeping || !S.lightsOn) {
                S.hunger = clamp(S.hunger + dt * 0.004, 0, 1);
                S.happy = clamp(S.happy - dt * 0.002, 0, 1);
            } else {
                S.hunger = clamp(S.hunger + dt * 0.012, 0, 1);
                S.happy = clamp(S.happy - dt * 0.006, 0, 1);
                if (S.poops.length) {
                    S.health = clamp(S.health - dt * 0.004 * S.poops.length, 0, 1);
                }
            }
        }

        // Poop spawn
        if (S.form !== 'egg' && S.lightsOn && !S.sleeping && S.poops.length < 4) {
            if (Math.random() < dt * 0.008) {
                S.poops.push({ x: clamp(S.x + (Math.random() - 0.5) * 0.2, 0.18, 0.82) });
                scheduleSave();
            }
        }

        // Sickness
        if (!S.sick && S.form !== 'egg' && (S.poops.length >= 3 || S.hunger > 0.92 || S.health < 0.35)) {
            if (Math.random() < dt * 0.02) {
                S.sick = true;
                setBanner('Thermal instability! Needs Meds');
                syncActionButtons();
                scheduleSave();
            }
        }
        if (S.sick) {
            S.health = clamp(S.health - dt * 0.01, 0, 1);
            S.happy = clamp(S.happy - dt * 0.008, 0, 1);
        }

        // Care mistakes / death
        if (S.hunger >= 1) {
            S.happy = clamp(S.happy - dt * 0.02, 0, 1);
            if (Math.random() < dt * 0.05) S.careMistakes += 1;
        }
        if (S.careMistakes >= 8 || S.health <= 0) {
            killPet(S, false);
            saveState();
            return;
        }

        // Food physics + eating
        updateFood(dt);

        // AI / state machine
        S.stateTimer -= dt;
        // Prefer eating over idle sickness posing
        if ((S.sleeping || !S.lightsOn) && S.state !== 'seek' && S.state !== 'eat') {
            S.state = 'sleep';
            fx.bob = Math.sin(fx.frame * 1.5) * 0.005;
            if (Math.random() < dt * 0.7) {
                fx.zzz.push({ x: S.x + 0.05, y: 0.48, vy: -0.04, life: 1.3, age: 0 });
            }
        } else if (S.state === 'seek' && S.targetX != null) {
            const food = nearestFood();
            if (food) S.targetX = food.x;
            const dir = S.targetX >= S.x ? 1 : -1;
            S.facing = dir;
            S.x = clamp(S.x + dir * dt * 0.28, 0.12, 0.88);
            fx.bob = Math.sin(fx.frame * 12) * 0.012;
            if (food && Math.abs(S.x - food.x) < 0.045 && food.settled) {
                food.eaten = true;
                S.state = 'eat';
                S.stateTimer = 1.15;
                S.hunger = clamp(S.hunger - 0.32, 0, 1);
                S.happy = clamp(S.happy + 0.08, 0, 1);
                S.weight = clamp(S.weight + 0.4, 3, 30);
                S.feedCount += 1;
                setBanner('Fuel accreted!');
                scheduleSave();
            } else if (!food || S.stateTimer <= 0) {
                S.state = 'idle';
                S.stateTimer = 1;
                S.targetX = null;
            }
        } else if (S.sick && S.state !== 'eat' && S.state !== 'train' && S.state !== 'happy') {
            S.state = 'sick';
            fx.bob = Math.sin(fx.frame * 3) * 0.004;
        } else if (S.state === 'eat') {
            fx.bob = Math.sin(fx.frame * 18) * 0.01;
            if (S.stateTimer <= 0) {
                S.food = S.food.filter((f) => !f.eaten);
                S.state = 'idle';
                S.stateTimer = 1;
                S.targetX = null;
                syncMeters();
            }
        } else if (S.state === 'happy') {
            fx.bob = Math.abs(Math.sin(fx.frame * 14)) * 0.035;
            if (S.stateTimer <= 0) { S.state = 'idle'; S.stateTimer = 1.2; }
        } else if (S.state === 'train') {
            fx.bob = Math.sin(fx.frame * 20) * 0.02;
            if (S.stateTimer <= 0) { S.state = 'idle'; S.stateTimer = 1; }
        } else if (S.state === 'hatch') {
            fx.bob = Math.sin(fx.frame * 10) * 0.02;
            if (S.stateTimer <= 0) { S.state = 'happy'; S.stateTimer = 1; spawnHearts(4); }
        } else if (S.state === 'walk') {
            S.x = clamp(S.x + S.facing * dt * 0.1, 0.12, 0.88);
            if (S.x <= 0.12 || S.x >= 0.88) S.facing *= -1;
            fx.bob = Math.sin(fx.frame * 10) * 0.01;
            if (S.stateTimer <= 0) pickIdleBehavior();
        } else {
            fx.bob = Math.sin(fx.frame * 2) * 0.006;
            if (S.stateTimer <= 0) pickIdleBehavior();
        }

        // Periodic UI refresh
        if (Math.floor(fx.frame * 2) !== Math.floor((fx.frame - dt) * 2)) {
            syncMeters();
            syncActionButtons();
            if (fx.messageTimer <= 0 && statusEl) statusEl.textContent = statusLine();
        }

        // Autosave every ~5s while the panel is open
        saveAccum += dt;
        if (saveAccum >= 5) {
            saveAccum = 0;
            saveState();
        }
    }

    function pickIdleBehavior() {
        const leftover = nearestFood();
        if (leftover && S.lightsOn && !S.sleeping) {
            beginSeekFood();
            return;
        }
        const roll = Math.random();
        if (roll < 0.4) {
            S.state = 'walk';
            S.stateTimer = 1.5 + Math.random() * 2;
            if (Math.random() < 0.4) S.facing *= -1;
        } else {
            S.state = 'idle';
            S.stateTimer = 1.2 + Math.random() * 2.5;
        }
    }

    function updateFood(dt) {
        const landY = FLOOR_Y - 0.02;
        let justSettled = false;
        S.food = (S.food || []).filter((f) => f);
        S.food.forEach((f) => {
            if (f.eaten) return;
            if (!f.settled) {
                f.vy += dt * 2.2;
                f.y += f.vy * dt;
                if (f.y >= landY) {
                    f.y = landY;
                    f.vy = 0;
                    f.settled = true;
                    justSettled = true;
                }
            } else {
                f.y = landY;
            }
            f.life -= dt;
        });
        S.food = S.food.filter((f) => (f.life > 0 && !f.eaten) || (f.eaten && S.state === 'eat'));
        // Once food lands, make sure the pet walks to it
        if (justSettled && S.state !== 'eat' && S.state !== 'sleep' && !S.sleeping && S.lightsOn) {
            beginSeekFood();
        }
    }

    function updateParticles(list, dt, gravity) {
        for (let i = list.length - 1; i >= 0; i--) {
            const p = list[i];
            p.age += dt;
            if (p.vx) p.x += p.vx * dt;
            p.y += (p.vy || 0) * dt;
            if (gravity) p.vy = (p.vy || 0) + dt * 0.5;
            if (p.age >= p.life) list.splice(i, 1);
        }
    }

    // ---------------------------------------------------------------
    // Drawing
    // ---------------------------------------------------------------
    function resizeCanvas() {
        const wrap = canvas.parentElement;
        const cssW = Math.max(wrap.clientWidth, 1);
        const cssH = Math.max(260, Math.min(360, Math.round(cssW * 0.42)));
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.style.width = '100%';
        canvas.style.height = cssH + 'px';
        const drawnW = Math.max(canvas.clientWidth || cssW, 1);
        canvas.width = Math.round(drawnW * dpr);
        canvas.height = Math.round(cssH * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (!w || !h) return;

        drawRoom(w, h);
        S.poops.forEach((p) => drawWindDebris(p.x * w, h * FLOOR_Y));
        S.food.forEach((f) => {
            if (!f.eaten) drawFuelPellet(f.x * w, f.y * h, 1);
        });
        if (S.alive) drawCreature(w, h);
        else drawGhost(w, h);

        // FX
        fx.hearts.forEach((p) => {
            ctx.save();
            ctx.globalAlpha = 1 - p.age / p.life;
            ctx.fillStyle = '#ffb347';
            drawHeart(p.x * w, p.y * h, 8);
            ctx.restore();
        });
        fx.sparks.forEach((p) => {
            ctx.save();
            ctx.globalAlpha = 1 - p.age / p.life;
            ctx.fillStyle = '#f5c842';
            ctx.fillRect(p.x * w, p.y * h, 3, 3);
            ctx.restore();
        });
        fx.zzz.forEach((p) => {
            ctx.save();
            ctx.globalAlpha = (1 - p.age / p.life) * 0.85;
            ctx.fillStyle = '#6b8a9a';
            ctx.font = `${11 + p.age * 7}px sans-serif`;
            ctx.fillText('z', p.x * w + p.age * 10, p.y * h);
            ctx.restore();
        });

        if (fx.evolveFlash > 0) {
            ctx.save();
            ctx.globalAlpha = Math.min(0.7, fx.evolveFlash);
            ctx.fillStyle = '#fff8e0';
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }

        if (S.sick && S.alive) {
            ctx.fillStyle = 'rgba(255, 180, 80, 0.85)';
            ctx.font = '14px sans-serif';
            ctx.fillText('!', S.x * w + 18, h * 0.55);
        }
    }

    function drawRoom(w, h) {
        const night = !S.lightsOn;
        const floorY = h * FLOOR_Y;

        // Observatory wall: deep space with faint stars
        ctx.fillStyle = night ? '#0b1220' : '#152238';
        ctx.fillRect(0, 0, w, floorY);
        ctx.fillStyle = night ? 'rgba(255,255,255,0.85)' : 'rgba(200,220,255,0.55)';
        for (let i = 0; i < 40; i++) {
            const sx = ((i * 97) % 200) / 200 * w;
            const sy = ((i * 53) % 180) / 180 * (floorY - 8);
            ctx.beginPath();
            ctx.arc(sx, sy, (i % 3 === 0) ? 1.4 : 0.8, 0, Math.PI * 2);
            ctx.fill();
        }

        // Dome window arc
        ctx.strokeStyle = night ? 'rgba(120,160,200,0.35)' : 'rgba(160,200,240,0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(w * 0.72, floorY + 20, h * 0.42, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();

        // Desk floor
        ctx.fillStyle = night ? '#3d3228' : '#c4a882';
        ctx.fillRect(0, floorY, w, h - floorY);
        ctx.fillStyle = night ? '#2f271f' : '#b08968';
        ctx.fillRect(0, floorY, w, 4);

        drawTelescope(w * 0.14, floorY);
        drawMug(w * 0.88, floorY);
    }

    function drawTelescope(px, py) {
        ctx.strokeStyle = '#8a9bb0';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        // tripod
        ctx.beginPath();
        ctx.moveTo(px, py - 2);
        ctx.lineTo(px - 14, py - 28);
        ctx.moveTo(px, py - 2);
        ctx.lineTo(px + 14, py - 28);
        ctx.moveTo(px, py - 2);
        ctx.lineTo(px, py - 36);
        ctx.stroke();
        // tube
        ctx.fillStyle = '#6b7c90';
        ctx.save();
        ctx.translate(px + 2, py - 40);
        ctx.rotate(-0.5);
        roundRect(-6, -22, 12, 36, 3);
        ctx.fill();
        ctx.fillStyle = '#9eb0c4';
        ctx.beginPath();
        ctx.arc(0, -22, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawMug(mx, py) {
        ctx.fillStyle = '#f7fbff';
        roundRect(mx - 10, py - 24, 18, 18, 3);
        ctx.fill();
        ctx.strokeStyle = '#c5d3de';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(mx + 10, py - 15, 6, -Math.PI * 0.55, Math.PI * 0.55);
        ctx.stroke();
        ctx.fillStyle = 'rgba(120, 78, 45, 0.55)';
        roundRect(mx - 7, py - 20, 12, 5, 2);
        ctx.fill();
    }

    function drawWindDebris(x, y) {
        // Stellar-wind / ejecta clumps
        ctx.fillStyle = 'rgba(180, 160, 220, 0.75)';
        ctx.beginPath(); ctx.ellipse(x, y - 6, 9, 6, 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(140, 190, 255, 0.55)';
        ctx.beginPath(); ctx.ellipse(x - 5, y - 12, 6, 5, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath(); ctx.arc(x + 3, y - 14, 1.4, 0, Math.PI * 2); ctx.fill();
    }

    function drawFuelPellet(x, y, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        // Frozen hydrogen / ice pellet
        const g = ctx.createRadialGradient(-3, -3, 1, 0, 0, 12);
        g.addColorStop(0, '#e8f7ff');
        g.addColorStop(0.5, '#7ec8f0');
        g.addColorStop(1, '#3a7eb8');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(0, 0, 11, 9, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.ellipse(-3, -3, 3, 2, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#dfefff';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('H', -4, 3);
        ctx.restore();
    }

    function drawCreature(w, h) {
        const floorY = h * FLOOR_Y;
        const px = S.x * w;
        const py = floorY - 6 + fx.bob * h;
        const s = Math.min(w, h) * (S.form === 'egg' ? 0.11 : S.form.startsWith('champ') ? 0.15 : 0.125);

        ctx.save();
        ctx.translate(px, py);
        ctx.scale(S.facing, 1);

        ctx.fillStyle = 'rgba(20, 30, 50, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 4, s * 0.75, s * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();

        switch (S.form) {
            case 'egg': drawEgg(s); break;
            case 'fresh': drawFresh(s); break;
            case 'training': drawTraining(s); break;
            case 'rookie_fire': drawRookieFire(s); break;
            case 'rookie_fluff': drawRookieFluff(s); break;
            case 'rookie_junk': drawRookieJunk(s); break;
            case 'champ_fire': drawChampFire(s); break;
            case 'champ_fluff': drawChampFluff(s); break;
            case 'champ_junk': drawChampJunk(s); break;
            default: drawFresh(s);
        }

        ctx.restore();
    }

    function face(s, eyeY, opts) {
        opts = opts || {};
        const sleeping = S.sleeping || !S.lightsOn;
        const eyeOpen = sleeping || fx.blink > 0 ? 0.08 : 1;
        ctx.fillStyle = '#0e1a28';
        if (sleeping) {
            ctx.strokeStyle = '#0e1a28';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(-s * 0.28, eyeY, s * 0.12, 0.15, Math.PI - 0.15); ctx.stroke();
            ctx.beginPath(); ctx.arc(s * 0.28, eyeY, s * 0.12, 0.15, Math.PI - 0.15); ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.ellipse(-s * 0.28, eyeY, s * 0.12, s * 0.15 * eyeOpen, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(s * 0.28, eyeY, s * 0.12, s * 0.15 * eyeOpen, 0, 0, Math.PI * 2);
            ctx.fill();
            if (eyeOpen > 0.5) {
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(-s * 0.25, eyeY - s * 0.04, s * 0.04, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(s * 0.31, eyeY - s * 0.04, s * 0.04, 0, Math.PI * 2); ctx.fill();
            }
        }
        ctx.strokeStyle = '#0e1a28';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (S.state === 'eat') {
            ctx.fillStyle = '#0e1a28';
            ctx.beginPath();
            ctx.ellipse(0, eyeY + s * 0.32, s * 0.16, s * 0.14, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (S.state === 'happy' || S.state === 'train') {
            ctx.arc(0, eyeY + s * 0.28, s * 0.16, 0.15, Math.PI - 0.15);
            ctx.stroke();
        } else if (S.sick) {
            ctx.moveTo(-s * 0.08, eyeY + s * 0.3);
            ctx.lineTo(s * 0.08, eyeY + s * 0.3);
            ctx.stroke();
        } else if (sleeping) {
            ctx.moveTo(-s * 0.06, eyeY + s * 0.28);
            ctx.lineTo(s * 0.06, eyeY + s * 0.28);
            ctx.stroke();
        } else {
            ctx.arc(0, eyeY + s * 0.26, s * 0.1, 0.2, Math.PI - 0.2);
            ctx.stroke();
        }
    }

    function drawEgg(s) {
        // Dusty molecular-cloud core
        const shake = S.age > 20 ? Math.sin(fx.frame * 8) * 0.06 : 0;
        ctx.rotate(shake);
        const g = ctx.createRadialGradient(0, -s * 0.5, s * 0.1, 0, -s * 0.4, s);
        g.addColorStop(0, '#5a4a78');
        g.addColorStop(0.55, '#2a2040');
        g.addColorStop(1, 'rgba(20,16,32,0.2)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.45, s * 0.95, s * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 200, 140, 0.35)';
        ctx.beginPath();
        ctx.arc(0, -s * 0.45, s * 0.22, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawFresh(s) {
        // Protostar: glowing orange core + dusty envelope
        ctx.fillStyle = 'rgba(120, 90, 160, 0.35)';
        ctx.beginPath(); ctx.ellipse(0, -s * 0.5, s * 1.05, s * 0.7, 0, 0, Math.PI * 2); ctx.fill();
        const g = ctx.createRadialGradient(-s * 0.1, -s * 0.6, s * 0.05, 0, -s * 0.45, s * 0.7);
        g.addColorStop(0, '#ffe6a0');
        g.addColorStop(0.45, '#f0953a');
        g.addColorStop(1, '#a04020');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(0, -s * 0.5, s * 0.7, s * 0.65, 0, 0, Math.PI * 2); ctx.fill();
        face(s, -s * 0.55);
    }

    function drawTraining(s) {
        // T Tauri: star + bipolar jets
        const g = ctx.createRadialGradient(0, -s * 0.5, s * 0.1, 0, -s * 0.45, s * 0.75);
        g.addColorStop(0, '#fff0c8');
        g.addColorStop(1, '#e87830');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(0, -s * 0.5, s * 0.72, s * 0.68, 0, 0, Math.PI * 2); ctx.fill();
        // jets
        ctx.strokeStyle = 'rgba(120, 200, 255, 0.75)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -s * 1.15);
        ctx.lineTo(0, -s * 1.55);
        ctx.moveTo(0, s * 0.05);
        ctx.lineTo(0, s * 0.45);
        ctx.stroke();
        ctx.fillStyle = 'rgba(120, 200, 255, 0.5)';
        ctx.beginPath(); ctx.arc(0, -s * 1.58, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, s * 0.48, 4, 0, Math.PI * 2); ctx.fill();
        face(s, -s * 0.55);
    }

    function drawStarBody(s, c0, c1, rayColor, rays) {
        if (rays) {
            ctx.strokeStyle = rayColor;
            ctx.lineWidth = 2;
            for (let i = 0; i < rays; i++) {
                const a = (Math.PI * 2 * i) / rays + fx.frame * 0.15;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * s * 0.75, -s * 0.5 + Math.sin(a) * s * 0.75);
                ctx.lineTo(Math.cos(a) * s * 1.15, -s * 0.5 + Math.sin(a) * s * 1.15);
                ctx.stroke();
            }
        }
        const g = ctx.createRadialGradient(-s * 0.15, -s * 0.65, s * 0.08, 0, -s * 0.45, s * 0.85);
        g.addColorStop(0, c0);
        g.addColorStop(1, c1);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.5, s * 0.78, s * 0.78, 0, 0, Math.PI * 2);
        ctx.fill();
        face(s, -s * 0.55);
    }

    function drawRookieFire(s) {
        // Hot massive blue MS star
        drawStarBody(s, '#e8f4ff', '#4a7dff', 'rgba(120,170,255,0.55)', 10);
    }

    function drawRookieFluff(s) {
        // Sun-like G dwarf
        drawStarBody(s, '#fff4c0', '#f0a020', 'rgba(255,200,80,0.5)', 12);
    }

    function drawRookieJunk(s) {
        // Cool red dwarf
        drawStarBody(s, '#ffb0a0', '#c04030', 'rgba(255,100,80,0.35)', 8);
    }

    function drawChampFire(s) {
        // Black hole + accretion disk
        ctx.strokeStyle = 'rgba(255, 180, 80, 0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.45, s * 1.15, s * 0.32, -0.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 120, 60, 0.45)';
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.45, s * 0.85, s * 0.22, -0.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#05060a';
        ctx.beginPath();
        ctx.arc(0, -s * 0.45, s * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -s * 0.45, s * 0.42, 0, Math.PI * 2);
        ctx.stroke();
        // tiny face glow on photon ring joke
        face(s * 0.85, -s * 0.5);
    }

    function drawChampFluff(s) {
        // Red giant: large puffy envelope
        const g = ctx.createRadialGradient(0, -s * 0.45, s * 0.2, 0, -s * 0.4, s * 1.2);
        g.addColorStop(0, '#ffd0a0');
        g.addColorStop(0.4, '#e06030');
        g.addColorStop(1, 'rgba(160,40,20,0.35)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.45, s * 1.15, s * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();
        face(s * 1.05, -s * 0.5);
    }

    function drawChampJunk(s) {
        // White dwarf: compact hot ember
        const g = ctx.createRadialGradient(0, -s * 0.5, s * 0.05, 0, -s * 0.5, s * 0.55);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.5, '#d0e8ff');
        g.addColorStop(1, '#8090c0');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, -s * 0.5, s * 0.48, 0, Math.PI * 2);
        ctx.fill();
        face(s * 0.75, -s * 0.52);
    }

    function drawGhost(w, h) {
        const px = w * 0.5;
        const py = h * 0.52 + Math.sin(fx.frame * 2) * 6;
        ctx.save();
        ctx.globalAlpha = 0.5;
        // Faded remnant / empty event silhouette
        ctx.strokeStyle = 'rgba(180,200,255,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(px, py, 48, 14, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(200,220,255,0.35)';
        ctx.font = '12px sans-serif';
        ctx.fillText('no signal', px - 28, py + 4);
        ctx.restore();
    }

    function drawHeart(x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y + size * 0.3);
        ctx.bezierCurveTo(x, y, x - size, y, x - size, y + size * 0.3);
        ctx.bezierCurveTo(x - size, y + size * 0.7, x, y + size, x, y + size);
        ctx.bezierCurveTo(x, y + size, x + size, y + size * 0.7, x + size, y + size * 0.3);
        ctx.bezierCurveTo(x + size, y, x, y, x, y + size * 0.3);
        ctx.fill();
    }

    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
});
