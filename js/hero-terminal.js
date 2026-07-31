/**
 * Hidden Hero Terminal Easter Egg
 * ---------------------------------
 * Click the three hero badges in the secret combo:
 *   OzGrav x2  ->  PhD x1  ->  Computational Astrophysics x3
 * ...and the hero card transforms into an interactive terminal.
 */

document.addEventListener('DOMContentLoaded', () => {
    const glassCard = document.getElementById('hero-glass-card');
    const chips = document.querySelectorAll('#hero-stats .stat-chip[data-chip]');
    const terminalPanel = document.getElementById('hero-terminal');

    if (!glassCard || !chips.length || !terminalPanel) return;

    const profileFrame = glassCard.querySelector('.profile-frame');
    const heroContent = glassCard.querySelector('.hero-content-glass');
    const terminalBody = document.getElementById('terminal-body');
    const hiddenInput = document.getElementById('terminal-hidden-input');
    const inputDisplay = document.getElementById('terminal-input-text');
    const closeBtn = document.getElementById('terminal-close');
    const terminalWindow = terminalPanel.querySelector('.terminal-window');
    const promptEl = document.getElementById('terminal-prompt');

    // ---------------------------------------------------------------
    // Secret combo detection
    // ---------------------------------------------------------------
    const COMBO = ['ozgrav', 'ozgrav', 'phd', 'comp', 'comp', 'comp'];
    let progress = 0;
    let comboResetTimer = null;
    let terminalActive = false;

    chips.forEach((chip) => {
        chip.addEventListener('click', () => handleChipInput(chip));
        chip.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleChipInput(chip);
            }
        });
    });

    function handleChipInput(chip) {
        if (terminalActive) return;

        // Tactile click feedback
        chip.classList.remove('chip-pressed');
        void chip.offsetWidth; // restart animation
        chip.classList.add('chip-pressed');

        const key = chip.getAttribute('data-chip');

        clearTimeout(comboResetTimer);
        comboResetTimer = setTimeout(() => { progress = 0; }, 3500);

        if (key === COMBO[progress]) {
            progress++;
            if (progress === COMBO.length) {
                progress = 0;
                clearTimeout(comboResetTimer);
                activateTerminal();
            }
        } else {
            progress = key === COMBO[0] ? 1 : 0;
        }
    }

    // ---------------------------------------------------------------
    // Activate / deactivate the terminal
    // ---------------------------------------------------------------
    function activateTerminal() {
        if (terminalActive) return;
        terminalActive = true;

        glassCard.classList.add('terminal-flash');
        setTimeout(() => glassCard.classList.remove('terminal-flash'), 550);

        setTimeout(() => {
            if (profileFrame) profileFrame.classList.add('hero-fade-out');
            if (heroContent) heroContent.classList.add('hero-fade-out');

            setTimeout(() => {
                if (profileFrame) profileFrame.style.display = 'none';
                if (heroContent) heroContent.style.display = 'none';
            }, 350);

            terminalPanel.style.display = 'block';
            terminalPanel.setAttribute('aria-hidden', 'false');
            requestAnimationFrame(() => {
                requestAnimationFrame(() => terminalPanel.classList.add('terminal-visible'));
            });

            runBootSequence();
        }, 150);

        document.addEventListener('keydown', onGlobalKeydown);
    }

    function deactivateTerminal() {
        if (!terminalActive) return;
        terminalActive = false;

        stopMatrix();
        clearBootTimers();
        document.removeEventListener('keydown', onGlobalKeydown);
        hiddenInput.blur();
        authStage = 'idle';
        resetPrompt();

        terminalPanel.classList.remove('terminal-visible');
        setTimeout(() => {
            terminalPanel.style.display = 'none';
            terminalPanel.setAttribute('aria-hidden', 'true');
            terminalBody.innerHTML = '';
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
        if (e.key === 'Escape') deactivateTerminal();
    }

    closeBtn.addEventListener('click', deactivateTerminal);
    terminalWindow.addEventListener('click', () => focusInput());

    // ---------------------------------------------------------------
    // Terminal output helpers
    // ---------------------------------------------------------------
    function printLine(text, type) {
        const line = document.createElement('div');
        line.className = 'term-line' + (type ? ` term-${type}` : '');
        line.textContent = text;
        terminalBody.appendChild(line);
        scrollToBottom();
        return line;
    }

    function printCommandEcho(cmd) {
        const line = document.createElement('div');
        line.className = 'term-line term-cmd';
        const prompt = document.createElement('span');
        prompt.className = 'term-cmd-prompt';
        prompt.textContent = promptEl.textContent;
        line.appendChild(prompt);
        line.appendChild(document.createTextNode(cmd));
        terminalBody.appendChild(line);
        scrollToBottom();
    }

    function scrollToBottom() {
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    function focusInput() {
        hiddenInput.focus({ preventScroll: true });
    }

    // ---------------------------------------------------------------
    // Boot sequence
    // ---------------------------------------------------------------
    let bootTimers = [];

    function clearBootTimers() {
        bootTimers.forEach((t) => clearTimeout(t));
        bootTimers = [];
    }

    const BOOT_LINES = [
        { text: '[system] Initialising secure shell...', type: 'info', delay: 150 },
        { text: '[ok] Combo accepted: OZGRAV x2 \u2192 PHD x1 \u2192 COMP x3', type: 'success', delay: 350 },
        { text: '[ok] Bypassing mundane portfolio interface...', type: 'info', delay: 300 },
        { text: '[ok] Connecting to OzGrav mainframe... done.', type: 'info', delay: 350 },
        { text: '\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557', type: 'accent', delay: 250 },
        { text: '\u2551   MITCHELL HOOYMANS \u2014 ASTRO SHELL v1.0   \u2551', type: 'accent', delay: 60 },
        { text: '\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d', type: 'accent', delay: 60 },
        { text: "Welcome, Guest. You've discovered the hidden terminal.", type: '', delay: 400 },
        { text: "Type 'help' to see what you can do here.", type: '', delay: 200 },
    ];

    function runBootSequence() {
        terminalBody.innerHTML = '';
        let cumulative = 0;
        BOOT_LINES.forEach((line) => {
            cumulative += line.delay;
            bootTimers.push(setTimeout(() => printLine(line.text, line.type), cumulative));
        });
        bootTimers.push(setTimeout(() => focusInput(), cumulative + 150));
    }

    // ---------------------------------------------------------------
    // Input handling
    // ---------------------------------------------------------------
    let commandHistory = [];
    let historyIndex = 0;

    hiddenInput.addEventListener('input', () => {
        inputDisplay.textContent = authStage === 'password'
            ? '*'.repeat(hiddenInput.value.length)
            : hiddenInput.value;
    });

    hiddenInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const raw = hiddenInput.value;
            hiddenInput.value = '';
            inputDisplay.textContent = '';
            submitCommand(raw);
        } else if (e.key === 'ArrowUp' && authStage === 'idle') {
            e.preventDefault();
            if (commandHistory.length) {
                historyIndex = Math.max(0, historyIndex - 1);
                hiddenInput.value = commandHistory[historyIndex] || '';
                inputDisplay.textContent = hiddenInput.value;
            }
        } else if (e.key === 'ArrowDown' && authStage === 'idle') {
            e.preventDefault();
            if (commandHistory.length) {
                historyIndex = Math.min(commandHistory.length, historyIndex + 1);
                hiddenInput.value = commandHistory[historyIndex] || '';
                inputDisplay.textContent = hiddenInput.value;
            }
        }
    });

    function submitCommand(raw) {
        const trimmed = raw.trim();

        if (authStage === 'username') {
            printCommandEcho(trimmed);
            if (!trimmed || trimmed.toLowerCase() === 'cancel') {
                printLine('Login cancelled.', 'warn');
                resetPrompt();
                return;
            }
            pendingUsername = trimmed;
            authStage = 'password';
            promptEl.textContent = 'Password:';
            return;
        }

        if (authStage === 'password') {
            printCommandEcho(trimmed ? '*'.repeat(trimmed.length) : '(empty)');
            authStage = 'idle';
            if (!trimmed || trimmed.toLowerCase() === 'cancel') {
                printLine('Login cancelled.', 'warn');
                resetPrompt();
                return;
            }
            runAuthentication(pendingUsername, trimmed);
            return;
        }

        printCommandEcho(trimmed);
        if (!trimmed) return;
        commandHistory.push(trimmed);
        historyIndex = commandHistory.length;
        runCommand(trimmed);
    }

    // ---------------------------------------------------------------
    // Secure login flow
    // ---------------------------------------------------------------
    let authStage = 'idle'; // 'idle' | 'username' | 'password'
    let pendingUsername = '';
    let loggedIn = false;
    let loggedInUser = null;
    let isRootUser = false;

    function resetPrompt() {
        authStage = 'idle';
        promptEl.textContent = loggedIn
            ? `${loggedInUser}@mitchellhooymans.com:~${isRootUser ? '#' : '$'}`
            : 'guest@mitchellhooymans.com:~$';
    }

    function startLoginFlow() {
        if (loggedIn) {
            printLine(`Already logged in as ${loggedInUser}. Type 'logout' to sign out.`, 'info');
            return;
        }
        printLine('Initiating secure authentication sequence...', 'info');
        authStage = 'username';
        promptEl.textContent = 'Username:';
    }

    const VALID_USERNAME = 'mitchellhooymans';
    const VALID_PASSWORD = 'astrophysics1!';
    let failedAttempts = 0;

    function runAuthentication(username, password) {
        printLine('Authenticating...', 'info');
        const success = username.toLowerCase() === VALID_USERNAME && password === VALID_PASSWORD;

        const steps = [
            { text: `Verifying credentials for "${username}"...`, delay: 500, type: '' },
            { text: 'Cross-referencing OzGrav clearance database...', delay: 700, type: '' },
        ];

        if (success) {
            steps.push({ text: 'Identity confirmed: Mitchell Hooymans.', delay: 500, type: 'success' });
            steps.push({ text: 'Access granted.', delay: 400, type: 'success' });
        } else {
            steps.push({ text: 'Access denied: invalid credentials.', delay: 500, type: 'error' });
        }

        let cumulative = 0;
        steps.forEach((s) => {
            cumulative += s.delay;
            bootTimers.push(setTimeout(() => printLine(s.text, s.type), cumulative));
        });

        bootTimers.push(setTimeout(() => {
            if (success) {
                completeLogin();
            } else {
                failedAttempts++;
                if (failedAttempts >= 3) {
                    printLine("Still guessing? Type 'login' to try again \u2014 you'll get it eventually.", 'warn');
                } else {
                    printLine("Type 'login' to try again.", 'info');
                }
                resetPrompt();
            }
        }, cumulative + 300));
    }

    function completeLogin() {
        loggedIn = true;
        loggedInUser = VALID_USERNAME;
        isRootUser = true;
        failedAttempts = 0;
        printLine('Welcome, root. You now have elevated access.', 'success');
        printLine("New commands unlocked: 'secrets', 'mainframe', 'logout'.", 'accent');
        resetPrompt();
    }

    function handleLogout() {
        if (!loggedIn) {
            printLine('Not currently logged in.', 'warn');
            return;
        }
        printLine(`Logging out ${loggedInUser}...`, 'info');
        loggedIn = false;
        loggedInUser = null;
        isRootUser = false;
        resetPrompt();
    }

    // ---------------------------------------------------------------
    // Commands
    // ---------------------------------------------------------------
    const PAGE_MAP = {
        about: 'pages/about.html',
        cv: 'pages/cv.html',
        resume: 'pages/cv.html',
        research: 'pages/research.html',
        contact: 'pages/contact.html',
        blog: 'pages/blog.html',
        tools: 'pages/tools.html',
        simulations: 'pages/simulations.html',
        sim: 'pages/simulations.html',
        talks: 'pages/talks.html',
        photography: 'pages/photography.html',
        photos: 'pages/photography.html',
        tutorials: 'pages/tutorials.html',
        resources: 'pages/resources.html',
        home: 'index.html',
    };
    const NAV_SHORTCUTS = new Set([
        'cv', 'resume', 'research', 'contact', 'blog', 'tools', 'simulations',
        'sim', 'talks', 'photography', 'photos', 'tutorials', 'resources', 'home',
    ]);

    function runCommand(cmdStr) {
        const parts = cmdStr.split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        switch (cmd) {
            case 'help':
                printHelp();
                break;
            case 'about':
                printAbout();
                break;
            case 'whoami':
                if (loggedIn) {
                    printLine(`${loggedInUser} \u2014 authenticated ${isRootUser ? '(root access)' : '(guest access)'}.`, '');
                } else {
                    printLine('guest \u2014 curious visitor. Probably a recruiter, a fellow astrophysicist,', '');
                    printLine('or a future collaborator who clicked things in the right order.', '');
                }
                break;
            case 'ls':
                printLine('about/  cv/  research/  blog/  tools/  simulations/  talks/  photography/  contact/', '');
                printLine("Type 'open <name>' to navigate, e.g. 'open research'.", 'info');
                break;
            case 'date':
                printLine(new Date().toString(), '');
                break;
            case 'echo':
                printLine(args.join(' '), '');
                break;
            case 'banner':
                BOOT_LINES.slice(4, 7).forEach((l) => printLine(l.text, l.type));
                break;
            case 'coffee':
                printCoffee();
                break;
            case 'clear':
            case 'cls':
                terminalBody.innerHTML = '';
                break;
            case 'history':
                if (!commandHistory.length) {
                    printLine('No commands run yet.', 'info');
                } else {
                    commandHistory.forEach((c, i) => printLine(`${i + 1}  ${c}`, ''));
                }
                break;
            case 'sudo':
                printSudo(args);
                break;
            case 'matrix':
                toggleMatrix();
                break;
            case 'blackhole':
            case 'singularity':
                triggerMiniBlackHole();
                break;
            case 'login':
                startLoginFlow();
                break;
            case 'logout':
                handleLogout();
                break;
            case 'secrets':
                printSecrets();
                break;
            case 'mainframe':
                triggerMainframe();
                break;
            case 'open':
                handleOpen(args[0]);
                break;
            case 'exit':
            case 'back':
            case 'quit':
                printLine('Closing shell... returning to the normal universe.', 'info');
                setTimeout(deactivateTerminal, 300);
                break;
            default:
                if (NAV_SHORTCUTS.has(cmd)) {
                    handleOpen(cmd);
                } else {
                    printLine(`command not found: ${cmd}`, 'error');
                    printLine("Type 'help' for a list of commands.", 'info');
                }
        }
    }

    function printHelp() {
        [
            ['about', 'A little about me'],
            ['whoami', 'Who are you, really?'],
            ['ls', 'List site sections'],
            ['open <name>', 'Navigate to a section (cv, research, blog, tools, ...)'],
            ['banner', 'Redisplay the ASCII banner'],
            ['history', 'Show command history'],
            ['matrix', 'Enter the matrix (type again to exit early)'],
            ['blackhole', 'Simulate a gravitational collapse'],
            ['coffee', 'Brew a virtual coffee'],
            ['sudo ...', "Try it and see what happens"],
            ['login', 'Authenticate for elevated access'],
            ['clear', 'Clear the terminal'],
            ['exit', 'Return to the normal hero'],
        ].forEach(([cmd, desc]) => {
            const line = document.createElement('div');
            line.className = 'term-line';
            const cmdSpan = document.createElement('span');
            cmdSpan.className = 'term-key';
            cmdSpan.textContent = cmd.padEnd(14, ' ');
            line.appendChild(cmdSpan);
            line.appendChild(document.createTextNode(desc));
            terminalBody.appendChild(line);
        });
        scrollToBottom();
    }

    function printAbout() {
        printLine('Mitchell Hooymans \u2014 PhD candidate in Astrophysics @ The University of Queensland.', '');
        printLine('OzGrav member studying black hole dynamics in dense stellar environments and', '');
        printLine('their role as gravitational wave sources. Also dabbles in web dev & photography.', '');
        printLine("Type 'open about' for the full story.", 'info');
    }

    function printCoffee() {
        [
            '        ( (',
            '         ) )',
            '      ........',
            "      |      |]",
            '      \\      /',
            "       `----'",
            'Here\u2019s your coffee. Now get back to the research.',
        ].forEach((l) => printLine(l, l.startsWith('Here') ? 'success' : ''));
    }

    function printSudo(args) {
        const joined = args.join(' ').toLowerCase();
        if (isRootUser) {
            printLine("You're already root. Flex somewhere else.", 'warn');
        } else if (joined.includes('sandwich')) {
            printLine('Okay.', 'success');
        } else if (joined.includes('make me a phd') || joined.includes('give me a phd')) {
            printLine("Nice try. That one takes ~4 years and several existential crises.", 'warn');
        } else {
            printLine(`${loggedIn ? loggedInUser : 'guest'} is not in the sudoers file. This incident will be reported`, 'error');
            printLine('to the OzGrav mainframe.', 'error');
        }
    }

    function printSecrets() {
        if (!loggedIn) {
            printLine('Permission denied. Try logging in first: type \'login\'.', 'error');
            return;
        }
        [
            '[classified] Simulation seed: black hole spin parameter a* = 0.998 (near-extremal Kerr).',
            '[classified] More coffee has been consumed during this PhD than water.',
            '[classified] The real launch codes are stored safely... in my head.',
        ].forEach((l) => printLine(l, 'accent'));
    }

    function triggerMainframe() {
        if (!loggedIn) {
            printLine('Permission denied. Try logging in first: type \'login\'.', 'error');
            return;
        }
        printLine('Pinging OzGrav mainframe...', 'info');
        bootTimers.push(setTimeout(() => {
            printLine('\u26a0 GRAVITATIONAL WAVE EVENT DETECTED \u26a0', 'error');
            terminalWindow.classList.add('alert-flash');
            bootTimers.push(setTimeout(() => {
                terminalWindow.classList.remove('alert-flash');
                printLine('False alarm. Probably a truck driving past LIGO.', 'warn');
            }, 3000));
        }, 800));
    }

    function handleOpen(target) {
        target = (target || '').toLowerCase();
        if (!target) {
            printLine("Usage: open <destination>  (try 'ls' first)", 'warn');
            return;
        }
        if (PAGE_MAP[target]) {
            printLine(`Navigating to ${target}...`, 'success');
            setTimeout(() => {
                window.location.href = PAGE_MAP[target];
            }, 600);
        } else {
            printLine(`No such destination: "${target}". Type 'ls' to see available sections.`, 'error');
        }
    }

    // ---------------------------------------------------------------
    // Effect: matrix rain
    // ---------------------------------------------------------------
    let matrixCanvas = null;
    let matrixAnimId = null;
    let matrixTimeout = null;

    function toggleMatrix() {
        if (matrixCanvas) {
            stopMatrix();
            printLine('Matrix sequence aborted.', 'warn');
            return;
        }
        printLine('Entering the matrix... (auto-exits in 6s, or type "matrix" again to stop)', 'accent');
        startMatrix();
    }

    function startMatrix() {
        matrixCanvas = document.createElement('canvas');
        matrixCanvas.id = 'matrix-rain-overlay';
        document.body.appendChild(matrixCanvas);
        const ctx = matrixCanvas.getContext('2d');

        function resize() {
            matrixCanvas.width = window.innerWidth;
            matrixCanvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);
        matrixCanvas._resizeHandler = resize;

        requestAnimationFrame(() => matrixCanvas.classList.add('active'));

        const chars = '\u30a2\u30a4\u30a6\u30a8\u30aa\u30ab\u30ad\u30af\u30b1\u30b3\u30b5\u30b7\u30b9\u30bb\u30bd0123456789MITCHELLHOOYMANSOZGRAV'.split('');
        const fontSize = 16;
        const columns = Math.floor(matrixCanvas.width / fontSize);
        const drops = new Array(columns).fill(1);

        function draw() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
            ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
            ctx.fillStyle = '#38f88a';
            ctx.font = fontSize + 'px monospace';
            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
            matrixAnimId = requestAnimationFrame(draw);
        }
        draw();

        matrixTimeout = setTimeout(() => {
            stopMatrix();
            if (terminalActive) printLine('Matrix sequence complete. Welcome back to reality.', 'success');
        }, 6000);
    }

    function stopMatrix() {
        if (!matrixCanvas) return;
        clearTimeout(matrixTimeout);
        cancelAnimationFrame(matrixAnimId);
        window.removeEventListener('resize', matrixCanvas._resizeHandler);
        matrixCanvas.classList.remove('active');
        const toRemove = matrixCanvas;
        setTimeout(() => toRemove.remove(), 650);
        matrixCanvas = null;
    }

    // ---------------------------------------------------------------
    // Effect: mini black hole
    // ---------------------------------------------------------------
    function triggerMiniBlackHole() {
        printLine('Simulating gravitational collapse...', 'accent');
        const wrap = document.createElement('div');
        wrap.className = 'mini-singularity';
        wrap.innerHTML = '<div class="mini-disk"></div><div class="mini-hole"></div>';
        terminalBody.appendChild(wrap);
        scrollToBottom();
        setTimeout(() => {
            wrap.remove();
            printLine('...the singularity evaporates via Hawking radiation. Physics intact.', 'success');
        }, 3200);
    }
});
