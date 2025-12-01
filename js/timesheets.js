// Timesheet Management Controller
let timesheetsTable;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Timesheets page DOM loaded');
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
    
    // Initialize workspace and load data after authentication
    initializeWorkspace();
    loadTimesheets();
    loadUsers();
    loadProjects();
}

function initializeWorkspace() {
    // Load workspaces into dropdown
    WorkspaceService.loadWorkspacesIntoDropdown();
    
    // Handle workspace change
    const workspaceDropdown = document.getElementById('workspaceDropdown');
    if (workspaceDropdown) {
        workspaceDropdown.addEventListener('change', function() {
            const workspaceId = parseInt(this.value);
            const workspace = { id: workspaceId, name: this.options[this.selectedIndex].text };
            WorkspaceService.setCurrentWorkspace(workspace);
            // Reload data for new workspace
            loadTimesheets();
            loadUsers();
            loadProjects();
        });
    }
}

async function loadTimesheets() {
    try {
        console.log('Loading timesheets...');
        showLoading(true);
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        console.log('Current workspace ID:', workspaceId);
        const timesheets = await ApiService.getTimesheets(workspaceId);
        console.log('Timesheets loaded:', timesheets.length);
        populateTimesheetsTable(timesheets);
    } catch (error) {
        console.error('Error loading timesheets:', error);
        showAlert('Failed to load timesheets', 'error');
    } finally {
        showLoading(false);
    }
}

