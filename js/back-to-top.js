class BackToTop {
    init() {
        // Inject HTML
        const buttonHTML = `
        <button id="backToTop" class="back-to-top" aria-label="Back to Top">
            <i class="fas fa-arrow-up"></i>
        </button>
        `;
        document.body.insertAdjacentHTML('beforeend', buttonHTML);

        // Add Event Listeners
        const backToTopBtn = document.getElementById('backToTop');

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Auto-initialize if the script is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BackToTop().init();
});
