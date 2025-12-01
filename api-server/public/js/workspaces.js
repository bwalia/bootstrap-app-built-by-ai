// Workspace Management Controller
let workspacesTable;

document.addEventListener('DOMContentLoaded', function() {
    // Only run on workspaces page
    if (window.location.pathname !== '/workspaces') {
        return;
    }
    
    // Simple auto-login and load workspaces
    if (!AuthService.isAuthenticated()) {
        AuthService.login('administrative@admin.com', 'Admin@123').then(() => {
            loadWorkspaces();
        }).catch(error => {
            console.error('Login failed:', error);
        });
    } else {
        loadWorkspaces();
    }
});

async function loadWorkspaces() {
    try {
        const workspaces = await ApiService.getWorkspaces();
        populateWorkspacesTable(workspaces);
    } catch (error) {
        console.error('Error loading workspaces:', error);
    }
}

function populateWorkspacesTable(workspaces) {
    if (workspacesTable) {
        workspacesTable.destroy();
    }
    
    const tbody = document.querySelector('#workspacesTable tbody');
    tbody.innerHTML = '';
    
    workspaces.forEach(workspace => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${workspace.id}</td>
            <td>${workspace.name}</td>
            <td>${workspace.description || 'N/A'}</td>
            <td><span class="badge bg-${workspace.status === 'active' ? 'success' : 'secondary'}">${workspace.status}</span></td>
            <td>${formatDate(workspace.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editWorkspace(${workspace.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteWorkspace(${workspace.id}, '${workspace.name}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Initialize DataTable
    if (typeof $ !== 'undefined' && $.fn.DataTable) {
        workspacesTable = $('#workspacesTable').DataTable({
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

async function addWorkspace() {
    const name = document.getElementById('workspaceName').value.trim();
    const description = document.getElementById('workspaceDescription').value.trim();
    
    if (!name) {
        alert('Please enter workspace name');
        return;
    }
    
    try {
        const workspaceData = {
            name: name,
            description: description,
            status: 'active'
        };
        
        await ApiService.createWorkspace(workspaceData);
        
        const modalElement = document.getElementById('addWorkspaceModal');
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
        document.getElementById('addWorkspaceForm').reset();
        
        await loadWorkspaces();
    } catch (error) {
        console.error('Error creating workspace:', error);
        alert('Failed to create workspace');
    }
}

async function editWorkspace(workspaceId) {
    try {
        const workspaces = await ApiService.getWorkspaces();
        const workspace = workspaces.find(w => w.id === workspaceId);
        
        if (workspace) {
            document.getElementById('editWorkspaceId').value = workspace.id;
            document.getElementById('editWorkspaceName').value = workspace.name;
            document.getElementById('editWorkspaceMachineName').value = workspace.machine_name || '';
            document.getElementById('editWorkspaceDescription').value = workspace.description || '';
            document.getElementById('editWorkspaceStatus').value = workspace.status;
            
            const modal = new bootstrap.Modal(document.getElementById('editWorkspaceModal'));
            modal.show();
        }
    } catch (error) {
        console.error('Error loading workspace for edit:', error);
        alert('Failed to load workspace data');
    }
}

async function updateWorkspace() {
    const workspaceId = document.getElementById('editWorkspaceId').value;
    const name = document.getElementById('editWorkspaceName').value.trim();
    const machineName = document.getElementById('editWorkspaceMachineName').value.trim();
    const description = document.getElementById('editWorkspaceDescription').value.trim();
    const status = document.getElementById('editWorkspaceStatus').value;
    
    if (!name) {
        alert('Please enter workspace name');
        return;
    }
    
    try {
        const workspaceData = {
            name: name,
            machine_name: machineName,
            description: description,
            status: status
        };
        
        await ApiService.updateWorkspace(workspaceId, workspaceData);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('editWorkspaceModal'));
        modal.hide();
        
        await loadWorkspaces();
        alert('Workspace updated successfully');
    } catch (error) {
        console.error('Error updating workspace:', error);
        alert('Failed to update workspace');
    }
}

async function deleteWorkspace(workspaceId, workspaceName) {
    if (!confirm(`Are you sure you want to delete workspace ${workspaceName}?`)) {
        return;
    }
    
    try {
        await ApiService.deleteWorkspace(workspaceId);
        await loadWorkspaces();
    } catch (error) {
        console.error('Error deleting workspace:', error);
        alert('Failed to delete workspace');
    }
}