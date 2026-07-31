/**
 * Space Invaders \u2014 defend against the descending horde, rendered as ASCII.
 * Controls: Left/Right (or A/D) to move, Space to shoot, 'q'/Escape to quit.
 */
window.TerminalGames = window.TerminalGames || {};

window.TerminalGames.invaders = function createInvadersDescriptor() {
    const WIDTH = 28;
    const HEIGHT = 14;
    const engine = window.AsciiGameEngine;
    const ENEMY_ROWS = 3;
    const ENEMY_COLS = 8;
    const ENEMY_TOP = 1;
    const ENEMY_H_GAP = 3;
    const MOVE_EVERY_N_TICKS = 3;

    function buildEnemies() {
        const enemies = [];
        for (let r = 0; r < ENEMY_ROWS; r++) {
            for (let c = 0; c < ENEMY_COLS; c++) {
                enemies.push({ x: 2 + c * ENEMY_H_GAP, y: ENEMY_TOP + r, alive: true });
            }
        }
        return enemies;
    }

    function initialState() {
        return {
            playerX: Math.floor(WIDTH / 2),
            bullets: [],
            enemyBullets: [],
            enemies: buildEnemies(),
            enemyDir: 1,
            score: 0,
            tickCount: 0,
            won: false,
        };
    }

    function aliveEnemies(state) {
        return state.enemies.filter((e) => e.alive);
    }

    function onTick(state) {
        state.tickCount++;

        state.bullets = state.bullets
            .map((b) => ({ x: b.x, y: b.y - 1 }))
            .filter((b) => b.y >= 0);

        state.enemyBullets = state.enemyBullets
            .map((b) => ({ x: b.x, y: b.y + 1 }))
            .filter((b) => b.y < HEIGHT);

        const alive = aliveEnemies(state);
        if (alive.length === 0) {
            state.won = true;
            return false;
        }

        if (state.tickCount % MOVE_EVERY_N_TICKS === 0) {
            const minX = Math.min(...alive.map((e) => e.x));
            const maxX = Math.max(...alive.map((e) => e.x));
            const willHitEdge = (maxX + state.enemyDir >= WIDTH - 1) || (minX + state.enemyDir <= 0);
            if (willHitEdge) {
                state.enemyDir *= -1;
                alive.forEach((e) => { e.y += 1; });
            } else {
                alive.forEach((e) => { e.x += state.enemyDir; });
            }
        }

        if (Math.random() < 0.12 && alive.length) {
            const shooter = alive[Math.floor(Math.random() * alive.length)];
            state.enemyBullets.push({ x: shooter.x, y: shooter.y + 1 });
        }

        state.bullets.forEach((b) => {
            const hit = alive.find((e) => e.alive && e.x === b.x && e.y === b.y);
            if (hit) {
                hit.alive = false;
                state.score += 10;
                b.y = -1;
            }
        });
        state.bullets = state.bullets.filter((b) => b.y >= 0);

        const playerHit = state.enemyBullets.some((b) => b.x === state.playerX && b.y === HEIGHT - 1);
        if (playerHit) return false;

        const invaded = alive.some((e) => e.y >= HEIGHT - 2);
        if (invaded) return false;

        return true;
    }

    function onKey(state, key) {
        if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
            state.playerX = Math.max(0, state.playerX - 1);
        } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
            state.playerX = Math.min(WIDTH - 1, state.playerX + 1);
        } else if (key === ' ') {
            if (state.bullets.length < 3) {
                state.bullets.push({ x: state.playerX, y: HEIGHT - 2 });
            }
        }
    }

    function render(state) {
        const grid = engine.buildGrid(WIDTH, HEIGHT, ' ');
        state.enemies.forEach((e) => {
            if (e.alive && e.y >= 0 && e.y < HEIGHT) grid[e.y][e.x] = '\u00a5';
        });
        state.bullets.forEach((b) => { if (b.y >= 0 && b.y < HEIGHT) grid[b.y][b.x] = '|'; });
        state.enemyBullets.forEach((b) => { if (b.y >= 0 && b.y < HEIGHT) grid[b.y][b.x] = '.'; });
        grid[HEIGHT - 1][state.playerX] = '\u25b2';

        const header = engine.padHeader(`INVADERS   score: ${state.score}`, WIDTH);
        return header + '\n' + engine.gridToString(grid);
    }

    return {
        width: WIDTH,
        height: HEIGHT,
        tickMs: 130,
        initialState,
        onTick,
        onKey,
        render,
        scoreOf: (state) => state.score,
    };
};
