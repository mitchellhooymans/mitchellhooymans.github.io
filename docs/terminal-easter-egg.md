# Hero Terminal Easter Egg — Quick Reference

Private cheat-sheet for the hidden terminal on the homepage hero section, in case future-me forgets how it works.

## How to trigger it

On the homepage hero card, click the three stat chips in this exact order/count, within ~3.5 seconds of each click (timer resets on every click):

1. **OzGrav** × 2
2. **PhD** × 1
3. **Computational Astrophysics** × 3

On success the hero card flashes and morphs into a full-screen-style terminal window with a boot sequence.

- Trigger logic lives in `js/hero-terminal.js` → `COMBO` array + `handleChipInput()`.
- Chips are marked with `data-chip="ozgrav" | "phd" | "comp"` in `index.html`.
- Press `Esc` or click the terminal's close button to exit back to the normal hero.

## Login

Type `login` at the prompt, then enter:

- **Username:** `mitchellhooymans` (case-insensitive)
- **Password:** `astrophysics1!` (case-sensitive)

Any other credentials are rejected. On success you become root (`mitchellhooymans@mitchellhooymans.com:~#`) and unlock two extra commands: `secrets` and `mainframe`. Use `logout` to drop back to guest.

Credentials/logic: `js/hero-terminal.js` → `VALID_USERNAME`, `VALID_PASSWORD`, `runAuthentication()`.

## Command list

| Command | What it does |
|---|---|
| `about` | Short bio blurb |
| `whoami` | Shows guest/root identity |
| `ls` | Lists site sections |
| `open <name>` | Navigates to a section (`cv`, `research`, `blog`, `tools`, ...) |
| `banner` | Redisplays the ASCII banner |
| `history` | Command history |
| `matrix` | Toggles matrix rain effect |
| `blackhole` / `singularity` | Mini black-hole visual effect |
| `coffee` | Brews a virtual coffee (fun output) |
| `sudo ...` | Easter-egg response (root-aware) |
| `login` | Starts the login flow |
| `logout` | Ends the root session |
| `secrets` | Root-only classified facts |
| `mainframe` | Root-only effect/sequence |
| `games` | Lists playable ASCII games + best scores |
| `play <name>` | Launches a game (or just type the game name directly) |
| `highscores` (aka `scores`, `leaderboard`) | Shows best score per game |
| `highscores reset` | Clears all saved high scores |
| `clear` | Clears the terminal screen |
| `exit` / `back` / `quit` | Closes the terminal, returns to hero |

## Games

Three ASCII games, playable directly in the terminal body:

- `snake` — classic snake
- `invaders` — Space Invaders style
- `spaceship` — side-scrolling asteroid dodger (also shoots — space fires bullets that destroy asteroids for bonus points)

**Controls:** Arrow keys or WASD to move, Space to fire (invaders and spaceship), `q` or `Esc` to quit mid-game.

Game files live in `games/`:
- `ascii-engine.js` — shared game loop/render engine (`AsciiGameEngine`)
- `snake.js`, `invaders.js`, `spaceship.js` — individual game descriptors (`TerminalGames`)
- `highscores.js` — persistent best-score storage (`TerminalHighScores`, backed by `localStorage` key `astroShellHighScores`)

## Key files

| File | Purpose |
|---|---|
| `index.html` | Hero markup, stat chips (`data-chip`), terminal DOM, script includes |
| `styles.css` | All terminal/game visual styling (search `.hero-terminal`, `.game-screen`) |
| `js/hero-terminal.js` | Combo detection, boot sequence, command parser, login flow, game lifecycle |
| `games/*.js` | Game engine + individual games + high scores |

## Notes

- Everything is client-side vanilla JS — no backend, no real auth. It's just for fun/immersion on my own site.
- High scores are per-browser (via `localStorage`), not synced across devices.
- If you add a new game, register it in `TerminalGames` (in its own file under `games/`), add it to `GAME_NAMES` in `js/hero-terminal.js`, and add a line to `printGamesList()`.
