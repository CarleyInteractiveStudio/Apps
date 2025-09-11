document.addEventListener('DOMContentLoaded', () => {
    const startMenuButton = document.getElementById('start-menu-button');
    const appPanel = document.getElementById('app-panel');

    if (startMenuButton && appPanel) {
        startMenuButton.addEventListener('click', (event) => {
            // Stop the click from bubbling up to the document listener
            event.stopPropagation();
            appPanel.classList.toggle('hidden');
        });

        // Close the panel if user clicks outside of it
        document.addEventListener('click', (event) => {
            // If the click is outside the app panel and the panel is not hidden
            if (!appPanel.contains(event.target) && !appPanel.classList.contains('hidden')) {
                appPanel.classList.add('hidden');
            }
        });

        // Also close with the "Escape" key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !appPanel.classList.contains('hidden')) {
                appPanel.classList.add('hidden');
            }
        });
    }
});
