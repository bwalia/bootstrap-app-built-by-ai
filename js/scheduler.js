// Job Scheduler Controller
let schedulerResources = [];
let schedulerJobs = [];
let currentView = 'list';
let currentDate = new Date();

document.addEventListener('DOMContentLoaded', function() {
    console.log('Scheduler page DOM loaded');
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
    loadSchedulerData();
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
            loadSchedulerData();
            loadProjects();
        });
    }
}

async function loadSchedulerData() {
    try {
        console.log('Loading scheduler data...');
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        console.log('Current workspace ID:', workspaceId);
        
        // Load users as resources
        const users = await ApiService.getUsers(workspaceId);
        schedulerResources = users.map(user => ({
            id: user.id,
            name: user.name || `${user.first_name} ${user.last_name}`,
            email: user.email,
            department: user.department || 'General',
            status: getRandomStatus(), // Simulate availability status
            skills: getRandomSkills(), // Simulate skills
            workload: Math.floor(Math.random() * 100) // Simulate current workload percentage
        }));
        
        // Load jobs
        const jobs = await ApiService.getJobs(workspaceId);
        schedulerJobs = jobs.map(job => ({
            id: job.id,
            title: job.name || 'Untitled Job',
            description: job.description || '',
            project: job.project_id,
            startDate: job.start_date || new Date().toISOString().split('T')[0],
            endDate: job.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            priority: job.priority || 'medium',
            status: job.status || 'pending',
            resources: getRandomResources(job.id), // Simulate assigned resources
            created: job.created_at,
            updated: job.updated_at
        }));
        
        console.log('Resources loaded:', schedulerResources.length);
        console.log('Jobs loaded:', schedulerJobs.length);
        
        renderResourcePanel();
        renderJobList();
        renderTimeline();
    } catch (error) {
        console.error('Error loading scheduler data:', error);
        showAlert('Failed to load scheduler data', 'error');
    }
}

function getRandomStatus() {
    const statuses = ['available', 'busy', 'unavailable'];
    return statuses[Math.floor(Math.random() * statuses.length)];
}

function getRandomSkills() {
    const skills = ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Docker', 'AWS', 'Git'];
    const numSkills = Math.floor(Math.random() * 3) + 1;
    return skills.sort(() => 0.5 - Math.random()).slice(0, numSkills);
}

function getRandomResources(jobId) {
    const numResources = Math.floor(Math.random() * 3) + 1;
    return schedulerResources
        .sort(() => 0.5 - Math.random())
        .slice(0, numResources)
        .map(resource => resource.id);
}

function renderResourcePanel() {
    const resourceList = document.getElementById('resourceList');
    resourceList.innerHTML = '';
    
    schedulerResources.forEach(resource => {
        const resourceItem = createResourceItem(resource);
        resourceList.appendChild(resourceItem);
    });
}

function createResourceItem(resource) {
    const item = document.createElement('div');
    item.className = 'resource-item';
    item.draggable = true;
    item.dataset.resourceId = resource.id;
    
    const statusClass = `status-${resource.status}`;
    const workloadColor = resource.workload > 80 ? 'var(--jira-error)' : 
                         resource.workload > 60 ? 'var(--jira-warning)' : 'var(--jira-success)';
    
    item.innerHTML = `
        <div class="resource-name">${resource.name}</div>
        <div class="resource-meta">
            <span>${resource.department}</span>
            <span class="resource-status ${statusClass}">${resource.status}</span>
        </div>
        <div class="resource-meta">
            <span>Workload: ${resource.workload}%</span>
            <div style="width: 60px; height: 4px; background: var(--jira-gray-200); border-radius: 2px; overflow: hidden;">
                <div style="width: ${resource.workload}%; height: 100%; background: ${workloadColor};"></div>
            </div>
        </div>
    `;
    
    // Add drag event listeners
    item.addEventListener('dragstart', handleResourceDragStart);
    item.addEventListener('dragend', handleResourceDragEnd);
    
    return item;
}

function handleResourceDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.target.dataset.resourceId);
}

function handleResourceDragEnd(e) {
    e.target.classList.remove('dragging');
}

