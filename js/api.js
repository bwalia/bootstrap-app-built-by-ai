// API Service
const ApiService = {
    API_URL: 'https://opsapi.workstation.co.uk',

    // Make authenticated request
    async request(endpoint, options = {}) {
        const token = AuthService.getToken();

        if (!token) {
            throw new Error('No authentication token found');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        try {
            const response = await fetch(`${this.API_URL}${endpoint}`, {
                ...options,
                headers
            });

            // Check if unauthorized
            if (response.status === 401) {
                AuthService.logout();
                window.location.reload();
                throw new Error('Unauthorized. Please login again.');
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    },

    // Get all users
    async getUsers() {
        try {
            // Try different possible endpoints for users
            const possibleEndpoints = ['/users', '/api/users', '/user', '/api/user'];

            for (const endpoint of possibleEndpoints) {
                try {
                    const data = await this.request(endpoint);
                    // If successful, return the data
                    return data;
                } catch (error) {
                    // If it's a 404, try the next endpoint
                    if (error.message.includes('404')) {
                        continue;
                    }
                    // For other errors, throw them
                    throw error;
                }
            }

            // If all endpoints failed
            throw new Error('Could not find users endpoint');
        } catch (error) {
            console.error('Get users error:', error);
            throw error;
        }
    }
};
