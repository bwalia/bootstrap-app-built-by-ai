// Permissions Management Logic
let dataTable;
let loginModal;
let permissionEditorModal;
let deleteConfirmModal;
let currentPermissionId = null;

$(document).ready(function() {
    loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    permissionEditorModal = new bootstrap.Modal(document.getElementById('permissionEditorModal'));
    deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));

    if (!AuthService.isAuthenticated()) {
        loginModal.show();
    } else {
        initializeDashboard();
    }

    setupEventListeners();
});

function setupEventListeners() {
    $('#loginForm').on('submit', async function(e) {
        e.preventDefault();
        const email = $('#email').val();
        const password = $('#password').val();
        const loginBtn = $('#loginBtn');
        const loginError = $('#loginError');
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

    $('#logoutBtn').on('click', function(e) {
        e.preventDefault();
        AuthService.logout();
        window.location.reload();
    });

    $('#refreshBtn').on('click', function() {
        loadPermissions();
    });

    $('#addPermissionBtn').on('click', function() {
        openPermissionEditor();
    });

    $('#savePermissionBtn').on('click', function() {
        savePermission();
    });

    $('#confirmDeleteBtn').on('click', function() {
        deletePermission();
    });

    $('#permissionEditorForm').on('submit', function(e) {
        e.preventDefault();
        savePermission();
    });
}

function initializeDashboard() {
    const userData = AuthService.getUserData();
    if (userData && userData.email) {
        $('#userEmail').text(userData.email);
    }
    loadPermissions();
}

async function loadPermissions() {
    const loadingSpinner = $('#loadingSpinner');
    const alertContainer = $('#alertContainer');
    try {
        loadingSpinner.show();
        alertContainer.empty();
        const response = await ApiService.getPermissions();
        let permissions = Array.isArray(response) ? response : (response.data || response.items || []);
        if (!Array.isArray(permissions)) throw new Error('Unable to parse permissions data from API response');
        if (dataTable) {
            dataTable.clear();
            dataTable.rows.add(formatPermissionsData(permissions));
            dataTable.draw();
        } else {
            initializeDataTable(formatPermissionsData(permissions));
        }
        showAlert('success', `Successfully loaded ${permissions.length} permissions`);
    } catch (error) {
        console.error('Error loading permissions:', error);
        showAlert('danger', `Error loading permissions: ${error.message}`);
    } finally {
        loadingSpinner.hide();
    }
}

function formatPermissionsData(permissions) {
    return permissions.map(perm => {
        const actions = `
            <button class=\"btn btn-sm btn-primary edit-permission\" data-perm='${JSON.stringify(perm).replace(/'/g, "&apos;")}'><i class=\"fas fa-edit\"></i></button>
            <button class=\"btn btn-sm btn-danger delete-permission\" data-id=\"${perm.id}\" data-name=\"${perm.name}\"><i class=\"fas fa-trash\"></i></button>
        `;
        return [
            perm.id || 'N/A',
            perm.name || 'N/A',
            perm.description || 'N/A',
            formatDate(perm.created_at || perm.createdAt),
            actions
        ];
    });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (error) {
        return dateString;
    }
}

function initializeDataTable(data) {
    dataTable = $('#permissionsTable').DataTable({
        data: data,
        columns: [
            { title: "ID" },
            { title: "Name" },
            { title: "Description" },
            { title: "Created At" },
            { title: "Actions", orderable: false }
        ],
        responsive: true,
        pageLength: 25,
        lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
        order: [[0, 'asc']]
    });

    $('#permissionsTable').on('click', '.edit-permission', function() {
        const permData = JSON.parse($(this).attr('data-perm').replace(/&apos;/g, "'"));
        openPermissionEditor(permData);
    });
    $('#permissionsTable').on('click', '.delete-permission', function() {
        const permissionId = $(this).data('id');
        const permissionName = $(this).data('name');
        confirmDeletePermission(permissionId, permissionName);
    });
}

function openPermissionEditor(permData = null) {
    $('#permissionEditorForm')[0].reset();
    $('#permissionEditorError').hide();
    if (permData) {
        $('#modalTitle').text('Edit Permission');
        $('#permissionId').val(permData.id);
        $('#permissionName').val(permData.name || '');
        $('#permissionDescription').val(permData.description || '');
    } else {
        $('#modalTitle').text('Add Permission');
        $('#permissionId').val('');
    }
    permissionEditorModal.show();
}

async function savePermission() {
    const permissionId = $('#permissionId').val();
    const permissionName = $('#permissionName').val().trim();
    const permissionDescription = $('#permissionDescription').val().trim();
    const saveBtn = $('#savePermissionBtn');
    const errorDiv = $('#permissionEditorError');
    if (!permissionName) {
        errorDiv.text('Name is required').show();
        return;
    }
    saveBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Saving...');
    errorDiv.hide();
    try {
        const permData = { name: permissionName, description: permissionDescription };
        if (permissionId) {
            await ApiService.updatePermission(permissionId, permData);
            showAlert('success', 'Permission updated successfully');
        } else {
            await ApiService.createPermission(permData);
            showAlert('success', 'Permission created successfully');
        }
        permissionEditorModal.hide();
        loadPermissions();
    } catch (error) {
        console.error('Save permission error:', error);
        errorDiv.text(`Error: ${error.message}`).show();
    } finally {
        saveBtn.prop('disabled', false).html('<i class="fas fa-save"></i> Save Permission');
    }
}

function confirmDeletePermission(permissionId, permissionName) {
    currentPermissionId = permissionId;
    $('#deletePermissionName').text(permissionName);
    deleteConfirmModal.show();
}

async function deletePermission() {
    if (!currentPermissionId) return;
    const confirmBtn = $('#confirmDeleteBtn');
    confirmBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Deleting...');
    try {
        await ApiService.deletePermission(currentPermissionId);
        showAlert('success', 'Permission deleted successfully');
        deleteConfirmModal.hide();
        loadPermissions();
    } catch (error) {
        console.error('Delete permission error:', error);
        showAlert('danger', `Error deleting permission: ${error.message}`);
    } finally {
        confirmBtn.prop('disabled', false).html('<i class="fas fa-trash"></i> Delete Permission');
        currentPermissionId = null;
    }
}

