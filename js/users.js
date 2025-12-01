// User Management Controller
let usersTable;

document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    loadUsers();
});

function initializeAuth() {
    if (!AuthService.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    const user = AuthService.getCurrentUser();
    if (user) {
        document.getElementById('userEmail').textContent = user.email;
    }
    
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        AuthService.logout();
    });
}

async function loadUsers() {
    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getWorkspaceId();
        const users = await ApiService.getUsers(workspaceId);
        populateUsersTable(users);
    } catch (error) {
        console.error('Error loading users:', error);
        showAlert('Failed to load users', 'error');
    } finally {
        showLoading(false);
    }
}

function populateUsersTable(users) {
    if (usersTable) {
        usersTable.destroy();
    }
    
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.name}</td>
            <td><span class="badge bg-${getRoleColor(user.role)}">${user.role}</span></td>
            <td><span class="badge bg-${user.status === 'active' ? 'success' : 'secondary'}">${user.status}</span></td>
            <td>${user.phone_no || '-'}</td>
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
    
    usersTable = $('#usersTable').DataTable({
        pageLength: 10,
        order: [[6, 'desc']],
        columnDefs: [{ orderable: false, targets: 7 }]
    });
}

function getRoleColor(role) {
    switch(role) {
        case 'admin': return 'danger';
        case 'manager': return 'warning';
        case 'user': return 'info';
        default: return 'secondary';
    }
}

async function addUser() {
    const username = document.getElementById('userUsername').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const firstName = document.getElementById('userFirstName').value.trim();
    const lastName = document.getElementById('userLastName').value.trim();
    const role = document.getElementById('userRole').value;
    const phone = document.getElementById('userPhone').value.trim();
    const address = document.getElementById('userAddress').value.trim();
    
    if (!username || !email || !firstName || !lastName) {
        showAlert('Please fill in required fields', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getWorkspaceId();
        const userData = {
            username: username,
            email: email,
            first_name: firstName,
            last_name: lastName,
            name: `${firstName} ${lastName}`,
            role: role,
            phone_no: phone,
            address: address
        };
        
        await ApiService.createUser(userData, workspaceId);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
        modal.hide();
        document.getElementById('addUserForm').reset();
        
        await loadUsers();
        showAlert('User created successfully', 'success');
    } catch (error) {
        console.error('Error creating user:', error);
        showAlert('Failed to create user', 'error');
    } finally {
        showLoading(false);
    }
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function showLoading(show) {
    console.log(show ? 'Loading...' : 'Loading complete');
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    alertDiv.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(alertDiv, mainContent.firstChild);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}
