/**
 * Shared ASCII Game Engine
 * ------------------------
 * A tiny, reusable harness for turn-based/tick-based text games that
 * render into a monospace grid. Individual games (snake, invaders,
 * spaceship) provide a descriptor object describing their state and
 * behaviour; this engine drives the game loop and hands back rendered
 * frames as plain strings.
 *
 * Descriptor shape:
 *   {
 *     width, height,        // grid size in characters
 *     tickMs,               // loop interval in ms
 *     initialState(),       // () => state
 *     onTick(state),        // (state) => boolean (false = game over)
 *     onKey(state, key),    // (state, key) => void
 *     render(state),        // (state) => string
 *     scoreOf(state),       // optional (state) => number
 *   }
 */
window.AsciiGameEngine = (function () {
    function createGame(descriptor) {
        let state = descriptor.initialState();
        let intervalId = null;
        let running = false;

        function frame() {
            return descriptor.render(state);
        }

        function tick() {
            const alive = descriptor.onTick(state);
            if (descriptor.onFrame) descriptor.onFrame(frame());
            if (!alive) {
                stop();
                if (descriptor.onGameOver) descriptor.onGameOver(state);
            }
        }

        function start() {
            if (running) return;
            running = true;
            if (descriptor.onFrame) descriptor.onFrame(frame());
            intervalId = setInterval(tick, descriptor.tickMs);
        }

        function stop() {
            running = false;
            if (intervalId) clearInterval(intervalId);
            intervalId = null;
        }

        function handleKey(key) {
            if (!running) return;
            descriptor.onKey(state, key);
        }

        return {
            start,
            stop,
            handleKey,
            isRunning: () => running,
            getState: () => state,
            getScore: () => (descriptor.scoreOf ? descriptor.scoreOf(state) : state.score || 0),
        };
    }

    function buildGrid(width, height, fillChar) {
        const grid = [];
        for (let y = 0; y < height; y++) {
            grid.push(new Array(width).fill(fillChar));
        }
        return grid;
    }

    function gridToString(grid) {
        return grid.map((row) => row.join('')).join('\n');
    }

    function padHeader(text, width) {
        return text.length >= width ? text.slice(0, width) : text.padEnd(width, ' ');
    }

    return { createGame, buildGrid, gridToString, padHeader };
})();
