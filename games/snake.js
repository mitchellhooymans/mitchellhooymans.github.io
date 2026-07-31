/**
 * Snake \u2014 classic grid snake game, rendered as ASCII in the terminal.
 * Controls: Arrow keys / WASD to steer, 'q' or Escape to quit.
 */
window.TerminalGames = window.TerminalGames || {};

window.TerminalGames.snake = function createSnakeDescriptor() {
    const WIDTH = 28;
    const HEIGHT = 14;
    const engine = window.AsciiGameEngine;

    const DIR_KEYS = {
        ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, W: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, S: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, A: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }, D: { x: 1, y: 0 },
    };

    function randomFood(snake) {
        let pos;
        do {
            pos = { x: Math.floor(Math.random() * WIDTH), y: Math.floor(Math.random() * HEIGHT) };
        } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
        return pos;
    }

    function initialState() {
        const snake = [{ x: 6, y: 7 }, { x: 5, y: 7 }, { x: 4, y: 7 }];
        return {
            snake,
            dir: { x: 1, y: 0 },
            nextDir: { x: 1, y: 0 },
            food: randomFood(snake),
            score: 0,
        };
    }

    function onTick(state) {
        state.dir = state.nextDir;
        const head = state.snake[0];
        const newHead = { x: head.x + state.dir.x, y: head.y + state.dir.y };

        if (newHead.x < 0 || newHead.x >= WIDTH || newHead.y < 0 || newHead.y >= HEIGHT) return false;
        if (state.snake.some((s) => s.x === newHead.x && s.y === newHead.y)) return false;

        state.snake.unshift(newHead);
        if (newHead.x === state.food.x && newHead.y === state.food.y) {
            state.score += 10;
            state.food = randomFood(state.snake);
        } else {
            state.snake.pop();
        }
        return true;
    }

    function onKey(state, key) {
        const next = DIR_KEYS[key];
        if (!next) return;
        const isReverse = next.x === -state.dir.x && next.y === -state.dir.y;
        if (isReverse && state.snake.length > 1) return;
        state.nextDir = next;
    }

    function render(state) {
        const grid = engine.buildGrid(WIDTH, HEIGHT, '\u00b7');
        grid[state.food.y][state.food.x] = '\u2726';
        state.snake.forEach((seg, i) => {
            grid[seg.y][seg.x] = i === 0 ? '\u25c9' : '\u25cf';
        });
        const header = engine.padHeader(`SNAKE   score: ${state.score}`, WIDTH);
        return header + '\n' + engine.gridToString(grid);
    }

    return {
        width: WIDTH,
        height: HEIGHT,
        tickMs: 140,
        initialState,
        onTick,
        onKey,
        render,
        scoreOf: (state) => state.score,
    };
};
