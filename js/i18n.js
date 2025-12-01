// Internationalization Service
const I18nService = {
    currentLanguage: 'en',
    supportedLanguages: ['en', 'fr', 'nl', 'hi'],

    translations: {
        en: {
            // Navigation
            'nav.dashboard': 'Dashboard',
            'nav.users': 'Users',
            'nav.groups': 'Groups',
            'nav.roles': 'Roles',
            'nav.logout': 'Logout',

            // Common
            'common.add': 'Add',
            'common.edit': 'Edit',
            'common.delete': 'Delete',
            'common.save': 'Save',
            'common.cancel': 'Cancel',
            'common.close': 'Close',
            'common.refresh': 'Refresh',
            'common.search': 'Search',
            'common.actions': 'Actions',
            'common.status': 'Status',
            'common.active': 'Active',
            'common.inactive': 'Inactive',
            'common.loading': 'Loading...',
            'common.name': 'Name',
            'common.email': 'Email',

            // Dark Mode
            'darkMode.toggle': 'Toggle Dark Mode',
            'darkMode.light': 'Switch to Light Mode',
            'darkMode.dark': 'Switch to Dark Mode',
            'common.description': 'Description',
            'common.createdAt': 'Created At',
            'common.id': 'ID',
            'common.required': 'required',

            // Users
            'users.title': 'Users Management',
            'users.addUser': 'Add User',
            'users.editUser': 'Edit User',
            'users.deleteUser': 'Delete User',
            'users.usersList': 'Users List',
            'users.password': 'Password',
            'users.role': 'Role',
            'users.confirmDelete': 'Are you sure you want to delete this user?',
            'users.deleteWarning': 'This action cannot be undone.',
            'users.passwordHelp': 'Leave blank to keep current password (when editing)',
            'users.loadingUsers': 'Loading users data...',
            'users.searchUsers': 'Search users:',
            'users.showPerPage': 'Show _MENU_ users per page',
            'users.showing': 'Showing _START_ to _END_ of _TOTAL_ users',
            'users.noUsers': 'No users available',
            'users.filtered': '(filtered from _MAX_ total users)',
            'users.noMatching': 'No matching users found',

            // Groups
            'groups.title': 'Groups Management',
            'groups.addGroup': 'Add Group',
            'groups.editGroup': 'Edit Group',
            'groups.deleteGroup': 'Delete Group',
            'groups.groupsList': 'Groups List',
            'groups.confirmDelete': 'Are you sure you want to delete this group?',
            'groups.deleteWarning': 'This action cannot be undone.',
            'groups.loadingGroups': 'Loading groups data...',
            'groups.searchGroups': 'Search groups:',
            'groups.showPerPage': 'Show _MENU_ groups per page',
            'groups.showing': 'Showing _START_ to _END_ of _TOTAL_ groups',
            'groups.noGroups': 'No groups available',
            'groups.filtered': '(filtered from _MAX_ total groups)',
            'groups.noMatching': 'No matching groups found',

            // Roles
            'roles.title': 'Roles Management',
            'roles.addRole': 'Add Role',
            'roles.editRole': 'Edit Role',
            'roles.deleteRole': 'Delete Role',
            'roles.rolesList': 'Roles List',
            'roles.permissions': 'Permissions',
            'roles.confirmDelete': 'Are you sure you want to delete this role?',
            'roles.deleteWarning': 'This action cannot be undone.',
            'roles.loadingRoles': 'Loading roles data...',
            'roles.searchRoles': 'Search roles:',
            'roles.showPerPage': 'Show _MENU_ roles per page',
            'roles.showing': 'Showing _START_ to _END_ of _TOTAL_ roles',
            'roles.noRoles': 'No roles available',
            'roles.filtered': '(filtered from _MAX_ total roles)',
            'roles.noMatching': 'No matching roles found',
            'roles.permRead': 'Read',
            'roles.permWrite': 'Write',
            'roles.permDelete': 'Delete',
            'roles.permAdmin': 'Admin',

            // Login
            'login.title': 'Login Required',
            'login.email': 'Email',
            'login.password': 'Password',
            'login.loginButton': 'Login',
            'login.loggingIn': 'Logging in...',

            // Messages
            'msg.confirmDelete': 'Confirm Delete',
            'msg.saveSuccess': 'Saved successfully',
            'msg.deleteSuccess': 'Deleted successfully',
            'msg.loadSuccess': 'Loaded successfully',
            'msg.error': 'Error',

            // Font Size
            'font.size': 'Font Size',
            'font.decrease': 'Decrease Font Size',
            'font.increase': 'Increase Font Size',
            'font.reset': 'Reset Font Size',
        },

        fr: {
            // Navigation
            'nav.dashboard': 'Tableau de bord',
            'nav.users': 'Utilisateurs',
            'nav.groups': 'Groupes',
            'nav.roles': 'Rôles',
            'nav.logout': 'Déconnexion',

            // Common
            'common.add': 'Ajouter',
            'common.edit': 'Modifier',
            'common.delete': 'Supprimer',
            'common.save': 'Enregistrer',
            'common.cancel': 'Annuler',
            'common.close': 'Fermer',
            'common.refresh': 'Actualiser',
            'common.search': 'Rechercher',
            'common.actions': 'Actions',
            'common.status': 'Statut',
            'common.active': 'Actif',
            'common.inactive': 'Inactif',
            'common.loading': 'Chargement...',
            'common.name': 'Nom',
            'common.email': 'E-mail',
            'common.description': 'Description',
            'common.createdAt': 'Créé le',
            'common.id': 'ID',
            'common.required': 'requis',

            // Users
            'users.title': 'Gestion des utilisateurs',
            'users.addUser': 'Ajouter un utilisateur',
            'users.editUser': 'Modifier l\'utilisateur',
            'users.deleteUser': 'Supprimer l\'utilisateur',
            'users.usersList': 'Liste des utilisateurs',
            'users.password': 'Mot de passe',
            'users.role': 'Rôle',
            'users.confirmDelete': 'Êtes-vous sûr de vouloir supprimer cet utilisateur?',
            'users.deleteWarning': 'Cette action ne peut pas être annulée.',
            'users.passwordHelp': 'Laisser vide pour conserver le mot de passe actuel (lors de la modification)',
            'users.loadingUsers': 'Chargement des données utilisateurs...',
            'users.searchUsers': 'Rechercher des utilisateurs:',
            'users.showPerPage': 'Afficher _MENU_ utilisateurs par page',
            'users.showing': 'Affichage de _START_ à _END_ sur _TOTAL_ utilisateurs',
            'users.noUsers': 'Aucun utilisateur disponible',
            'users.filtered': '(filtré à partir de _MAX_ utilisateurs totaux)',
            'users.noMatching': 'Aucun utilisateur correspondant trouvé',

            // Groups
            'groups.title': 'Gestion des groupes',
            'groups.addGroup': 'Ajouter un groupe',
            'groups.editGroup': 'Modifier le groupe',
            'groups.deleteGroup': 'Supprimer le groupe',
            'groups.groupsList': 'Liste des groupes',
            'groups.confirmDelete': 'Êtes-vous sûr de vouloir supprimer ce groupe?',
            'groups.deleteWarning': 'Cette action ne peut pas être annulée.',
            'groups.loadingGroups': 'Chargement des données de groupe...',
            'groups.searchGroups': 'Rechercher des groupes:',
            'groups.showPerPage': 'Afficher _MENU_ groupes par page',
            'groups.showing': 'Affichage de _START_ à _END_ sur _TOTAL_ groupes',
            'groups.noGroups': 'Aucun groupe disponible',
            'groups.filtered': '(filtré à partir de _MAX_ groupes totaux)',
            'groups.noMatching': 'Aucun groupe correspondant trouvé',

            // Roles
            'roles.title': 'Gestion des rôles',
            'roles.addRole': 'Ajouter un rôle',
            'roles.editRole': 'Modifier le rôle',
            'roles.deleteRole': 'Supprimer le rôle',
            'roles.rolesList': 'Liste des rôles',
            'roles.permissions': 'Autorisations',
            'roles.confirmDelete': 'Êtes-vous sûr de vouloir supprimer ce rôle?',
            'roles.deleteWarning': 'Cette action ne peut pas être annulée.',
            'roles.loadingRoles': 'Chargement des données de rôle...',
            'roles.searchRoles': 'Rechercher des rôles:',
            'roles.showPerPage': 'Afficher _MENU_ rôles par page',
            'roles.showing': 'Affichage de _START_ à _END_ sur _TOTAL_ rôles',
            'roles.noRoles': 'Aucun rôle disponible',
            'roles.filtered': '(filtré à partir de _MAX_ rôles totaux)',
            'roles.noMatching': 'Aucun rôle correspondant trouvé',
            'roles.permRead': 'Lire',
            'roles.permWrite': 'Écrire',
            'roles.permDelete': 'Supprimer',
            'roles.permAdmin': 'Administrateur',

            // Login
            'login.title': 'Connexion requise',
            'login.email': 'E-mail',
            'login.password': 'Mot de passe',
            'login.loginButton': 'Se connecter',
            'login.loggingIn': 'Connexion en cours...',

            // Messages
            'msg.confirmDelete': 'Confirmer la suppression',
            'msg.saveSuccess': 'Enregistré avec succès',
            'msg.deleteSuccess': 'Supprimé avec succès',
            'msg.loadSuccess': 'Chargé avec succès',
            'msg.error': 'Erreur',

            // Font Size
            'font.size': 'Taille de police',
            'font.decrease': 'Diminuer la taille de police',
            'font.increase': 'Augmenter la taille de police',
            'font.reset': 'Réinitialiser la taille de police',
        },

        nl: {
            // Navigation
            'nav.dashboard': 'Dashboard',
            'nav.users': 'Gebruikers',
            'nav.groups': 'Groepen',
            'nav.roles': 'Rollen',
            'nav.logout': 'Uitloggen',

            // Common
            'common.add': 'Toevoegen',
            'common.edit': 'Bewerken',
            'common.delete': 'Verwijderen',
            'common.save': 'Opslaan',
            'common.cancel': 'Annuleren',
            'common.close': 'Sluiten',
            'common.refresh': 'Vernieuwen',
            'common.search': 'Zoeken',
            'common.actions': 'Acties',
            'common.status': 'Status',
            'common.active': 'Actief',
            'common.inactive': 'Inactief',
            'common.loading': 'Laden...',
            'common.name': 'Naam',
            'common.email': 'E-mail',
            'common.description': 'Beschrijving',
            'common.createdAt': 'Aangemaakt op',
            'common.id': 'ID',
            'common.required': 'verplicht',

            // Users
            'users.title': 'Gebruikersbeheer',
            'users.addUser': 'Gebruiker toevoegen',
            'users.editUser': 'Gebruiker bewerken',
            'users.deleteUser': 'Gebruiker verwijderen',
            'users.usersList': 'Gebruikerslijst',
            'users.password': 'Wachtwoord',
            'users.role': 'Rol',
            'users.confirmDelete': 'Weet u zeker dat u deze gebruiker wilt verwijderen?',
            'users.deleteWarning': 'Deze actie kan niet ongedaan worden gemaakt.',
            'users.passwordHelp': 'Laat leeg om het huidige wachtwoord te behouden (bij bewerken)',
            'users.loadingUsers': 'Gebruikersgegevens laden...',
            'users.searchUsers': 'Zoek gebruikers:',
            'users.showPerPage': 'Toon _MENU_ gebruikers per pagina',
            'users.showing': 'Toont _START_ tot _END_ van _TOTAL_ gebruikers',
            'users.noUsers': 'Geen gebruikers beschikbaar',
            'users.filtered': '(gefilterd van _MAX_ totale gebruikers)',
            'users.noMatching': 'Geen overeenkomende gebruikers gevonden',

            // Groups
            'groups.title': 'Groepenbeheer',
            'groups.addGroup': 'Groep toevoegen',
            'groups.editGroup': 'Groep bewerken',
            'groups.deleteGroup': 'Groep verwijderen',
            'groups.groupsList': 'Groepenlijst',
            'groups.confirmDelete': 'Weet u zeker dat u deze groep wilt verwijderen?',
            'groups.deleteWarning': 'Deze actie kan niet ongedaan worden gemaakt.',
            'groups.loadingGroups': 'Groepsgegevens laden...',
            'groups.searchGroups': 'Zoek groepen:',
            'groups.showPerPage': 'Toon _MENU_ groepen per pagina',
            'groups.showing': 'Toont _START_ tot _END_ van _TOTAL_ groepen',
            'groups.noGroups': 'Geen groepen beschikbaar',
            'groups.filtered': '(gefilterd van _MAX_ totale groepen)',
            'groups.noMatching': 'Geen overeenkomende groepen gevonden',

            // Roles
            'roles.title': 'Rollenbeheer',
            'roles.addRole': 'Rol toevoegen',
            'roles.editRole': 'Rol bewerken',
            'roles.deleteRole': 'Rol verwijderen',
            'roles.rolesList': 'Rollenlijst',
            'roles.permissions': 'Rechten',
            'roles.confirmDelete': 'Weet u zeker dat u deze rol wilt verwijderen?',
            'roles.deleteWarning': 'Deze actie kan niet ongedaan worden gemaakt.',
            'roles.loadingRoles': 'Rolgegevens laden...',
            'roles.searchRoles': 'Zoek rollen:',
            'roles.showPerPage': 'Toon _MENU_ rollen per pagina',
            'roles.showing': 'Toont _START_ tot _END_ van _TOTAL_ rollen',
            'roles.noRoles': 'Geen rollen beschikbaar',
            'roles.filtered': '(gefilterd van _MAX_ totale rollen)',
            'roles.noMatching': 'Geen overeenkomende rollen gevonden',
            'roles.permRead': 'Lezen',
            'roles.permWrite': 'Schrijven',
            'roles.permDelete': 'Verwijderen',
            'roles.permAdmin': 'Beheerder',

            // Login
            'login.title': 'Inloggen vereist',
            'login.email': 'E-mail',
            'login.password': 'Wachtwoord',
            'login.loginButton': 'Inloggen',
            'login.loggingIn': 'Inloggen...',

            // Messages
            'msg.confirmDelete': 'Verwijdering bevestigen',
            'msg.saveSuccess': 'Succesvol opgeslagen',
            'msg.deleteSuccess': 'Succesvol verwijderd',
            'msg.loadSuccess': 'Succesvol geladen',
            'msg.error': 'Fout',

            // Font Size
            'font.size': 'Lettergrootte',
            'font.decrease': 'Lettergrootte verkleinen',
            'font.increase': 'Lettergrootte vergroten',
            'font.reset': 'Lettergrootte resetten',
        },

        hi: {
            // Navigation
            'nav.dashboard': 'डैशबोर्ड',
            'nav.users': 'उपयोगकर्ता',
            'nav.groups': 'समूह',
            'nav.roles': 'भूमिकाएँ',
            'nav.logout': 'लॉग आउट',

            // Common
            'common.add': 'जोड़ें',
            'common.edit': 'संपादित करें',
            'common.delete': 'हटाएं',
            'common.save': 'सहेजें',
            'common.cancel': 'रद्द करें',
            'common.close': 'बंद करें',
            'common.refresh': 'ताज़ा करें',
            'common.search': 'खोजें',
            'common.actions': 'क्रियाएँ',
            'common.status': 'स्थिति',
            'common.active': 'सक्रिय',
            'common.inactive': 'निष्क्रिय',
            'common.loading': 'लोड हो रहा है...',
            'common.name': 'नाम',
            'common.email': 'ईमेल',
            'common.description': 'विवरण',
            'common.createdAt': 'बनाया गया',
            'common.id': 'आईडी',
            'common.required': 'आवश्यक',

            // Users
            'users.title': 'उपयोगकर्ता प्रबंधन',
            'users.addUser': 'उपयोगकर्ता जोड़ें',
            'users.editUser': 'उपयोगकर्ता संपादित करें',
            'users.deleteUser': 'उपयोगकर्ता हटाएं',
            'users.usersList': 'उपयोगकर्ता सूची',
            'users.password': 'पासवर्ड',
            'users.role': 'भूमिका',
            'users.confirmDelete': 'क्या आप वाकई इस उपयोगकर्ता को हटाना चाहते हैं?',
            'users.deleteWarning': 'यह क्रिया पूर्ववत नहीं की जा सकती।',
            'users.passwordHelp': 'वर्तमान पासवर्ड रखने के लिए खाली छोड़ें (संपादन करते समय)',
            'users.loadingUsers': 'उपयोगकर्ता डेटा लोड हो रहा है...',
            'users.searchUsers': 'उपयोगकर्ता खोजें:',
            'users.showPerPage': 'प्रति पृष्ठ _MENU_ उपयोगकर्ता दिखाएं',
            'users.showing': '_TOTAL_ में से _START_ से _END_ तक दिखा रहे हैं',
            'users.noUsers': 'कोई उपयोगकर्ता उपलब्ध नहीं',
            'users.filtered': '(_MAX_ कुल उपयोगकर्ताओं से फ़िल्टर किया गया)',
            'users.noMatching': 'कोई मेल खाता उपयोगकर्ता नहीं मिला',

            // Groups
            'groups.title': 'समूह प्रबंधन',
            'groups.addGroup': 'समूह जोड़ें',
            'groups.editGroup': 'समूह संपादित करें',
            'groups.deleteGroup': 'समूह हटाएं',
            'groups.groupsList': 'समूह सूची',
            'groups.confirmDelete': 'क्या आप वाकई इस समूह को हटाना चाहते हैं?',
            'groups.deleteWarning': 'यह क्रिया पूर्ववत नहीं की जा सकती।',
            'groups.loadingGroups': 'समूह डेटा लोड हो रहा है...',
            'groups.searchGroups': 'समूह खोजें:',
            'groups.showPerPage': 'प्रति पृष्ठ _MENU_ समूह दिखाएं',
            'groups.showing': '_TOTAL_ में से _START_ से _END_ तक दिखा रहे हैं',
            'groups.noGroups': 'कोई समूह उपलब्ध नहीं',
            'groups.filtered': '(_MAX_ कुल समूहों से फ़िल्टर किया गया)',
            'groups.noMatching': 'कोई मेल खाता समूह नहीं मिला',

            // Roles
            'roles.title': 'भूमिका प्रबंधन',
            'roles.addRole': 'भूमिका जोड़ें',
            'roles.editRole': 'भूमिका संपादित करें',
            'roles.deleteRole': 'भूमिका हटाएं',
            'roles.rolesList': 'भूमिका सूची',
            'roles.permissions': 'अनुमतियाँ',
            'roles.confirmDelete': 'क्या आप वाकई इस भूमिका को हटाना चाहते हैं?',
            'roles.deleteWarning': 'यह क्रिया पूर्ववत नहीं की जा सकती।',
            'roles.loadingRoles': 'भूमिका डेटा लोड हो रहा है...',
            'roles.searchRoles': 'भूमिका खोजें:',
            'roles.showPerPage': 'प्रति पृष्ठ _MENU_ भूमिकाएँ दिखाएं',
            'roles.showing': '_TOTAL_ में से _START_ से _END_ तक दिखा रहे हैं',
            'roles.noRoles': 'कोई भूमिका उपलब्ध नहीं',
            'roles.filtered': '(_MAX_ कुल भूमिकाओं से फ़िल्टर किया गया)',
            'roles.noMatching': 'कोई मेल खाती भूमिका नहीं मिली',
            'roles.permRead': 'पढ़ें',
            'roles.permWrite': 'लिखें',
            'roles.permDelete': 'हटाएं',
            'roles.permAdmin': 'व्यवस्थापक',

            // Login
            'login.title': 'लॉगिन आवश्यक',
            'login.email': 'ईमेल',
            'login.password': 'पासवर्ड',
            'login.loginButton': 'लॉगिन',
            'login.loggingIn': 'लॉगिन हो रहा है...',

            // Messages
            'msg.confirmDelete': 'हटाने की पुष्टि करें',
            'msg.saveSuccess': 'सफलतापूर्वक सहेजा गया',
            'msg.deleteSuccess': 'सफलतापूर्वक हटाया गया',
            'msg.loadSuccess': 'सफलतापूर्वक लोड किया गया',
            'msg.error': 'त्रुटि',

            // Font Size
            'font.size': 'फ़ॉन्ट आकार',
            'font.decrease': 'फ़ॉन्ट आकार घटाएं',
            'font.increase': 'फ़ॉन्ट आकार बढ़ाएं',
            'font.reset': 'फ़ॉन्ट आकार रीसेट करें',
        }
    },

    // Initialize i18n
    init() {
        // Detect browser language
        const browserLang = navigator.language || navigator.userLanguage;
        const langCode = browserLang.split('-')[0]; // Get 'en' from 'en-US'

        // Set language from localStorage or browser default
        const savedLang = localStorage.getItem('app_language');
        if (savedLang && this.supportedLanguages.includes(savedLang)) {
            this.currentLanguage = savedLang;
        } else if (this.supportedLanguages.includes(langCode)) {
            this.currentLanguage = langCode;
        }

        console.log('I18n initialized with language:', this.currentLanguage);
    },

    // Get translation
    t(key) {
        const translation = this.translations[this.currentLanguage]?.[key];
        return translation || key;
    },

    // Set language
    setLanguage(lang) {
        if (this.supportedLanguages.includes(lang)) {
            this.currentLanguage = lang;
            localStorage.setItem('app_language', lang);
            // Reload page to apply translations
            window.location.reload();
        }
    },

    // Get current language
    getLanguage() {
        return this.currentLanguage;
    },

    // Get language name
    getLanguageName(lang) {
        const names = {
            'en': 'English',
            'fr': 'Français',
            'nl': 'Nederlands',
            'hi': 'हिन्दी'
        };
        return names[lang] || lang;
    }
};

// Initialize on load
I18nService.init();
