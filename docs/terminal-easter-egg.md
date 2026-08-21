# Hero Easter Eggs — Quick Reference

Private cheat-sheet for the hidden hero overlays on the homepage, in case future-me forgets how it works.

Shared combo routing lives in `js/hero-combos.js`. Clicks must land within ~3.5 seconds of each other (timer resets on every click). Only one overlay can be open at a time.

Chips are marked with `data-chip="ozgrav" | "phd" | "comp"` in `index.html`.

---

## Terminal

### How to trigger it

1. **OzGrav** × 2
2. **PhD** × 1
3. **Computational Astrophysics** × 3

On success the hero card flashes and morphs into a terminal window with a boot sequence.

- Logic: `js/hero-terminal.js` (listens for `hero-combo:terminal`)
- Press `Esc` or click the terminal's close button to exit

### Login

Type `login` at the prompt, then enter:

- **Username:** `mitchellhooymans` (case-insensitive)
- **Password:** `astrophysics1!` (case-sensitive)

Any other credentials are rejected. On success you become root (`mitchellhooymans@mitchellhooymans.com:~#`) and unlock two extra commands: `secrets` and `mainframe`. Use `logout` to drop back to guest.

Credentials/logic: `js/hero-terminal.js` → `VALID_USERNAME`, `VALID_PASSWORD`, `runAuthentication()`.

### Command list

| Command | What it does |
|---|---|
| `about` | Short bio blurb |
| `whoami` | Shows guest/root identity |
| `ls` | Lists site sections |
| `open <name>` | Navigates to a section (`cv`, `research`, `blog`, `tools`, ...) |
| `science` | Lists hidden science-lab dashboards (`open science`, `open residuals`) |
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
| `play <name>` | Play a game (snake, invaders, spaceship) |
| `highscores` (aka `scores`, `leaderboard`) | Shows best score per game |
| `highscores reset` | Clears all saved high scores |
| `clear` | Clears the terminal screen |
| `exit` / `back` / `quit` | Closes the terminal, returns to hero |

### Games

Three ASCII games, playable directly in the terminal body:

- `snake` — classic snake
- `invaders` — Space Invaders style
- `spaceship` — side-scrolling asteroid dodger (also shoots — space fires bullets that destroy asteroids for bonus points)

**Controls:** Arrow keys or WASD to move, Space to fire (invaders and spaceship), `q` or `Esc` to quit mid-game.

Game files live in `games/`:
- `ascii-engine.js` — shared game loop/render engine (`AsciiGameEngine`)
- `snake.js`, `invaders.js`, `spaceship.js` — individual game descriptors (`TerminalGames`)
- `highscores.js` — persistent best-score storage (`TerminalHighScores`, backed by `localStorage` key `astroShellHighScores`)

---

## Blackboard

### How to trigger it

1. **PhD** × 1
2. **OzGrav** × 2
3. **Computational Astrophysics** × 1

On success the hero card flashes and morphs into a wooden-framed chalk blackboard. A random celestial outline is pre-sketched lightly (star, crescent moon, Saturn, or sun) so you can trace or freestyle over it — the title does not reveal which one.

- Logic: `js/hero-blackboard.js` (listens for `hero-combo:blackboard`)
- Tools: white / yellow / blue / pink chalk, eraser, Clear (wipes drawings **and** the outline)
- Presets: ★ / ☾ / ♄ / ☼ buttons swap in a fresh outline (also clears current drawing)
- Press `Esc` or click ✕ to exit

---

## Stellar buddy (evolution pet)

### How to trigger it

1. **Computational Astrophysics** × 1
2. **OzGrav** × 1
3. **PhD** × 2

A stellar-evolution desk pet with persistent save data (`localStorage` key `stellarBuddySave`). Closing the panel or leaving the page keeps progress; reopening applies offline time (fuel drain, activity, wind debris, possible instability).

### Life cycle (mass tracks)

| Stage | Object |
|---|---|
| Prestellar | **Dust Core** (molecular-cloud core) |
| Class 0 | **Protostar** (collapsing, not yet fusing) |
| Pre-MS | **T Tauri** (still contracting; bipolar jets) |
| Main Sequence | **Blue Sequence** (high mass / lots of accretion) · **G Dwarf** (balanced) · **Red Dwarf** (neglected / low mass) |
| Late | **Black Hole** · **Red Giant** · **White Dwarf** |

Mass is raised by **Accrete**; fuel is restored by **Fuel** (hydrogen pellets). Evolution at ZAMS / post-MS follows those care proxies.

### Actions

| Button | Astrophysics meaning |
|---|---|
| **Fuel** | Drop a hydrogen pellet; the object walks over and accretes it |
| **Flare** | Activity / magnetic flare (also click the object) |
| **Accrete** | Increase mass (affects evolutionary track); costs some fuel |
| **Sweep** | Clear one stellar-wind debris clump |
| **Quench** | Fix thermal instability |
| **Dome** | Observatory night / day (dormant when closed) |
| **Status** | Fuel / Activity / Mass / Stability (+ approx M☉) |
| **Restart** | Only when gone — new Dust Core |

Neglect (fuel exhaustion, debris, care slips) can end the run. Esc or ✕ closes (and saves).

- Logic: `js/hero-pet.js` (listens for `hero-combo:pet`)

---

## Key files

| File | Purpose |
|---|---|
| `index.html` | Hero markup, stat chips (`data-chip`), terminal / blackboard / pet DOM, script includes |
| `styles.css` | Terminal / blackboard / pet / game visual styling |
| `js/hero-combos.js` | Shared chip combo detection + overlay lock (`HeroCombos`) |
| `js/hero-terminal.js` | Terminal boot, commands, login, games |
| `js/hero-blackboard.js` | Chalkboard canvas drawing + guide shapes |
| `js/hero-pet.js` | Stellar-evolution buddy + localStorage save |
| `games/*.js` | Game engine + individual games + high scores |

## Notes

- Everything is client-side vanilla JS — no backend, no real auth. It's just for fun/immersion on my own site.
- High scores are per-browser (via `localStorage`), not synced across devices.
- If you add a new game, register it in `TerminalGames` (in its own file under `games/`), add it to `GAME_NAMES` in `js/hero-terminal.js`, and add a line to `printGamesList()`.
- If you add another chip combo, register it in `COMBOS` inside `js/hero-combos.js` and listen for `hero-combo:<name>`.
- Science lab pages live in `science/` and are kept off the public nav, search index, and sitemap (`robots.txt` disallows `/science/`). Terminal entry points: `science`, `open science`, `open residuals`.
