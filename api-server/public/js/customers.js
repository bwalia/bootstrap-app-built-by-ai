// Customer Management Controller
let customersTable;

document.addEventListener('DOMContentLoaded', function() {
    // Only run on customers page
    if (window.location.pathname === '/customers') {
        initializeAuth();
        loadCustomers();
    }
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
    
    // Listen for workspace changes
    document.addEventListener('workspaceChanged', function(event) {
        console.log('Workspace changed, reloading customers for workspace:', event.detail.workspaceId);
        loadCustomers();
    });
}

async function loadCustomers() {
    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const customers = await ApiService.getCustomers(workspaceId);
        populateCustomersTable(customers);
    } catch (error) {
        console.error('Error loading customers:', error);
        showAlert('Failed to load customers', 'error');
    } finally {
        showLoading(false);
    }
}

function populateCustomersTable(customers) {
    if (customersTable) {
        customersTable.destroy();
    }
    
    const tbody = document.querySelector('#customersTable tbody');
    tbody.innerHTML = '';
    
    customers.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.id}</td>
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone || '-'}</td>
            <td>${customer.company || '-'}</td>
            <td><span class="badge bg-${customer.status === 'active' ? 'success' : 'secondary'}">${customer.status}</span></td>
            <td>${customer.workspace_id || '-'}</td>
            <td>${formatDate(customer.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editCustomer(${customer.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteCustomer(${customer.id}, '${customer.name}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    customersTable = $('#customersTable').DataTable({
        pageLength: 10,
        order: [[7, 'desc']],
        columnDefs: [{ orderable: false, targets: 8 }]
    });
}

async function addCustomer() {
    const name = document.getElementById('customerName').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const company = document.getElementById('customerCompany').value.trim();
    const status = document.getElementById('customerStatus').value;
    
    if (!name || !email) {
        showAlert('Please fill in required fields', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const customerData = {
            name: name,
            email: email,
            phone: phone,
            company: company,
            status: status
        };
        
        await ApiService.createCustomer(customerData, workspaceId);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('addCustomerModal'));
        modal.hide();
        document.getElementById('addCustomerForm').reset();
        
        await loadCustomers();
        showAlert('Customer created successfully', 'success');
    } catch (error) {
        console.error('Error creating customer:', error);
        showAlert('Failed to create customer', 'error');
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

async function editCustomer(customerId) {
    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getCurrentWorkspaceId();
        const customers = await ApiService.getCustomers(workspaceId);
        const customer = customers.find(c => c.id === customerId);
        
        if (customer) {
            document.getElementById('editCustomerId').value = customer.id;
            document.getElementById('editCustomerName').value = customer.name;
            document.getElementById('editCustomerEmail').value = customer.email;
            document.getElementById('editCustomerPhone').value = customer.phone || '';
            document.getElementById('editCustomerCompany').value = customer.company || '';
            document.getElementById('editCustomerStatus').value = customer.status;
            
            const modal = new bootstrap.Modal(document.getElementById('editCustomerModal'));
            modal.show();
        }
    } catch (error) {
        console.error('Error loading customer for edit:', error);
        showAlert('Failed to load customer data', 'error');
    } finally {
        showLoading(false);
    }
}

async function updateCustomer() {
    const customerId = document.getElementById('editCustomerId').value;
    const name = document.getElementById('editCustomerName').value.trim();
    const email = document.getElementById('editCustomerEmail').value.trim();
    const phone = document.getElementById('editCustomerPhone').value.trim();
    const company = document.getElementById('editCustomerCompany').value.trim();
    const status = document.getElementById('editCustomerStatus').value;
    
    if (!name || !email) {
        showAlert('Please fill in required fields', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const customerData = {
            name: name,
            email: email,
            phone: phone,
            company: company,
            status: status
        };
        
        await ApiService.updateCustomer(customerId, customerData);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('editCustomerModal'));
        modal.hide();
        
        await loadCustomers();
        showAlert('Customer updated successfully', 'success');
    } catch (error) {
        console.error('Error updating customer:', error);
        showAlert('Failed to update customer', 'error');
    } finally {
        showLoading(false);
    }
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
