// Document Management Controller
let documentsTable;

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
    
    // Listen for workspace changes
    document.addEventListener('workspaceChanged', function(event) {
        console.log('Workspace changed, reloading documents for workspace:', event.detail.workspaceId);
        loadDocuments();
        loadProjects();
    });
    
    // Load data after authentication
    loadDocuments();
    loadProjects();
}

async function loadDocuments() {
    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const documents = await ApiService.getDocuments(workspaceId);
        populateDocumentsTable(documents);
    } catch (error) {
        console.error('Error loading documents:', error);
        showAlert('Failed to load documents', 'error');
    } finally {
        showLoading(false);
    }
}

async function loadProjects() {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const projects = await ApiService.getProjects(workspaceId);
        const projectSelect = document.getElementById('documentProject');
        
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

function populateDocumentsTable(documents) {
    if (documentsTable) {
        documentsTable.destroy();
    }
    
    const tbody = document.querySelector('#documentsTable tbody');
    tbody.innerHTML = '';
    
    documents.forEach(document => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${document.id}</td>
            <td>${document.name}</td>
            <td>${document.description || '-'}</td>
            <td>${formatFileSize(document.file_size)}</td>
            <td><span class="badge bg-info">${getFileType(document.name)}</span></td>
            <td>${document.project_id || '-'}</td>
            <td>${document.workspace_id || '-'}</td>
            <td>${formatDate(document.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="downloadDocument(${document.id})" title="Download">
                    <i class="fas fa-download"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteDocument(${document.id}, '${document.name}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    documentsTable = $('#documentsTable').DataTable({
        pageLength: 10,
        order: [[7, 'desc']],
        columnDefs: [{ orderable: false, targets: 8 }]
    });
}

function getFileType(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    switch(extension) {
        case 'pdf': return 'PDF';
        case 'doc':
        case 'docx': return 'Word';
        case 'xls':
        case 'xlsx': return 'Excel';
        case 'ppt':
        case 'pptx': return 'PowerPoint';
        case 'jpg':
        case 'jpeg':
        case 'png': return 'Image';
        case 'txt': return 'Text';
        case 'zip': return 'Archive';
        default: return 'File';
    }
}

function formatFileSize(bytes) {
    if (!bytes) return '-';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

async function uploadDocument() {
    const fileInput = document.getElementById('documentFile');
    const description = document.getElementById('documentDescription').value.trim();
    const projectId = document.getElementById('documentProject').value;
    
    if (!fileInput.files[0]) {
        showAlert('Please select a file to upload', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        
        console.log('Uploading document with workspace ID:', workspaceId);
        console.log('File:', fileInput.files[0]);
        console.log('Description:', description);
        console.log('Project ID:', projectId);
        
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('description', description);
        formData.append('project_id', projectId);
        
        console.log('FormData entries:');
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }
        
        await ApiService.uploadDocument(formData, workspaceId);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('uploadDocumentModal'));
        modal.hide();
        document.getElementById('uploadDocumentForm').reset();
        
        await loadDocuments();
        showAlert('Document uploaded successfully', 'success');
    } catch (error) {
        console.error('Error uploading document:', error);
        showAlert('Failed to upload document', 'error');
    } finally {
        showLoading(false);
    }
}

async function downloadDocument(documentId) {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const response = await ApiService.downloadDocument(documentId, workspaceId);
        
        // Create a blob and download link
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.filename || 'document';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showAlert('Document downloaded successfully', 'success');
    } catch (error) {
        console.error('Error downloading document:', error);
        showAlert('Failed to download document', 'error');
    }
}

async function deleteDocument(documentId, documentName) {
    if (!confirm(`Are you sure you want to delete "${documentName}"?`)) {
        return;
    }
    
    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        await ApiService.deleteDocument(documentId, workspaceId);
        
        await loadDocuments();
        showAlert('Document deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting document:', error);
        showAlert('Failed to delete document', 'error');
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

async function editDocument(documentId) {
    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const documents = await ApiService.getDocuments(workspaceId);
        const document = documents.find(d => d.id === documentId);
        
        if (document) {
            document.getElementById('editDocumentId').value = document.id;
            document.getElementById('editDocumentName').value = document.name;
            document.getElementById('editDocumentDescription').value = document.description || '';
            document.getElementById('editDocumentCategory').value = document.category || '';
            document.getElementById('editDocumentTags').value = document.tags || '';
            
            const modal = new bootstrap.Modal(document.getElementById('editDocumentModal'));
            modal.show();
        }
    } catch (error) {
        console.error('Error loading document for edit:', error);
        showAlert('Failed to load document data', 'error');
    } finally {
        showLoading(false);
    }
}

async function updateDocument() {
    const documentId = document.getElementById('editDocumentId').value;
    const name = document.getElementById('editDocumentName').value.trim();
    const description = document.getElementById('editDocumentDescription').value.trim();
    const category = document.getElementById('editDocumentCategory').value.trim();
    const tags = document.getElementById('editDocumentTags').value.trim();
    
    if (!name) {
        showAlert('Please enter document name', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const documentData = {
            name: name,
            description: description,
            category: category,
            tags: tags
        };
        
        await ApiService.updateDocument(documentId, documentData);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('editDocumentModal'));
        modal.hide();
        
        await loadDocuments();
        showAlert('Document updated successfully', 'success');
    } catch (error) {
        console.error('Error updating document:', error);
        showAlert('Failed to update document', 'error');
    } finally {
        showLoading(false);
    }
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