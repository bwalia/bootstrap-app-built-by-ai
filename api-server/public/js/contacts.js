// Contacts Management Controller
let contactsTable;

document.addEventListener('DOMContentLoaded', function() {
    // Only run on contacts page
    if (window.location.pathname !== '/contacts') {
        return;
    }
    
    // Simple auto-login and load contacts
    if (!AuthService.isAuthenticated()) {
        AuthService.login('administrative@admin.com', 'Admin@123').then(() => {
            loadContacts();
        }).catch(error => {
            console.error('Login failed:', error);
        });
    } else {
        loadContacts();
    }
});

async function loadContacts() {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const contacts = await ApiService.getContacts(workspaceId);
        populateContactsTable(contacts);
    } catch (error) {
        console.error('Error loading contacts:', error);
    }
}

function populateContactsTable(contacts) {
    if (contactsTable) {
        contactsTable.destroy();
    }
    
    const tbody = document.querySelector('#contactsTable tbody');
    tbody.innerHTML = '';
    
    // Count header columns
    const headerRow = document.querySelector('#contactsTable thead tr');
    const headerCount = headerRow ? headerRow.children.length : 0;
    console.log('Header columns count:', headerCount);
    
    contacts.forEach(contact => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${contact.id}</td>
            <td>${contact.first_name} ${contact.last_name}</td>
            <td>${contact.email}</td>
            <td>${contact.phone || 'N/A'}</td>
            <td>${contact.company || 'N/A'}</td>
            <td>${contact.position || 'N/A'}</td>
            <td>${contact.workspace_id || 'N/A'}</td>
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
    
    // Count data columns
    const firstRow = tbody.querySelector('tr');
    const dataCount = firstRow ? firstRow.children.length : 0;
    console.log('Data columns count:', dataCount);
    
    // Initialize DataTable
    if (typeof $ !== 'undefined' && $.fn.DataTable) {
        // Check if DataTable already exists and destroy it
        if ($.fn.DataTable.isDataTable('#contactsTable')) {
            $('#contactsTable').DataTable().destroy();
        }
        contactsTable = $('#contactsTable').DataTable({
            pageLength: 10,
            order: [[7, 'desc']]
        });
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

async function addContact() {
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const company = document.getElementById('contactCompany').value.trim();
    
    if (!name || !email) {
        alert('Please enter name and email');
        return;
    }
    
    // Split name into first and last name
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const contactData = {
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone,
            company: company,
            status: 'active'
        };
        
        await ApiService.createContact(contactData, workspaceId);
        
        const modalElement = document.getElementById('addContactModal');
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
        document.getElementById('addContactForm').reset();
        
        await loadContacts();
    } catch (error) {
        console.error('Error creating contact:', error);
        alert('Failed to create contact');
    }
}

async function editContact(contactId) {
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const contacts = await ApiService.getContacts(workspaceId);
        const contact = contacts.find(c => c.id === contactId);
        
        if (!contact) {
            alert('Contact not found');
            return;
        }
        
        // Populate the edit form
        document.getElementById('editContactId').value = contact.id;
        document.getElementById('editContactName').value = `${contact.first_name} ${contact.last_name}`;
        document.getElementById('editContactEmail').value = contact.email;
        document.getElementById('editContactPhone').value = contact.phone || '';
        document.getElementById('editContactCompany').value = contact.company || '';
        document.getElementById('editContactPosition').value = contact.position || '';
        
        // Show the edit modal
        const modalElement = document.getElementById('editContactModal');
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.show();
    } catch (error) {
        console.error('Error loading contact for edit:', error);
        alert('Failed to load contact data');
    }
}

async function updateContact() {
    const contactId = document.getElementById('editContactId').value;
    const name = document.getElementById('editContactName').value.trim();
    const email = document.getElementById('editContactEmail').value.trim();
    const phone = document.getElementById('editContactPhone').value.trim();
    const company = document.getElementById('editContactCompany').value.trim();
    const position = document.getElementById('editContactPosition').value.trim();
    
    if (!name || !email) {
        alert('Please enter name and email');
        return;
    }
    
    // Split name into first and last name
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const contactData = {
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone,
            company: company,
            position: position
        };
        
        await ApiService.updateContact(contactId, contactData, workspaceId);
        
        const modalElement = document.getElementById('editContactModal');
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
        
        await loadContacts();
    } catch (error) {
        console.error('Error updating contact:', error);
        alert('Failed to update contact');
    }
}

async function deleteContact(contactId, contactName) {
    if (!confirm(`Are you sure you want to delete contact ${contactName}?`)) {
        return;
    }
    
    try {
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        await ApiService.deleteContact(contactId, workspaceId);
        await loadContacts();
    } catch (error) {
        console.error('Error deleting contact:', error);
        alert('Failed to delete contact');
    }
}
