// Application Logic
let dataTable;
let loginModal;

// Initialize app when DOM is ready
$(document).ready(function() {
    // Initialize Bootstrap modal
    loginModal = new bootstrap.Modal(document.getElementById('loginModal'));

    // Check if user is authenticated
    if (!AuthService.isAuthenticated()) {
        loginModal.show();
    } else {
        initializeDashboard();
    }

    // Setup event listeners
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Login form submit
    $('#loginForm').on('submit', async function(e) {
        e.preventDefault();

        const email = $('#email').val();
        const password = $('#password').val();
        const loginBtn = $('#loginBtn');
        const loginError = $('#loginError');

        // Disable button and show loading
        loginBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Logging in...');
        loginError.hide();

        try {
            await AuthService.login(email, password);
            loginModal.hide();
            initializeDashboard();
        } catch (error) {
            loginError.text(error.message).show();
        } finally {
            loginBtn.prop('disabled', false).html('<i class="fas fa-sign-in-alt"></i> Login');
        }
    });

    // Logout button
    $('#logoutBtn').on('click', function(e) {
        e.preventDefault();
        AuthService.logout();
        window.location.reload();
    });

    // Refresh button
    $('#refreshBtn').on('click', function() {
        loadUsers();
    });
}

// Initialize dashboard
function initializeDashboard() {
    // Display user info
    const userData = AuthService.getUserData();
    if (userData && userData.email) {
        $('#userEmail').text(userData.email);
    }

    // Load users data
    loadUsers();
}

// Load users data
async function loadUsers() {
    const loadingSpinner = $('#loadingSpinner');
    const alertContainer = $('#alertContainer');

    try {
        // Show loading spinner
        loadingSpinner.show();
        alertContainer.empty();

        // Fetch users from API
        const response = await ApiService.getUsers();

        // Extract users array from response
        let users = [];
        if (Array.isArray(response)) {
            users = response;
        } else if (response.data && Array.isArray(response.data)) {
            users = response.data;
        } else if (response.users && Array.isArray(response.users)) {
            users = response.users;
        } else {
            throw new Error('Unable to parse users data from API response');
        }

        // Initialize or update DataTable
        if (dataTable) {
            dataTable.clear();
            dataTable.rows.add(formatUsersData(users));
            dataTable.draw();
        } else {
            initializeDataTable(formatUsersData(users));
        }

        showAlert('success', `Successfully loaded ${users.length} users`);
    } catch (error) {
        console.error('Error loading users:', error);
        showAlert('danger', `Error loading users: ${error.message}`);
    } finally {
        loadingSpinner.hide();
    }
}

// Format users data for DataTable
function formatUsersData(users) {
    return users.map(user => {
        return [
            user.id || 'N/A',
            user.name || user.full_name || user.username || 'N/A',
            user.email || 'N/A',
            user.role || user.user_type || 'User',
            formatStatus(user.status || user.is_active),
            formatDate(user.created_at || user.createdAt)
        ];
    });
}

// Format status with badge
function formatStatus(status) {
    if (status === true || status === 1 || status === 'active' || status === 'Active') {
        return '<span class="badge bg-success">Active</span>';
    } else if (status === false || status === 0 || status === 'inactive' || status === 'Inactive') {
        return '<span class="badge bg-danger">Inactive</span>';
    } else {
        return `<span class="badge bg-secondary">${status || 'Unknown'}</span>`;
    }
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateString;
    }
}

// Initialize DataTable
function initializeDataTable(data) {
    dataTable = $('#usersTable').DataTable({
        data: data,
        columns: [
            { title: "ID" },
            { title: "Name" },
            { title: "Email" },
            { title: "Role" },
            { title: "Status" },
            { title: "Created At" }
        ],
        responsive: true,
        pageLength: 25,
        lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
        order: [[0, 'asc']],
        language: {
            search: "Search users:",
            lengthMenu: "Show _MENU_ users per page",
            info: "Showing _START_ to _END_ of _TOTAL_ users",
            infoEmpty: "No users available",
            infoFiltered: "(filtered from _MAX_ total users)",
            zeroRecords: "No matching users found"
        }
    });
}

// Show alert message
function showAlert(type, message) {
    const alertContainer = $('#alertContainer');
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    alertContainer.html(alertHtml);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alertContainer.find('.alert').fadeOut();
    }, 5000);
}