function renderJobList() {
    const jobList = document.getElementById('jobList');
    jobList.innerHTML = '';
    
    schedulerJobs.forEach(job => {
        const jobSlot = createJobSlot(job);
        jobList.appendChild(jobSlot);
    });
}

function createJobSlot(job) {
    const slot = document.createElement('div');
    slot.className = 'job-slot occupied';
    slot.dataset.jobId = job.id;
    
    const assignedResources = schedulerResources.filter(resource => 
        job.resources.includes(resource.id)
    );
    
    const startDate = new Date(job.startDate);
    const endDate = new Date(job.endDate);
    const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    slot.innerHTML = `
        <div class="job-slot-header">
            <div class="job-title">${job.title}</div>
            <div class="job-meta">${duration} days</div>
        </div>
        <div class="job-meta">
            <i class="fas fa-calendar-alt me-1"></i>
            ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}
        </div>
        <div class="job-resources">
            ${assignedResources.map(resource => 
                `<span class="resource-tag">${resource.name}</span>`
            ).join('')}
        </div>
    `;
    
    // Add drop event listeners
    slot.addEventListener('dragover', allowJobDrop);
    slot.addEventListener('drop', handleJobDrop);
    
    return slot;
}

function allowJobDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleJobDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const resourceId = parseInt(e.dataTransfer.getData('text/plain'));
    const jobId = parseInt(e.currentTarget.dataset.jobId);
    
    // Add resource to job
    const job = schedulerJobs.find(j => j.id === jobId);
    if (job && !job.resources.includes(resourceId)) {
        job.resources.push(resourceId);
        renderJobList();
        renderTimeline();
        showAlert('Resource assigned to job successfully', 'success');
    }
}

function renderTimeline() {
    const timelineList = document.getElementById('timelineList');
    timelineList.innerHTML = '';
    
    // Group jobs by resource
    const resourceJobs = {};
    schedulerJobs.forEach(job => {
        job.resources.forEach(resourceId => {
            if (!resourceJobs[resourceId]) {
                resourceJobs[resourceId] = [];
            }
            resourceJobs[resourceId].push(job);
        });
    });
    
    // Create timeline items
    Object.keys(resourceJobs).forEach(resourceId => {
        const resource = schedulerResources.find(r => r.id == resourceId);
        const jobs = resourceJobs[resourceId];
        
        jobs.forEach(job => {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            
            const startDate = new Date(job.startDate);
            const endDate = new Date(job.endDate);
            const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
            
            timelineItem.innerHTML = `
                <div>
                    <div class="timeline-job">${job.title}</div>
                    <div class="timeline-resource">${resource.name}</div>
                </div>
                <div class="timeline-duration">${duration}d</div>
            `;
            
            timelineList.appendChild(timelineItem);
        });
    });
}

async function loadProjects() {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const projects = await ApiService.getProjects(workspaceId);
        
        // Update project filter
        const projectFilter = document.getElementById('projectFilter');
        projectFilter.innerHTML = '<option value="">All Projects</option>';
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectFilter.appendChild(option);
        });
        
        // Update job form project select
        const jobProject = document.getElementById('jobProject');
        jobProject.innerHTML = '<option value="">Select Project</option>';
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            jobProject.appendChild(option);
        });
        
        // Update job form resources select
        const jobResources = document.getElementById('jobResources');
        jobResources.innerHTML = '';
        schedulerResources.forEach(resource => {
            const option = document.createElement('option');
            option.value = resource.id;
            option.textContent = resource.name;
            jobResources.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

async function addJob() {
    const title = document.getElementById('jobTitle').value;
    const description = document.getElementById('jobDescription').value;
    const project = document.getElementById('jobProject').value;
    const startDate = document.getElementById('jobStartDate').value;
    const endDate = document.getElementById('jobEndDate').value;
    const priority = document.getElementById('jobPriority').value;
    const resources = Array.from(document.getElementById('jobResources').selectedOptions)
        .map(option => parseInt(option.value));
    
    if (!title || !project || !startDate || !endDate) {
        showAlert('Please fill in required fields', 'error');
        return;
    }
    
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const jobData = {
            name: title,
            description: description,
            project_id: parseInt(project),
            start_date: startDate,
            end_date: endDate,
            priority: priority,
            status: 'pending'
        };
        
        const newJob = await ApiService.createJob(jobData, workspaceId);
        
        // Add to local data
        schedulerJobs.push({
            id: newJob.id,
            title: newJob.name,
            description: newJob.description,
            project: newJob.project_id,
            startDate: newJob.start_date,
            endDate: newJob.end_date,
            priority: newJob.priority,
            status: newJob.status,
            resources: resources,
            created: newJob.created_at,
            updated: newJob.updated_at
        });
        
        // Re-render views
        renderJobList();
        renderTimeline();
        
        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('addJobModal'));
        modal.hide();
        document.getElementById('addJobForm').reset();
        
        showAlert('Job created successfully', 'success');
    } catch (error) {
        console.error('Error creating job:', error);
        showAlert('Failed to create job', 'error');
    }
}

