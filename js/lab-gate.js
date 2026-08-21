/* Login overlay for unlisted science-lab pages. Requires js/lab-auth.js. */
(function () {
    if (typeof LabAuth === 'undefined') return;

    const SCRIPT_SRC = document.currentScript && document.currentScript.src;
    const STYLE_ID = 'lab-gate-style';
    const CSS = [
        'html.lab-locked body > *:not(#lab-gate) { visibility: hidden !important; pointer-events: none !important; }',
        '#lab-gate { visibility: visible !important; pointer-events: auto !important; position: fixed; inset: 0; z-index: 100000;',
        'display: flex; align-items: center; justify-content: center; padding: 1.5rem;',
        'background: radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.12), transparent 50%), #020617;',
        'font-family: Inter, system-ui, sans-serif; color: #e2e8f0; }',
        '#lab-gate .lab-gate-card { width: min(420px, 100%); background: rgba(15, 23, 42, 0.92); border: 1px solid rgba(255,255,255,0.1);',
        'border-radius: 18px; padding: 1.75rem 1.6rem 1.5rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.65); }',
        '#lab-gate h1 { font-family: "Space Grotesk", Inter, sans-serif; font-size: 1.35rem; margin: 0 0 0.4rem; color: #fff; }',
        '#lab-gate p { margin: 0 0 1.15rem; color: #94a3b8; font-size: 0.9rem; line-height: 1.45; }',
        '#lab-gate label { display: block; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;',
        'color: #94a3b8; margin-bottom: 0.35rem; }',
        '#lab-gate .lab-gate-field { margin-bottom: 0.85rem; }',
        '#lab-gate input { width: 100%; box-sizing: border-box; background: rgba(2, 6, 23, 0.7); border: 1px solid rgba(148,163,184,0.28);',
        'border-radius: 10px; color: #e2e8f0; padding: 0.65rem 0.8rem; font-size: 0.95rem; font-family: inherit; }',
        '#lab-gate input:focus { outline: none; border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56,189,248,0.18); }',
        '#lab-gate button[type="submit"] { width: 100%; margin-top: 0.35rem; border: 0; border-radius: 10px; padding: 0.7rem 1rem;',
        'background: #38bdf8; color: #0f172a; font-weight: 700; cursor: pointer; font-size: 0.95rem; }',
        '#lab-gate button[type="submit"]:disabled { opacity: 0.6; cursor: wait; }',
        '#lab-gate .lab-gate-status { min-height: 1.2rem; margin: 0.7rem 0 0; font-size: 0.82rem; font-family: ui-monospace, monospace; }',
        '#lab-gate .lab-gate-status.is-error { color: #f87171; }',
        '#lab-gate .lab-gate-status.is-ok { color: #4ade80; }',
        '#lab-gate .lab-gate-home { display: inline-block; margin-top: 0.9rem; color: #7dd3fc; font-size: 0.82rem; text-decoration: none; }'
    ].join('\n');

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = CSS;
        (document.head || document.documentElement).appendChild(style);
    }

    function homeHref() {
        if (SCRIPT_SRC) {
            try {
                return new URL('../index.html', SCRIPT_SRC).href;
            } catch (err) { /* fall through */ }
        }
        return '/';
    }

    function unlock() {
        document.documentElement.classList.remove('lab-locked');
        const gate = document.getElementById('lab-gate');
        if (gate) gate.remove();
        document.dispatchEvent(new Event('lab-auth:granted'));
    }

    function showGate() {
        document.documentElement.classList.add('lab-locked');
        injectStyle();

        const mount = function () {
            if (document.getElementById('lab-gate')) return;
            if (!document.body) {
                document.addEventListener('DOMContentLoaded', mount);
                return;
            }

            const overlay = document.createElement('div');
            overlay.id = 'lab-gate';
            overlay.innerHTML =
                '<div class="lab-gate-card">' +
                '<h1>Restricted lab</h1>' +
                '<p>This section is private. Sign in with your site credentials to continue.</p>' +
                '<form id="lab-gate-form" autocomplete="username">' +
                '<div class="lab-gate-field"><label for="lab-gate-user">Username</label>' +
                '<input id="lab-gate-user" name="username" type="text" autocapitalize="none" autocomplete="username" required></div>' +
                '<div class="lab-gate-field"><label for="lab-gate-pass">Password</label>' +
                '<input id="lab-gate-pass" name="password" type="password" autocomplete="current-password" required></div>' +
                '<button type="submit">Sign in</button>' +
                '</form>' +
                '<p class="lab-gate-status" id="lab-gate-status"></p>' +
                '<a class="lab-gate-home" href="' + homeHref() + '">Return to the public site</a>' +
                '</div>';
            document.body.appendChild(overlay);

            const form = document.getElementById('lab-gate-form');
            const status = document.getElementById('lab-gate-status');
            const userEl = document.getElementById('lab-gate-user');
            const passEl = document.getElementById('lab-gate-pass');
            const submit = form.querySelector('button[type="submit"]');

            form.addEventListener('submit', async function (evt) {
                evt.preventDefault();
                status.className = 'lab-gate-status';
                status.textContent = 'Authenticating...';
                submit.disabled = true;
                try {
                    const ok = await LabAuth.login(userEl.value, passEl.value);
                    if (ok) {
                        status.className = 'lab-gate-status is-ok';
                        status.textContent = 'Access granted.';
                        setTimeout(unlock, 250);
                    } else {
                        status.className = 'lab-gate-status is-error';
                        status.textContent = 'Access denied: invalid credentials.';
                        passEl.value = '';
                        passEl.focus();
                    }
                } catch (err) {
                    status.className = 'lab-gate-status is-error';
                    status.textContent = err.message || 'Authentication failed.';
                } finally {
                    submit.disabled = false;
                }
            });

            userEl.focus();
        };

        mount();
    }

    document.addEventListener('click', function (evt) {
        const btn = evt.target.closest('[data-lab-logout]');
        if (!btn) return;
        evt.preventDefault();
        LabAuth.logout();
        window.location.reload();
    });

    if (LabAuth.isAuthed()) {
        document.documentElement.classList.remove('lab-locked');
    } else {
        showGate();
    }
})();
