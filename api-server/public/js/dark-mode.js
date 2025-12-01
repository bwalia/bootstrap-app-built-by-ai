// Dark Mode Toggle Controller
class DarkModeController {
    constructor() {
        this.theme = this.getStoredTheme() || this.getSystemTheme();
        this.init();
    }

    init() {
        this.applyTheme();
        this.createToggleButton();
        this.setupEventListeners();
    }

    getStoredTheme() {
        return localStorage.getItem('theme');
    }

    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('theme', this.theme);
        
        // Update favicon based on theme
        this.updateFavicon();
        
        // Dispatch theme change event
        document.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: this.theme } 
        }));
    }

    updateFavicon() {
        const favicon = document.querySelector('link[rel="icon"]') || document.createElement('link');
        favicon.rel = 'icon';
        favicon.href = this.theme === 'dark' ? '/assets/logo-dark.svg' : '/assets/logo.svg';
        if (!document.querySelector('link[rel="icon"]')) {
            document.head.appendChild(favicon);
        }
    }

    createToggleButton() {
        // Remove existing toggle if it exists
        const existingToggle = document.querySelector('.theme-toggle');
        if (existingToggle) {
            existingToggle.remove();
        }

        const toggle = document.createElement('button');
        toggle.className = 'theme-toggle btn btn-sm';
        toggle.setAttribute('aria-label', 'Toggle theme');
        toggle.innerHTML = this.getToggleIcon();
        
        // Find the user dropdown or create a container
        const userDropdown = document.querySelector('.navbar-nav .dropdown');
        if (userDropdown) {
            userDropdown.parentNode.insertBefore(toggle, userDropdown);
        } else {
            // Fallback: add to navbar
            const navbar = document.querySelector('.navbar-nav');
            if (navbar) {
                const li = document.createElement('li');
                li.className = 'nav-item';
                li.appendChild(toggle);
                navbar.appendChild(li);
            }
        }
    }

    getToggleIcon() {
        return this.theme === 'dark' 
            ? '<i class="fas fa-sun"></i>' 
            : '<i class="fas fa-moon"></i>';
    }

    setupEventListeners() {
        // Toggle button click
        document.addEventListener('click', (e) => {
            if (e.target.closest('.theme-toggle')) {
                this.toggleTheme();
            }
        });

        // System theme change listener
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!this.getStoredTheme()) {
                this.theme = e.matches ? 'dark' : 'light';
                this.applyTheme();
                this.updateToggleButton();
            }
        });

        // Keyboard shortcut (Ctrl/Cmd + Shift + D)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme();
        this.updateToggleButton();
        this.showThemeNotification();
    }

    updateToggleButton() {
        const toggle = document.querySelector('.theme-toggle');
        if (toggle) {
            toggle.innerHTML = this.getToggleIcon();
        }
    }

    showThemeNotification() {
        // Create notification
        const notification = document.createElement('div');
        notification.className = `alert alert-info fade-in position-fixed`;
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 250px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;
        notification.innerHTML = `
            <i class="fas fa-${this.theme === 'dark' ? 'moon' : 'sun'} me-2"></i>
            Switched to ${this.theme} mode
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }, 3000);
    }

    // Public methods
    setTheme(theme) {
        if (['light', 'dark'].includes(theme)) {
            this.theme = theme;
            this.applyTheme();
            this.updateToggleButton();
        }
    }

    getTheme() {
        return this.theme;
    }

    isDark() {
        return this.theme === 'dark';
    }
}

// Initialize dark mode controller
let darkModeController;

document.addEventListener('DOMContentLoaded', function() {
    darkModeController = new DarkModeController();
    
    // Make it globally available
    window.DarkMode = darkModeController;
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DarkModeController;
}