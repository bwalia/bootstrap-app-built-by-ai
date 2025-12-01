// Groups Management Logic
let dataTable;
let loginModal;
let groupEditorModal;
let deleteConfirmModal;
let currentGroupId = null;

// Initialize app when DOM is ready
$(document).ready(function() {
    // Initialize Bootstrap modals
    loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    groupEditorModal = new bootstrap.Modal(document.getElementById('groupEditorModal'));
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
        loadGroups();
    });

    // Add group button
    $('#addGroupBtn').on('click', function() {
        openGroupEditor();
    });

    // Save group button
    $('#saveGroupBtn').on('click', function() {
        saveGroup();
    });

    // Confirm delete button
    $('#confirmDeleteBtn').on('click', function() {
        deleteGroup();
    });

    // Handle group editor form submission
    $('#groupEditorForm').on('submit', function(e) {
        e.preventDefault();
        saveGroup();
    });
}

// Initialize dashboard
function initializeDashboard() {
    // Display user info
    const userData = AuthService.getUserData();
    if (userData && userData.email) {
        $('#userEmail').text(userData.email);
    }

    // Load groups data
    loadGroups();
}

// Load groups data
async function loadGroups() {
    const loadingSpinner = $('#loadingSpinner');
    const alertContainer = $('#alertContainer');

    try {
        // Show loading spinner
        loadingSpinner.show();
        alertContainer.empty();

        // Fetch groups from API
        const response = await ApiService.getGroups();
        console.log('Groups API response:', response);

        // Extract groups array from response
        let groups = [];
        if (Array.isArray(response)) {
            groups = response;
        } else if (response.data && Array.isArray(response.data)) {
            groups = response.data;
        } else if (response.groups && Array.isArray(response.groups)) {
            groups = response.groups;
        } else if (response.results && Array.isArray(response.results)) {
            groups = response.results;
        } else if (response.items && Array.isArray(response.items)) {
            groups = response.items;
        } else {
            console.error('Unexpected API response structure:', response);
            throw new Error('Unable to parse groups data from API response. Check console for details.');
        }

        // Initialize or update DataTable
        if (dataTable) {
            dataTable.clear();
            dataTable.rows.add(formatGroupsData(groups));
            dataTable.draw();
        } else {
            initializeDataTable(formatGroupsData(groups));
        }

        showAlert('success', `Successfully loaded ${groups.length} groups`);
    } catch (error) {
        console.error('Error loading groups:', error);
        showAlert('danger', `Error loading groups: ${error.message}`);
    } finally {
        loadingSpinner.hide();
    }
}

// Format groups data for DataTable
function formatGroupsData(groups) {
    return groups.map(group => {
        const actions = `
            <button class="btn btn-sm btn-primary edit-group" data-group='${JSON.stringify(group).replace(/'/g, "&apos;")}'>
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger delete-group" data-id="${group.id}" data-name="${group.name}">
                <i class="fas fa-trash"></i>
            </button>
        `;
        return [
            group.id || 'N/A',
            group.name || 'N/A',
            group.description || 'N/A',
            formatStatus(group.status || group.is_active),
            formatDate(group.created_at || group.createdAt),
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
    dataTable = $('#groupsTable').DataTable({
        data: data,
        columns: [
            { title: "ID" },
            { title: "Name" },
            { title: "Description" },
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
            search: "Search groups:",
            lengthMenu: "Show _MENU_ groups per page",
            info: "Showing _START_ to _END_ of _TOTAL_ groups",
            infoEmpty: "No groups available",
            infoFiltered: "(filtered from _MAX_ total groups)",
            zeroRecords: "No matching groups found"
        }
    });

    // Handle edit button clicks
    $('#groupsTable').on('click', '.edit-group', function() {
        const groupData = JSON.parse($(this).attr('data-group').replace(/&apos;/g, "'"));
        openGroupEditor(groupData);
    });

    // Handle delete button clicks
    $('#groupsTable').on('click', '.delete-group', function() {
        const groupId = $(this).data('id');
        const groupName = $(this).data('name');
        confirmDeleteGroup(groupId, groupName);
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

// Open group editor modal (for add or edit)
function openGroupEditor(groupData = null) {
    // Reset form
    $('#groupEditorForm')[0].reset();
    $('#groupEditorError').hide();

    if (groupData) {
        // Edit mode
        $('#modalTitle').text('Edit Group');
        $('#groupId').val(groupData.id);
        $('#groupName').val(groupData.name || '');
        $('#groupDescription').val(groupData.description || '');
        $('#groupStatus').val(groupData.status || (groupData.is_active ? 'active' : 'inactive'));
    } else {
        // Add mode
        $('#modalTitle').text('Add Group');
        $('#groupId').val('');
    }

    groupEditorModal.show();
}

// Save group (create or update)
async function saveGroup() {
    const groupId = $('#groupId').val();
    const groupName = $('#groupName').val().trim();
    const groupDescription = $('#groupDescription').val().trim();
    const groupStatus = $('#groupStatus').val();

    const saveBtn = $('#saveGroupBtn');
    const errorDiv = $('#groupEditorError');

    // Validation
    if (!groupName) {
        errorDiv.text('Group name is required').show();
        return;
    }

    // Disable button
    saveBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Saving...');
    errorDiv.hide();

    try {
        const groupData = {
            name: groupName,
            description: groupDescription,
            status: groupStatus
        };

        if (groupId) {
            // Update existing group
            await ApiService.updateGroup(groupId, groupData);
            showAlert('success', 'Group updated successfully');
        } else {
            // Create new group
            await ApiService.createGroup(groupData);
            showAlert('success', 'Group created successfully');
        }

        groupEditorModal.hide();
        loadGroups();
    } catch (error) {
        console.error('Save group error:', error);
        errorDiv.text(`Error: ${error.message}`).show();
    } finally {
        saveBtn.prop('disabled', false).html('<i class="fas fa-save"></i> Save Group');
    }
}

// Confirm delete group
function confirmDeleteGroup(groupId, groupName) {
    currentGroupId = groupId;
    $('#deleteGroupName').text(groupName);
    deleteConfirmModal.show();
}

// Delete group
async function deleteGroup() {
    if (!currentGroupId) return;

    const confirmBtn = $('#confirmDeleteBtn');
    confirmBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Deleting...');

    try {
        await ApiService.deleteGroup(currentGroupId);
        showAlert('success', 'Group deleted successfully');
        deleteConfirmModal.hide();
        loadGroups();
    } catch (error) {
        console.error('Delete group error:', error);
        showAlert('danger', `Error deleting group: ${error.message}`);
    } finally {
        confirmBtn.prop('disabled', false).html('<i class="fas fa-trash"></i> Delete Group');
        currentGroupId = null;
    }
}
