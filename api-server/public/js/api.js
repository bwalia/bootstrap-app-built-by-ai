// API Service
const ApiService = {
    // API_URL: 'https://opsapi.workstation.co.uk',
    API_URL: 'https://dev007.webaimpetus.com',

    // Make authenticated request
    async request(endpoint, options = {}) {
        const token = AuthService.getToken();

        if (!token) {
            console.error('No authentication token found');
            throw new Error('No authentication token found');
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        // Only add Content-Type for JSON requests (not for FormData)
        if (options.body && typeof options.body === 'string') {
            headers['Content-Type'] = 'application/json';
        }


        try {
            const response = await fetch(`${this.API_URL}${endpoint}`, {
                ...options,
                headers
            });


            // Check if unauthorized
            if (response.status === 401) {
                AuthService.logout();
                window.location.reload();
                throw new Error('Unauthorized. Please login again.');
            }

            // Handle server errors
            if (response.status >= 500) {
                console.error(`Server error ${response.status} for endpoint: ${endpoint}`);
                throw new Error(`Server error (${response.status}). The endpoint ${endpoint} may not be implemented yet.`);
            }

            // Handle 404 errors
            if (response.status === 404) {
                throw new Error(`Endpoint not found: ${endpoint} (404)`);
            }

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const error = await response.json();
                    errorMessage = error.message || error.error || errorMessage;
                } catch (e) {
                    // If response is not JSON, use the default error message
                    const text = await response.text();
                    if (text) errorMessage = text;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    },

    // Get all users
    async getUsers(workspaceId = null) {
        const url = workspaceId ? `/api/v2/users?workspace_id=${workspaceId}` : '/api/v2/users';
        return await this.request(url);
    },

    // Get a single user by ID
    async getUser(userId) {
        return await this.request(`/api/v2/users/${userId}`);
    },

    // Create a new user (supports both JSON and FormData)
    async createUser(userData, useFormData = false) {
        if (useFormData) {
            const formData = new FormData();

            // Add all user data to FormData
            if (userData.username) formData.append('username', userData.username);
            if (userData.email) formData.append('email', userData.email);
            if (userData.password) formData.append('password', userData.password);
            if (userData.first_name) formData.append('first_name', userData.first_name);
            if (userData.last_name) formData.append('last_name', userData.last_name);
            if (userData.role) formData.append('role', userData.role);
            if (userData.active !== undefined) formData.append('active', userData.active);
            if (userData.phone_no) formData.append('phone_no', userData.phone_no);
            if (userData.address) formData.append('address', userData.address);

            return await this.request('/api/v2/users', {
                method: 'POST',
                body: formData
            });
        } else {
            return await this.request('/api/v2/users', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        }
    },

    // Update an existing user
    async updateUser(userId, userData) {
        try {
            return await this.request(`/api/v2/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
        } catch (error) {
            // Try PATCH if PUT fails
            return await this.request(`/api/v2/users/${userId}`, {
                method: 'PATCH',
                body: JSON.stringify(userData)
            });
        }
    },

    // Delete a user
    async deleteUser(userId) {
        return await this.request(`/api/v2/users/${userId}`, {
            method: 'DELETE'
        });
    },

    // ===== GROUPS MANAGEMENT =====

    // Get all groups
    async getGroups() {
        return await this.request('/api/v2/groups');
    },

    // Get a single group by ID
    async getGroup(groupId) {
        return await this.request(`/api/v2/groups/${groupId}`);
    },

    // Create a new group
    async createGroup(groupData, useFormData = false) {
        if (useFormData) {
            const formData = new FormData();

            if (groupData.name) formData.append('name', groupData.name);
            if (groupData.machine_name) formData.append('machine_name', groupData.machine_name);
            if (groupData.description) formData.append('description', groupData.description);

            return await this.request('/api/v2/groups', {
                method: 'POST',
                body: formData
            });
        } else {
            return await this.request('/api/v2/groups', {
                method: 'POST',
                body: JSON.stringify(groupData)
            });
        }
    },

    // Update an existing group
    async updateGroup(groupId, groupData) {
        try {
            return await this.request(`/api/v2/groups/${groupId}`, {
                method: 'PUT',
                body: JSON.stringify(groupData)
            });
        } catch (error) {
            // Try PATCH if PUT fails
            return await this.request(`/api/v2/groups/${groupId}`, {
                method: 'PATCH',
                body: JSON.stringify(groupData)
            });
        }
    },

    // Delete a group
    async deleteGroup(groupId) {
        return await this.request(`/api/v2/groups/${groupId}`, {
            method: 'DELETE'
        });
    },

    // ===== ROLES MANAGEMENT =====

    // Get all roles
    async getRoles() {
        return await this.request('/api/v2/roles');
    },

    // Get a single role by ID
    async getRole(roleId) {
        return await this.request(`/api/v2/roles/${roleId}`);
    },

    // Create a new role
    async createRole(roleData, useFormData = false) {
        if (useFormData) {
            const formData = new FormData();

            if (roleData.role_name) formData.append('role_name', roleData.role_name);
            if (roleData.name) formData.append('role_name', roleData.name);

            return await this.request('/api/v2/roles', {
                method: 'POST',
                body: formData
            });
        } else {
            return await this.request('/api/v2/roles', {
                method: 'POST',
                body: JSON.stringify(roleData)
            });
        }
    },

    // Update an existing role
    async updateRole(roleId, roleData) {
        try {
            return await this.request(`/api/v2/roles/${roleId}`, {
                method: 'PUT',
                body: JSON.stringify(roleData)
            });
        } catch (error) {
            // Try PATCH if PUT fails
            return await this.request(`/api/v2/roles/${roleId}`, {
                method: 'PATCH',
                body: JSON.stringify(roleData)
            });
        }
    },

    // Delete a role
    async deleteRole(roleId) {
        return await this.request(`/api/v2/roles/${roleId}`, {
            method: 'DELETE'
        });
    },

    // ===== DEPARTMENTS MANAGEMENT =====

    async getDepartments() {
        return await this.request('/api/v2/departments');
    },

    async getDepartment(departmentId) {
        return await this.request(`/api/v2/departments/${departmentId}`);
    },

    async createDepartment(departmentData) {
        return await this.request('/api/v2/departments', {
            method: 'POST',
            body: JSON.stringify(departmentData)
        });
    },

    async updateDepartment(departmentId, departmentData) {
        try {
            return await this.request(`/api/v2/departments/${departmentId}`, {
                method: 'PUT',
                body: JSON.stringify(departmentData)
            });
        } catch (error) {
            return await this.request(`/api/v2/departments/${departmentId}`, {
                method: 'PATCH',
                body: JSON.stringify(departmentData)
            });
        }
    },

    async deleteDepartment(departmentId) {
        return await this.request(`/api/v2/departments/${departmentId}`, {
            method: 'DELETE'
        });
    },

    // ===== PERMISSIONS MANAGEMENT =====

    async getPermissions() {
        return await this.request('/api/v2/permissions');
    },

    async getPermission(permissionId) {
        return await this.request(`/api/v2/permissions/${permissionId}`);
    },

    async createPermission(permissionData) {
        return await this.request('/api/v2/permissions', {
            method: 'POST',
            body: JSON.stringify(permissionData)
        });
    },

    async updatePermission(permissionId, permissionData) {
        try {
            return await this.request(`/api/v2/permissions/${permissionId}`, {
                method: 'PUT',
                body: JSON.stringify(permissionData)
            });
        } catch (error) {
            return await this.request(`/api/v2/permissions/${permissionId}`, {
                method: 'PATCH',
                body: JSON.stringify(permissionData)
            });
        }
    },

    async deletePermission(permissionId) {
        return await this.request(`/api/v2/permissions/${permissionId}`, {
            method: 'DELETE'
        });
    },

    // ===== WORKSPACES MANAGEMENT =====

    // Get all workspaces
    async getWorkspaces() {
        return await this.request('/api/v2/workspaces');
    },

    // Get a single workspace by ID
    async getWorkspace(workspaceId) {
        return await this.request(`/api/v2/workspaces/${workspaceId}`);
    },

    // Create a new workspace
    async createWorkspace(workspaceData) {
        return await this.request('/api/v2/workspaces', {
            method: 'POST',
            body: JSON.stringify(workspaceData)
        });
    },

    // Update an existing workspace
    async updateWorkspace(workspaceId, workspaceData) {
        try {
            return await this.request(`/api/v2/workspaces/${workspaceId}`, {
                method: 'PUT',
                body: JSON.stringify(workspaceData)
            });
        } catch (error) {
            return await this.request(`/api/v2/workspaces/${workspaceId}`, {
                method: 'PATCH',
                body: JSON.stringify(workspaceData)
            });
        }
    },

    // Delete a workspace
    async deleteWorkspace(workspaceId) {
        return await this.request(`/api/v2/workspaces/${workspaceId}`, {
            method: 'DELETE'
        });
    },

    // ===== CRM MANAGEMENT =====

    // CONTACTS
    async getContacts(workspaceId = null) {
        const url = workspaceId ? `/api/v2/contacts?workspace_id=${workspaceId}` : '/api/v2/contacts';
        return await this.request(url);
    },

    async getContact(contactId, workspaceId = null) {
        const url = workspaceId ? `/api/v2/contacts/${contactId}?workspace_id=${workspaceId}` : `/api/v2/contacts/${contactId}`;
        return await this.request(url);
    },

    async createContact(contactData, workspaceId = null) {
        const headers = workspaceId ? { 'X-Workspace-Id': workspaceId } : {};
        return await this.request('/api/v2/contacts', {
            method: 'POST',
            body: JSON.stringify(contactData),
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    },

    async updateContact(contactId, contactData, workspaceId = null) {
        const headers = workspaceId ? { 'X-Workspace-Id': workspaceId } : {};
        try {
            return await this.request(`/api/v2/contacts/${contactId}`, {
                method: 'PUT',
                body: JSON.stringify(contactData),
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        } catch (error) {
            return await this.request(`/api/v2/contacts/${contactId}`, {
                method: 'PATCH',
                body: JSON.stringify(contactData),
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        }
    },

    async deleteContact(contactId, workspaceId = null) {
        const headers = workspaceId ? { 'X-Workspace-Id': workspaceId } : {};
        return await this.request(`/api/v2/contacts/${contactId}`, {
            method: 'DELETE',
            headers
        });
    },

    // CUSTOMERS
    async getCustomers(workspaceId = null) {
        const url = workspaceId ? `/api/v2/customers?workspace_id=${workspaceId}` : '/api/v2/customers';
        return await this.request(url);
    },

    async getCustomer(customerId, workspaceId = null) {
        const url = workspaceId ? `/api/v2/customers/${customerId}?workspace_id=${workspaceId}` : `/api/v2/customers/${customerId}`;
        return await this.request(url);
    },

    async createCustomer(customerData, workspaceId = null) {
        const headers = workspaceId ? { 'X-Workspace-Id': workspaceId } : {};
        return await this.request('/api/v2/customers', {
            method: 'POST',
            body: JSON.stringify(customerData),
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    },

    async updateCustomer(customerId, customerData, workspaceId = null) {
        const headers = workspaceId ? { 'X-Workspace-Id': workspaceId } : {};
        try {
            return await this.request(`/api/v2/customers/${customerId}`, {
                method: 'PUT',
                body: JSON.stringify(customerData),
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        } catch (error) {
            return await this.request(`/api/v2/customers/${customerId}`, {
                method: 'PATCH',
                body: JSON.stringify(customerData),
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        }
    },

    async deleteCustomer(customerId, workspaceId = null) {
        const headers = workspaceId ? { 'X-Workspace-Id': workspaceId } : {};
        return await this.request(`/api/v2/customers/${customerId}`, {
            method: 'DELETE',
            headers
        });
    },

    // ENQUIRIES
    async getEnquiries(workspaceId = null) {
        const url = workspaceId ? `/api/v2/enquiries?workspace_id=${workspaceId}` : '/api/v2/enquiries';
        return await this.request(url);
    },

    async getEnquiry(enquiryId, workspaceId = null) {
        const url = workspaceId ? `/api/v2/enquiries/${enquiryId}?workspace_id=${workspaceId}` : `/api/v2/enquiries/${enquiryId}`;
        return await this.request(url);
    },

    async createEnquiry(enquiryData, workspaceId = null) {
        const headers = workspaceId ? { 'X-Workspace-Id': workspaceId } : {};
        return await this.request('/api/v2/enquiries', {
            method: 'POST',
            body: JSON.stringify(enquiryData),
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    },

    async updateEnquiry(enquiryId, enquiryData, workspaceId = null) {
        const headers = workspaceId ? { 'X-Workspace-Id': workspaceId } : {};
        try {
            return await this.request(`/api/v2/enquiries/${enquiryId}`, {
                method: 'PUT',
                body: JSON.stringify(enquiryData),
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        } catch (error) {
            return await this.request(`/api/v2/enquiries/${enquiryId}`, {
                method: 'PATCH',
                body: JSON.stringify(enquiryData),
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        }
    },

    async deleteEnquiry(enquiryId, workspaceId = null) {
        const headers = workspaceId ? { 'X-Workspace-Id': workspaceId } : {};
        return await this.request(`/api/v2/enquiries/${enquiryId}`, {
            method: 'DELETE',
            headers
        });
    },

    // ===== PROJECT MANAGEMENT =====

    // PROJECTS
    async getProjects(workspaceId = null) {
        const url = workspaceId ? `/api/v2/projects?workspace_id=${workspaceId}` : '/api/v2/projects';
        return await this.request(url);
    },

    async getProject(projectId, workspaceId = null) {
        const url = workspaceId ? `/api/v2/projects/${projectId}?workspace_id=${workspaceId}` : `/api/v2/projects/${projectId}`;
        return await this.request(url);
    },

    async createProject(projectData, workspaceId = null) {
        const headers = workspaceId ? { 'X-Workspace-Id': workspaceId } : {};
        return await this.request('/api/v2/projects', {
            method: 'POST',
            body: JSON.stringify(projectData),
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    },

    async updateProject(projectId, projectData, workspaceId = null) {
        const headers = workspaceId ? { 'X-Workspace-Id': workspaceId } : {};
        try {
            return await this.request(`/api/v2/projects/${projectId}`, {
                method: 'PUT',
                body: JSON.stringify(projectData),
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        } catch (error) {
            return await this.request(`/api/v2/projects/${projectId}`, {
                method: 'PATCH',
                body: JSON.stringify(projectData),
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        }
    },

    async deleteProject(projectId, workspaceId = null) {
        const headers = workspaceId ? { 'X-Workspace-Id': workspaceId } : {};
        return await this.request(`/api/v2/projects/${projectId}`, {
            method: 'DELETE',
            headers
        });
    },

    // JOBS
    async getJobs(workspaceId = null) {
        const url = workspaceId ? `/api/v2/jobs?workspace_id=${workspaceId}` : '/api/v2/jobs';
        return await this.request(url);
    },

    async getJob(jobId, workspaceId = null) {
        const url = workspaceId ? `/api/v2/jobs/${jobId}?workspace_id=${workspaceId}` : `/api/v2/jobs/${jobId}`;
        return await this.request(url);
    },

    async createJob(jobData, workspaceId = null) {
        const headers = workspaceId ? { 'X-Workspace-Id': workspaceId } : {};
        return await this.request('/api/v2/jobs', {
            method: 'POST',
            body: JSON.stringify(jobData),
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    },

    async updateJob(jobId, jobData, workspaceId = null) {
        const headers = workspaceId ? { 'X-Workspace-Id': workspaceId } : {};
        try {
            return await this.request(`/api/v2/jobs/${jobId}`, {
                method: 'PUT',
                body: JSON.stringify(jobData),
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        } catch (error) {
            return await this.request(`/api/v2/jobs/${jobId}`, {
                method: 'PATCH',
                body: JSON.stringify(jobData),
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        }
    },

    async deleteJob(jobId, workspaceId = null) {
        const headers = workspaceId ? { 'X-Workspace-Id': workspaceId } : {};
        return await this.request(`/api/v2/jobs/${jobId}`, {
            method: 'DELETE',
            headers
        });
    },

    // TASKS
    async getTasks(workspaceId = null) {
        const url = workspaceId ? `/api/v2/tasks?workspace_id=${workspaceId}` : '/api/v2/tasks';
        return await this.request(url);
    },

    async getTask(taskId, workspaceId = null) {
        const url = workspaceId ? `/api/v2/tasks/${taskId}?workspace_id=${workspaceId}` : `/api/v2/tasks/${taskId}`;
        return await this.request(url);
    },

    async createTask(taskData, workspaceId = null) {
        const headers = workspaceId ? { 'X-Workspace-Id': workspaceId } : {};
        return await this.request('/api/v2/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData),
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    },

    async updateTask(taskId, taskData, workspaceId = null) {
        const headers = workspaceId ? { 'X-Workspace-Id': workspaceId } : {};
        try {
            return await this.request(`/api/v2/tasks/${taskId}`, {
                method: 'PUT',
                body: JSON.stringify(taskData),
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        } catch (error) {
            return await this.request(`/api/v2/tasks/${taskId}`, {
                method: 'PATCH',
                body: JSON.stringify(taskData),
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        }
    },

    async deleteTask(taskId, workspaceId = null) {
        const headers = workspaceId ? { 'X-Workspace-Id': workspaceId } : {};
        return await this.request(`/api/v2/tasks/${taskId}`, {
            method: 'DELETE',
            headers
        });
    },

    // TIMESHEETS
    async getTimesheets(workspaceId = null) {
        const url = workspaceId ? `/api/v2/timesheets?workspace_id=${workspaceId}` : '/api/v2/timesheets';
        try {
            const result = await this.request(url);
            return result;
        } catch (error) {
            console.error('ApiService.getTimesheets error:', error);
            throw error;
        }
    },

    async getTimesheet(timesheetId, workspaceId = null) {
        const url = workspaceId ? `/api/v2/timesheets/${timesheetId}?workspace_id=${workspaceId}` : `/api/v2/timesheets/${timesheetId}`;
        return await this.request(url);
    },

    async createTimesheet(timesheetData, workspaceId = null) {
        const headers = workspaceId ? { 'X-Workspace-Id': workspaceId } : {};
        return await this.request('/api/v2/timesheets', {
            method: 'POST',
            body: JSON.stringify(timesheetData),
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    },

    async updateTimesheet(timesheetId, timesheetData, workspaceId = null) {
        const headers = workspaceId ? { 'X-Workspace-Id': workspaceId } : {};
        try {
            return await this.request(`/api/v2/timesheets/${timesheetId}`, {
                method: 'PUT',
                body: JSON.stringify(timesheetData),
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        } catch (error) {
            return await this.request(`/api/v2/timesheets/${timesheetId}`, {
                method: 'PATCH',
                body: JSON.stringify(timesheetData),
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        }
    },

    async deleteTimesheet(timesheetId, workspaceId = null) {
        const headers = workspaceId ? { 'X-Workspace-Id': workspaceId } : {};
        return await this.request(`/api/v2/timesheets/${timesheetId}`, {
            method: 'DELETE',
            headers
        });
    },

    // DOCUMENTS
    async getDocuments(workspaceId = null) {
        const url = workspaceId ? `/api/v2/documents?workspace_id=${workspaceId}` : '/api/v2/documents';
        return await this.request(url);
    },

    async getDocument(documentId, workspaceId = null) {
        const url = workspaceId ? `/api/v2/documents/${documentId}?workspace_id=${workspaceId}` : `/api/v2/documents/${documentId}`;
        return await this.request(url);
    },

    async uploadDocument(formData, workspaceId = null) {
        const headers = {};
        if (workspaceId) {
            headers['X-Workspace-Id'] = workspaceId;
        }

        return await this.request('/api/v2/documents/upload', {
            method: 'POST',
            body: formData,
            headers
        });
    },

    async downloadDocument(documentId, workspaceId = null) {
        const url = workspaceId ? 
            `${this.API_URL}/api/v2/documents/${documentId}/download?workspace_id=${workspaceId}` :
            `${this.API_URL}/api/v2/documents/${documentId}/download`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: this.getHeaders()
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to download document');
        }
        
        const blob = await response.blob();
        const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'document';
        
        return { data: blob, filename };
    },

    async updateDocument(documentId, documentData, workspaceId = null) {
        const headers = workspaceId ? { 'X-Workspace-Id': workspaceId } : {};
        return await this.request(`/api/v2/documents/${documentId}`, {
            method: 'PUT',
            body: JSON.stringify(documentData),
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            }
        });
    },

    async deleteDocument(documentId, workspaceId = null) {
        const headers = workspaceId ? { 'X-Workspace-Id': workspaceId } : {};
        return await this.request(`/api/v2/documents/${documentId}`, {
            method: 'DELETE',
            headers
        });
    }
};
