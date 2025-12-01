// Enquiry Management Controller
let enquiriesTable;

document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    loadEnquiries();
    loadCustomers();
    loadContacts();
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

async function loadEnquiries() {
    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getWorkspaceId();
        const enquiries = await ApiService.getEnquiries(workspaceId);
        populateEnquiriesTable(enquiries);
    } catch (error) {
        console.error('Error loading enquiries:', error);
        showAlert('Failed to load enquiries', 'error');
    } finally {
        showLoading(false);
    }
}

async function loadCustomers() {
    try {
        const workspaceId = WorkspaceService.getWorkspaceId();
        const customers = await ApiService.getCustomers(workspaceId);
        const customerSelect = document.getElementById('enquiryCustomer');
        
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

async function loadContacts() {
    try {
        const workspaceId = WorkspaceService.getWorkspaceId();
        const contacts = await ApiService.getContacts(workspaceId);
        const contactSelect = document.getElementById('enquiryContact');
        
        contactSelect.innerHTML = '<option value="">Select Contact (Optional)</option>';
        contacts.forEach(contact => {
            const option = document.createElement('option');
            option.value = contact.id;
            option.textContent = `${contact.first_name} ${contact.last_name}`;
            contactSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading contacts:', error);
    }
}

function populateEnquiriesTable(enquiries) {
    if (enquiriesTable) {
        enquiriesTable.destroy();
    }
    
    const tbody = document.querySelector('#enquiriesTable tbody');
    tbody.innerHTML = '';
    
    enquiries.forEach(enquiry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${enquiry.subject}</td>
            <td>${enquiry.customer_id ? `Customer ${enquiry.customer_id}` : '-'}</td>
            <td>${enquiry.contact_id ? `Contact ${enquiry.contact_id}` : '-'}</td>
            <td><span class="badge bg-${getPriorityColor(enquiry.priority)}">${enquiry.priority}</span></td>
            <td><span class="badge bg-${getStatusColor(enquiry.status)}">${enquiry.status}</span></td>
            <td><span class="badge bg-secondary">${enquiry.source}</span></td>
            <td>${enquiry.assigned_to ? `User ${enquiry.assigned_to}` : '-'}</td>
            <td>${formatDate(enquiry.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editEnquiry(${enquiry.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteEnquiry(${enquiry.id}, '${enquiry.subject}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    enquiriesTable = $('#enquiriesTable').DataTable({
        pageLength: 10,
        order: [[7, 'desc']],
        columnDefs: [{ orderable: false, targets: 8 }]
    });
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

function getStatusColor(status) {
    switch(status) {
        case 'open': return 'success';
        case 'in_progress': return 'warning';
        case 'closed': return 'secondary';
        case 'resolved': return 'info';
        default: return 'secondary';
    }
}

async function addEnquiry() {
    const subject = document.getElementById('enquirySubject').value.trim();
    const description = document.getElementById('enquiryDescription').value.trim();
    const customerId = document.getElementById('enquiryCustomer').value;
    const contactId = document.getElementById('enquiryContact').value;
    const priority = document.getElementById('enquiryPriority').value;
    const source = document.getElementById('enquirySource').value;
    
    if (!subject || !description) {
        showAlert('Please fill in required fields', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getWorkspaceId();
        const enquiryData = {
            subject: subject,
            description: description,
            customer_id: customerId || null,
            contact_id: contactId || null,
            priority: priority,
            source: source,
            assigned_to: 1 // Default to current user
        };
        
        await ApiService.createEnquiry(enquiryData, workspaceId);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('addEnquiryModal'));
        modal.hide();
        document.getElementById('addEnquiryForm').reset();
        
        await loadEnquiries();
        showAlert('Enquiry created successfully', 'success');
    } catch (error) {
        console.error('Error creating enquiry:', error);
        showAlert('Failed to create enquiry', 'error');
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
