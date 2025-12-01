// Roles Management Logic
let dataTable;
let loginModal;
let roleEditorModal;
let deleteConfirmModal;
let currentRoleId = null;

// Initialize app when DOM is ready
$(document).ready(function() {
    // Initialize Bootstrap modals
    loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    roleEditorModal = new bootstrap.Modal(document.getElementById('roleEditorModal'));
    deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));

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
        loadRoles();
    });

    // Add role button
    $('#addRoleBtn').on('click', function() {
        openRoleEditor();
    });

    // Save role button
    $('#saveRoleBtn').on('click', function() {
        saveRole();
    });

    // Confirm delete button
    $('#confirmDeleteBtn').on('click', function() {
        deleteRole();
    });

    // Handle role editor form submission
    $('#roleEditorForm').on('submit', function(e) {
        e.preventDefault();
        saveRole();
    });
}

// Initialize dashboard
function initializeDashboard() {
    // Display user info
    const userData = AuthService.getUserData();
    if (userData && userData.email) {
        $('#userEmail').text(userData.email);
    }

    // Load roles data
    loadRoles();
}

// Load roles data
async function loadRoles() {
    const loadingSpinner = $('#loadingSpinner');
    const alertContainer = $('#alertContainer');

    try {
        // Show loading spinner
        loadingSpinner.show();
        alertContainer.empty();

        // Fetch roles from API
        const response = await ApiService.getRoles();
        console.log('Roles API response:', response);

        // Extract roles array from response
        let roles = [];
        if (Array.isArray(response)) {
            roles = response;
        } else if (response.data && Array.isArray(response.data)) {
            roles = response.data;
        } else if (response.roles && Array.isArray(response.roles)) {
            roles = response.roles;
        } else if (response.results && Array.isArray(response.results)) {
            roles = response.results;
        } else if (response.items && Array.isArray(response.items)) {
            roles = response.items;
        } else {
            console.error('Unexpected API response structure:', response);
            throw new Error('Unable to parse roles data from API response. Check console for details.');
        }

        // Initialize or update DataTable
        if (dataTable) {
            dataTable.clear();
            dataTable.rows.add(formatRolesData(roles));
            dataTable.draw();
        } else {
            initializeDataTable(formatRolesData(roles));
        }

        showAlert('success', `Successfully loaded ${roles.length} roles`);
    } catch (error) {
        console.error('Error loading roles:', error);
        showAlert('danger', `Error loading roles: ${error.message}`);
    } finally {
        loadingSpinner.hide();
    }
}

// Format roles data for DataTable
function formatRolesData(roles) {
    return roles.map(role => {
        const actions = `
            <button class="btn btn-sm btn-primary edit-role" data-role='${JSON.stringify(role).replace(/'/g, "&apos;")}'>
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger delete-role" data-id="${role.id}" data-name="${role.name}">
                <i class="fas fa-trash"></i>
            </button>
        `;
        return [
            role.id || 'N/A',
            role.name || 'N/A',
            role.description || 'N/A',
            formatPermissions(role.permissions),
            formatStatus(role.status || role.is_active),
            formatDate(role.created_at || role.createdAt),
            actions
        ];
    });
}

