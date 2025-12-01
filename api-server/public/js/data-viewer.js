// Data Viewer Controller
let dataTables = {};

document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
});

function initializeAuth() {
    // Auto-login for testing if not authenticated
    if (!AuthService.isAuthenticated()) {
        console.log('Not authenticated, attempting auto-login...');
        AuthService.login('administrative@admin.com', 'Admin@123').then(() => {
            console.log('Auto-login successful');
            setupAuthUI();
        }).catch(error => {
            console.error('Auto-login failed:', error);
            window.location.href = 'login.html';
        });
        return;
    }
    
    setupAuthUI();
}

function setupAuthUI() {
    const user = AuthService.getCurrentUser();
    if (user) {
        document.getElementById('userEmail').textContent = user.email;
    } else {
        console.warn('No user data found, using default email');
        document.getElementById('userEmail').textContent = 'administrative@admin.com';
    }
    
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        AuthService.logout();
    });
    
    // Load data after authentication
    loadAllData();
}

async function loadAllData() {
    try {
        showLoading(true);
        const response = await fetch('/api/v2/data-viewer/all', {
            headers: {
                'Authorization': `Bearer ${AuthService.getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load data');
        }
        
        const data = await response.json();
        
        // Populate all tables
        populateTable('users', data.users, ['id', 'name', 'email', 'role', 'status']);
        populateTable('workspaces', data.workspaces, ['id', 'name', 'status', 'createdAt']);
        populateTable('projects', data.projects, ['id', 'name', 'status', 'workspace_id']);
        populateTable('tasks', data.tasks, ['id', 'title', 'status', 'priority']);
        populateTable('jobs', data.jobs, ['id', 'title', 'status', 'priority']);
        populateTable('timesheets', data.timesheets, ['id', 'date', 'hours', 'status']);
        populateTable('groups', data.groups, ['id', 'name', 'description', 'status']);
        populateTable('roles', data.roles, ['id', 'name', 'description', 'status']);
        populateTable('departments', data.departments, ['id', 'name', 'description', 'status']);
        populateTable('permissions', data.permissions, ['id', 'name', 'description', 'resource']);
        populateTable('contacts', data.contacts, ['id', 'name', 'email', 'phone']);
        populateTable('customers', data.customers, ['id', 'name', 'email', 'status']);
        populateTable('enquiries', data.enquiries, ['id', 'subject', 'status', 'priority']);
        populateTable('documents', data.documents, ['id', 'name', 'file_type', 'size']);
        
        // Update counts
        updateCounts(data.counts);
        
    } catch (error) {
        console.error('Error loading data:', error);
        showAlert('Failed to load data', 'error');
    } finally {
        showLoading(false);
    }
}

function populateTable(tableName, data, columns) {
    const tableId = `${tableName}DataTable`;
    const table = document.getElementById(tableId);
    if (!table) return;
    
    // Destroy existing DataTable if it exists
    if (dataTables[tableId]) {
        dataTables[tableId].destroy();
    }
    
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    
    data.forEach(item => {
        const row = document.createElement('tr');
        const cells = columns.map(col => {
            let value = item[col];
            if (col === 'createdAt' && value) {
                value = new Date(value).toLocaleDateString();
            }
            if (col === 'status' && value) {
                return `<span class="badge bg-${getStatusColor(value)}">${value}</span>`;
            }
            return value || '-';
        });
        
        row.innerHTML = cells.map(cell => `<td>${cell}</td>`).join('');
        tbody.appendChild(row);
    });
    
    // Initialize DataTable
    dataTables[tableId] = $(`#${tableId}`).DataTable({
        pageLength: 10,
        order: [[0, 'asc']],
        searching: true,
        info: true,
        paging: true
    });
}

function updateCounts(counts) {
    Object.keys(counts).forEach(key => {
        const countElement = document.getElementById(`${key}Count`);
        if (countElement) {
            countElement.textContent = counts[key].toLocaleString();
        }
    });
}

function getStatusColor(status) {
    switch(status) {
        case 'active': return 'success';
        case 'inactive': return 'secondary';
        case 'pending': return 'warning';
        case 'suspended': return 'danger';
        case 'completed': return 'info';
        case 'in-progress': return 'primary';
        default: return 'secondary';
    }
}

// Redis functions
async function getRedisValue() {
    const key = document.getElementById('redisKeyInput').value.trim();
    if (!key) {
        showAlert('Please enter a Redis key', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const response = await fetch(`/api/v2/redis/${encodeURIComponent(key)}`, {
            headers: {
                'Authorization': `Bearer ${AuthService.getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to get Redis value');
        }
        
        const data = await response.json();
        displayRedisResult(data);
        
    } catch (error) {
        console.error('Error getting Redis value:', error);
        showAlert('Failed to get Redis value', 'error');
    } finally {
        showLoading(false);
    }
}

async function getAllRedisKeys() {
    try {
        showLoading(true);
        const response = await fetch('/api/v2/redis', {
            headers: {
                'Authorization': `Bearer ${AuthService.getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to get Redis keys');
        }
        
        const data = await response.json();
        displayRedisKeys(data);
        
    } catch (error) {
        console.error('Error getting Redis keys:', error);
        showAlert('Failed to get Redis keys', 'error');
    } finally {
        showLoading(false);
    }
}

async function clearRedisData() {
    if (!confirm('Are you sure you want to clear all Redis data? This action cannot be undone.')) {
        return;
    }
    
    try {
        showLoading(true);
        const response = await fetch('/api/v2/redis', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${AuthService.getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to clear Redis data');
        }
        
        const data = await response.json();
        showAlert(data.message, 'success');
        document.getElementById('redisResults').innerHTML = '';
        
    } catch (error) {
        console.error('Error clearing Redis data:', error);
        showAlert('Failed to clear Redis data', 'error');
    } finally {
        showLoading(false);
    }
}

function displayRedisResult(data) {
    const resultsDiv = document.getElementById('redisResults');
    resultsDiv.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h6><i class="fas fa-key"></i> Redis Key: <code>${data.key}</code></h6>
            </div>
            <div class="card-body">
                <p><strong>Type:</strong> ${data.type}</p>
                <p><strong>Value:</strong></p>
                <pre class="bg-light p-3 rounded"><code>${JSON.stringify(data.value, null, 2)}</code></pre>
            </div>
        </div>
    `;
}

function displayRedisKeys(data) {
    const resultsDiv = document.getElementById('redisResults');
    
    if (data.count === 0) {
        resultsDiv.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i> No Redis keys found.
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="card">
            <div class="card-header">
                <h6><i class="fas fa-list"></i> Redis Keys (${data.count} total)</h6>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-sm">
                        <thead>
                            <tr>
                                <th>Key</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    Object.entries(data.keyValues).forEach(([key, value]) => {
        html += `
            <tr>
                <td><code>${key}</code></td>
                <td><pre class="mb-0"><code>${JSON.stringify(value, null, 2)}</code></pre></td>
            </tr>
        `;
    });
    
    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    resultsDiv.innerHTML = html;
}

function refreshAllData() {
    loadAllData();
}

function showLoading(show) {
    console.log(show ? 'Loading...' : 'Loading complete');
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    alertDiv.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    
    const mainContent = document.querySelector('.jira-main-content');
    if (mainContent) {
        mainContent.insertBefore(alertDiv, mainContent.firstChild);
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}
