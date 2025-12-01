// Dashboard functionality
const Dashboard = {
    // Initialize dashboard
    async init() {
        console.log('Initializing dashboard...');
        console.log('AuthService available:', typeof AuthService);
        console.log('AuthService.isAuthenticated:', typeof AuthService.isAuthenticated);
        
        // Check authentication
        if (!AuthService.isAuthenticated()) {
            console.log('User not authenticated, redirecting to login');
            window.location.href = '/login.html';
            return;
        }
        
        console.log('User authenticated, proceeding with dashboard initialization');
        
        // Load dashboard data
        await this.loadDashboardData();
        
        // Setup refresh button
        this.setupRefreshButton();
        
        console.log('Dashboard initialized successfully');
    },
    
    // Load all dashboard data
    async loadDashboardData() {
        try {
            console.log('Loading dashboard data...');
            
            // Load data in parallel
            const [usersData, projectsData, tasksData, timesheetsData] = await Promise.allSettled([
                this.loadUsersCount(),
                this.loadProjectsCount(),
                this.loadTasksCount(),
                this.loadTimesheetsCount()
            ]);
            
            // Update UI with loaded data
            this.updateDashboardCards(usersData, projectsData, tasksData, timesheetsData);
            
            // Load recent activity
            await this.loadRecentActivity();
            
            console.log('Dashboard data loaded successfully');
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data');
        }
    },
    
    // Load users count
    async loadUsersCount() {
        try {
            const response = await ApiService.getUsers();
            let users = [];
            
            if (Array.isArray(response)) {
                users = response;
            } else if (response.data && Array.isArray(response.data)) {
                users = response.data;
            } else if (response.users && Array.isArray(response.users)) {
                users = response.users;
            }
            
            return users.length;
        } catch (error) {
            console.error('Error loading users count:', error);
            return 0;
        }
    },
    
    // Load projects count
    async loadProjectsCount() {
        try {
            const response = await ApiService.getProjects();
            let projects = [];
            
            if (Array.isArray(response)) {
                projects = response;
            } else if (response.data && Array.isArray(response.data)) {
                projects = response.data;
            } else if (response.projects && Array.isArray(response.projects)) {
                projects = response.projects;
            }
            
            return projects.length;
        } catch (error) {
            console.error('Error loading projects count:', error);
            return 0;
        }
    },
    
    // Load tasks count
    async loadTasksCount() {
        try {
            const response = await ApiService.getTasks();
            let tasks = [];
            
            if (Array.isArray(response)) {
                tasks = response;
            } else if (response.data && Array.isArray(response.data)) {
                tasks = response.data;
            } else if (response.tasks && Array.isArray(response.tasks)) {
                tasks = response.tasks;
            }
            
            return tasks.length;
        } catch (error) {
            console.error('Error loading tasks count:', error);
            return 0;
        }
    },
    
    // Load timesheets count and calculate weekly hours
    async loadTimesheetsCount() {
        try {
            const response = await ApiService.getTimesheets();
            let timesheets = [];
            
            if (Array.isArray(response)) {
                timesheets = response;
            } else if (response.data && Array.isArray(response.data)) {
                timesheets = response.data;
            } else if (response.timesheets && Array.isArray(response.timesheets)) {
                timesheets = response.timesheets;
            }
            
            // Calculate weekly hours
            const now = new Date();
            const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
            const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
            
            const weeklyHours = timesheets
                .filter(ts => {
                    const tsDate = new Date(ts.date);
                    return tsDate >= weekStart && tsDate <= weekEnd;
                })
                .reduce((total, ts) => total + (parseFloat(ts.hours) || 0), 0);
            
            return {
                count: timesheets.length,
                weeklyHours: weeklyHours
            };
        } catch (error) {
            console.error('Error loading timesheets count:', error);
            return { count: 0, weeklyHours: 0 };
        }
    },
    
    // Update dashboard cards with data
    updateDashboardCards(usersData, projectsData, tasksData, timesheetsData) {
        // Update users count
        const usersCount = usersData.status === 'fulfilled' ? usersData.value : 0;
        document.getElementById('totalUsers').textContent = usersCount;
        
        // Update projects count
        const projectsCount = projectsData.status === 'fulfilled' ? projectsData.value : 0;
        document.getElementById('activeProjects').textContent = projectsCount;
        
        // Update tasks count
        const tasksCount = tasksData.status === 'fulfilled' ? tasksData.value : 0;
        document.getElementById('pendingTasks').textContent = tasksCount;
        
        // Update weekly hours
        const timesheetsDataValue = timesheetsData.status === 'fulfilled' ? timesheetsData.value : { weeklyHours: 0 };
        document.getElementById('weeklyHours').textContent = timesheetsDataValue.weeklyHours || 0;
    },
    
    // Load recent activity
    async loadRecentActivity() {
        try {
            const recentActivity = document.getElementById('recentActivity');
            if (!recentActivity) return;
            
            // For now, show a simple message
            recentActivity.innerHTML = `
                <div class="list-group list-group-flush">
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">Dashboard Loaded</h6>
                            <small class="text-muted">System initialized successfully</small>
                        </div>
                        <small class="text-muted">Just now</small>
                    </div>
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">User Authenticated</h6>
                            <small class="text-muted">Login successful</small>
                        </div>
                        <small class="text-muted">Just now</small>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    },
    
    // Setup refresh button
    setupRefreshButton() {
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
                refreshBtn.disabled = true;
                
                try {
                    await this.loadDashboardData();
                    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
                } catch (error) {
                    console.error('Error refreshing dashboard:', error);
                    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
                } finally {
                    refreshBtn.disabled = false;
                }
            });
        }
    },
    
    // Show error message
    showError(message) {
        console.error('Dashboard error:', message);
        this.showAlert('danger', message);
    },
    
    // Show alert message
    showAlert(type, message) {
        // Create alert container if it doesn't exist
        let alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) {
            alertContainer = document.createElement('div');
            alertContainer.id = 'alertContainer';
            alertContainer.className = 'position-fixed top-0 end-0 p-3';
            alertContainer.style.zIndex = '9999';
            document.body.appendChild(alertContainer);
        }
        
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        alertContainer.innerHTML = alertHtml;
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = alertContainer.querySelector('.alert');
            if (alert) {
                alert.classList.remove('show');
                setTimeout(() => {
                    alert.remove();
                }, 150);
            }
        }, 5000);
    }
};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the dashboard page
    if (window.location.pathname === '/' || window.location.pathname === '/dashboard') {
        // Add a small delay to ensure authentication is properly set up
        setTimeout(() => {
            Dashboard.init();
        }, 100);
    }
});