// Format permissions
function formatPermissions(permissions) {
    if (!permissions) return '<span class="badge bg-secondary">None</span>';

    if (Array.isArray(permissions)) {
        return permissions.map(perm => `<span class="badge bg-info me-1">${perm}</span>`).join('');
    } else if (typeof permissions === 'string') {
        try {
            const permsArray = JSON.parse(permissions);
            return permsArray.map(perm => `<span class="badge bg-info me-1">${perm}</span>`).join('');
        } catch {
            return `<span class="badge bg-info">${permissions}</span>`;
        }
    }

    return '<span class="badge bg-secondary">None</span>';
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
    dataTable = $('#rolesTable').DataTable({
        data: data,
        columns: [
            { title: "ID" },
            { title: "Name" },
            { title: "Description" },
            { title: "Permissions" },
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
            search: "Search roles:",
            lengthMenu: "Show _MENU_ roles per page",
            info: "Showing _START_ to _END_ of _TOTAL_ roles",
            infoEmpty: "No roles available",
            infoFiltered: "(filtered from _MAX_ total roles)",
            zeroRecords: "No matching roles found"
        }
    });

    // Handle edit button clicks
    $('#rolesTable').on('click', '.edit-role', function() {
        const roleData = JSON.parse($(this).attr('data-role').replace(/&apos;/g, "'"));
        openRoleEditor(roleData);
    });

    // Handle delete button clicks
    $('#rolesTable').on('click', '.delete-role', function() {
        const roleId = $(this).data('id');
        const roleName = $(this).data('name');
        confirmDeleteRole(roleId, roleName);
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

// Open role editor modal (for add or edit)
function openRoleEditor(roleData = null) {
    // Reset form
    $('#roleEditorForm')[0].reset();
    $('#roleEditorError').hide();

    // Uncheck all permissions
    $('#permissionsContainer input[type="checkbox"]').prop('checked', false);

    if (roleData) {
        // Edit mode
        $('#modalTitle').text('Edit Role');
        $('#roleId').val(roleData.id);
        $('#roleName').val(roleData.name || '');
        $('#roleDescription').val(roleData.description || '');
        $('#roleStatus').val(roleData.status || (roleData.is_active ? 'active' : 'inactive'));

        // Set permissions
        if (roleData.permissions) {
            let permissions = [];
            if (Array.isArray(roleData.permissions)) {
                permissions = roleData.permissions;
            } else if (typeof roleData.permissions === 'string') {
                try {
                    permissions = JSON.parse(roleData.permissions);
                } catch {
                    permissions = [roleData.permissions];
                }
            }

            permissions.forEach(perm => {
                $(`#perm_${perm}`).prop('checked', true);
            });
        }
    } else {
        // Add mode
        $('#modalTitle').text('Add Role');
        $('#roleId').val('');
    }

    roleEditorModal.show();
}

// Save role (create or update)
async function saveRole() {
    const roleId = $('#roleId').val();
    const roleName = $('#roleName').val().trim();
    const roleDescription = $('#roleDescription').val().trim();
    const roleStatus = $('#roleStatus').val();

    // Get selected permissions
    const permissions = [];
    $('#permissionsContainer input[type="checkbox"]:checked').each(function() {
        permissions.push($(this).val());
    });

    const saveBtn = $('#saveRoleBtn');
    const errorDiv = $('#roleEditorError');

    // Validation
    if (!roleName) {
        errorDiv.text('Role name is required').show();
        return;
    }

    // Disable button
    saveBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Saving...');
    errorDiv.hide();

    try {
        const roleData = {
            name: roleName,
            description: roleDescription,
            permissions: permissions,
            status: roleStatus
        };

        if (roleId) {
            // Update existing role
            await ApiService.updateRole(roleId, roleData);
            showAlert('success', 'Role updated successfully');
        } else {
            // Create new role
            await ApiService.createRole(roleData);
            showAlert('success', 'Role created successfully');
        }

        roleEditorModal.hide();
        loadRoles();
    } catch (error) {
        console.error('Save role error:', error);
        errorDiv.text(`Error: ${error.message}`).show();
    } finally {
        saveBtn.prop('disabled', false).html('<i class="fas fa-save"></i> Save Role');
    }
}

// Confirm delete role
function confirmDeleteRole(roleId, roleName) {
    currentRoleId = roleId;
    $('#deleteRoleName').text(roleName);
    deleteConfirmModal.show();
}

// Delete role
async function deleteRole() {
    if (!currentRoleId) return;

    const confirmBtn = $('#confirmDeleteBtn');
    confirmBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Deleting...');

    try {
        await ApiService.deleteRole(currentRoleId);
        showAlert('success', 'Role deleted successfully');
        deleteConfirmModal.hide();
        loadRoles();
    } catch (error) {
        console.error('Delete role error:', error);
        showAlert('danger', `Error deleting role: ${error.message}`);
    } finally {
        confirmBtn.prop('disabled', false).html('<i class="fas fa-trash"></i> Delete Role');
        currentRoleId = null;
    }
}
