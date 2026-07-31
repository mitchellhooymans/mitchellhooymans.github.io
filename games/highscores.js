/**
 * Persistent High Scores
 * ----------------------
 * Stores best scores per game in localStorage so they survive page
 * reloads and browser restarts. Fails silently if storage is
 * unavailable (private browsing, quota exceeded, etc).
 */
window.TerminalHighScores = (function () {
    const STORAGE_KEY = 'astroShellHighScores';

    function loadAll() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : {};
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (e) {
            return {};
        }
    }

    function saveAll(scores) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
        } catch (e) {
            // Storage unavailable \u2014 high scores just won't persist this session.
        }
    }

    function get(game) {
        const scores = loadAll();
        return scores[game] || 0;
    }

    function getAll() {
        return loadAll();
    }

    function submit(game, score) {
        const scores = loadAll();
        const previousBest = scores[game] || 0;
        const isNewHigh = score > previousBest;
        if (isNewHigh) {
            scores[game] = score;
            saveAll(scores);
        }
        return { isNewHigh, previousBest, best: isNewHigh ? score : previousBest };
    }

    function resetAll() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            // ignore
        }
    }

    return { get, getAll, submit, resetAll };
})();
