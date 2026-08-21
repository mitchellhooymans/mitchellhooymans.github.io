/* Shared client-side lab auth for the hidden terminal and /science/ pages.
   This is a convenience gate, not real security — the pages are still static. */
(function (global) {
    const USERNAME = 'mitchellhooymans';
    const STORAGE_KEY = 'astroShellAuth.v1';
    const CREDENTIAL_HASH = '150ed49ed1999faa0bbb627eff2e991fd93149cf9bc713a581f5f5933dcda4e3';

    function toHex(buffer) {
        return Array.from(new Uint8Array(buffer))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
    }

    async function digest(message) {
        if (!global.crypto || !crypto.subtle) {
            throw new Error('Secure hashing is unavailable in this context. Open the site over http(s).');
        }
        const data = new TextEncoder().encode(message);
        return toHex(await crypto.subtle.digest('SHA-256', data));
    }

    async function credentialHash(username, password) {
        return digest(String(username).trim().toLowerCase() + '\0' + String(password));
    }

    function isAuthed() {
        try {
            return sessionStorage.getItem(STORAGE_KEY) === CREDENTIAL_HASH;
        } catch (err) {
            return false;
        }
    }

    async function login(username, password) {
        const hash = await credentialHash(username, password);
        if (hash !== CREDENTIAL_HASH) return false;
        try {
            sessionStorage.setItem(STORAGE_KEY, hash);
        } catch (err) {
            /* private mode / blocked storage — still treat this tab as authed */
        }
        return true;
    }

    function logout() {
        try {
            sessionStorage.removeItem(STORAGE_KEY);
        } catch (err) { /* ignore */ }
    }

    global.LabAuth = {
        USERNAME: USERNAME,
        isAuthed: isAuthed,
        login: login,
        logout: logout,
        username: function () {
            return isAuthed() ? USERNAME : null;
        }
    };
})(window);
