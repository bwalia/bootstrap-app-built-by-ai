// Timesheet Management Controller
let timesheetsTable;

document.addEventListener('DOMContentLoaded', function() {
    // Only run on timesheets page
    if (window.location.pathname !== '/timesheets') {
        return;
    }
    
    // Auto-login and setup
    if (!AuthService.isAuthenticated()) {
        AuthService.login('administrative@admin.com', 'Admin@123').then(() => {
            setupTimesheets();
        }).catch(error => {
            console.error('Auto-login failed:', error);
        });
    } else {
        setupTimesheets();
    }
});

function setupTimesheets() {
    // Setup user info
    const user = AuthService.getCurrentUser();
    if (user) {
        document.getElementById('userEmail').textContent = user.email;
    }
    
    // Setup logout
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        AuthService.logout();
    });
    
    // Load initial data
    loadTimesheets();
    loadUsers();
    loadProjects();
    
    // Setup workspace handling
    WorkspaceService.loadWorkspacesIntoDropdown();
    const workspaceDropdown = document.getElementById('workspaceDropdown');
    if (workspaceDropdown) {
        workspaceDropdown.addEventListener('change', function() {
            const selectedWorkspaceId = this.value;
            if (selectedWorkspaceId) {
                WorkspaceService.switchWorkspace(selectedWorkspaceId);
            }
        });
    }
    
    // Listen for workspace changes
    document.addEventListener('workspaceChanged', function(event) {
        loadTimesheets();
        loadUsers();
        loadProjects();
    });
    
    // Setup modal event listeners
    const modal = document.getElementById('addTimesheetModal');
    if (modal) {
        modal.addEventListener('show.bs.modal', function() {
            loadUsers();
            loadProjects();
        });
    }
}

async function loadTimesheets() {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const timesheets = await ApiService.getTimesheets(workspaceId);
        populateTimesheetsTable(timesheets);
    } catch (error) {
        console.error('Error loading timesheets:', error);
    }
}

async function loadUsers() {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const users = await ApiService.getUsers(workspaceId);
        const userSelect = document.getElementById('timesheetUser');
        if (userSelect) {
            userSelect.innerHTML = '<option value="">Select User</option>';
            if (users && Array.isArray(users)) {
                users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = user.name || `${user.first_name} ${user.last_name}`;
                    userSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function loadProjects() {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const projects = await ApiService.getProjects(workspaceId);
        const projectSelect = document.getElementById('timesheetProject');
        if (projectSelect) {
            projectSelect.innerHTML = '<option value="">Select Project</option>';
            if (projects && Array.isArray(projects)) {
                projects.forEach(project => {
                    const option = document.createElement('option');
                    option.value = project.id;
                    option.textContent = project.name;
                    projectSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

function populateTimesheetsTable(timesheets) {
    if (timesheetsTable) {
        timesheetsTable.destroy();
    }
    
    const tbody = document.querySelector('#timesheetsTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    timesheets.forEach(timesheet => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${timesheet.id}</td>
            <td>User ${timesheet.user_id}</td>
            <td>Project ${timesheet.project_id}</td>
            <td>${timesheet.date}</td>
            <td>${timesheet.hours}</td>
            <td>${timesheet.description || 'N/A'}</td>
            <td><span class="badge bg-${getStatusColor(timesheet.status)}">${timesheet.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteTimesheet(${timesheet.id}, '${timesheet.date}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    try {
        if (typeof $ !== 'undefined' && $.fn.DataTable) {
            if ($.fn.DataTable.isDataTable('#timesheetsTable')) {
                $('#timesheetsTable').DataTable().destroy();
            }
            
            timesheetsTable = $('#timesheetsTable').DataTable({
                pageLength: 10,
                order: [[3, 'desc']],
                columnDefs: [
                    { width: "8%", targets: 0 },
                    { width: "12%", targets: 1 },
                    { width: "12%", targets: 2 },
                    { width: "12%", targets: 3 },
                    { width: "8%", targets: 4 },
                    { width: "25%", targets: 5 },
                    { width: "10%", targets: 6 },
                    { width: "13%", targets: 7 }
                ],
                autoWidth: false,
                responsive: true
            });
        }
    } catch (error) {
        console.error('DataTable initialization failed:', error);
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
    const userId = document.getElementById('timesheetUser').value;
    const projectId = document.getElementById('timesheetProject').value;
    const date = document.getElementById('timesheetDate').value;
    const hours = document.getElementById('timesheetHours').value;
    const description = document.getElementById('timesheetDescription').value.trim();
    
    if (!userId || !projectId || !date || !hours) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const timesheetData = {
            user_id: parseInt(userId),
            project_id: parseInt(projectId),
            date: date,
            hours: parseFloat(hours),
            description: description,
            status: 'pending'
        };
        
        await ApiService.createTimesheet(timesheetData, workspaceId);
        
        const modalElement = document.getElementById('addTimesheetModal');
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
        document.getElementById('addTimesheetForm').reset();
        
        await loadTimesheets();
    } catch (error) {
        console.error('Error creating timesheet:', error);
        alert('Failed to create timesheet');
    }
}

async function editTimesheet(timesheetId) {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const timesheets = await ApiService.getTimesheets(workspaceId);
        const timesheet = timesheets.find(t => t.id === timesheetId);
        
        if (timesheet) {
            document.getElementById('editTimesheetId').value = timesheet.id;
            document.getElementById('editTimesheetUser').value = timesheet.user_id;
            document.getElementById('editTimesheetProject').value = timesheet.project_id;
            document.getElementById('editTimesheetDate').value = timesheet.date;
            document.getElementById('editTimesheetHours').value = timesheet.hours;
            document.getElementById('editTimesheetDescription').value = timesheet.description || '';
            document.getElementById('editTimesheetStatus').value = timesheet.status;
            
            const modal = new bootstrap.Modal(document.getElementById('editTimesheetModal'));
            modal.show();
        }
    } catch (error) {
        console.error('Error loading timesheet for edit:', error);
        alert('Failed to load timesheet data');
    }
}

async function updateTimesheet() {
    const timesheetId = document.getElementById('editTimesheetId').value;
    const userId = document.getElementById('editTimesheetUser').value;
    const projectId = document.getElementById('editTimesheetProject').value;
    const date = document.getElementById('editTimesheetDate').value;
    const hours = document.getElementById('editTimesheetHours').value;
    const description = document.getElementById('editTimesheetDescription').value.trim();
    const status = document.getElementById('editTimesheetStatus').value;
    
    if (!userId || !projectId || !date || !hours) {
        alert('Please fill in required fields');
        return;
    }
    
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const timesheetData = {
            user_id: parseInt(userId),
            project_id: parseInt(projectId),
            date: date,
            hours: parseFloat(hours),
            description: description,
            status: status
        };
        
        await ApiService.updateTimesheet(timesheetId, timesheetData, workspaceId);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('editTimesheetModal'));
        modal.hide();
        
        await loadTimesheets();
        alert('Timesheet updated successfully');
    } catch (error) {
        console.error('Error updating timesheet:', error);
        alert('Failed to update timesheet');
    }
}

async function deleteTimesheet(timesheetId, timesheetDate) {
    if (!confirm(`Are you sure you want to delete timesheet for ${timesheetDate}?`)) {
        return;
    }
    
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        await ApiService.deleteTimesheet(timesheetId, workspaceId);
        await loadTimesheets();
    } catch (error) {
        console.error('Error deleting timesheet:', error);
        alert('Failed to delete timesheet');
    }
}
