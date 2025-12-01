// Project Management Controller
let projectsTable;

document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    loadProjects();
    loadCustomers();
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

async function loadProjects() {
    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getWorkspaceId();
        const projects = await ApiService.getProjects(workspaceId);
        populateProjectsTable(projects);
    } catch (error) {
        console.error('Error loading projects:', error);
        showAlert('Failed to load projects', 'error');
    } finally {
        showLoading(false);
    }
}

async function loadCustomers() {
    try {
        const workspaceId = WorkspaceService.getWorkspaceId();
        const customers = await ApiService.getCustomers(workspaceId);
        const customerSelect = document.getElementById('projectCustomer');
        
        customerSelect.innerHTML = '<option value="">Select Customer (Optional)</option>';
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.name;
            customerSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading customers:', error);
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
            <td>${project.name}</td>
            <td>${project.description || '-'}</td>
            <td><span class="badge bg-${getStatusColor(project.status)}">${project.status}</span></td>
            <td><span class="badge bg-${getPriorityColor(project.priority)}">${project.priority}</span></td>
            <td>${project.start_date || '-'}</td>
            <td>${project.end_date || '-'}</td>
            <td>${project.budget ? '$' + project.budget.toLocaleString() : '-'}</td>
            <td>${project.customer_id ? `Customer ${project.customer_id}` : '-'}</td>
            <td>${project.project_manager ? `User ${project.project_manager}` : '-'}</td>
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
    
    projectsTable = $('#projectsTable').DataTable({
        pageLength: 10,
        order: [[9, 'desc']],
        columnDefs: [{ orderable: false, targets: 10 }]
    });
}

function getStatusColor(status) {
    switch(status) {
        case 'active': return 'success';
        case 'planning': return 'info';
        case 'completed': return 'secondary';
        case 'on_hold': return 'warning';
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

async function addProject() {
    const name = document.getElementById('projectName').value.trim();
    const description = document.getElementById('projectDescription').value.trim();
    const priority = document.getElementById('projectPriority').value;
    const startDate = document.getElementById('projectStartDate').value;
    const endDate = document.getElementById('projectEndDate').value;
    const budget = document.getElementById('projectBudget').value;
    const customerId = document.getElementById('projectCustomer').value;
    
    if (!name || !description) {
        showAlert('Please fill in required fields', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getWorkspaceId();
        const projectData = {
            name: name,
            description: description,
            priority: priority,
            start_date: startDate || null,
            end_date: endDate || null,
            budget: budget ? parseFloat(budget) : null,
            customer_id: customerId || null,
            project_manager: 1 // Default to current user
        };
        
        await ApiService.createProject(projectData, workspaceId);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('addProjectModal'));
        modal.hide();
        document.getElementById('addProjectForm').reset();
        
        await loadProjects();
        showAlert('Project created successfully', 'success');
    } catch (error) {
        console.error('Error creating project:', error);
        showAlert('Failed to create project', 'error');
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
