// Scrum Board Controller
let scrumStories = [];

document.addEventListener('DOMContentLoaded', function() {
    // Only run on scrum page
    if (window.location.pathname !== '/scrum') {
        return;
    }
    console.log('Scrum page DOM loaded');
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
        console.log('Workspace changed, reloading scrum data for workspace:', event.detail.workspaceId);
        loadScrumData();
        loadUsers();
        loadProjects();
    });
    
    // Initialize workspace and load data after authentication
    initializeWorkspace();
    loadScrumData();
    loadUsers();
    loadProjects();
}

function initializeWorkspace() {
    // Add a small delay to ensure authentication is complete
    setTimeout(() => {
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
                loadScrumData();
                loadUsers();
                loadProjects();
            });
        }
    }, 100);
}

async function loadScrumData() {
    try {
        console.log('Loading scrum data...');
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        console.log('Current workspace ID:', workspaceId);
        
        // Load tasks and treat them as user stories
        const tasks = await ApiService.getTasks(workspaceId);
        console.log('Stories loaded:', tasks.length);
        
        // Convert tasks to user stories format
        scrumStories = tasks.map(task => ({
            id: task.id,
            title: task.name || 'Untitled Story',
            description: task.description || '',
            points: task.story_points || Math.floor(Math.random() * 13) + 1, // Random points if not set
            priority: task.priority || 'medium',
            assignee: task.assigned_to_name || 'Unassigned',
            assigneeId: task.assigned_to,
            project: task.project_id,
            status: task.status || 'backlog',
            created: task.created_at,
            updated: task.updated_at
        }));
        
        renderScrumBoard();
        updateSprintStats();
    } catch (error) {
        console.error('Error loading scrum data:', error);
        showAlert('Failed to load scrum data', 'error');
    }
}

function renderScrumBoard() {
    // Clear all columns
    document.querySelectorAll('.scrum-column-body').forEach(column => {
        column.innerHTML = '';
    });
    
    // Group stories by status
    const storiesByStatus = {
        'backlog': [],
        'sprint-backlog': [],
        'in-progress': [],
        'testing': [],
        'done': []
    };
    
    scrumStories.forEach(story => {
        const status = story.status || 'backlog';
        if (storiesByStatus[status]) {
            storiesByStatus[status].push(story);
        }
    });
    
    // Render stories in each column
    Object.keys(storiesByStatus).forEach(status => {
        const column = document.querySelector(`[data-status="${status}"] .scrum-column-body`);
        const countBadge = document.getElementById(`${status.replace('-', '')}Count`);
        
        if (countBadge) {
            countBadge.textContent = storiesByStatus[status].length;
        }
        
        storiesByStatus[status].forEach(story => {
            const storyCard = createStoryCard(story);
            column.appendChild(storyCard);
        });
    });
}

function createStoryCard(story) {
    const card = document.createElement('div');
    card.className = 'story-card';
    card.dataset.storyId = story.id;
    
    const assigneeInitials = story.assignee.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    
    card.innerHTML = `
        <div class="story-title">${story.title}</div>
        <div class="story-meta">
            <div class="story-assignee">
                <div class="assignee-avatar">${assigneeInitials}</div>
                <span>${story.assignee}</span>
            </div>
            <div class="story-points">${story.points}</div>
        </div>
    `;
    
    // Add click to edit
    card.addEventListener('click', () => editStory(story.id));
    
    return card;
}

function updateSprintStats() {
    const totalPoints = scrumStories.reduce((sum, story) => sum + story.points, 0);
    const completedPoints = scrumStories
        .filter(story => story.status === 'done')
        .reduce((sum, story) => sum + story.points, 0);
    const remainingPoints = totalPoints - completedPoints;
    const progressPercent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
    
    document.getElementById('totalPoints').textContent = totalPoints;
    document.getElementById('completedPoints').textContent = completedPoints;
    document.getElementById('remainingPoints').textContent = remainingPoints;
    document.getElementById('progressPercent').textContent = progressPercent + '%';
}

async function loadUsers() {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const users = await ApiService.getUsers(workspaceId);
        const userSelect = document.getElementById('storyAssignee');
        
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
        const projectSelect = document.getElementById('storyProject');
        
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

async function addStory() {
    const title = document.getElementById('storyTitle').value;
    const description = document.getElementById('storyDescription').value;
    const points = parseInt(document.getElementById('storyPoints').value);
    const priority = document.getElementById('storyPriority').value;
    const assignee = document.getElementById('storyAssignee').value;
    const project = document.getElementById('storyProject').value;
    const status = document.getElementById('storyStatus').value;
    
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
            story_points: points,
            job_id: null
        };
        
        const newTask = await ApiService.createTask(taskData, workspaceId);
        
        // Add to local data
        scrumStories.push({
            id: newTask.id,
            title: newTask.name,
            description: newTask.description,
            points: newTask.story_points || points,
            priority: newTask.priority,
            assignee: newTask.assigned_to_name || 'Unassigned',
            assigneeId: newTask.assigned_to,
            project: newTask.project_id,
            status: newTask.status,
            created: newTask.created_at,
            updated: newTask.updated_at
        });
        
        // Re-render board
        renderScrumBoard();
        updateSprintStats();
        
        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('addStoryModal'));
        modal.hide();
        document.getElementById('addStoryForm').reset();
        
        showAlert('User story created successfully', 'success');
    } catch (error) {
        console.error('Error creating story:', error);
        showAlert('Failed to create user story', 'error');
    }
}

async function editStory(storyId) {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const task = await ApiService.getTask(storyId, workspaceId);
        
        // Populate form with story data
        document.getElementById('storyTitle').value = task.name || '';
        document.getElementById('storyDescription').value = task.description || '';
        document.getElementById('storyPoints').value = task.story_points || 1;
        document.getElementById('storyPriority').value = task.priority || 'medium';
        document.getElementById('storyAssignee').value = task.assigned_to || '';
        document.getElementById('storyProject').value = task.project_id || '';
        document.getElementById('storyStatus').value = task.status || 'backlog';
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('addStoryModal'));
        modal.show();
        
        // Change modal title
        document.querySelector('#addStoryModal .modal-title').textContent = 'Edit User Story';
        
        // Store story ID for update
        document.getElementById('addStoryModal').dataset.storyId = storyId;
    } catch (error) {
        console.error('Error loading story for edit:', error);
        showAlert('Failed to load story for editing', 'error');
    }
}

function refreshScrum() {
    loadScrumData();
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
