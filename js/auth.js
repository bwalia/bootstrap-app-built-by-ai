// Authentication Service
const AuthService = {
    API_URL: 'https://opsapi.workstation.co.uk',
    TOKEN_KEY: 'api_token',
    USER_KEY: 'user_data',

    // Login to API and get token
    async login(email, password) {
        try {
            const response = await fetch(`${this.API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Login failed');
            }

            const data = await response.json();

            // Store token and user data
            if (data.token || data.access_token) {
                const token = data.token || data.access_token;
                this.setToken(token);
                this.setUserData(data.user || { email: email });
                return data;
            } else {
                throw new Error('No token received from server');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // Store token in localStorage
    setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    },

    // Get token from localStorage
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    // Store user data
    setUserData(userData) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
    },

    // Get user data
    getUserData() {
        const data = localStorage.getItem(this.USER_KEY);
        return data ? JSON.parse(data) : null;
    },

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getToken();
    },

    // Logout
    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    }
};
