// Job Management Controller
let jobsTable;

document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    loadJobs();
    loadProjects();
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

async function loadJobs() {
    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getWorkspaceId();
        const jobs = await ApiService.getJobs(workspaceId);
        populateJobsTable(jobs);
    } catch (error) {
        console.error('Error loading jobs:', error);
        showAlert('Failed to load jobs', 'error');
    } finally {
        showLoading(false);
    }
}

async function loadProjects() {
    try {
        const workspaceId = WorkspaceService.getWorkspaceId();
        const projects = await ApiService.getProjects(workspaceId);
        const projectSelect = document.getElementById('jobProject');
        
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

async function loadUsers() {
    try {
        const workspaceId = WorkspaceService.getWorkspaceId();
        const users = await ApiService.getUsers(workspaceId);
        const userSelect = document.getElementById('jobAssignedTo');
        
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

function populateJobsTable(jobs) {
    if (jobsTable) {
        jobsTable.destroy();
    }
    
    const tbody = document.querySelector('#jobsTable tbody');
    tbody.innerHTML = '';
    
    jobs.forEach(job => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${job.name}</td>
            <td>${job.description || '-'}</td>
            <td>Project ${job.project_id}</td>
            <td><span class="badge bg-${getStatusColor(job.status)}">${job.status}</span></td>
            <td><span class="badge bg-${getPriorityColor(job.priority)}">${job.priority}</span></td>
            <td>${job.assigned_to ? `User ${job.assigned_to}` : '-'}</td>
            <td>${job.estimated_hours || '-'}</td>
            <td>${job.actual_hours || '-'}</td>
            <td>${formatDate(job.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editJob(${job.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteJob(${job.id}, '${job.name}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    jobsTable = $('#jobsTable').DataTable({
        pageLength: 10,
        order: [[8, 'desc']],
        columnDefs: [{ orderable: false, targets: 9 }]
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

async function addJob() {
    const name = document.getElementById('jobName').value.trim();
    const description = document.getElementById('jobDescription').value.trim();
    const projectId = document.getElementById('jobProject').value;
    const priority = document.getElementById('jobPriority').value;
    const assignedTo = document.getElementById('jobAssignedTo').value;
    const estimatedHours = document.getElementById('jobEstimatedHours').value;
    
    if (!name || !description || !projectId) {
        showAlert('Please fill in required fields', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getWorkspaceId();
        const jobData = {
            name: name,
            description: description,
            project_id: parseInt(projectId),
            priority: priority,
            assigned_to: assignedTo ? parseInt(assignedTo) : null,
            estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null
        };
        
        await ApiService.createJob(jobData, workspaceId);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('addJobModal'));
        modal.hide();
        document.getElementById('addJobForm').reset();
        
        await loadJobs();
        showAlert('Job created successfully', 'success');
    } catch (error) {
        console.error('Error creating job:', error);
        showAlert('Failed to create job', 'error');
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
