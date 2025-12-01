// Customer Management Controller
let customersTable;

document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
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

async function loadCustomers() {
    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getWorkspaceId();
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
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone || '-'}</td>
            <td><span class="badge bg-info">${customer.customer_type}</span></td>
            <td>${customer.industry || '-'}</td>
            <td><span class="badge bg-${customer.status === 'active' ? 'success' : 'secondary'}">${customer.status}</span></td>
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
        order: [[6, 'desc']],
        columnDefs: [{ orderable: false, targets: 7 }]
    });
}

async function addCustomer() {
    const name = document.getElementById('customerName').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('customerAddress').value.trim();
    const customerType = document.getElementById('customerType').value;
    const industry = document.getElementById('customerIndustry').value.trim();
    
    if (!name || !email) {
        showAlert('Please fill in required fields', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const workspaceId = WorkspaceService.getWorkspaceId();
        const customerData = {
            name: name,
            email: email,
            phone: phone,
            address: address,
            customer_type: customerType,
            industry: industry
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
