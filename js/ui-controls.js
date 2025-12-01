// UI Controls for Font Size and Language
const UIControls = {
    fontSizes: ['font-small', 'font-medium', 'font-large', 'font-xlarge', 'font-xxlarge'],
    currentFontIndex: 1, // Start at medium

    // Initialize UI controls
    init() {
        // Load saved font size
        const savedFont = localStorage.getItem('app_font_size');
        if (savedFont) {
            const index = this.fontSizes.indexOf(savedFont);
            if (index !== -1) {
                this.currentFontIndex = index;
            }
        }
        this.applyFontSize();

        // Add controls to navbar
        this.addControlsToNavbar();

        // Translate page content
        this.translatePage();
    },

    // Apply font size class to body
    applyFontSize() {
        // Remove all font size classes
        this.fontSizes.forEach(cls => document.body.classList.remove(cls));
        // Add current font size class
        document.body.classList.add(this.fontSizes[this.currentFontIndex]);
        // Save to localStorage
        localStorage.setItem('app_font_size', this.fontSizes[this.currentFontIndex]);
    },

    // Increase font size
    increaseFontSize() {
        if (this.currentFontIndex < this.fontSizes.length - 1) {
            this.currentFontIndex++;
            this.applyFontSize();
        }
    },

    // Decrease font size
    decreaseFontSize() {
        if (this.currentFontIndex > 0) {
            this.currentFontIndex--;
            this.applyFontSize();
        }
    },

    // Reset font size
    resetFontSize() {
        this.currentFontIndex = 1; // Medium
        this.applyFontSize();
    },

    // Add controls to navbar
    addControlsToNavbar() {
        const navbar = document.querySelector('.navbar .navbar-nav');
        if (!navbar) return;

        // Check if controls already exist
        if (document.getElementById('languageDropdown') || document.getElementById('fontDropdown')) {
            return;
        }

        // Create controls container with white text styling
        const controlsHTML = `
            <li class="nav-item dropdown me-3">
                <a class="nav-link dropdown-toggle text-white" href="#" id="languageDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false" style="color: white !important;">
                    <i class="fas fa-language"></i> ${I18nService.getLanguageName(I18nService.getLanguage())}
                </a>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="languageDropdown">
                    <li><a class="dropdown-item language-option" href="#" data-lang="en">English</a></li>
                    <li><a class="dropdown-item language-option" href="#" data-lang="fr">Français</a></li>
                    <li><a class="dropdown-item language-option" href="#" data-lang="nl">Nederlands</a></li>
                    <li><a class="dropdown-item language-option" href="#" data-lang="hi">हिन्दी</a></li>
                </ul>
            </li>
            <li class="nav-item dropdown me-3">
                <a class="nav-link dropdown-toggle text-white" href="#" id="fontDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false" style="color: white !important;">
                    <i class="fas fa-text-height"></i> ${I18nService.t('font.size')}
                </a>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="fontDropdown">
                    <li><a class="dropdown-item" href="#" id="fontDecrease"><i class="fas fa-minus"></i> ${I18nService.t('font.decrease')}</a></li>
                    <li><a class="dropdown-item" href="#" id="fontIncrease"><i class="fas fa-plus"></i> ${I18nService.t('font.increase')}</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" id="fontReset"><i class="fas fa-undo"></i> ${I18nService.t('font.reset')}</a></li>
                </ul>
            </li>
        `;

        // Insert before user email/logout items (right side but before user controls)
        const userEmail = navbar.querySelector('#userEmail');
        if (userEmail && userEmail.parentElement) {
            userEmail.parentElement.insertAdjacentHTML('beforebegin', controlsHTML);
        } else {
            // Fallback: insert at the end
            navbar.insertAdjacentHTML('beforeend', controlsHTML);
        }

        // Add event listeners
        this.attachEventListeners();
    },

    // Attach event listeners
    attachEventListeners() {
        // Font size controls
        const decreaseBtn = document.getElementById('fontDecrease');
        const increaseBtn = document.getElementById('fontIncrease');
        const resetBtn = document.getElementById('fontReset');

        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.decreaseFontSize();
            });
        }

        if (increaseBtn) {
            increaseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.increaseFontSize();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.resetFontSize();
            });
        }

        // Language selection
        document.querySelectorAll('.language-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                const lang = e.target.getAttribute('data-lang');
                if (lang) {
                    I18nService.setLanguage(lang);
                }
            });
        });
    },

    // Translate page content
    translatePage() {
        // Translate elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = I18nService.t(key);

            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });

        // Translate elements with data-i18n-html attribute (for HTML content)
        document.querySelectorAll('[data-i18n-html]').forEach(element => {
            const key = element.getAttribute('data-i18n-html');
            element.innerHTML = I18nService.t(key);
        });
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        UIControls.init();
    });
} else {
    UIControls.init();
}