function applyFilters() {
    const projectFilter = document.getElementById('projectFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    let filteredResources = schedulerResources;
    let filteredJobs = schedulerJobs;
    
    // Filter resources by status
    if (statusFilter) {
        filteredResources = schedulerResources.filter(resource => 
            resource.status === statusFilter
        );
    }
    
    // Filter jobs by project
    if (projectFilter) {
        filteredJobs = schedulerJobs.filter(job => 
            job.project == projectFilter
        );
    }
    
    // Filter jobs by date
    if (dateFilter) {
        filteredJobs = filteredJobs.filter(job => 
            job.startDate <= dateFilter && job.endDate >= dateFilter
        );
    }
    
    // Re-render with filtered data
    renderFilteredData(filteredResources, filteredJobs);
}

function renderFilteredData(resources, jobs) {
    // Update resource panel
    const resourceList = document.getElementById('resourceList');
    resourceList.innerHTML = '';
    resources.forEach(resource => {
        const resourceItem = createResourceItem(resource);
        resourceList.appendChild(resourceItem);
    });
    
    // Update job list
    const jobList = document.getElementById('jobList');
    jobList.innerHTML = '';
    jobs.forEach(job => {
        const jobSlot = createJobSlot(job);
        jobList.appendChild(jobSlot);
    });
}

function showListView() {
    currentView = 'list';
    document.getElementById('listView').style.display = 'block';
    document.getElementById('calendarView').style.display = 'none';
    
    // Update button states
    document.querySelectorAll('.btn-group .btn').forEach(btn => {
        btn.classList.remove('btn-jira-primary');
        btn.classList.add('btn-jira-secondary');
    });
    event.target.classList.remove('btn-jira-secondary');
    event.target.classList.add('btn-jira-primary');
}

function showCalendarView() {
    currentView = 'calendar';
    document.getElementById('listView').style.display = 'none';
    document.getElementById('calendarView').style.display = 'block';
    
    // Update button states
    document.querySelectorAll('.btn-group .btn').forEach(btn => {
        btn.classList.remove('btn-jira-primary');
        btn.classList.add('btn-jira-secondary');
    });
    event.target.classList.remove('btn-jira-secondary');
    event.target.classList.add('btn-jira-primary');
    
    renderCalendar();
}

function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const calendarMonth = document.getElementById('calendarMonth');
    
    // Set month title
    calendarMonth.textContent = currentDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
    });
    
    // Generate calendar
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    calendarGrid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendarGrid.appendChild(header);
    });
    
    // Add calendar days
    const currentDate = new Date(startDate);
    for (let i = 0; i < 42; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        if (currentDate.getMonth() === month) {
            dayElement.innerHTML = `
                <div class="calendar-day-number">${currentDate.getDate()}</div>
                ${getDayEvents(currentDate)}
            `;
        }
        
        calendarGrid.appendChild(dayElement);
        currentDate.setDate(currentDate.getDate() + 1);
    }
}

function getDayEvents(date) {
    const dateStr = date.toISOString().split('T')[0];
    const dayJobs = schedulerJobs.filter(job => 
        job.startDate <= dateStr && job.endDate >= dateStr
    );
    
    return dayJobs.map(job => 
        `<div class="calendar-event">${job.title}</div>`
    ).join('');
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

function refreshScheduler() {
    loadSchedulerData();
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
