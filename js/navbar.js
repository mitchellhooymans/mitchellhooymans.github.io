document.addEventListener('DOMContentLoaded', () => {
    // 1. Determine Relative Path
    const path = window.location.pathname;

    // Check depth based on known subdirectories
    // If we are in pages, simulations, tutorials (non-interactive), tools, or blog
    let rootPath = "./";
    if (path.includes("/pages/") || path.includes("/simulations/") || path.includes("/tutorials/") || path.includes("/tools/") || path.includes("/blog/")) {
        rootPath = "../";
    }

    // NOTE: This logic assumes a flat structure within these subdirectories (depth 1).
    // If nested folders are added (e.g. tutorials/advanced/), this logic will need update.

    // 2. Define Navigation HTML
    // We use rootPath to ensure links point to the correct location
    const navHTML = `
    <nav class="nav" id="nav">
        <canvas id="brand-particles"></canvas>
        <div class="nav-content">
            <a href="${rootPath}" class="nav-brand" id="navBrand">
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
                        <a href="${rootPath}pages/tools.html" id="nav-tools">Tools</a>
                        <a href="${rootPath}pages/talks.html" id="nav-talks">Talks</a>
                    </div>
                </li>
                <li><a href="${rootPath}pages/blog.html" id="nav-blog">Blog</a></li>
                <li><a href="${rootPath}pages/photography.html" id="nav-photography">Photography</a></li>
                <li><a href="${rootPath}pages/contact.html" id="nav-contact">Contact</a></li>
                <li><button class="nav-search-btn" id="navSearchTrigger" aria-label="Search">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon-svg">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </button></li>
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
        <a href="${rootPath}pages/tools.html" id="mobile-tools">Tools</a>
        <a href="${rootPath}pages/talks.html" id="mobile-talks">Talks</a>
        <a href="${rootPath}pages/blog.html" id="mobile-blog">Blog</a>
        <a href="${rootPath}pages/photography.html" id="mobile-photography">Photography</a>
        <a href="${rootPath}pages/contact.html" id="mobile-contact">Contact</a>
        <a href="javascript:void(0)" id="mobileSearchTrigger" style="color: var(--color-accent);">Search Site <i class="fas fa-search"></i></a>
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
    else if (path.includes("tools")) { setActive('nav-tools'); setActive('mobile-tools'); setActive('nav-resources-toggle'); }
    else if (path.includes("talks")) { setActive('nav-talks'); setActive('mobile-talks'); setActive('nav-resources-toggle'); }
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
    // 6. Navbar Starfield Effect
    // A quiet field of stars twinkles across the whole navbar on hover, with the
    // occasional shooting star gliding past. Simple, calm, and unmistakably
    // astrophysical - no orbits or physics required.
    const brandCanvas = document.getElementById('brand-particles');
    const brandLink = document.getElementById('navBrand');
    const navContainer = document.getElementById('nav');

    if (brandCanvas && brandLink && navContainer) {
        const ctx = brandCanvas.getContext('2d');

        const starConfig = {
            starCount: 55,             // Number of twinkling stars across the navbar
            twinkleSpeedMin: 0.03,     // Slowest twinkle rate
            twinkleSpeedMax: 0.09,     // Fastest twinkle rate
            fadeSpeed: 0.05,           // Fade-out rate once the mouse leaves
            shootingStarInterval: 130  // Average frames between shooting stars
        };

        let stars = [];
        let shootingStars = [];
        let animationId = null;
        let isHovering = false;
        let frameCount = 0;
        let sceneLife = 0; // Fades the whole effect in/out on hover

        function resizeCanvas() {
            brandCanvas.width = navContainer.offsetWidth;
            brandCanvas.height = navContainer.offsetHeight;
        }

        // Initialize canvas size
        setTimeout(resizeCanvas, 100); // Small delay to ensure rendering
        window.addEventListener('resize', resizeCanvas);

        function getArea() {
            // The whole navbar, edge to edge
            return { x: 0, y: 0, w: brandCanvas.width, h: brandCanvas.height };
        }

        class Star {
            constructor(area) {
                this.x = area.x + Math.random() * area.w;
                this.y = area.y + Math.random() * area.h;
                this.size = 0.6 + Math.random() * 1.3;
                this.phase = Math.random() * Math.PI * 2;
                this.speed = starConfig.twinkleSpeedMin + Math.random() * (starConfig.twinkleSpeedMax - starConfig.twinkleSpeedMin);
                this.color = Math.random() > 0.7 ? '56, 189, 248' : '255, 255, 255';
            }
            draw(alpha) {
                const twinkle = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(frameCount * this.speed + this.phase));
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${this.color}, ${twinkle * alpha})`;
                ctx.fill();
            }
        }

        class ShootingStar {
            constructor(area) {
                this.x = area.x - 20;
                this.y = area.y + Math.random() * area.h * 0.5;
                const speed = 6 + Math.random() * 3;
                const angle = 0.16 + Math.random() * 0.12; // Gentle downward diagonal
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
                this.tailLength = 22 + Math.random() * 14;
                this.life = 1;
                this.area = area;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.life -= 0.012;
                if (this.x > this.area.w + 30 || this.y > this.area.h + 30) {
                    this.life = 0;
                }
            }
            draw(alpha) {
                const mag = Math.hypot(this.vx, this.vy) || 1;
                const tailX = this.x - (this.vx / mag) * this.tailLength;
                const tailY = this.y - (this.vy / mag) * this.tailLength;
                const a = Math.max(0, this.life) * alpha;

                const grad = ctx.createLinearGradient(tailX, tailY, this.x, this.y);
                grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
                grad.addColorStop(1, `rgba(255, 255, 255, ${a})`);
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1.3;
                ctx.beginPath();
                ctx.moveTo(tailX, tailY);
                ctx.lineTo(this.x, this.y);
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(this.x, this.y, 1.2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
                ctx.fill();
            }
        }

        function animate() {
            ctx.clearRect(0, 0, brandCanvas.width, brandCanvas.height);
            frameCount++;

            sceneLife = isHovering
                ? Math.min(1, sceneLife + 0.08)
                : Math.max(0, sceneLife - starConfig.fadeSpeed);

            if (isHovering) {
                const area = getArea();

                if (stars.length < starConfig.starCount) {
                    stars.push(new Star(area));
                }

                if (Math.random() < 1 / starConfig.shootingStarInterval && shootingStars.length < 2) {
                    shootingStars.push(new ShootingStar(area));
                }
            }

            if (sceneLife > 0) {
                for (let i = 0; i < stars.length; i++) {
                    stars[i].draw(sceneLife);
                }
            }

            for (let i = 0; i < shootingStars.length; i++) {
                shootingStars[i].update();
                shootingStars[i].draw(sceneLife);
                if (shootingStars[i].life <= 0) {
                    shootingStars.splice(i, 1);
                    i--;
                }
            }

            if (sceneLife <= 0) {
                stars = [];
            }

            if (sceneLife > 0 || shootingStars.length > 0 || isHovering) {
                animationId = requestAnimationFrame(animate);
            } else {
                animationId = null;
            }
        }

        navContainer.addEventListener('mouseenter', () => {
            isHovering = true;
            resizeCanvas(); // Ensure correct size on hover
            if (!animationId) {
                animate();
            }
        });

        navContainer.addEventListener('mouseleave', () => {
            isHovering = false;
        });
    }

    // 7. Inject Search Module 
    if (!document.getElementById('site-search-script')) {
        const searchScript = document.createElement('script');
        searchScript.id = 'site-search-script';
        searchScript.src = `${rootPath}js/search.js`;
        document.body.appendChild(searchScript);
    }
});
