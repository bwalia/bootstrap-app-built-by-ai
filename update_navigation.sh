#!/bin/bash

# Complete navigation menu template
NAV_MENU='                    <ul class="nav flex-column">
                        <li class="nav-item">
                            <a class="nav-link" href="index.html">
                                <i class="fas fa-tachometer-alt"></i> Dashboard
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="users.html">
                                <i class="fas fa-users"></i> Users
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="groups.html">
                                <i class="fas fa-layer-group"></i> Groups
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="roles.html">
                                <i class="fas fa-user-tag"></i> Roles
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="departments.html">
                                <i class="fas fa-building"></i> Departments
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="permissions.html">
                                <i class="fas fa-key"></i> Permissions
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="workspaces.html">
                                <i class="fas fa-building"></i> Workspaces
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="contacts.html">
                                <i class="fas fa-address-book"></i> Contacts
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="customers.html">
                                <i class="fas fa-users"></i> Customers
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="enquiries.html">
                                <i class="fas fa-question-circle"></i> Enquiries
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="projects.html">
                                <i class="fas fa-project-diagram"></i> Projects
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="jobs.html">
                                <i class="fas fa-tasks"></i> Jobs
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="tasks.html">
                                <i class="fas fa-list-check"></i> Tasks
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="timesheets.html">
                                <i class="fas fa-clock"></i> Timesheets
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="documents.html">
                                <i class="fas fa-file-alt"></i> Documents
                            </a>
                        </li>
                    </ul>'

# Function to update navigation for a specific file
update_navigation() {
    local file="$1"
    local active_page="$2"
    
    echo "Updating navigation in $file..."
    
    # Create temporary file with updated navigation
    local temp_file=$(mktemp)
    
    # Replace the active class for the current page
    local updated_menu=$(echo "$NAV_MENU" | sed "s/href=\"$active_page\.html\"/href=\"$active_page.html\" class=\"nav-link active\"/g")
    
    # Use awk to replace the navigation section
    awk -v new_nav="$updated_menu" '
    /<ul class="nav flex-column">/ {
        print new_nav
        # Skip all lines until we find the closing </ul>
        while (getline && !/<\/ul>/) {
            # Skip lines
        }
        print "</ul>"
        next
    }
    { print }
    ' "$file" > "$temp_file"
    
    # Replace original file
    mv "$temp_file" "$file"
    
    echo "Updated $file"
}

# Update all HTML files
update_navigation "permissions.html" "permissions"
update_navigation "workspaces.html" "workspaces"
update_navigation "contacts.html" "contacts"
update_navigation "customers.html" "customers"
update_navigation "enquiries.html" "enquiries"
update_navigation "projects.html" "projects"
update_navigation "jobs.html" "jobs"
update_navigation "tasks.html" "tasks"
update_navigation "timesheets.html" "timesheets"
update_navigation "documents.html" "documents"

echo "All navigation menus updated!"
