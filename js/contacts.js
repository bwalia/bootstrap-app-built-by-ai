// Contact Management Controller
let contactsTable;

document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
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

async function loadContacts() {
    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getWorkspaceId();
        const contacts = await ApiService.getContacts(workspaceId);
        populateContactsTable(contacts);
    } catch (error) {
        console.error('Error loading contacts:', error);
        showAlert('Failed to load contacts', 'error');
    } finally {
        showLoading(false);
    }
}

function populateContactsTable(contacts) {
    if (contactsTable) {
        contactsTable.destroy();
    }
    
    const tbody = document.querySelector('#contactsTable tbody');
    tbody.innerHTML = '';
    
    contacts.forEach(contact => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${contact.first_name} ${contact.last_name}</td>
            <td>${contact.email}</td>
            <td>${contact.phone || '-'}</td>
            <td>${contact.company || '-'}</td>
            <td>${contact.position || '-'}</td>
            <td><span class="badge bg-${contact.status === 'active' ? 'success' : 'secondary'}">${contact.status}</span></td>
            <td>${formatDate(contact.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editContact(${contact.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteContact(${contact.id}, '${contact.first_name} ${contact.last_name}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    contactsTable = $('#contactsTable').DataTable({
        pageLength: 10,
        order: [[6, 'desc']],
        columnDefs: [{ orderable: false, targets: 7 }]
    });
}

async function addContact() {
    const firstName = document.getElementById('contactFirstName').value.trim();
    const lastName = document.getElementById('contactLastName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const company = document.getElementById('contactCompany').value.trim();
    const position = document.getElementById('contactPosition').value.trim();
    const notes = document.getElementById('contactNotes').value.trim();
    
    if (!firstName || !lastName || !email) {
        showAlert('Please fill in required fields', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getWorkspaceId();
        const contactData = {
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone,
            company: company,
            position: position,
            notes: notes
        };
        
        await ApiService.createContact(contactData, workspaceId);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('addContactModal'));
        modal.hide();
        document.getElementById('addContactForm').reset();
        
        await loadContacts();
        showAlert('Contact created successfully', 'success');
    } catch (error) {
        console.error('Error creating contact:', error);
        showAlert('Failed to create contact', 'error');
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
