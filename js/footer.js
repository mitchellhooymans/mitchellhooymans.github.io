/**
 * usage: <script src="path/to/footer.js"></script>
 *        <div id="footer-placeholder"></div>
 *        <script>new Footer().init('path/to/root/');</script>
 */

class Footer {
    constructor() {
        this.year = new Date().getFullYear();
    }

    init(rootPath = './') {
        const footerHTML = `
        <footer class="footer">
            <div class="container">
                <div class="footer-content">
                    <div>
                        <a href="${rootPath}index.html" class="footer-brand">Mitchell Hooymans</a>
                        <p class="footer-tagline">Astrophysicist & STEM Communicator</p>
                        <div class="social-links" style="margin-top: var(--space-4);">
                            <a href="https://www.linkedin.com/in/mitchell-hooymans/" class="social-link"
                                aria-label="LinkedIn" target="_blank">
                                <i class="fab fa-linkedin-in"></i>
                            </a>
                            <a href="https://github.com/mitchellhooymans" class="social-link" aria-label="GitHub"
                                target="_blank">
                                <i class="fab fa-github"></i>
                            </a>
                            <a href="mailto:m.hooymans@uq.edu.au" class="social-link" aria-label="Email">
                                <i class="fas fa-envelope"></i>
                            </a>
                        </div>
                    </div>
    
                    <div class="footer-links">
                        <h4 style="margin-bottom: var(--space-4);">Quick Links</h4>
                        <ul style="list-style: none;">
                            <li class="mb-2"><a href="${rootPath}pages/about.html" style="color: var(--color-gray-400);">About Me</a></li>
                            <li class="mb-2"><a href="${rootPath}pages/tutorials.html" style="color: var(--color-gray-400);">Tutorials</a></li>
                            <li class="mb-2"><a href="${rootPath}pages/simulations.html" style="color: var(--color-gray-400);">Simulations</a></li>
                            <li class="mb-2"><a href="${rootPath}pages/blog.html" style="color: var(--color-gray-400);">Blog</a></li>
                        </ul>
                    </div>
    
                    <div class="footer-about" style="max-width: 300px;">
                        <h4 style="margin-bottom: var(--space-4);">About</h4>
                        <p style="font-size: 0.9rem;">
                            PhD researcher at UQ resolving black hole dynamics in star clusters. Passionate about making
                            complex physics accessible through code and interactive simulations.
                        </p>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p>&copy; <span id="year">${this.year}</span> Mitchell Hooymans. All Rights Reserved.</p>
                </div>
            </div>
        </footer>
        `;

        const placeholder = document.getElementById('footer-placeholder');
        if (placeholder) {
            placeholder.innerHTML = footerHTML;
        } else {
            console.error('Footer placeholder not found!');
        }
    }
}
