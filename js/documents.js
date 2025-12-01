// Document Management Controller
let documentsTable;
let currentDocumentId = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    loadDocuments();
    loadProjects();
});

// Initialize authentication
function initializeAuth() {
    if (!AuthService.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Update user info
    const user = AuthService.getCurrentUser();
    if (user) {
        document.getElementById('userEmail').textContent = user.email;
    }
    
    // Setup logout
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        AuthService.logout();
    });
}

// Load documents
async function loadDocuments() {
    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getWorkspaceId();
        const documents = await ApiService.getDocuments(workspaceId);
        populateDocumentsTable(documents);
    } catch (error) {
        console.error('Error loading documents:', error);
        showAlert('Failed to load documents', 'error');
    } finally {
        showLoading(false);
    }
}

// Load projects for dropdown
async function loadProjects() {
    try {
        const workspaceId = WorkspaceService.getWorkspaceId();
        const projects = await ApiService.getProjects(workspaceId);
        const projectSelect = document.getElementById('documentProject');
        
        projectSelect.innerHTML = '<option value="">Select Project (Optional)</option>';
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

// Populate documents table
function populateDocumentsTable(documents) {
    if (documentsTable) {
        documentsTable.destroy();
    }
    
    const tbody = document.querySelector('#documentsTable tbody');
    tbody.innerHTML = '';
    
    documents.forEach(document => {
        const row = document.createElement('tr');
        const fileIcon = getFileIcon(document.file_type);
        const fileSize = formatFileSize(document.file_size);
        
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <i class="${fileIcon} file-icon"></i>
                    <div>
                        <div>${document.name}</div>
                        <div class="file-size">${fileSize}</div>
                    </div>
                </div>
            </td>
            <td>${document.description || '-'}</td>
            <td><span class="badge bg-secondary">${document.file_type}</span></td>
            <td>${fileSize}</td>
            <td>${document.project_id ? `Project ${document.project_id}` : '-'}</td>
            <td>User ${document.uploaded_by}</td>
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
    
    // Initialize DataTable
    documentsTable = $('#documentsTable').DataTable({
        pageLength: 10,
        order: [[6, 'desc']], // Sort by upload date
        columnDefs: [
            { orderable: false, targets: 7 }
        ]
    });
}

// Get file icon based on file type
function getFileIcon(fileType) {
    if (fileType.includes('pdf')) return 'fas fa-file-pdf text-danger';
    if (fileType.includes('word') || fileType.includes('document')) return 'fas fa-file-word text-primary';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'fas fa-file-excel text-success';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'fas fa-file-powerpoint text-warning';
    if (fileType.includes('image')) return 'fas fa-file-image text-info';
    if (fileType.includes('video')) return 'fas fa-file-video text-purple';
    if (fileType.includes('audio')) return 'fas fa-file-audio text-secondary';
    if (fileType.includes('zip') || fileType.includes('archive')) return 'fas fa-file-archive text-dark';
    if (fileType.includes('text')) return 'fas fa-file-alt text-muted';
    return 'fas fa-file text-muted';
}

// Format file size
function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Upload document
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
        const workspaceId = WorkspaceService.getWorkspaceId();
        
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('description', description);
        if (projectId) {
            formData.append('project_id', projectId);
        }
        
        // Upload file
        const response = await fetch(`${ApiService.API_URL}/api/v2/documents/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AuthService.getToken()}`
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Upload failed');
        }
        
        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('uploadDocumentModal'));
        modal.hide();
        document.getElementById('uploadDocumentForm').reset();
        
        // Reload documents
        await loadDocuments();
        
        showAlert('Document uploaded successfully', 'success');
    } catch (error) {
        console.error('Error uploading document:', error);
        showAlert('Failed to upload document', 'error');
    } finally {
        showLoading(false);
    }
}

// Download document
async function downloadDocument(documentId) {
    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getWorkspaceId();
        const document = await ApiService.getDocument(documentId, workspaceId);
        
        // Create download link
        const link = document.createElement('a');
        link.href = `${ApiService.API_URL}/api/v2/documents/${documentId}/download`;
        link.download = document.name;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showAlert('Download started', 'success');
    } catch (error) {
        console.error('Error downloading document:', error);
        showAlert('Failed to download document', 'error');
    } finally {
        showLoading(false);
    }
}

// Delete document
function deleteDocument(documentId, documentName) {
    currentDocumentId = documentId;
    document.getElementById('deleteDocumentName').textContent = documentName;
    
    const modal = new bootstrap.Modal(document.getElementById('deleteDocumentModal'));
    modal.show();
}

// Confirm delete document
async function confirmDeleteDocument() {
    if (!currentDocumentId) return;
    
    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getWorkspaceId();
        await ApiService.deleteDocument(currentDocumentId, workspaceId);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteDocumentModal'));
        modal.hide();
        
        // Reload documents
        await loadDocuments();
        
        showAlert('Document deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting document:', error);
        showAlert('Failed to delete document', 'error');
    } finally {
        showLoading(false);
        currentDocumentId = null;
    }
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Show loading state
function showLoading(show) {
    // You can implement a loading spinner here
    if (show) {
        console.log('Loading...');
    } else {
        console.log('Loading complete');
    }
}

// Show alert
function showAlert(message, type = 'info') {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert at top of main content
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(alertDiv, mainContent.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}
