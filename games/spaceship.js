/**
 * Spaceship Runner \u2014 side-scrolling asteroid dodger, rendered as ASCII.
 * Controls: Up/Down (or W/S) to move, Space to fire, 'q'/Escape to quit.
 */
window.TerminalGames = window.TerminalGames || {};

window.TerminalGames.spaceship = function createSpaceshipDescriptor() {
    const WIDTH = 34;
    const HEIGHT = 12;
    const PLAYER_X = 3;
    const engine = window.AsciiGameEngine;
    const SPAWN_CHANCE = 0.32;
    const SPEED_UP_EVERY = 200;
    const SHOT_COOLDOWN_TICKS = 2;
    const KILL_BONUS = 5;

    function initialState() {
        return {
            playerY: Math.floor(HEIGHT / 2),
            obstacles: [],
            bullets: [],
            score: 0,
            distance: 0,
            shotCooldown: 0,
        };
    }

    function onTick(state) {
        state.distance++;
        if (state.shotCooldown > 0) state.shotCooldown--;

        state.obstacles = state.obstacles
            .map((o) => ({ x: o.x - 1, y: o.y }))
            .filter((o) => o.x >= 0);

        state.bullets = state.bullets
            .map((b) => ({ x: b.x + 2, y: b.y }))
            .filter((b) => b.x < WIDTH);

        const spawnChance = Math.min(0.55, SPAWN_CHANCE + state.distance / (SPEED_UP_EVERY * 10));
        if (Math.random() < spawnChance) {
            state.obstacles.push({ x: WIDTH - 1, y: Math.floor(Math.random() * HEIGHT) });
        }

        state.bullets.forEach((b) => {
            // Bullets move faster than obstacles, so check the whole path
            // swept this tick rather than an exact x match.
            const hitIndex = state.obstacles.findIndex((o) => o.y === b.y && o.x <= b.x && o.x >= b.x - 3);
            if (hitIndex !== -1) {
                state.obstacles.splice(hitIndex, 1);
                b.x = WIDTH; // mark for removal this frame
                state.score += KILL_BONUS;
            }
        });
        state.bullets = state.bullets.filter((b) => b.x < WIDTH);

        const collided = state.obstacles.some((o) => o.x === PLAYER_X && o.y === state.playerY);
        if (collided) return false;

        state.score = Math.max(state.score, Math.floor(state.distance / 2));
        return true;
    }

    function onKey(state, key) {
        if (key === 'ArrowUp' || key === 'w' || key === 'W') {
            state.playerY = Math.max(0, state.playerY - 1);
        } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
            state.playerY = Math.min(HEIGHT - 1, state.playerY + 1);
        } else if (key === ' ') {
            if (state.shotCooldown <= 0) {
                state.bullets.push({ x: PLAYER_X + 2, y: state.playerY });
                state.shotCooldown = SHOT_COOLDOWN_TICKS;
            }
        }
    }

    function render(state) {
        const grid = engine.buildGrid(WIDTH, HEIGHT, ' ');

        state.bullets.forEach((b) => {
            if (b.x >= 0 && b.x < WIDTH) grid[b.y][b.x] = '\u2013';
        });

        state.obstacles.forEach((o) => { grid[o.y][o.x] = '*'; });

        if (PLAYER_X + 1 < WIDTH) grid[state.playerY][PLAYER_X + 1] = '>';
        grid[state.playerY][PLAYER_X] = '\u25b6';

        const header = engine.padHeader(`SPACESHIP   score: ${state.score}`, WIDTH);
        return header + '\n' + engine.gridToString(grid);
    }

    return {
        width: WIDTH,
        height: HEIGHT,
        tickMs: 110,
        initialState,
        onTick,
        onKey,
        render,
        scoreOf: (state) => state.score,
    };
};
