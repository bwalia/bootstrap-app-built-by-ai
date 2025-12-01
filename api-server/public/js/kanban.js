// Kanban Board Controller
let kanbanTasks = [];
let draggedTask = null;

document.addEventListener('DOMContentLoaded', function() {
    // Only run on kanban page
    if (window.location.pathname !== '/kanban') {
        return;
    }
    console.log('Kanban page DOM loaded');
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
    
    // Listen for workspace changes
    document.addEventListener('workspaceChanged', function(event) {
        console.log('Workspace changed, reloading kanban data for workspace:', event.detail.workspaceId);
        loadKanbanData();
        loadUsers();
        loadProjects();
    });
    
    // Initialize workspace and load data after authentication
    initializeWorkspace();
    loadKanbanData();
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
            loadKanbanData();
            loadUsers();
            loadProjects();
        });
    }
}

async function loadKanbanData() {
    try {
        console.log('Loading kanban data...');
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        console.log('Current workspace ID:', workspaceId);
        
        // Load tasks and filter by status
        const tasks = await ApiService.getTasks(workspaceId);
        console.log('Tasks loaded:', tasks.length);
        
        kanbanTasks = tasks;
        renderKanbanBoard();
    } catch (error) {
        console.error('Error loading kanban data:', error);
        showAlert('Failed to load kanban data', 'error');
    }
}

function renderKanbanBoard() {
    // Clear all columns
    document.querySelectorAll('.kanban-column-body').forEach(column => {
        column.innerHTML = '<button class="add-task-btn" onclick="showAddTaskModal(\'' + 
            column.closest('.kanban-column').dataset.status + '\')"><i class="fas fa-plus"></i> Add a task</button>';
    });
    
    // Group tasks by status
    const tasksByStatus = {
        'todo': [],
        'in-progress': [],
        'review': [],
        'done': []
    };
    
    kanbanTasks.forEach(task => {
        const status = task.status || 'todo';
        if (tasksByStatus[status]) {
            tasksByStatus[status].push(task);
        }
    });
    
    // Render tasks in each column
    Object.keys(tasksByStatus).forEach(status => {
        const column = document.querySelector(`[data-status="${status}"] .kanban-column-body`);
        const countBadge = document.getElementById(`${status.replace('-', '')}Count`);
        
        if (countBadge) {
            countBadge.textContent = tasksByStatus[status].length;
        }
        
        tasksByStatus[status].forEach(task => {
            const taskCard = createTaskCard(task);
            column.insertBefore(taskCard, column.firstChild);
        });
    });
}

function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'kanban-card task-card';
    card.draggable = true;
    card.dataset.taskId = task.id;
    
    const priorityClass = `priority-${task.priority || 'medium'}`;
    const assigneeName = task.assigned_to_name || 'Unassigned';
    const assigneeInitials = assigneeName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    
    card.innerHTML = `
        <div class="task-priority ${priorityClass}"></div>
        <div class="kanban-card-title">${task.name || 'Untitled Task'}</div>
        <div class="kanban-card-meta">
            <div class="task-assignee">
                <div class="assignee-avatar">${assigneeInitials}</div>
                <span>${assigneeName}</span>
            </div>
            <div class="task-id">#${task.id}</div>
        </div>
    `;
    
    // Add drag event listeners
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    
    // Add click to edit
    card.addEventListener('click', () => editTask(task.id));
    
    return card;
}

function handleDragStart(e) {
    draggedTask = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedTask = null;
}

function allowDrop(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function drop(e) {
    e.preventDefault();
    
    if (!draggedTask) return;
    
    const taskId = parseInt(draggedTask.dataset.taskId);
    const newStatus = e.currentTarget.closest('.kanban-column').dataset.status;
    
    // Update task status
    updateTaskStatus(taskId, newStatus);
}

async function updateTaskStatus(taskId, newStatus) {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const task = kanbanTasks.find(t => t.id === taskId);
        
        if (!task) return;
        
        const updatedTask = { ...task, status: newStatus };
        await ApiService.updateTask(taskId, updatedTask, workspaceId);
        
        // Update local data
        task.status = newStatus;
        
        // Re-render board
        renderKanbanBoard();
        
        showAlert('Task status updated successfully', 'success');
    } catch (error) {
        console.error('Error updating task status:', error);
        showAlert('Failed to update task status', 'error');
    }
}

async function loadUsers() {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const users = await ApiService.getUsers(workspaceId);
        const userSelect = document.getElementById('taskAssignee');
        
        userSelect.innerHTML = '<option value="">Unassigned</option>';
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name || `${user.first_name} ${user.last_name}`;
            userSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function loadProjects() {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const projects = await ApiService.getProjects(workspaceId);
        const projectSelect = document.getElementById('taskProject');
        
        projectSelect.innerHTML = '<option value="">Select Project</option>';
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

function showAddTaskModal(status) {
    document.getElementById('taskStatus').value = status;
    const modal = new bootstrap.Modal(document.getElementById('addTaskModal'));
    modal.show();
}

async function addTask() {
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const priority = document.getElementById('taskPriority').value;
    const assignee = document.getElementById('taskAssignee').value;
    const project = document.getElementById('taskProject').value;
    const status = document.getElementById('taskStatus').value;
    
    if (!title || !project) {
        showAlert('Please fill in required fields', 'error');
        return;
    }
    
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const taskData = {
            name: title,
            description: description,
            priority: priority,
            assigned_to: assignee ? parseInt(assignee) : null,
            project_id: parseInt(project),
            status: status,
            job_id: null // Could be set based on project selection
        };
        
        const newTask = await ApiService.createTask(taskData, workspaceId);
        
        // Add to local data
        kanbanTasks.push(newTask);
        
        // Re-render board
        renderKanbanBoard();
        
        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
        modal.hide();
        document.getElementById('addTaskForm').reset();
        
        showAlert('Task created successfully', 'success');
    } catch (error) {
        console.error('Error creating task:', error);
        showAlert('Failed to create task', 'error');
    }
}

async function editTask(taskId) {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const task = await ApiService.getTask(taskId, workspaceId);
        
        // Populate form with task data
        document.getElementById('taskTitle').value = task.name || '';
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskPriority').value = task.priority || 'medium';
        document.getElementById('taskAssignee').value = task.assigned_to || '';
        document.getElementById('taskProject').value = task.project_id || '';
        document.getElementById('taskStatus').value = task.status || 'todo';
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('addTaskModal'));
        modal.show();
        
        // Change modal title
        document.querySelector('#addTaskModal .modal-title').textContent = 'Edit Task';
        
        // Store task ID for update
        document.getElementById('addTaskModal').dataset.taskId = taskId;
    } catch (error) {
        console.error('Error loading task for edit:', error);
        showAlert('Failed to load task for editing', 'error');
    }
}

function refreshKanban() {
    loadKanbanData();
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
