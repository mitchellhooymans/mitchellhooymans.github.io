document.addEventListener('DOMContentLoaded', () => {
    // 1. Determine Relative Path
    const path = window.location.pathname;

    // Check depth based on known subdirectories
    // If we are in pages, simulations, tutorials (non-interactive), or blog
    let rootPath = "./";
    if (path.includes("/pages/") || path.includes("/simulations/") || path.includes("/tutorials/") || path.includes("/blog/")) {
        rootPath = "../";
    }

    // NOTE: This logic assumes a flat structure within these subdirectories (depth 1).
    // If nested folders are added (e.g. tutorials/advanced/), this logic will need update.

    // 2. Define Navigation HTML
    // We use rootPath to ensure links point to the correct location
    const navHTML = `
    <nav class="nav" id="nav">
        <div class="nav-content">
            <a href="${rootPath}" class="nav-brand">
                <span>Mitchell</span>Hooymans
            </a>
            <ul class="nav-links">
                <li class="dropdown" id="nav-profile-dropdown">
                    <a href="javascript:void(0)" class="dropbtn" id="nav-profile-toggle">Profile <i class="fas fa-chevron-down"></i></a>
                    <div class="dropdown-content">
                        <a href="${rootPath}pages/about.html" id="nav-about">About Me</a>
                        <a href="${rootPath}pages/research.html" id="nav-research">Research</a>
                        <a href="${rootPath}pages/cv.html" id="nav-cv">CV</a>
                    </div>
                </li>
                <li class="dropdown" id="nav-resources-dropdown">
                    <a href="javascript:void(0)" class="dropbtn" id="nav-resources-toggle">Resources <i class="fas fa-chevron-down"></i></a>
                    <div class="dropdown-content">
                        <a href="${rootPath}pages/tutorials.html" id="nav-tutorials">Tutorials</a>
                        <a href="${rootPath}pages/simulations.html" id="nav-simulations">Simulations</a>
                    </div>
                </li>
                <li><a href="${rootPath}pages/blog.html" id="nav-blog">Blog</a></li>
                <li><a href="${rootPath}pages/photography.html" id="nav-photography">Photography</a></li>
                <li><a href="${rootPath}pages/contact.html" id="nav-contact">Contact</a></li>
            </ul>
            <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </div>
    </nav>
    <div class="mobile-menu" id="mobileMenu">
        <a href="${rootPath}pages/about.html" id="mobile-about">About Me</a>
        <a href="${rootPath}pages/research.html" id="mobile-research">Research</a>
        <a href="${rootPath}pages/cv.html" id="mobile-cv">CV</a>
        <a href="${rootPath}pages/tutorials.html" id="mobile-tutorials">Tutorials</a>
        <a href="${rootPath}pages/simulations.html" id="mobile-simulations">Simulations</a>
        <a href="${rootPath}pages/blog.html" id="mobile-blog">Blog</a>
        <a href="${rootPath}pages/photography.html" id="mobile-photography">Photography</a>
        <a href="${rootPath}pages/contact.html" id="mobile-contact">Contact</a>
    </div>
    `;

    // 3. Inject HTML
    const placeholder = document.getElementById('navbar-placeholder');
    if (!placeholder) {
        console.warn("Navbar placeholder not found on this page.");
        return;
    }
    placeholder.innerHTML = navHTML;

    // 4. Set Active State
    const setActive = (id) => {
        const el = document.getElementById(id);
        if (el) el.classList.add('active');
    };

    // Simple robust check: specific filename matching
    if (path.includes("about.html")) { setActive('nav-about'); setActive('mobile-about'); setActive('nav-profile-toggle'); }
    else if (path.includes("research.html")) { setActive('nav-research'); setActive('mobile-research'); setActive('nav-profile-toggle'); }
    else if (path.includes("cv.html")) { setActive('nav-cv'); setActive('mobile-cv'); setActive('nav-profile-toggle'); }
    else if (path.includes("tutorials")) { setActive('nav-tutorials'); setActive('mobile-tutorials'); setActive('nav-resources-toggle'); }
    else if (path.includes("simulations")) { setActive('nav-simulations'); setActive('mobile-simulations'); setActive('nav-resources-toggle'); }
    else if (path.includes("blog")) { setActive('nav-blog'); setActive('mobile-blog'); }
    else if (path.includes("photography.html")) { setActive('nav-photography'); setActive('mobile-photography'); }
    else if (path.includes("contact.html")) { setActive('nav-contact'); setActive('mobile-contact'); }

    // 5. Initialize Interactive Elements (Scroll & Mobile Toggle)
    const nav = document.getElementById('nav');
    const navToggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    // Scroll Effect
    const handleScroll = () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    // Mobile Menu Toggle
    if (navToggle && mobileMenu) {
        navToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('open');
            // Optional: Animate hamburger icon if CSS supports it
            navToggle.classList.toggle('active');
        });

        // Close mobile menu when clicking a link
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
                navToggle.classList.remove('active');
            });
        });
    }
});
