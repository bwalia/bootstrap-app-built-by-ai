// Application Logic
let appTable;
let appLoginModal;
let userEditorModal;
let appDeleteConfirmModal;
let currentUserId = null;

// Initialize app when DOM is ready
$(document).ready(function() {
    // Only initialize modals if they exist on this page
    const loginModalEl = document.getElementById('loginModal');
    const userEditorModalEl = document.getElementById('userEditorModal');
    const deleteConfirmModalEl = document.getElementById('deleteConfirmModal');
    
    if (loginModalEl) appLoginModal = new bootstrap.Modal(loginModalEl);
    if (userEditorModalEl) userEditorModal = new bootstrap.Modal(userEditorModalEl);
    if (deleteConfirmModalEl) appDeleteConfirmModal = new bootstrap.Modal(deleteConfirmModalEl);

    // Check if user is authenticated
    if (!AuthService.isAuthenticated()) {
        if (appLoginModal) appLoginModal.show();
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
            appLoginModal.hide();
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

    // Add user button
    $('#addUserBtn').on('click', function() {
        openUserEditor();
    });

    // Save user button
    $('#saveUserBtn').on('click', function() {
        saveUser();
    });

    // Confirm delete button
    $('#confirmDeleteBtn').on('click', function() {
        deleteUser();
    });

    // Handle user editor form submission
    $('#userEditorForm').on('submit', function(e) {
        e.preventDefault();
        saveUser();
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
        if (appTable) {
            appTable.clear();
            appTable.rows.add(formatUsersData(users));
            appTable.draw();
        } else {
            initializeDataTable(formatUsersData(users));
        }

        // Users loaded successfully
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
        const actions = `
            <button class="btn btn-sm btn-primary edit-user" data-user='${JSON.stringify(user).replace(/'/g, "&apos;")}'>
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger delete-user" data-id="${user.id}" data-name="${user.name || user.email}">
                <i class="fas fa-trash"></i>
            </button>
        `;
        return [
            user.id || 'N/A',
            user.name || user.full_name || user.username || 'N/A',
            user.email || 'N/A',
            user.role || user.user_type || 'User',
            formatStatus(user.status || user.is_active),
            formatDate(user.created_at || user.createdAt),
            actions
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
    appTable = $('#usersTable').DataTable({
        data: data,
        columns: [
            { title: "ID" },
            { title: "Name" },
            { title: "Email" },
            { title: "Role" },
            { title: "Status" },
            { title: "Created At" },
            { title: "Actions", orderable: false }
        ],
        responsive: true,
        pageLength: 25,
        lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
        order: [[0, 'asc']],
        stateSave: false,
        language: {
            search: "Search users:",
            lengthMenu: "Show _MENU_ users per page",
            info: "Showing _START_ to _END_ of _TOTAL_ users",
            infoEmpty: "No users available",
            infoFiltered: "(filtered from _MAX_ total users)",
            zeroRecords: "No matching users found"
        }
    });

    // Handle edit button clicks
    $('#usersTable').on('click', '.edit-user', function() {
        const userData = JSON.parse($(this).attr('data-user').replace(/&apos;/g, "'"));
        openUserEditor(userData);
    });

    // Handle delete button clicks
    $('#usersTable').on('click', '.delete-user', function() {
        const userId = $(this).data('id');
        const userName = $(this).data('name');
        confirmDeleteUser(userId, userName);
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

// Open user editor modal (for add or edit)
function openUserEditor(userData = null) {
    // Reset form
    $('#userEditorForm')[0].reset();
    $('#userEditorError').hide();

    if (userData) {
        // Edit mode
        $('#modalTitle').text('Edit User');
        $('#userId').val(userData.id);
        $('#userName').val(userData.name || userData.full_name || userData.username || '');
        $('#userEmail').val(userData.email || '');
        $('#userRole').val(userData.role || userData.user_type || 'User');
        $('#userStatus').val(userData.status || (userData.is_active ? 'active' : 'inactive'));
        $('#userPassword').prop('required', false);
        $('#passwordRequired').hide();
        $('#passwordHelp').show();
    } else {
        // Add mode
        $('#modalTitle').text('Add User');
        $('#userId').val('');
        $('#userPassword').prop('required', true);
        $('#passwordRequired').show();
        $('#passwordHelp').hide();
    }

    userEditorModal.show();
}

// Save user (create or update)
async function saveUser() {
    const userId = $('#userId').val();
    const userName = $('#userName').val().trim();
    const userEmail = $('#userEmail').val().trim();
    const userPassword = $('#userPassword').val();
    const userRole = $('#userRole').val();
    const userStatus = $('#userStatus').val();

    const saveBtn = $('#saveUserBtn');
    const errorDiv = $('#userEditorError');

    // Validation
    if (!userName || !userEmail) {
        errorDiv.text('Name and Email are required').show();
        return;
    }

    if (!userId && !userPassword) {
        errorDiv.text('Password is required for new users').show();
        return;
    }

    // Disable button
    saveBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Saving...');
    errorDiv.hide();

    try {
        const userData = {
            name: userName,
            email: userEmail,
            role: userRole,
            status: userStatus
        };

        // Only include password if provided
        if (userPassword) {
            userData.password = userPassword;
        }

        if (userId) {
            // Update existing user
            await ApiService.updateUser(userId, userData);
            showAlert('success', 'User updated successfully');
        } else {
            // Create new user
            await ApiService.createUser(userData);
            showAlert('success', 'User created successfully');
        }

        userEditorModal.hide();
        loadUsers();
    } catch (error) {
        console.error('Save user error:', error);
        errorDiv.text(`Error: ${error.message}`).show();
    } finally {
        saveBtn.prop('disabled', false).html('<i class="fas fa-save"></i> Save User');
    }
}

// Confirm delete user
function confirmDeleteUser(userId, userName) {
    currentUserId = userId;
    $('#deleteUserName').text(userName);
    appDeleteConfirmModal.show();
}

// Delete user
async function deleteUser() {
    if (!currentUserId) return;

    const confirmBtn = $('#confirmDeleteBtn');
    confirmBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Deleting...');

    try {
        await ApiService.deleteUser(currentUserId);
        showAlert('success', 'User deleted successfully');
        appDeleteConfirmModal.hide();
        loadUsers();
    } catch (error) {
        console.error('Delete user error:', error);
        showAlert('danger', `Error deleting user: ${error.message}`);
    } finally {
        confirmBtn.prop('disabled', false).html('<i class="fas fa-trash"></i> Delete User');
        currentUserId = null;
    }
}
