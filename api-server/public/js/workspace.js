// Workspace Management Service
const WorkspaceService = {
    CURRENT_WORKSPACE_KEY: 'current_workspace',
    
    // Get current workspace from localStorage
    getCurrentWorkspace() {
        const workspace = localStorage.getItem(this.CURRENT_WORKSPACE_KEY);
        return workspace ? JSON.parse(workspace) : { id: 1, name: 'Default Workspace' };
    },
    
    // Get current workspace ID
    getCurrentWorkspaceId() {
        const workspace = this.getCurrentWorkspace();
        return workspace.id;
    },
    
    // Set current workspace
    setCurrentWorkspace(workspace) {
        localStorage.setItem(this.CURRENT_WORKSPACE_KEY, JSON.stringify(workspace));
        this.updateWorkspaceUI();
    },
    
    // Update workspace UI elements
    updateWorkspaceUI() {
        const currentWorkspace = this.getCurrentWorkspace();
        const workspaceElements = document.querySelectorAll('.current-workspace-name');
        workspaceElements.forEach(element => {
            element.textContent = currentWorkspace.name;
        });
        
        // Update page title if needed
        const titleElement = document.querySelector('title');
        if (titleElement) {
            titleElement.textContent = `${currentWorkspace.name} - Bootstrap App`;
        }
    },
    
    // Load workspaces into dropdown
    async loadWorkspacesIntoDropdown() {
        try {
            // Check if user is authenticated before loading workspaces
            if (!AuthService.isAuthenticated()) {
                console.log('User not authenticated, skipping workspace dropdown load');
                return;
            }
            
            const workspaces = await ApiService.getWorkspaces();
            const dropdown = document.getElementById('workspaceDropdown');
            if (dropdown) {
                dropdown.innerHTML = '';
                workspaces.forEach(workspace => {
                    const option = document.createElement('option');
                    option.value = workspace.id;
                    option.textContent = workspace.name;
                    dropdown.appendChild(option);
                });
                
                // Set current workspace
                const currentWorkspace = this.getCurrentWorkspace();
                dropdown.value = currentWorkspace.id;
            }
        } catch (error) {
            console.error('Error loading workspaces:', error);
        }
    },
    
    // Load workspaces and populate dropdown
    async loadWorkspaces() {
        try {
            // Check if user is authenticated before loading workspaces
            if (!AuthService.isAuthenticated()) {
                console.log('User not authenticated, skipping workspace load');
                return;
            }
            
            const workspaces = await ApiService.getWorkspaces();
            this.populateWorkspaceDropdown(workspaces);
        } catch (error) {
            console.error('Failed to load workspaces:', error);
            // Don't show alert for authentication errors
            if (!error.message.includes('authentication')) {
                showAlert('Failed to load workspaces', 'error');
            }
        }
    },
    
    // Populate workspace dropdown
    populateWorkspaceDropdown(workspaces) {
        const dropdown = document.getElementById('workspaceDropdown');
        if (!dropdown) return;
        
        dropdown.innerHTML = '';
        const currentWorkspace = this.getCurrentWorkspace();
        
        workspaces.forEach(workspace => {
            const option = document.createElement('option');
            option.value = workspace.id;
            option.textContent = workspace.name;
            option.selected = workspace.id === currentWorkspace.id;
            dropdown.appendChild(option);
        });
    },
    
    // Switch workspace
    async switchWorkspace(workspaceId) {
        try {
            const workspace = await ApiService.getWorkspace(workspaceId);
            this.setCurrentWorkspace(workspace);
            
            // Dispatch workspace change event for all modules to listen
            const workspaceChangeEvent = new CustomEvent('workspaceChanged', {
                detail: { workspaceId: workspaceId, workspace: workspace }
            });
            document.dispatchEvent(workspaceChangeEvent);
            
            // Reload current page data (legacy support)
            if (typeof loadData === 'function') {
                loadData();
            }
            
            // Workspace switched successfully
        } catch (error) {
            console.error('Failed to switch workspace:', error);
            showAlert('Failed to switch workspace', 'error');
        }
    },
    
    // Create new workspace
    async createWorkspace(workspaceData) {
        try {
            const newWorkspace = await ApiService.createWorkspace(workspaceData);
            await this.loadWorkspaces();
            showAlert('Workspace created successfully', 'success');
            return newWorkspace;
        } catch (error) {
            console.error('Failed to create workspace:', error);
            showAlert('Failed to create workspace', 'error');
            throw error;
        }
    },
    
    // Update workspace
    async updateWorkspace(workspaceId, workspaceData) {
        try {
            const updatedWorkspace = await ApiService.updateWorkspace(workspaceId, workspaceData);
            await this.loadWorkspaces();
            
            // Update current workspace if it's the one being updated
            const currentWorkspace = this.getCurrentWorkspace();
            if (currentWorkspace.id === workspaceId) {
                this.setCurrentWorkspace(updatedWorkspace);
            }
            
            showAlert('Workspace updated successfully', 'success');
            return updatedWorkspace;
        } catch (error) {
            console.error('Failed to update workspace:', error);
            showAlert('Failed to update workspace', 'error');
            throw error;
        }
    },
    
    // Delete workspace
    async deleteWorkspace(workspaceId) {
        try {
            await ApiService.deleteWorkspace(workspaceId);
            await this.loadWorkspaces();
            
            // Switch to default workspace if current workspace was deleted
            const currentWorkspace = this.getCurrentWorkspace();
            if (currentWorkspace.id === workspaceId) {
                this.setCurrentWorkspace({ id: 1, name: 'Default Workspace' });
            }
            
            showAlert('Workspace deleted successfully', 'success');
        } catch (error) {
            console.error('Failed to delete workspace:', error);
            showAlert('Failed to delete workspace', 'error');
            throw error;
        }
    },
    
    // Get workspace ID for API calls
    getWorkspaceId() {
        return this.getCurrentWorkspace().id;
    },
    
    // Load workspaces after authentication
    async loadWorkspacesAfterAuth() {
        try {
            await this.loadWorkspaces();
        } catch (error) {
            console.error('Failed to load workspaces after auth:', error);
        }
    }
};

// Initialize workspace service when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    WorkspaceService.updateWorkspaceUI();
    
    // Only load workspaces if user is already authenticated
    if (AuthService.isAuthenticated()) {
        WorkspaceService.loadWorkspaces();
    }
    
    // Handle workspace dropdown change
    const workspaceDropdown = document.getElementById('workspaceDropdown');
    if (workspaceDropdown) {
        workspaceDropdown.addEventListener('change', function() {
            const workspaceId = parseInt(this.value);
            WorkspaceService.switchWorkspace(workspaceId);
        });
    }
});
