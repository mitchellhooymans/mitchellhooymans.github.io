if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
} else {
    setTimeout(initSearch, 50);
}

function initSearch() {
    // Determine root path similar to navbar.js
    const path = window.location.pathname;
    let rootPath = "./";
    if (path.includes("/pages/") || path.includes("/simulations/") || path.includes("/tutorials/") || path.includes("/tools/") || path.includes("/blog/")) {
        rootPath = "../";
    }

    // 1. Pages to Index (with basic fallbacks for local testing)
    const pageUrls = [
        { title: "Home", url: "index.html", icon: "fa-home", keywords: "home portfolio" },
        { title: "About Me", url: "pages/about.html", icon: "fa-user", keywords: "about bio" },
        { title: "Research", url: "pages/research.html", icon: "fa-microscope", keywords: "research black hole" },
        { title: "CV", url: "pages/cv.html", icon: "fa-file-alt", keywords: "cv resume" },
        { title: "Tutorials", url: "pages/tutorials.html", icon: "fa-book", keywords: "tutorials physics code" },
        { title: "Simulations", url: "pages/simulations.html", icon: "fa-star", keywords: "simulations n-body interactive" },
        { title: "Tools", url: "pages/tools.html", icon: "fa-wrench", keywords: "tools app utility" },
        { title: "Blog", url: "pages/blog.html", icon: "fa-pen-nib", keywords: "blog posts writing" },
        { title: "Photography", url: "pages/photography.html", icon: "fa-camera", keywords: "photography photo wildlife landscape koala camera" },
        { title: "Contact", url: "pages/contact.html", icon: "fa-envelope", keywords: "contact email message" },

        // Tools
        { title: "Kick Estimator", url: "tools/kick-estimator.html", icon: "fa-wrench", keywords: "kick estimator tool" },
        { title: "QR Code Generator", url: "tools/qr.html", icon: "fa-qrcode", keywords: "qr code generator" },
        { title: "Steganography", url: "tools/steg.html", icon: "fa-lock", keywords: "steganography tool encryption" },

        // Tutorials
        { title: "Black Holes Tutorial", url: "tutorials/blackholes.html", icon: "fa-book", keywords: "black holes tutorial" },
        { title: "N-Body Tutorial", url: "tutorials/nbody.html", icon: "fa-book", keywords: "n-body tutorial" },
        { title: "Introductory Python for Physicists", url: "tutorials/pythonphys.html", icon: "fa-book", keywords: "python physics" },

        // Simulations
        // { title: "Supernova Simulation", url: "simulations/basic-supernova.html", icon: "fa-star", keywords: "supernova explosion simulation" },
        // { title: "Binary Black Hole", url: "simulations/binary-black-hole.html", icon: "fa-star", keywords: "binary black hole simulation" },
        { title: "Globular Cluster", url: "simulations/globular.html", icon: "fa-star", keywords: "globular cluster simulation" },
        { title: "N-Body Simulation", url: "simulations/nbodysim.html", icon: "fa-star", keywords: "n-body simulation" },
        { title: "Pendulum Simulation", url: "simulations/pendulum.html", icon: "fa-star", keywords: "pendulum physics simulation" },
        { title: "Projectile Physics", url: "simulations/projectile.html", icon: "fa-star", keywords: "projectile motion simulation" },
        { title: "Three-Body Problem", url: "simulations/threebody.html", icon: "fa-star", keywords: "three-body physics simulation" },
        { title: "Two-Body Simulation", url: "simulations/twobody.html", icon: "fa-star", keywords: "two-body physics simulation" },

        // Blog
        { title: "Programming Blog", url: "blog/programming.html", icon: "fa-pen-nib", keywords: "programming blog" },
        { title: "Science Career QA", url: "blog/science-career-qa.html", icon: "fa-pen-nib", keywords: "science career qa blog" }
    ];

    let searchIndex = [];
    let isIndexing = false;
    let indexCompleted = false;

    async function buildIndex() {
        if (isIndexing || indexCompleted) return;
        isIndexing = true;

        const parser = new DOMParser();

        const fetchPromises = pageUrls.map(async (pageData) => {
            let corpus = (pageData.title + " " + (pageData.keywords || "")).toLowerCase();
            let finalTitle = pageData.title;
            let finalDesc = "";

            try {
                // In local testing via file:// protocol, fetch() is strictly blocked by browser CORS policies.
                if (window.location.protocol === 'file:') {
                    throw new Error("Local file:// protocol blocks fetch()");
                }

                const fetchUrl = rootPath + pageData.url;
                const response = await fetch(fetchUrl);
                if (response.ok) {
                    const html = await response.text();
                    const doc = parser.parseFromString(html, "text/html");

                    finalTitle = (doc.title || pageData.title).replace(" | Mitchell Hooymans", "").trim();
                    const metaDesc = doc.querySelector('meta[name="description"]');
                    if (metaDesc && metaDesc.getAttribute("content")) {
                        finalDesc = metaDesc.getAttribute("content");
                    }

                    const bodyClone = doc.body.cloneNode(true);
                    const scripts = bodyClone.querySelectorAll('script, style, noscript, nav, footer, #navbar-placeholder, #footer-placeholder');
                    scripts.forEach(s => s.remove());

                    const textContent = bodyClone.innerText.replace(/\s+/g, ' ');
                    const images = doc.querySelectorAll('img');
                    const altTexts = Array.from(images).map(img => img.getAttribute("alt")).filter(alt => alt).join(" ");

                    corpus += " " + (finalDesc + " " + textContent + " " + altTexts).toLowerCase();
                }
            } catch (error) {
                // Fallback implicitly triggered: corpus, finalTitle, finalDesc are retained from hardcoded values.
            }

            return {
                title: finalTitle,
                url: pageData.url,
                description: finalDesc,
                icon: pageData.icon,
                searchCorpus: corpus
            };
        });

        const results = await Promise.all(fetchPromises);
        searchIndex = results.filter(item => item !== null);

        isIndexing = false;
        indexCompleted = true;
    }

    // Start background scrape immediately
    buildIndex();

    // 2. Inject Modal HTML
    if (document.getElementById('search-modal')) return;

    const modalHTML = `
        <div class="search-modal-backdrop" id="search-modal">
            <div class="search-modal-container">
                <div class="search-header">
                    <svg class="search-icon-large" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input type="text" id="search-input" placeholder="Search the cosmos... (e.g., Black Holes, Koala)" autocomplete="off">
                    <button class="search-close" id="search-close-btn" aria-label="Close search">&times;</button>
                </div>
                <div class="search-results" id="search-results">
                    <!-- Results inject here -->
                </div>
                <div class="search-footer">
                    <span id="search-status-text"><kbd>ESC</kbd> to close</span>
                    <span><kbd>&uarr;&darr;</kbd> to navigate</span>
                    <span><kbd>ENTER</kbd> to select</span>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('search-modal');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');
    const closeBtn = document.getElementById('search-close-btn');
    const searchStatus = document.getElementById('search-status-text');

    let selectedIndex = -1;

    // 3. Functions
    function openSearch() {
        modal.classList.add('visible');
        setTimeout(() => searchInput.focus(), 50);
        document.body.style.overflow = 'hidden';
        renderResults(searchInput.value);
    }

    function closeSearch() {
        modal.classList.remove('visible');
        searchInput.value = '';
        document.body.style.overflow = '';
    }

    function performSearch(query) {
        if (!query.trim()) {
            renderResults("");
            return;
        }

        if (!indexCompleted) {
            resultsContainer.innerHTML = `
                <div class="search-empty-state">
                    <p style="margin:0;"><i class="fas fa-circle-notch fa-spin"></i> Initializing star charts... please wait a moment.</p>
                </div>
            `;
            // Retry very soon
            setTimeout(() => performSearch(query), 500);
            return;
        }

        const lowerQuery = query.toLowerCase();

        // Custom simple relevance ranking:
        // Title match = +10, Description match = +5, Corpus match = +1
        const results = searchIndex.map(item => {
            let score = 0;
            if (item.title.toLowerCase().includes(lowerQuery)) score += 10;
            if (item.description.toLowerCase().includes(lowerQuery)) score += 5;
            if (item.searchCorpus.includes(lowerQuery)) score += 1;
            return { item, score };
        }).filter(r => r.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(r => r.item);

        renderResultsList(results);
    }

    function renderResults(query) {
        if (!query) {
            resultsContainer.innerHTML = `
                <div class="search-empty-state">
                    <p style="margin:0;">Start typing to explore pages, tools, tutorials, and simulations.</p>
                </div>
            `;
            selectedIndex = -1;
        } else {
            performSearch(query);
        }
    }

    function renderResultsList(results) {
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-empty-state">
                    <p style="margin:0;">No matching signals found in this galaxy.</p>
                </div>
            `;
            selectedIndex = -1;
            return;
        }

        resultsContainer.innerHTML = results.map((result, index) => `
            <a href="${rootPath}${result.url}" class="search-result-item" data-index="${index}">
                <div class="search-result-icon">
                    <i class="fas ${result.icon}"></i>
                </div>
                <div class="search-result-content">
                    <h4>${result.title}</h4>
                    ${result.description ? `<p>${result.description}</p>` : ''}
                </div>
            </a>
        `).join('');
        selectedIndex = -1;

        if (results.length > 0) {
            selectedIndex = 0;
            updateSelection();
        }
    }

    function updateSelection() {
        const items = resultsContainer.querySelectorAll('.search-result-item');
        items.forEach((item, index) => {
            if (index === selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }

    // 4. Event Listeners
    // Triggers
    const navSearchBtn = document.getElementById('navSearchTrigger');
    const mobileSearchBtn = document.getElementById('mobileSearchTrigger');

    // Remove existing event listeners in case of multiple injections
    const newNavSearchBtn = navSearchBtn ? navSearchBtn.cloneNode(true) : null;
    if (navSearchBtn) navSearchBtn.parentNode.replaceChild(newNavSearchBtn, navSearchBtn);

    if (newNavSearchBtn) {
        newNavSearchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openSearch();
        });
    }

    const newMobileBtn = mobileSearchBtn ? mobileSearchBtn.cloneNode(true) : null;
    if (mobileSearchBtn) mobileSearchBtn.parentNode.replaceChild(newMobileBtn, mobileSearchBtn);

    if (newMobileBtn) {
        newMobileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const mobileMenu = document.getElementById('mobileMenu');
            const navToggle = document.getElementById('navToggle');
            if (mobileMenu) mobileMenu.classList.remove('open');
            if (navToggle) navToggle.classList.remove('active');
            openSearch();
        });
    }

    closeBtn.addEventListener('click', closeSearch);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeSearch();
        }
    });

    searchInput.addEventListener('input', (e) => {
        performSearch(e.target.value);
    });

    resultsContainer.addEventListener('mouseover', (e) => {
        const item = e.target.closest('.search-result-item');
        if (item) {
            selectedIndex = parseInt(item.getAttribute('data-index'));
            updateSelection();
        }
    });

    // Keyboard Shortcuts
    document.removeEventListener('keydown', handleSearchKeydown); // clear if added before
    function handleSearchKeydown(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openSearch();
        }

        if (!modal.classList.contains('visible')) return;

        if (e.key === 'Escape') {
            closeSearch();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const items = resultsContainer.querySelectorAll('.search-result-item');
            if (items.length > 0) {
                selectedIndex = (selectedIndex + 1) % items.length;
                updateSelection();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const items = resultsContainer.querySelectorAll('.search-result-item');
            if (items.length > 0) {
                selectedIndex = selectedIndex <= 0 ? items.length - 1 : selectedIndex - 1;
                updateSelection();
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const items = resultsContainer.querySelectorAll('.search-result-item');
            if (selectedIndex >= 0 && selectedIndex < items.length) {
                items[selectedIndex].click();
            } else if (items.length > 0 && searchInput.value.trim().length > 0) {
                items[0].click();
            }
        }
    }
    document.addEventListener('keydown', handleSearchKeydown);
}
