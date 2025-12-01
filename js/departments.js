// Departments Management Logic
let dataTable;
let loginModal;
let departmentEditorModal;
let deleteConfirmModal;
let currentDepartmentId = null;

$(document).ready(function() {
    loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    departmentEditorModal = new bootstrap.Modal(document.getElementById('departmentEditorModal'));
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
        loadDepartments();
    });

    $('#addDepartmentBtn').on('click', function() {
        openDepartmentEditor();
    });

    $('#saveDepartmentBtn').on('click', function() {
        saveDepartment();
    });

    $('#confirmDeleteBtn').on('click', function() {
        deleteDepartment();
    });

    $('#departmentEditorForm').on('submit', function(e) {
        e.preventDefault();
        saveDepartment();
    });
}

function initializeDashboard() {
    const userData = AuthService.getUserData();
    if (userData && userData.email) {
        $('#userEmail').text(userData.email);
    }
    loadDepartments();
}

async function loadDepartments() {
    const loadingSpinner = $('#loadingSpinner');
    const alertContainer = $('#alertContainer');
    try {
        loadingSpinner.show();
        alertContainer.empty();
        const response = await ApiService.getDepartments();
        let departments = Array.isArray(response) ? response : (response.data || response.items || []);
        if (!Array.isArray(departments)) throw new Error('Unable to parse departments data from API response');
        if (dataTable) {
            dataTable.clear();
            dataTable.rows.add(formatDepartmentsData(departments));
            dataTable.draw();
        } else {
            initializeDataTable(formatDepartmentsData(departments));
        }
        showAlert('success', `Successfully loaded ${departments.length} departments`);
    } catch (error) {
        console.error('Error loading departments:', error);
        showAlert('danger', `Error loading departments: ${error.message}`);
    } finally {
        loadingSpinner.hide();
    }
}

function formatDepartmentsData(departments) {
    return departments.map(dept => {
        const actions = `
            <button class="btn btn-sm btn-primary edit-department" data-dept='${JSON.stringify(dept).replace(/'/g, "&apos;")}'><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-danger delete-department" data-id="${dept.id}" data-name="${dept.name}"><i class="fas fa-trash"></i></button>
        `;
        return [
            dept.id || 'N/A',
            dept.name || 'N/A',
            dept.code || 'N/A',
            dept.description || 'N/A',
            formatStatus(dept.status),
            formatDate(dept.created_at || dept.createdAt),
            actions
        ];
    });
}

function formatStatus(status) {
    if (status === true || status === 1 || status === 'active' || status === 'Active') {
        return '<span class="badge bg-success">Active</span>';
    } else if (status === false || status === 0 || status === 'inactive' || status === 'Inactive') {
        return '<span class="badge bg-danger">Inactive</span>';
    } else {
        return `<span class="badge bg-secondary">${status || 'Unknown'}</span>`;
    }
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
    dataTable = $('#departmentsTable').DataTable({
        data: data,
        columns: [
            { title: "ID" },
            { title: "Name" },
            { title: "Code" },
            { title: "Description" },
            { title: "Status" },
            { title: "Created At" },
            { title: "Actions", orderable: false }
        ],
        responsive: true,
        pageLength: 25,
        lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
        order: [[0, 'asc']]
    });

    $('#departmentsTable').on('click', '.edit-department', function() {
        const deptData = JSON.parse($(this).attr('data-dept').replace(/&apos;/g, "'"));
        openDepartmentEditor(deptData);
    });
    $('#departmentsTable').on('click', '.delete-department', function() {
        const departmentId = $(this).data('id');
        const departmentName = $(this).data('name');
        confirmDeleteDepartment(departmentId, departmentName);
    });
}

function openDepartmentEditor(deptData = null) {
    $('#departmentEditorForm')[0].reset();
    $('#departmentEditorError').hide();
    if (deptData) {
        $('#modalTitle').text('Edit Department');
        $('#departmentId').val(deptData.id);
        $('#departmentName').val(deptData.name || '');
        $('#departmentCode').val(deptData.code || '');
        $('#departmentDescription').val(deptData.description || '');
        $('#departmentStatus').val(deptData.status || 'active');
    } else {
        $('#modalTitle').text('Add Department');
        $('#departmentId').val('');
    }
    departmentEditorModal.show();
}

async function saveDepartment() {
    const departmentId = $('#departmentId').val();
    const departmentName = $('#departmentName').val().trim();
    const departmentCode = $('#departmentCode').val().trim();
    const departmentDescription = $('#departmentDescription').val().trim();
    const departmentStatus = $('#departmentStatus').val();
    const saveBtn = $('#saveDepartmentBtn');
    const errorDiv = $('#departmentEditorError');
    if (!departmentName || !departmentCode) {
        errorDiv.text('Name and Code are required').show();
        return;
    }
    saveBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Saving...');
    errorDiv.hide();
    try {
        const deptData = { name: departmentName, code: departmentCode, description: departmentDescription, status: departmentStatus };
        if (departmentId) {
            await ApiService.updateDepartment(departmentId, deptData);
            showAlert('success', 'Department updated successfully');
        } else {
            await ApiService.createDepartment(deptData);
            showAlert('success', 'Department created successfully');
        }
        departmentEditorModal.hide();
        loadDepartments();
    } catch (error) {
        console.error('Save department error:', error);
        errorDiv.text(`Error: ${error.message}`).show();
    } finally {
        saveBtn.prop('disabled', false).html('<i class="fas fa-save"></i> Save Department');
    }
}

function confirmDeleteDepartment(departmentId, departmentName) {
    currentDepartmentId = departmentId;
    $('#deleteDepartmentName').text(departmentName);
    deleteConfirmModal.show();
}

async function deleteDepartment() {
    if (!currentDepartmentId) return;
    const confirmBtn = $('#confirmDeleteBtn');
    confirmBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Deleting...');
    try {
        await ApiService.deleteDepartment(currentDepartmentId);
        showAlert('success', 'Department deleted successfully');
        deleteConfirmModal.hide();
        loadDepartments();
    } catch (error) {
        console.error('Delete department error:', error);
        showAlert('danger', `Error deleting department: ${error.message}`);
    } finally {
        confirmBtn.prop('disabled', false).html('<i class="fas fa-trash"></i> Delete Department');
        currentDepartmentId = null;
    }
}

