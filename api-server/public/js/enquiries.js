// Enquiries Management Controller
let enquiriesTable;

document.addEventListener('DOMContentLoaded', function() {
    // Only run on enquiries page
    if (window.location.pathname !== '/enquiries') {
        return;
    }
    
    // Simple auto-login and load enquiries
    if (!AuthService.isAuthenticated()) {
        AuthService.login('administrative@admin.com', 'Admin@123').then(() => {
            loadEnquiries();
        }).catch(error => {
            console.error('Login failed:', error);
        });
    } else {
        loadEnquiries();
    }
});

async function loadEnquiries() {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const enquiries = await ApiService.getEnquiries(workspaceId);
        populateEnquiriesTable(enquiries);
    } catch (error) {
        console.error('Error loading enquiries:', error);
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
            <td>${enquiry.id}</td>
            <td>${enquiry.customer_name || 'N/A'}</td>
            <td>${enquiry.email || 'N/A'}</td>
            <td>${enquiry.phone || 'N/A'}</td>
            <td>${enquiry.title || 'N/A'}</td>
            <td><span class="badge bg-${getStatusColor(enquiry.status)}">${enquiry.status}</span></td>
            <td>${enquiry.priority || 'Medium'}</td>
            <td>${enquiry.workspace_id || 'N/A'}</td>
            <td>${formatDate(enquiry.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editEnquiry(${enquiry.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteEnquiry(${enquiry.id}, '${enquiry.title || enquiry.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Initialize DataTable
    if (typeof $ !== 'undefined' && $.fn.DataTable) {
        // Check if DataTable already exists and destroy it
        if ($.fn.DataTable.isDataTable('#enquiriesTable')) {
            $('#enquiriesTable').DataTable().destroy();
        }
        enquiriesTable = $('#enquiriesTable').DataTable({
            pageLength: 10,
            order: [[8, 'desc']]
        });
    }
}

function getStatusColor(status) {
    switch(status) {
        case 'open': return 'primary';
        case 'in_progress': return 'warning';
        case 'closed': return 'success';
        case 'cancelled': return 'secondary';
        default: return 'info';
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

async function addEnquiry() {
    const title = document.getElementById('enquiryTitle').value.trim();
    const description = document.getElementById('enquiryDescription').value.trim();
    const customerName = document.getElementById('enquiryCustomerName').value.trim();
    const email = document.getElementById('enquiryEmail').value.trim();
    const phone = document.getElementById('enquiryPhone').value.trim();
    
    if (!title || !customerName || !email) {
        alert('Please enter title, customer name, and email');
        return;
    }
    
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const enquiryData = {
            title: title,
            description: description,
            customer_name: customerName,
            email: email,
            phone: phone,
            status: 'open'
        };
        
        await ApiService.createEnquiry(enquiryData, workspaceId);
        
        const modalElement = document.getElementById('addEnquiryModal');
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
        document.getElementById('addEnquiryForm').reset();
        
        await loadEnquiries();
    } catch (error) {
        console.error('Error creating enquiry:', error);
        alert('Failed to create enquiry');
    }
}

async function editEnquiry(enquiryId) {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const enquiries = await ApiService.getEnquiries(workspaceId);
        const enquiry = enquiries.find(e => e.id === enquiryId);
        
        if (!enquiry) {
            alert('Enquiry not found');
            return;
        }
        
        // Populate the edit form
        document.getElementById('editEnquiryId').value = enquiry.id;
        document.getElementById('editEnquiryTitle').value = enquiry.title || '';
        document.getElementById('editEnquiryDescription').value = enquiry.description || '';
        document.getElementById('editEnquiryCustomerName').value = enquiry.customer_name || '';
        document.getElementById('editEnquiryEmail').value = enquiry.email || '';
        document.getElementById('editEnquiryPhone').value = enquiry.phone || '';
        
        // Show the edit modal
        const modalElement = document.getElementById('editEnquiryModal');
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.show();
    } catch (error) {
        console.error('Error loading enquiry for edit:', error);
        alert('Failed to load enquiry data');
    }
}

async function updateEnquiry() {
    const enquiryId = document.getElementById('editEnquiryId').value;
    const title = document.getElementById('editEnquiryTitle').value.trim();
    const description = document.getElementById('editEnquiryDescription').value.trim();
    const customerName = document.getElementById('editEnquiryCustomerName').value.trim();
    const email = document.getElementById('editEnquiryEmail').value.trim();
    const phone = document.getElementById('editEnquiryPhone').value.trim();
    
    if (!title || !customerName || !email) {
        alert('Please enter title, customer name, and email');
        return;
    }
    
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const enquiryData = {
            title: title,
            description: description,
            customer_name: customerName,
            email: email,
            phone: phone,
            status: 'open'
        };
        
        await ApiService.updateEnquiry(enquiryId, enquiryData, workspaceId);
        
        const modalElement = document.getElementById('editEnquiryModal');
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
        
        await loadEnquiries();
    } catch (error) {
        console.error('Error updating enquiry:', error);
        alert('Failed to update enquiry');
    }
}

async function deleteEnquiry(enquiryId, enquiryTitle) {
    if (!confirm(`Are you sure you want to delete enquiry ${enquiryTitle}?`)) {
        return;
    }
    
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        await ApiService.deleteEnquiry(enquiryId, workspaceId);
        await loadEnquiries();
    } catch (error) {
        console.error('Error deleting enquiry:', error);
        alert('Failed to delete enquiry');
    }
}