async function loadUsers() {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const users = await ApiService.getUsers(workspaceId);
        const userSelects = ['timesheetUser', 'editTimesheetUser'];
        
        userSelects.forEach(selectId => {
            const userSelect = document.getElementById(selectId);
            if (userSelect) {
                userSelect.innerHTML = '<option value="">Select User</option>';
                users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = user.name || `${user.first_name} ${user.last_name}`;
                    userSelect.appendChild(option);
                });
            }
        });
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function loadProjects() {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const projects = await ApiService.getProjects(workspaceId);
        const projectSelects = ['timesheetProject', 'editTimesheetProject'];
        
        projectSelects.forEach(selectId => {
            const projectSelect = document.getElementById(selectId);
            if (projectSelect) {
                projectSelect.innerHTML = '<option value="">Select Project</option>';
                projects.forEach(project => {
                    const option = document.createElement('option');
                    option.value = project.id;
                    option.textContent = project.name;
                    projectSelect.appendChild(option);
                });
            }
        });
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

function populateTimesheetsTable(timesheets) {
    console.log('Populating timesheets table with', timesheets.length, 'entries');
    
    if (timesheetsTable) {
        timesheetsTable.destroy();
    }
    
    const tbody = document.querySelector('#timesheetsTable tbody');
    if (!tbody) {
        console.error('Timesheets table tbody not found');
        return;
    }
    
    tbody.innerHTML = '';
    
    // Show first 20 entries for debugging
    const displayTimesheets = timesheets.slice(0, 20);
    console.log('Displaying first', displayTimesheets.length, 'timesheets');
    
    displayTimesheets.forEach(timesheet => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${timesheet.date}</td>
            <td>User ${timesheet.user_id}</td>
            <td>Project ${timesheet.project_id}</td>
            <td>${timesheet.job_id ? `Job ${timesheet.job_id}` : '-'}</td>
            <td>${timesheet.task_id ? `Task ${timesheet.task_id}` : '-'}</td>
            <td class="hours-cell">${timesheet.hours}h</td>
            <td>${timesheet.description || '-'}</td>
            <td><span class="badge bg-${getStatusColor(timesheet.status)}">${timesheet.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editTimesheet(${timesheet.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteTimesheet(${timesheet.id}, '${timesheet.date}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Note: Do not add colspan rows inside tbody; DataTables doesn't support colspan/rowspan in tbody
    
    console.log('Initializing DataTable...');
    try {
        if (typeof $ !== 'undefined' && $.fn.DataTable) {
            // Destroy existing DataTable if it exists
            if ($.fn.DataTable.isDataTable('#timesheetsTable')) {
                $('#timesheetsTable').DataTable().destroy();
            }
            
            timesheetsTable = $('#timesheetsTable').DataTable({
                pageLength: 10,
                order: [[0, 'desc']],
                columnDefs: [
                    { orderable: false, targets: 8 }, // Actions column
                    { width: "10%", targets: 0 },    // Date
                    { width: "10%", targets: 1 },    // User
                    { width: "10%", targets: 2 },    // Project
                    { width: "8%", targets: 3 },     // Job
                    { width: "8%", targets: 4 },     // Task
                    { width: "8%", targets: 5 },     // Hours
                    { width: "20%", targets: 6 },    // Description
                    { width: "8%", targets: 7 },     // Status
                    { width: "8%", targets: 8 }      // Actions
                ],
                autoWidth: false,
                responsive: true
            });
            console.log('DataTable initialized successfully');
        } else {
            console.warn('jQuery or DataTable not available, using simple table');
        }
    } catch (error) {
        console.error('DataTable initialization failed:', error);
        console.log('Using simple table display');
    }
}

function getStatusColor(status) {
    switch(status) {
        case 'approved': return 'success';
        case 'pending': return 'warning';
        case 'rejected': return 'danger';
        default: return 'secondary';
    }
}

async function addTimesheet() {
    const date = document.getElementById('timesheetDate').value;
    const userId = document.getElementById('timesheetUser').value;
    const projectId = document.getElementById('timesheetProject').value;
    const jobId = document.getElementById('timesheetJob').value;
    const taskId = document.getElementById('timesheetTask').value;
    const hours = document.getElementById('timesheetHours').value;
    const description = document.getElementById('timesheetDescription').value.trim();
    const status = document.getElementById('timesheetStatus').value;
    
    if (!date || !userId || !projectId || !hours || !description) {
        showAlert('Please fill in required fields', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const timesheetData = {
            date: date,
            user_id: parseInt(userId),
            project_id: parseInt(projectId),
            job_id: jobId ? parseInt(jobId) : null,
            task_id: taskId ? parseInt(taskId) : null,
            hours: parseFloat(hours),
            description: description,
            status: status
        };
        
        await ApiService.createTimesheet(timesheetData, workspaceId);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('addTimesheetModal'));
        modal.hide();
        document.getElementById('addTimesheetForm').reset();
        
        await loadTimesheets();
        showAlert('Timesheet entry created successfully', 'success');
    } catch (error) {
        console.error('Error creating timesheet:', error);
        showAlert('Failed to create timesheet entry', 'error');
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

// Edit timesheet function
async function editTimesheet(timesheetId) {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const timesheet = await ApiService.getTimesheet(timesheetId, workspaceId);
        
        // Populate edit form
        document.getElementById('editTimesheetId').value = timesheet.id;
        document.getElementById('editTimesheetDate').value = timesheet.date;
        document.getElementById('editTimesheetUser').value = timesheet.user_id;
        document.getElementById('editTimesheetProject').value = timesheet.project_id;
        document.getElementById('editTimesheetJob').value = timesheet.job_id || '';
        document.getElementById('editTimesheetTask').value = timesheet.task_id || '';
        document.getElementById('editTimesheetHours').value = timesheet.hours;
        document.getElementById('editTimesheetDescription').value = timesheet.description;
        document.getElementById('editTimesheetStatus').value = timesheet.status;
        
        // Show edit modal
        const editModal = new bootstrap.Modal(document.getElementById('editTimesheetModal'));
        editModal.show();
    } catch (error) {
        console.error('Error loading timesheet for edit:', error);
        showAlert('Failed to load timesheet for editing', 'error');
    }
}

// Update timesheet function
async function updateTimesheet() {
    const timesheetId = document.getElementById('editTimesheetId').value;
    const date = document.getElementById('editTimesheetDate').value;
    const userId = document.getElementById('editTimesheetUser').value;
    const projectId = document.getElementById('editTimesheetProject').value;
    const jobId = document.getElementById('editTimesheetJob').value;
    const taskId = document.getElementById('editTimesheetTask').value;
    const hours = document.getElementById('editTimesheetHours').value;
    const description = document.getElementById('editTimesheetDescription').value.trim();
    const status = document.getElementById('editTimesheetStatus').value;
    
    if (!date || !userId || !projectId || !hours || !description) {
        showAlert('Please fill in required fields', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const timesheetData = {
            date: date,
            user_id: parseInt(userId),
            project_id: parseInt(projectId),
            job_id: jobId ? parseInt(jobId) : null,
            task_id: taskId ? parseInt(taskId) : null,
            hours: parseFloat(hours),
            description: description,
            status: status
        };
        
        await ApiService.updateTimesheet(timesheetId, timesheetData, workspaceId);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('editTimesheetModal'));
        modal.hide();
        
        await loadTimesheets();
        showAlert('Timesheet entry updated successfully', 'success');
    } catch (error) {
        console.error('Error updating timesheet:', error);
        showAlert('Failed to update timesheet entry', 'error');
    } finally {
        showLoading(false);
    }
}

// Delete timesheet function
async function deleteTimesheet(timesheetId, date) {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        await ApiService.deleteTimesheet(timesheetId, workspaceId);
        
        await loadTimesheets();
        showAlert('Timesheet entry deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting timesheet:', error);
        showAlert('Failed to delete timesheet entry', 'error');
    }
}
