// Roles Management Controller
let rolesTable;

document.addEventListener('DOMContentLoaded', function() {
    // Only run on roles page
    if (window.location.pathname !== '/roles') {
        return;
    }
    
    // Simple auto-login and load roles
    if (!AuthService.isAuthenticated()) {
        AuthService.login('administrative@admin.com', 'Admin@123').then(() => {
            loadRoles();
        }).catch(error => {
            console.error('Login failed:', error);
        });
    } else {
        loadRoles();
    }
});

async function loadRoles() {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const roles = await ApiService.getRoles(workspaceId);
        populateRolesTable(roles);
    } catch (error) {
        console.error('Error loading roles:', error);
    }
}

function populateRolesTable(roles) {
    if (rolesTable) {
        rolesTable.destroy();
    }
    
    const tbody = document.querySelector('#rolesTable tbody');
    tbody.innerHTML = '';
    
    roles.forEach(role => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${role.id}</td>
            <td>${role.name}</td>
            <td>${role.description || 'N/A'}</td>
            <td><span class="badge bg-${role.status === 'active' ? 'success' : 'secondary'}">${role.status}</span></td>
            <td>${formatDate(role.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editRole(${role.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteRole(${role.id}, '${role.name}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Initialize DataTable
    if (typeof $ !== 'undefined' && $.fn.DataTable) {
        rolesTable = $('#rolesTable').DataTable({
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

async function addRole() {
    const name = document.getElementById('roleName').value.trim();
    const description = document.getElementById('roleDescription').value.trim();
    
    if (!name) {
        alert('Please enter role name');
        return;
    }
    
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const roleData = {
            name: name,
            description: description,
            status: 'active'
        };
        
        await ApiService.createRole(roleData, workspaceId);
        
        const modalElement = document.getElementById('addRoleModal');
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
        document.getElementById('addRoleForm').reset();
        
        await loadRoles();
    } catch (error) {
        console.error('Error creating role:', error);
        alert('Failed to create role');
    }
}

async function editRole(roleId) {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const roles = await ApiService.getRoles(workspaceId);
        const role = roles.find(r => r.id === roleId);
        
        if (!role) {
            alert('Role not found');
            return;
        }
        
        // Populate the edit form
        document.getElementById('editRoleId').value = role.id;
        document.getElementById('editRoleName').value = role.name;
        document.getElementById('editRoleDescription').value = role.description || '';
        
        // Show the edit modal
        const modalElement = document.getElementById('editRoleModal');
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.show();
    } catch (error) {
        console.error('Error loading role for edit:', error);
        alert('Failed to load role data');
    }
}

async function updateRole() {
    const roleId = document.getElementById('editRoleId').value;
    const name = document.getElementById('editRoleName').value.trim();
    const description = document.getElementById('editRoleDescription').value.trim();
    
    if (!name) {
        alert('Please enter role name');
        return;
    }
    
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const roleData = {
            name: name,
            description: description,
            status: 'active'
        };
        
        await ApiService.updateRole(roleId, roleData, workspaceId);
        
        const modalElement = document.getElementById('editRoleModal');
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
        
        await loadRoles();
    } catch (error) {
        console.error('Error updating role:', error);
        alert('Failed to update role');
    }
}

async function deleteRole(roleId, roleName) {
    if (!confirm(`Are you sure you want to delete role ${roleName}?`)) {
        return;
    }
    
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        await ApiService.deleteRole(roleId, workspaceId);
        await loadRoles();
    } catch (error) {
        console.error('Error deleting role:', error);
        alert('Failed to delete role');
    }
}