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
        <div class="footer-container">
            <footer class="footer-pill">
                <div class="footer-pill-content">
                    <p class="footer-copyright">&copy; <span id="year">${this.year}</span> Mitchell Hooymans.</p>
                    <div class="social-links-pill">
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
            </footer>
        </div>
        `;

        const placeholder = document.getElementById('footer-placeholder');
        if (placeholder) {
            placeholder.innerHTML = footerHTML;
        } else {
            console.error('Footer placeholder not found!');
        }
    }
}
