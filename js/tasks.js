// Task Management Controller
let tasksTable;

document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    initializeWorkspace();
    loadTasks();
    loadJobs();
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
            loadTasks();
            loadJobs();
            loadUsers();
        });
    }
}

async function loadTasks() {
    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const tasks = await ApiService.getTasks(workspaceId);
        populateTasksTable(tasks);
    } catch (error) {
        console.error('Error loading tasks:', error);
        showAlert('Failed to load tasks', 'error');
    } finally {
        showLoading(false);
    }
}

async function loadJobs() {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const jobs = await ApiService.getJobs(workspaceId);
        const jobSelect = document.getElementById('taskJob');
        
        jobSelect.innerHTML = '<option value="">Select Job</option>';
        jobs.forEach(job => {
            const option = document.createElement('option');
            option.value = job.id;
            option.textContent = job.name;
            jobSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading jobs:', error);
    }
}

async function loadUsers() {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const users = await ApiService.getUsers(workspaceId);
        const userSelect = document.getElementById('taskAssignedTo');
        
        userSelect.innerHTML = '<option value="">Select User (Optional)</option>';
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            userSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function populateTasksTable(tasks) {
    if (tasksTable) {
        tasksTable.destroy();
    }
    
    const tbody = document.querySelector('#tasksTable tbody');
    tbody.innerHTML = '';
    
    tasks.forEach(task => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${task.name}</td>
            <td>${task.description || '-'}</td>
            <td>Job ${task.job_id}</td>
            <td><span class="badge bg-${getStatusColor(task.status)}">${task.status}</span></td>
            <td><span class="badge bg-${getPriorityColor(task.priority)}">${task.priority}</span></td>
            <td>${task.assigned_to ? `User ${task.assigned_to}` : '-'}</td>
            <td>${task.estimated_hours || '-'}</td>
            <td>${task.actual_hours || '-'}</td>
            <td>${task.due_date || '-'}</td>
            <td>${formatDate(task.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editTask(${task.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteTask(${task.id}, '${task.name}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    tasksTable = $('#tasksTable').DataTable({
        pageLength: 10,
        order: [[9, 'desc']],
        columnDefs: [{ orderable: false, targets: 10 }]
    });
}

function getStatusColor(status) {
    switch(status) {
        case 'completed': return 'success';
        case 'in_progress': return 'warning';
        case 'pending': return 'info';
        case 'cancelled': return 'danger';
        default: return 'secondary';
    }
}

function getPriorityColor(priority) {
    switch(priority) {
        case 'urgent': return 'danger';
        case 'high': return 'warning';
        case 'medium': return 'info';
        case 'low': return 'secondary';
        default: return 'secondary';
    }
}

async function addTask() {
    // Check if we're in edit mode
    const taskId = document.getElementById('addTaskModal').dataset.taskId;
    if (taskId) {
        await updateTask();
        return;
    }
    
    const name = document.getElementById('taskName').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const jobId = document.getElementById('taskJob').value;
    const priority = document.getElementById('taskPriority').value;
    const assignedTo = document.getElementById('taskAssignedTo').value;
    const estimatedHours = document.getElementById('taskEstimatedHours').value;
    const dueDate = document.getElementById('taskDueDate').value;
    
    if (!name || !description || !jobId) {
        showAlert('Please fill in required fields', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const taskData = {
            name: name,
            description: description,
            job_id: parseInt(jobId),
            priority: priority,
            assigned_to: assignedTo ? parseInt(assignedTo) : null,
            estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
            due_date: dueDate || null
        };
        
        await ApiService.createTask(taskData, workspaceId);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
        modal.hide();
        document.getElementById('addTaskForm').reset();
        
        await loadTasks();
        showAlert('Task created successfully', 'success');
    } catch (error) {
        console.error('Error creating task:', error);
        showAlert('Failed to create task', 'error');
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

// Edit task function
async function editTask(taskId) {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const task = await ApiService.getTask(taskId, workspaceId);

        // Populate edit form
        document.getElementById('taskName').value = task.name || '';
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskJob').value = task.job_id || '';
        document.getElementById('taskPriority').value = task.priority || 'medium';
        document.getElementById('taskAssignedTo').value = task.assigned_to || '';
        document.getElementById('taskEstimatedHours').value = task.estimated_hours || '';
        document.getElementById('taskDueDate').value = task.due_date || '';

        // Show edit modal
        const editModal = new bootstrap.Modal(document.getElementById('addTaskModal'));
        editModal.show();
        
        // Change modal title
        document.querySelector('#addTaskModal .modal-title').textContent = 'Edit Task';
        
        // Store task ID for update
        document.getElementById('addTaskModal').dataset.taskId = taskId;
    } catch (error) {
        console.error('Error loading task for edit:', error);
        showAlert('Failed to load task for editing', 'error');
    }
}

// Update task function
async function updateTask() {
    const taskId = document.getElementById('addTaskModal').dataset.taskId;
    const name = document.getElementById('taskName').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const jobId = document.getElementById('taskJob').value;
    const priority = document.getElementById('taskPriority').value;
    const assignedTo = document.getElementById('taskAssignedTo').value;
    const estimatedHours = document.getElementById('taskEstimatedHours').value;
    const dueDate = document.getElementById('taskDueDate').value;

    if (!name || !description || !jobId) {
        showAlert('Please fill in required fields', 'error');
        return;
    }

    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const taskData = {
            name: name,
            description: description,
            job_id: parseInt(jobId),
            priority: priority,
            assigned_to: assignedTo ? parseInt(assignedTo) : null,
            estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
            due_date: dueDate || null
        };

        await ApiService.updateTask(taskId, taskData, workspaceId);

        const modal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
        modal.hide();

        await loadTasks();
        showAlert('Task updated successfully', 'success');
    } catch (error) {
        console.error('Error updating task:', error);
        showAlert('Failed to update task', 'error');
    } finally {
        showLoading(false);
    }
}

// Delete task function
async function deleteTask(taskId, taskName) {
    if (!confirm(`Are you sure you want to delete the task "${taskName}"?`)) {
        return;
    }

    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        await ApiService.deleteTask(taskId, workspaceId);

        await loadTasks();
        showAlert('Task deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting task:', error);
        showAlert('Failed to delete task', 'error');
    }
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    alertDiv.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    
    const mainContent = document.querySelector('.jira-main-content');
    mainContent.insertBefore(alertDiv, mainContent.firstChild);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}
