// User Management Controller
let usersTable;

document.addEventListener('DOMContentLoaded', function() {
    // Only run on users page
    if (window.location.pathname !== '/users') {
        return;
    }
    
    // Simple auto-login and load users
    if (!AuthService.isAuthenticated()) {
        AuthService.login('administrative@admin.com', 'Admin@123').then(() => {
            loadUsers();
        }).catch(error => {
            console.error('Login failed:', error);
        });
    } else {
        loadUsers();
    }
});

async function loadUsers() {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const users = await ApiService.getUsers(workspaceId);
        populateUsersTable(users);
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function populateUsersTable(users) {
    if (usersTable) {
        usersTable.destroy();
    }
    
    const tbody = document.querySelector('#usersTable tbody');
    if (!tbody) {
        console.log('Users table tbody not found, skipping population');
        return;
    }
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name || user.username}</td>
            <td>${user.email}</td>
            <td><span class="badge bg-${getRoleColor(user.role)}">${user.role}</span></td>
            <td><span class="badge bg-${user.status === 'active' ? 'success' : 'secondary'}">${user.status}</span></td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editUser(${user.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${user.id}, '${user.username}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Initialize DataTable
    if (typeof $ !== 'undefined' && $.fn.DataTable) {
        usersTable = $('#usersTable').DataTable({
            pageLength: 10,
            order: [[5, 'desc']]
        });
    }
}

function getRoleColor(role) {
    switch(role) {
        case 'admin': return 'danger';
        case 'manager': return 'warning';
        case 'user': return 'info';
        default: return 'secondary';
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

async function addUser() {
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value.trim();
    const role = document.getElementById('userRole').value;
    
    if (!name || !email || !password || !role) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const userData = {
            name: name,
            email: email,
            password: password,
            role: role,
            username: email.split('@')[0],
            first_name: name.split(' ')[0],
            last_name: name.split(' ').slice(1).join(' ') || ''
        };
        
        await ApiService.createUser(userData, workspaceId);
        
        const modalElement = document.getElementById('addUserModal');
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
        document.getElementById('addUserForm').reset();
        
        await loadUsers();
    } catch (error) {
        console.error('Error creating user:', error);
        alert('Failed to create user');
    }
}

async function editUser(userId) {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const users = await ApiService.getUsers(workspaceId);
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            alert('User not found');
            return;
        }
        
        // Populate the edit form
        document.getElementById('editUserId').value = user.id;
        document.getElementById('editUserName').value = user.name || user.username;
        document.getElementById('editUserEmail').value = user.email;
        document.getElementById('editUserRole').value = user.role;
        
        // Show the edit modal
        const modalElement = document.getElementById('editUserModal');
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.show();
    } catch (error) {
        console.error('Error loading user for edit:', error);
        alert('Failed to load user data');
    }
}

async function updateUser() {
    const userId = document.getElementById('editUserId').value;
    const name = document.getElementById('editUserName').value.trim();
    const email = document.getElementById('editUserEmail').value.trim();
    const role = document.getElementById('editUserRole').value;
    
    if (!name || !email || !role) {
        alert('All fields are required');
        return;
    }
    
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const userData = {
            email: email,
            role: role,
            username: email.split('@')[0],
            first_name: name.split(' ')[0],
            last_name: name.split(' ').slice(1).join(' ') || ''
        };
        
        await ApiService.updateUser(userId, userData, workspaceId);
        
        const modalElement = document.getElementById('editUserModal');
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
        
        await loadUsers();
    } catch (error) {
        console.error('Error updating user:', error);
        alert('Failed to update user');
    }
}

async function deleteUser(userId, username) {
    if (!confirm(`Are you sure you want to delete user ${username}?`)) {
        return;
    }
    
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        await ApiService.deleteUser(userId, workspaceId);
        await loadUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
    }
}
