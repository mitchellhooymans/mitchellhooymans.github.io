/**
 * Hidden Hero Blackboard Easter Egg
 * -----------------------------------
 * Triggered via the shared combo router (js/hero-combos.js):
 *   PhD x1  ->  OzGrav x2  ->  Computational Astrophysics x1
 * ...and the hero card transforms into a chalk blackboard you can draw on.
 * A random celestial outline (star, crescent moon, Saturn, or sun) is
 * pre-sketched lightly so you can trace or freestyle over it.
 */

document.addEventListener('DOMContentLoaded', () => {
    const glassCard = document.getElementById('hero-glass-card');
    const boardPanel = document.getElementById('hero-blackboard');

    if (!glassCard || !boardPanel) return;

    const profileFrame = glassCard.querySelector('.profile-frame');
    const heroContent = glassCard.querySelector('.hero-content-glass');
    const canvas = document.getElementById('blackboard-canvas');
    const closeBtn = document.getElementById('blackboard-close');
    const clearBtn = document.getElementById('blackboard-clear');
    const colorBtns = boardPanel.querySelectorAll('[data-chalk]');
    const presetBtns = boardPanel.querySelectorAll('[data-preset]');
    const ctx = canvas.getContext('2d');

    const BOARD_COLOR = '#1a3a2a';
    const GUIDE_COLOR = 'rgba(232, 240, 230, 0.28)';
    const CHALK_COLORS = {
        white: '#f4f7f2',
        yellow: '#f5e6a3',
        blue: '#a8d4ef',
        pink: '#f0b8c8',
        eraser: BOARD_COLOR,
    };

    let boardActive = false;
    let drawing = false;
    let currentColor = 'white';
    let currentShape = 'star';
    let guideVisible = false;
    let lastX = 0;
    let lastY = 0;

    const SHAPES = ['star', 'crescent', 'saturn', 'sun'];

    document.addEventListener('hero-combo:blackboard', activateBoard);
    closeBtn.addEventListener('click', deactivateBoard);
    clearBtn.addEventListener('click', () => {
        guideVisible = false;
        syncPresetButtons();
        paintBoard();
    });

    colorBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            currentColor = btn.getAttribute('data-chalk');
            colorBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
            canvas.style.cursor = currentColor === 'eraser' ? 'cell' : 'crosshair';
        });
    });

    presetBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const shape = btn.getAttribute('data-preset');
            if (!SHAPES.includes(shape)) return;
            currentShape = shape;
            guideVisible = true;
            syncPresetButtons();
            paintBoard();
            drawGuide(currentShape);
        });
    });

    function syncPresetButtons() {
        presetBtns.forEach((btn) => {
            const active = guideVisible && btn.getAttribute('data-preset') === currentShape;
            btn.classList.toggle('is-active', active);
        });
    }

    // ---------------------------------------------------------------
    // Activate / deactivate
    // ---------------------------------------------------------------
    function activateBoard() {
        if (boardActive) return;
        if (window.HeroCombos && window.HeroCombos.isOverlayActive()) return;
        boardActive = true;
        if (window.HeroCombos) window.HeroCombos.setOverlayActive(true);

        currentShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        guideVisible = true;
        syncPresetButtons();

        glassCard.classList.add('terminal-flash');
        setTimeout(() => glassCard.classList.remove('terminal-flash'), 550);

        setTimeout(() => {
            if (profileFrame) profileFrame.classList.add('hero-fade-out');
            if (heroContent) heroContent.classList.add('hero-fade-out');

            boardPanel.style.display = 'block';
            boardPanel.setAttribute('aria-hidden', 'false');
            requestAnimationFrame(() => {
                requestAnimationFrame(() => boardPanel.classList.add('blackboard-visible'));
            });

            // Wait until hero siblings leave the flex layout so the canvas
            // measures at full card width before painting the guide.
            setTimeout(() => {
                if (!boardActive) return;
                if (profileFrame) profileFrame.style.display = 'none';
                if (heroContent) heroContent.style.display = 'none';
                requestAnimationFrame(() => {
                    resizeCanvas();
                    paintBoard();
                    if (guideVisible) drawGuide(currentShape);
                });
            }, 360);
        }, 150);

        document.addEventListener('keydown', onGlobalKeydown);
        window.addEventListener('resize', onResize);
    }

    function deactivateBoard() {
        if (!boardActive) return;
        boardActive = false;
        drawing = false;
        if (window.HeroCombos) window.HeroCombos.setOverlayActive(false);

        document.removeEventListener('keydown', onGlobalKeydown);
        window.removeEventListener('resize', onResize);

        boardPanel.classList.remove('blackboard-visible');
        setTimeout(() => {
            boardPanel.style.display = 'none';
            boardPanel.setAttribute('aria-hidden', 'true');
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
        if (e.key === 'Escape') deactivateBoard();
    }

    function onResize() {
        if (!boardActive) return;
        // Canvas resize clears content; restore board (+ guide if still on)
        resizeCanvas();
        paintBoard();
        if (guideVisible) drawGuide(currentShape);
    }

    // ---------------------------------------------------------------
    // Canvas setup
    // ---------------------------------------------------------------
    function resizeCanvas() {
        const wrap = canvas.parentElement;
        const cssW = Math.max(wrap.clientWidth, 1);
        const cssH = Math.max(280, Math.min(420, Math.round(cssW * 0.55)));
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.style.width = '100%';
        canvas.style.height = cssH + 'px';
        // Re-read after applying CSS so we match the laid-out width.
        const drawnW = Math.max(canvas.clientWidth || cssW, 1);
        canvas.width = Math.round(drawnW * dpr);
        canvas.height = Math.round(cssH * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function paintBoard() {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        ctx.fillStyle = BOARD_COLOR;
        ctx.fillRect(0, 0, w, h);

        // Subtle chalk-dust / grain texture
        ctx.save();
        ctx.globalAlpha = 0.04;
        for (let i = 0; i < 180; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            const s = Math.random() * 1.5 + 0.3;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, y, s, s);
        }
        ctx.restore();
    }

    // ---------------------------------------------------------------
    // Predrawn celestial guides
    // ---------------------------------------------------------------
    function drawGuide(shape) {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const cx = w / 2;
        const cy = h / 2;
        const r = Math.min(w, h) * 0.28;

        ctx.save();
        ctx.strokeStyle = GUIDE_COLOR;
        ctx.fillStyle = GUIDE_COLOR;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([6, 8]);

        switch (shape) {
            case 'star':
                drawStar(cx, cy, r, r * 0.42, 5);
                break;
            case 'crescent':
                drawCrescent(cx, cy, r);
                break;
            case 'saturn':
                drawSaturn(cx, cy, r);
                break;
            case 'sun':
                drawSun(cx, cy, r * 0.72);
                break;
        }

        ctx.restore();
    }

    function drawStar(cx, cy, outerR, innerR, points) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const angle = (Math.PI / points) * i - Math.PI / 2;
            const rad = i % 2 === 0 ? outerR : innerR;
            const x = cx + Math.cos(angle) * rad;
            const y = cy + Math.sin(angle) * rad;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }

    function drawCrescent(cx, cy, r) {
        // Equal-radius crescent as an explicit tip-to-tip polyline so the
        // dashed stroke meets cleanly at both horns.
        const d = r * 0.62;
        const alpha = Math.acos(clamp(d / (2 * r), -1, 1));
        const steps = 48;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-0.28);

        ctx.beginPath();

        // Outer bulge along the left circle (long way through the left).
        for (let i = 0; i <= steps; i++) {
            // Sweep clockwise from +alpha to -alpha through π
            const t = i / steps;
            const ang = alpha + t * (2 * Math.PI - 2 * alpha);
            const x = -d / 2 + Math.cos(ang) * r;
            const y = Math.sin(ang) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }

        // Inner bite along the right circle (short way through π).
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            // From π+alpha down to π-alpha through π
            const ang = Math.PI + alpha - t * (2 * alpha);
            const x = d / 2 + Math.cos(ang) * r;
            const y = Math.sin(ang) * r;
            ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    function clamp(n, lo, hi) {
        return Math.min(hi, Math.max(lo, n));
    }

    function drawSaturn(cx, cy, r) {
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(cx, cy + r * 0.02, r * 1.05, r * 0.28, -0.18, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(cx, cy + r * 0.02, r * 0.82, r * 0.18, -0.18, 0, Math.PI * 2);
        ctx.stroke();
    }

    function drawSun(cx, cy, r) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        const rays = 12;
        for (let i = 0; i < rays; i++) {
            const angle = (Math.PI * 2 * i) / rays;
            const inner = r + 10;
            const outer = r + 28;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
            ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
            ctx.stroke();
        }
    }

    // ---------------------------------------------------------------
    // Freehand drawing
    // ---------------------------------------------------------------
    function pointerPos(e) {
        const rect = canvas.getBoundingClientRect();
        const src = e.touches && e.touches[0] ? e.touches[0] : e;
        return {
            x: src.clientX - rect.left,
            y: src.clientY - rect.top,
        };
    }

    function startDraw(e) {
        if (!boardActive) return;
        e.preventDefault();
        drawing = true;
        const p = pointerPos(e);
        lastX = p.x;
        lastY = p.y;
        // Dot for single taps
        strokeTo(p.x, p.y, true);
    }

    function moveDraw(e) {
        if (!drawing) return;
        e.preventDefault();
        const p = pointerPos(e);
        strokeTo(p.x, p.y, false);
        lastX = p.x;
        lastY = p.y;
    }

    function endDraw() {
        drawing = false;
    }

    function strokeTo(x, y, isDot) {
        const isEraser = currentColor === 'eraser';
        ctx.save();
        ctx.setLineDash([]);
        ctx.strokeStyle = CHALK_COLORS[currentColor] || CHALK_COLORS.white;
        ctx.fillStyle = ctx.strokeStyle;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = isEraser ? 18 : 3.2;
        ctx.globalAlpha = isEraser ? 1 : 0.92;

        if (isDot) {
            ctx.beginPath();
            ctx.arc(x, y, ctx.lineWidth / 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Slight jitter for chalky feel
            const jx = (Math.random() - 0.5) * 0.6;
            const jy = (Math.random() - 0.5) * 0.6;
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x + jx, y + jy);
            ctx.stroke();
        }
        ctx.restore();
    }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', endDraw);

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', moveDraw, { passive: false });
    canvas.addEventListener('touchend', endDraw);
    canvas.addEventListener('touchcancel', endDraw);
});
