// Workspace Management Controller
let workspacesTable;
let currentWorkspaceId = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    loadWorkspaces();
});

// Initialize authentication
function initializeAuth() {
    if (!AuthService.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Update user info
    const user = AuthService.getCurrentUser();
    if (user) {
        document.getElementById('userEmail').textContent = user.email;
    }
    
    // Setup logout
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        AuthService.logout();
    });
}

// Load workspaces
async function loadWorkspaces() {
    try {
        showLoading(true);
        const workspaces = await ApiService.getWorkspaces();
        populateWorkspacesTable(workspaces);
    } catch (error) {
        console.error('Error loading workspaces:', error);
        showAlert('Failed to load workspaces', 'error');
    } finally {
        showLoading(false);
    }
}

// Populate workspaces table
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
            <td>${workspace.description || '-'}</td>
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
    workspacesTable = $('#workspacesTable').DataTable({
        pageLength: 10,
        order: [[0, 'desc']],
        columnDefs: [
            { orderable: false, targets: 5 }
        ]
    });
}

// Add workspace
async function addWorkspace() {
    const name = document.getElementById('workspaceName').value.trim();
    const description = document.getElementById('workspaceDescription').value.trim();
    const status = document.getElementById('workspaceStatus').value;
    
    if (!name) {
        showAlert('Please enter a workspace name', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const workspaceData = {
            name: name,
            description: description,
            status: status
        };
        
        await ApiService.createWorkspace(workspaceData);
        
        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('addWorkspaceModal'));
        modal.hide();
        document.getElementById('addWorkspaceForm').reset();
        
        // Reload workspaces
        await loadWorkspaces();
        
        showAlert('Workspace created successfully', 'success');
    } catch (error) {
        console.error('Error creating workspace:', error);
        showAlert('Failed to create workspace', 'error');
    } finally {
        showLoading(false);
    }
}

// Edit workspace
async function editWorkspace(workspaceId) {
    try {
        showLoading(true);
        const workspace = await ApiService.getWorkspace(workspaceId);
        
        // Populate edit form
        document.getElementById('editWorkspaceId').value = workspace.id;
        document.getElementById('editWorkspaceName').value = workspace.name;
        document.getElementById('editWorkspaceDescription').value = workspace.description || '';
        document.getElementById('editWorkspaceStatus').value = workspace.status;
        
        // Show edit modal
        const modal = new bootstrap.Modal(document.getElementById('editWorkspaceModal'));
        modal.show();
    } catch (error) {
        console.error('Error loading workspace:', error);
        showAlert('Failed to load workspace details', 'error');
    } finally {
        showLoading(false);
    }
}

// Update workspace
async function updateWorkspace() {
    const workspaceId = document.getElementById('editWorkspaceId').value;
    const name = document.getElementById('editWorkspaceName').value.trim();
    const description = document.getElementById('editWorkspaceDescription').value.trim();
    const status = document.getElementById('editWorkspaceStatus').value;
    
    if (!name) {
        showAlert('Please enter a workspace name', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const workspaceData = {
            name: name,
            description: description,
            status: status
        };
        
        await ApiService.updateWorkspace(workspaceId, workspaceData);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editWorkspaceModal'));
        modal.hide();
        
        // Reload workspaces
        await loadWorkspaces();
        
        showAlert('Workspace updated successfully', 'success');
    } catch (error) {
        console.error('Error updating workspace:', error);
        showAlert('Failed to update workspace', 'error');
    } finally {
        showLoading(false);
    }
}

// Delete workspace
function deleteWorkspace(workspaceId, workspaceName) {
    currentWorkspaceId = workspaceId;
    document.getElementById('deleteWorkspaceName').textContent = workspaceName;
    
    const modal = new bootstrap.Modal(document.getElementById('deleteWorkspaceModal'));
    modal.show();
}

// Confirm delete workspace
async function confirmDeleteWorkspace() {
    if (!currentWorkspaceId) return;
    
    try {
        showLoading(true);
        await ApiService.deleteWorkspace(currentWorkspaceId);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteWorkspaceModal'));
        modal.hide();
        
        // Reload workspaces
        await loadWorkspaces();
        
        showAlert('Workspace deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting workspace:', error);
        showAlert('Failed to delete workspace', 'error');
    } finally {
        showLoading(false);
        currentWorkspaceId = null;
    }
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Show loading state
function showLoading(show) {
    // You can implement a loading spinner here
    if (show) {
        console.log('Loading...');
    } else {
        console.log('Loading complete');
    }
}

// Show alert
function showAlert(message, type = 'info') {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert at top of main content
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(alertDiv, mainContent.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}
