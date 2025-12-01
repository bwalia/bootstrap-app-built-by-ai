// Projects Management Controller
let projectsTable;

document.addEventListener('DOMContentLoaded', function() {
    // Only run on projects page
    if (window.location.pathname !== '/projects') {
        return;
    }
    
    // Simple auto-login and load projects
    if (!AuthService.isAuthenticated()) {
        AuthService.login('administrative@admin.com', 'Admin@123').then(() => {
            loadProjects();
        }).catch(error => {
            console.error('Login failed:', error);
        });
    } else {
        loadProjects();
    }
});

async function loadProjects() {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const projects = await ApiService.getProjects(workspaceId);
        populateProjectsTable(projects);
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

function populateProjectsTable(projects) {
    if (projectsTable) {
        projectsTable.destroy();
    }
    
    const tbody = document.querySelector('#projectsTable tbody');
    tbody.innerHTML = '';
    
    projects.forEach(project => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${project.id}</td>
            <td>${project.name}</td>
            <td>${project.description || 'N/A'}</td>
            <td>${project.customer_name || 'N/A'}</td>
            <td><span class="badge bg-${getStatusColor(project.status)}">${project.status}</span></td>
            <td>${formatDate(project.start_date)}</td>
            <td>${formatDate(project.end_date)}</td>
            <td>${formatDate(project.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editProject(${project.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteProject(${project.id}, '${project.name}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Initialize DataTable
    if (typeof $ !== 'undefined' && $.fn.DataTable) {
        // Check if DataTable already exists and destroy it
        if ($.fn.DataTable.isDataTable('#projectsTable')) {
            $('#projectsTable').DataTable().destroy();
        }
        projectsTable = $('#projectsTable').DataTable({
            pageLength: 10,
            order: [[7, 'desc']]
        });
    }
}

function getStatusColor(status) {
    switch(status) {
        case 'active': return 'success';
        case 'in_progress': return 'warning';
        case 'completed': return 'info';
        case 'cancelled': return 'secondary';
        case 'on_hold': return 'danger';
        default: return 'primary';
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

async function addProject() {
    const name = document.getElementById('projectName').value.trim();
    const description = document.getElementById('projectDescription').value.trim();
    const customerId = document.getElementById('projectCustomer').value;
    const startDate = document.getElementById('projectStartDate').value;
    const endDate = document.getElementById('projectEndDate').value;
    
    if (!name || !customerId) {
        alert('Please enter project name and select customer');
        return;
    }
    
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const projectData = {
            name: name,
            description: description,
            customer_id: customerId,
            start_date: startDate,
            end_date: endDate,
            status: 'active'
        };
        
        await ApiService.createProject(projectData, workspaceId);
        
        const modalElement = document.getElementById('addProjectModal');
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
        document.getElementById('addProjectForm').reset();
        
        await loadProjects();
    } catch (error) {
        console.error('Error creating project:', error);
        alert('Failed to create project');
    }
}

async function editProject(projectId) {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const projects = await ApiService.getProjects(workspaceId);
        const project = projects.find(p => p.id === projectId);
        
        if (!project) {
            alert('Project not found');
            return;
        }
        
        // Populate the edit form
        document.getElementById('editProjectId').value = project.id;
        document.getElementById('editProjectName').value = project.name;
        document.getElementById('editProjectDescription').value = project.description || '';
        document.getElementById('editProjectCustomer').value = project.customer_id || '';
        document.getElementById('editProjectStartDate').value = project.start_date ? project.start_date.split('T')[0] : '';
        document.getElementById('editProjectEndDate').value = project.end_date ? project.end_date.split('T')[0] : '';
        
        // Show the edit modal
        const modalElement = document.getElementById('editProjectModal');
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.show();
    } catch (error) {
        console.error('Error loading project for edit:', error);
        alert('Failed to load project data');
    }
}

async function updateProject() {
    const projectId = document.getElementById('editProjectId').value;
    const name = document.getElementById('editProjectName').value.trim();
    const description = document.getElementById('editProjectDescription').value.trim();
    const customerId = document.getElementById('editProjectCustomer').value;
    const startDate = document.getElementById('editProjectStartDate').value;
    const endDate = document.getElementById('editProjectEndDate').value;
    
    if (!name || !customerId) {
        alert('Please enter project name and select customer');
        return;
    }
    
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const projectData = {
            name: name,
            description: description,
            customer_id: customerId,
            start_date: startDate,
            end_date: endDate,
            status: 'active'
        };
        
        await ApiService.updateProject(projectId, projectData, workspaceId);
        
        const modalElement = document.getElementById('editProjectModal');
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
        
        await loadProjects();
    } catch (error) {
        console.error('Error updating project:', error);
        alert('Failed to update project');
    }
}

async function deleteProject(projectId, projectName) {
    if (!confirm(`Are you sure you want to delete project ${projectName}?`)) {
        return;
    }
    
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        await ApiService.deleteProject(projectId, workspaceId);
        await loadProjects();
    } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project');
    }
}
