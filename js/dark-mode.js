// Dark Mode Toggle
const DarkMode = {
    STORAGE_KEY: 'dark_mode',

    // Initialize dark mode
    init() {
        // Check if dark mode was previously enabled
        const isDarkMode = this.isEnabled();
        if (isDarkMode) {
            this.enable();
        }

        // Add toggle button to controls container
        this.addToggleButton();
    },

    // Check if dark mode is enabled
    isEnabled() {
        return localStorage.getItem(this.STORAGE_KEY) === 'true';
    },

    // Enable dark mode
    enable() {
        document.body.classList.add('dark-mode');
        localStorage.setItem(this.STORAGE_KEY, 'true');
        this.updateToggleIcon();
    },

    // Disable dark mode
    disable() {
        document.body.classList.remove('dark-mode');
        localStorage.setItem(this.STORAGE_KEY, 'false');
        this.updateToggleIcon();
    },

    // Toggle dark mode
    toggle() {
        if (this.isEnabled()) {
            this.disable();
        } else {
            this.enable();
        }
    },

    // Add toggle button to controls container
    addToggleButton() {
        const controlsContainer = document.querySelector('.controls-container');
        if (controlsContainer) {
            const toggleButton = document.createElement('button');
            toggleButton.id = 'darkModeToggle';
            toggleButton.className = 'dark-mode-toggle';
            toggleButton.innerHTML = '<i class="fas fa-moon"></i>';
            toggleButton.title = 'Toggle Dark Mode';
            toggleButton.setAttribute('data-i18n-title', 'darkMode.toggle');

            toggleButton.addEventListener('click', () => {
                this.toggle();
            });

            controlsContainer.appendChild(toggleButton);
            this.updateToggleIcon();
        }
    },

    // Update toggle icon based on current mode
    updateToggleIcon() {
        const toggleButton = document.getElementById('darkModeToggle');
        if (toggleButton) {
            if (this.isEnabled()) {
                toggleButton.innerHTML = '<i class="fas fa-sun"></i>';
                toggleButton.title = 'Switch to Light Mode';
            } else {
                toggleButton.innerHTML = '<i class="fas fa-moon"></i>';
                toggleButton.title = 'Switch to Dark Mode';
            }
        }
    }
};

// Initialize dark mode when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    DarkMode.init();
});
