// Departments Management Controller
let departmentsTable;

document.addEventListener('DOMContentLoaded', function() {
    // Only run on departments page
    if (window.location.pathname !== '/departments') {
        return;
    }
    
    // Simple auto-login and load departments
    if (!AuthService.isAuthenticated()) {
        AuthService.login('administrative@admin.com', 'Admin@123').then(() => {
            loadDepartments();
        }).catch(error => {
            console.error('Login failed:', error);
        });
    } else {
        loadDepartments();
    }
});

async function loadDepartments() {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const departments = await ApiService.getDepartments(workspaceId);
        populateDepartmentsTable(departments);
    } catch (error) {
        console.error('Error loading departments:', error);
    }
}

function populateDepartmentsTable(departments) {
    if (departmentsTable) {
        departmentsTable.destroy();
    }
    
    const tbody = document.querySelector('#departmentsTable tbody');
    tbody.innerHTML = '';
    
    departments.forEach(department => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${department.id}</td>
            <td>${department.name}</td>
            <td>${department.description || 'N/A'}</td>
            <td>${department.manager || 'N/A'}</td>
            <td>${formatDate(department.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editDepartment(${department.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteDepartment(${department.id}, '${department.name}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Initialize DataTable
    if (typeof $ !== 'undefined' && $.fn.DataTable) {
        departmentsTable = $('#departmentsTable').DataTable({
            pageLength: 10,
            order: [[4, 'desc']]
        });
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (error) {
        return dateString;
    }
}

async function addDepartment() {
    const name = document.getElementById('departmentName').value.trim();
    const code = document.getElementById('departmentCode').value.trim();
    const description = document.getElementById('departmentDescription').value.trim();
    
    if (!name) {
        alert('Please enter department name');
        return;
    }
    
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const departmentData = {
            name: name,
            code: code,
            description: description,
            status: 'active'
        };
        
        await ApiService.createDepartment(departmentData, workspaceId);
        
        const modalElement = document.getElementById('addDepartmentModal');
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
        document.getElementById('addDepartmentForm').reset();
        
        await loadDepartments();
    } catch (error) {
        console.error('Error creating department:', error);
        alert('Failed to create department');
    }
}

async function editDepartment(departmentId) {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const departments = await ApiService.getDepartments(workspaceId);
        const department = departments.find(d => d.id === departmentId);
        
        if (!department) {
            alert('Department not found');
            return;
        }
        
        // Populate the edit form
        document.getElementById('editDepartmentId').value = department.id;
        document.getElementById('editDepartmentName').value = department.name;
        document.getElementById('editDepartmentCode').value = department.code || '';
        document.getElementById('editDepartmentDescription').value = department.description || '';
        
        // Show the edit modal
        const modalElement = document.getElementById('editDepartmentModal');
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.show();
    } catch (error) {
        console.error('Error loading department for edit:', error);
        alert('Failed to load department data');
    }
}

async function updateDepartment() {
    const departmentId = document.getElementById('editDepartmentId').value;
    const name = document.getElementById('editDepartmentName').value.trim();
    const code = document.getElementById('editDepartmentCode').value.trim();
    const description = document.getElementById('editDepartmentDescription').value.trim();
    
    if (!name) {
        alert('Please enter department name');
        return;
    }
    
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const departmentData = {
            name: name,
            code: code,
            description: description,
            status: 'active'
        };
        
        await ApiService.updateDepartment(departmentId, departmentData, workspaceId);
        
        const modalElement = document.getElementById('editDepartmentModal');
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
        
        await loadDepartments();
    } catch (error) {
        console.error('Error updating department:', error);
        alert('Failed to update department');
    }
}

async function deleteDepartment(departmentId, departmentName) {
    if (!confirm(`Are you sure you want to delete department ${departmentName}?`)) {
        return;
    }
    
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        await ApiService.deleteDepartment(departmentId, workspaceId);
        await loadDepartments();
    } catch (error) {
        console.error('Error deleting department:', error);
        alert('Failed to delete department');
    }
}