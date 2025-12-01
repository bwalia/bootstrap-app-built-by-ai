// Groups Management Controller
let groupsTable;

document.addEventListener('DOMContentLoaded', function() {
    // Only run on groups page
    if (window.location.pathname !== '/groups') {
        return;
    }
    
    // Simple auto-login and load groups
    if (!AuthService.isAuthenticated()) {
        AuthService.login('administrative@admin.com', 'Admin@123').then(() => {
            loadGroups();
        }).catch(error => {
            console.error('Login failed:', error);
        });
    } else {
        loadGroups();
    }
});

async function loadGroups() {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const groups = await ApiService.getGroups(workspaceId);
        populateGroupsTable(groups);
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

function populateGroupsTable(groups) {
    if (groupsTable) {
        groupsTable.destroy();
    }
    
    const tbody = document.querySelector('#groupsTable tbody');
    tbody.innerHTML = '';
    
    groups.forEach(group => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${group.id}</td>
            <td>${group.name}</td>
            <td>${group.machine_name || group.name.toLowerCase().replace(/\s+/g, '_')}</td>
            <td>${group.description || 'N/A'}</td>
            <td>${group.workspace_id || 'N/A'}</td>
            <td>${formatDate(group.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editGroup(${group.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteGroup(${group.id}, '${group.name}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Initialize DataTable
    if (typeof $ !== 'undefined' && $.fn.DataTable) {
        groupsTable = $('#groupsTable').DataTable({
            pageLength: 10,
            order: [[5, 'desc']]
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

async function addGroup() {
    const name = document.getElementById('groupName').value.trim();
    const description = document.getElementById('groupDescription').value.trim();
    
    if (!name) {
        alert('Please enter group name');
        return;
    }
    
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const groupData = {
            name: name,
            description: description,
            status: 'active'
        };
        
        await ApiService.createGroup(groupData, workspaceId);
        
        const modalElement = document.getElementById('addGroupModal');
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
        document.getElementById('addGroupForm').reset();
        
        await loadGroups();
    } catch (error) {
        console.error('Error creating group:', error);
        alert('Failed to create group');
    }
}

async function editGroup(groupId) {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const groups = await ApiService.getGroups(workspaceId);
        const group = groups.find(g => g.id === groupId);
        
        if (!group) {
            alert('Group not found');
            return;
        }
        
        // Populate the edit form
        document.getElementById('editGroupId').value = group.id;
        document.getElementById('editGroupName').value = group.name;
        document.getElementById('editGroupDescription').value = group.description || '';
        
        // Show the edit modal
        const modalElement = document.getElementById('editGroupModal');
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.show();
    } catch (error) {
        console.error('Error loading group for edit:', error);
        alert('Failed to load group data');
    }
}

async function updateGroup() {
    const groupId = document.getElementById('editGroupId').value;
    const name = document.getElementById('editGroupName').value.trim();
    const description = document.getElementById('editGroupDescription').value.trim();
    
    if (!name) {
        alert('Please enter group name');
        return;
    }
    
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const groupData = {
            name: name,
            description: description,
            workspace_id: workspaceId
        };
        
        await ApiService.updateGroup(groupId, groupData, workspaceId);
        
        const modalElement = document.getElementById('editGroupModal');
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
        
        await loadGroups();
    } catch (error) {
        console.error('Error updating group:', error);
        alert('Failed to update group');
    }
}

async function deleteGroup(groupId, groupName) {
    if (!confirm(`Are you sure you want to delete group ${groupName}?`)) {
        return;
    }
    
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        await ApiService.deleteGroup(groupId, workspaceId);
        await loadGroups();
    } catch (error) {
        console.error('Error deleting group:', error);
        alert('Failed to delete group');
    }
}