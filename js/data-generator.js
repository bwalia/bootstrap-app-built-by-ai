// Data Generator for Testing
const DataGenerator = {
    // Sample data pools
    firstNames: ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'James', 'Emily', 'Robert', 'Lisa',
                 'William', 'Maria', 'Richard', 'Jennifer', 'Charles', 'Linda', 'Thomas', 'Patricia', 'Daniel', 'Barbara',
                 'Matthew', 'Susan', 'Anthony', 'Jessica', 'Mark', 'Karen', 'Donald', 'Nancy', 'Steven', 'Betty',
                 'Paul', 'Margaret', 'Andrew', 'Sandra', 'Joshua', 'Ashley', 'Kenneth', 'Dorothy', 'Kevin', 'Kimberly',
                 'Brian', 'Emily', 'George', 'Donna', 'Edward', 'Michelle', 'Ronald', 'Carol', 'Timothy', 'Amanda'],

    lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
                'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
                'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
                'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'],

    departments: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'IT', 'Support', 'Legal', 'Product'],

    groupNames: ['Administrators', 'Developers', 'Designers', 'Project Managers', 'QA Team', 'DevOps', 'Data Analysts',
                 'Sales Team', 'Marketing Team', 'HR Department', 'Finance Department', 'Customer Support', 'Leadership',
                 'Interns', 'Contractors', 'Remote Workers', 'Office Staff', 'Regional Managers', 'Team Leads', 'Senior Staff'],

    roleTypes: [
        { name: 'Super Admin', permissions: ['read', 'write', 'delete', 'admin'] },
        { name: 'Admin', permissions: ['read', 'write', 'delete'] },
        { name: 'Manager', permissions: ['read', 'write'] },
        { name: 'Editor', permissions: ['read', 'write'] },
        { name: 'Viewer', permissions: ['read'] },
        { name: 'Contributor', permissions: ['read', 'write'] },
        { name: 'Guest', permissions: ['read'] }
    ],

    // Generate random name
    generateName() {
        const firstName = this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
        const lastName = this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
        return `${firstName} ${lastName}`;
    },

    // Generate email from name
    generateEmail(name) {
        const cleanName = name.toLowerCase().replace(/\s+/g, '.');
        const domains = ['example.com', 'test.com', 'demo.org', 'sample.net'];
        const domain = domains[Math.floor(Math.random() * domains.length)];
        const random = Math.floor(Math.random() * 1000);
        return `${cleanName}${random}@${domain}`;
    },

    // Generate random status
    generateStatus() {
        return Math.random() > 0.2 ? 'active' : 'inactive'; // 80% active
    },

    // Generate random role
    generateRole() {
        const roles = ['Super Admin', 'Admin', 'Manager', 'Editor', 'Viewer', 'Contributor', 'Guest'];
        return roles[Math.floor(Math.random() * roles.length)];
    },

    // Generate users
    async generateUsers(count) {
        const users = [];
        const createdUsers = [];

        console.log(`Generating ${count} users...`);

        for (let i = 0; i < count; i++) {
            const name = this.generateName();
            const user = {
                name: name,
                email: this.generateEmail(name),
                password: 'Password123!',
                role: this.generateRole(),
                status: this.generateStatus()
            };
            users.push(user);
        }

        // Create users via API
        for (let i = 0; i < users.length; i++) {
            try {
                const result = await ApiService.createUser(users[i]);
                createdUsers.push(result);
                console.log(`Created user ${i + 1}/${users.length}: ${users[i].name}`);

                // Add small delay to avoid overwhelming the server
                if (i % 10 === 0 && i > 0) {
                    await this.delay(500);
                }
            } catch (error) {
                console.error(`Failed to create user ${users[i].name}:`, error.message);
            }
        }

        return createdUsers;
    },

    // Generate groups
    async generateGroups(count) {
        const groups = [];
        const createdGroups = [];

        console.log(`Generating ${count} groups...`);

        for (let i = 0; i < count; i++) {
            const groupName = i < this.groupNames.length
                ? this.groupNames[i]
                : `${this.departments[i % this.departments.length]} - Team ${Math.floor(i / this.departments.length) + 1}`;

            const group = {
                name: groupName,
                description: `Description for ${groupName}`,
                status: this.generateStatus()
            };
            groups.push(group);
        }

        // Create groups via API
        for (let i = 0; i < groups.length; i++) {
            try {
                const result = await ApiService.createGroup(groups[i]);
                createdGroups.push(result);
                console.log(`Created group ${i + 1}/${groups.length}: ${groups[i].name}`);

                if (i % 5 === 0 && i > 0) {
                    await this.delay(300);
                }
            } catch (error) {
                console.error(`Failed to create group ${groups[i].name}:`, error.message);
            }
        }

        return createdGroups;
    },

    // Generate roles
    async generateRoles() {
        const createdRoles = [];

        console.log(`Generating ${this.roleTypes.length} roles...`);

        for (let i = 0; i < this.roleTypes.length; i++) {
            const roleType = this.roleTypes[i];
            const role = {
                name: roleType.name,
                description: `${roleType.name} role with ${roleType.permissions.join(', ')} permissions`,
                permissions: roleType.permissions,
                status: 'active'
            };

            try {
                const result = await ApiService.createRole(role);
                createdRoles.push(result);
                console.log(`Created role ${i + 1}/${this.roleTypes.length}: ${role.name}`);
            } catch (error) {
                console.error(`Failed to create role ${role.name}:`, error.message);
            }
        }

        return createdRoles;
    },

    // Generate all data
    async generateAll(userCount = 300, groupCount = 30) {
        console.log('=== Starting Data Generation ===');
        console.log(`Users: ${userCount}, Groups: ${groupCount}, Roles: ${this.roleTypes.length}`);

        const results = {
            roles: [],
            groups: [],
            users: [],
            errors: []
        };

        try {
            // Generate roles first (dependencies)
            console.log('\n--- Generating Roles ---');
            results.roles = await this.generateRoles();
            console.log(`✓ Created ${results.roles.length} roles`);

            // Generate groups
            console.log('\n--- Generating Groups ---');
            results.groups = await this.generateGroups(groupCount);
            console.log(`✓ Created ${results.groups.length} groups`);

            // Generate users
            console.log('\n--- Generating Users ---');
            results.users = await this.generateUsers(userCount);
            console.log(`✓ Created ${results.users.length} users`);

            console.log('\n=== Data Generation Complete ===');
            console.log(`Total: ${results.users.length} users, ${results.groups.length} groups, ${results.roles.length} roles`);

            return results;
        } catch (error) {
            console.error('Data generation error:', error);
            results.errors.push(error.message);
            return results;
        }
    },

    // Helper delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Clear all data (use with caution!)
    async clearAllData() {
        console.log('⚠️ WARNING: This will delete all users, groups, and roles!');

        if (!confirm('Are you sure you want to delete ALL data? This cannot be undone!')) {
            console.log('Cancelled.');
            return;
        }

        const results = {
            deletedUsers: 0,
            deletedGroups: 0,
            deletedRoles: 0,
            errors: []
        };

        try {
            // Get and delete all users
            console.log('Fetching users...');
            const usersResponse = await ApiService.getUsers();
            let users = [];
            if (Array.isArray(usersResponse)) {
                users = usersResponse;
            } else if (usersResponse.data) {
                users = usersResponse.data;
            }

            console.log(`Deleting ${users.length} users...`);
            for (const user of users) {
                try {
                    await ApiService.deleteUser(user.id);
                    results.deletedUsers++;
                } catch (error) {
                    console.error(`Failed to delete user ${user.id}:`, error.message);
                }
            }

            // Get and delete all groups
            console.log('Fetching groups...');
            const groupsResponse = await ApiService.getGroups();
            let groups = [];
            if (Array.isArray(groupsResponse)) {
                groups = groupsResponse;
            } else if (groupsResponse.data) {
                groups = groupsResponse.data;
            }

            console.log(`Deleting ${groups.length} groups...`);
            for (const group of groups) {
                try {
                    await ApiService.deleteGroup(group.id);
                    results.deletedGroups++;
                } catch (error) {
                    console.error(`Failed to delete group ${group.id}:`, error.message);
                }
            }

            // Get and delete all roles
            console.log('Fetching roles...');
            const rolesResponse = await ApiService.getRoles();
            let roles = [];
            if (Array.isArray(rolesResponse)) {
                roles = rolesResponse;
            } else if (rolesResponse.data) {
                roles = rolesResponse.data;
            }

            console.log(`Deleting ${roles.length} roles...`);
            for (const role of roles) {
                try {
                    await ApiService.deleteRole(role.id);
                    results.deletedRoles++;
                } catch (error) {
                    console.error(`Failed to delete role ${role.id}:`, error.message);
                }
            }

            console.log('\n=== Cleanup Complete ===');
            console.log(`Deleted: ${results.deletedUsers} users, ${results.deletedGroups} groups, ${results.deletedRoles} roles`);

            return results;
        } catch (error) {
            console.error('Cleanup error:', error);
            results.errors.push(error.message);
            return results;
        }
    }
};
