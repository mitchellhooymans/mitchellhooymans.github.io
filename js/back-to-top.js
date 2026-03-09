class BackToTop {
    init() {
        // Feature disabled: The back-to-top arrow has been removed
        // as per user request to clean up the bottom of the pages.
    }
}

// Auto-initialize if the script is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BackToTop().init();
});
