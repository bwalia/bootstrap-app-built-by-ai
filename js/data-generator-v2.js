// Enhanced Data Generator with Better Error Handling
const DataGeneratorV2 = {
    // Sample data pools (same as before)
    firstNames: ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'James', 'Emily', 'Robert', 'Lisa',
                 'William', 'Maria', 'Richard', 'Jennifer', 'Charles', 'Linda', 'Thomas', 'Patricia', 'Daniel', 'Barbara'],

    lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'],

    roleTypes: ['Super Admin', 'Admin', 'Manager', 'Editor', 'Viewer', 'Contributor', 'Guest'],

    // Statistics
    stats: {
        usersCreated: 0,
        usersFailed: 0,
        groupsCreated: 0,
        groupsFailed: 0,
        rolesCreated: 0,
        rolesFailed: 0
    },

    // Generate random name
    generateName() {
        const firstName = this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
        const lastName = this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
        return `${firstName} ${lastName}`;
    },

    // Generate email
    generateEmail(name) {
        const cleanName = name.toLowerCase().replace(/\s+/g, '.');
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `${cleanName}.${timestamp}.${random}@testdata.com`;
    },

    // Generate random status
    generateStatus() {
        return Math.random() > 0.2 ? 'active' : 'inactive';
    },

    // Generate random role
    generateRole() {
        return this.roleTypes[Math.floor(Math.random() * this.roleTypes.length)];
    },

    // Reset stats
    resetStats() {
        this.stats = {
            usersCreated: 0,
            usersFailed: 0,
            groupsCreated: 0,
            groupsFailed: 0,
            rolesCreated: 0,
            rolesFailed: 0
        };
    },

    // Generate single user
    async createSingleUser(index, total) {
        const firstName = this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
        const lastName = this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
        const name = `${firstName} ${lastName}`;
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);

        const userData = {
            username: `${firstName.toLowerCase()}${timestamp}`,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${timestamp}.${random}@admin.com`,
            password: 'Password123!',
            first_name: firstName,
            last_name: lastName,
            role: this.generateRole().toLowerCase().replace(/\s+/g, '_'),
            active: this.generateStatus() === 'active' ? 'true' : 'false'
        };

        try {
            console.log(`[${index + 1}/${total}] Creating: ${name} `);
            const result = await ApiService.createUser(userData);
            this.stats.usersCreated++;
            console.log(`✓ Success: ${name}`);
            return { success: true, data: result };
        } catch (error) {
            this.stats.usersFailed++;
            console.error(`✗ Failed: ${name} - ${error.message}`);
            return { success: false, error: error.message, userData };
        }
    },

    // Generate users with better control
    async generateUsers(count, options = {}) {
        const {
            batchSize = 5,
            delayBetweenBatches = 1000,
            onProgress = null
        } = options;

        console.log(`\n=== Generating ${count} Users ===`);
        console.log(`Batch size: ${batchSize}, Delay: ${delayBetweenBatches}ms`);

        const results = {
            successful: [],
            failed: []
        };

        for (let i = 0; i < count; i += batchSize) {
            const batchEnd = Math.min(i + batchSize, count);
            const batchPromises = [];

            // Create batch
            for (let j = i; j < batchEnd; j++) {
                batchPromises.push(this.createSingleUser(j, count));
            }

            // Wait for batch to complete
            const batchResults = await Promise.all(batchPromises);

            // Process results
            batchResults.forEach(result => {
                if (result.success) {
                    results.successful.push(result.data);
                } else {
                    results.failed.push(result);
                }
            });

            // Update progress
            if (onProgress) {
                onProgress({
                    current: batchEnd,
                    total: count,
                    successful: results.successful.length,
                    failed: results.failed.length,
                    percentage: (batchEnd / count) * 100
                });
            }

            // Delay between batches
            if (batchEnd < count) {
                console.log(`Batch ${Math.floor(i / batchSize) + 1} complete. Waiting ${delayBetweenBatches}ms...`);
                await this.delay(delayBetweenBatches);
            }
        }

        console.log(`\n✓ User generation complete:`);
        console.log(`  Success: ${results.successful.length}`);
        console.log(`  Failed: ${results.failed.length}`);

        if (results.failed.length > 0) {
            console.log(`\nFirst few errors:`);
            results.failed.slice(0, 5).forEach(fail => {
                console.log(`  - ${fail.userData.name}: ${fail.error}`);
            });
        }

        return results;
    },

    // Generate single group
    async createSingleGroup(name, description) {
        const machineName = name.toLowerCase().replace(/\s+/g, '_');
        const groupData = {
            name: name,
            machine_name: machineName,
            description: description
        };

        try {
            console.log(`Creating group: ${groupData.name}`);
            const result = await ApiService.createGroup(groupData);
            this.stats.groupsCreated++;
            console.log(`✓ Created: ${groupData.name}`);
            return { success: true, data: result };
        } catch (error) {
            this.stats.groupsFailed++;
            console.error(`✗ Failed: ${groupData.name} - ${error.message}`);
            return { success: false, error: error.message, groupData };
        }
    },

    // Generate groups
    async generateGroups(count, onProgress = null) {
        console.log(`\n=== Generating ${count} Groups ===`);

        const groupNames = [
            'Administrators', 'Developers', 'Designers', 'Project Managers',
            'QA Team', 'DevOps', 'Data Analysts', 'Sales Team',
            'Marketing Team', 'HR Department', 'Finance Department',
            'Customer Support', 'Leadership', 'Interns', 'Contractors'
        ];

        const results = {
            successful: [],
            failed: []
        };

        for (let i = 0; i < count; i++) {
            const name = i < groupNames.length
                ? groupNames[i]
                : `Team ${i + 1}`;

            const result = await this.createSingleGroup(name, `Description for ${name}`);

            if (result.success) {
                results.successful.push(result.data);
            } else {
                results.failed.push(result);
            }

            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total: count,
                    successful: results.successful.length,
                    failed: results.failed.length,
                    percentage: ((i + 1) / count) * 100
                });
            }

            // Small delay
            if (i < count - 1) {
                await this.delay(200);
            }
        }

        console.log(`\n✓ Group generation complete:`);
        console.log(`  Success: ${results.successful.length}`);
        console.log(`  Failed: ${results.failed.length}`);

        return results;
    },

    // Generate single role
    async createSingleRole(roleData) {
        try {
            console.log(`Creating role: ${roleData.name}`);
            // API expects role_name field
            const apiData = {
                role_name: roleData.name.toLowerCase().replace(/\s+/g, '_')
            };
            const result = await ApiService.createRole(apiData);
            this.stats.rolesCreated++;
            console.log(`✓ Created: ${roleData.name}`);
            return { success: true, data: result };
        } catch (error) {
            this.stats.rolesFailed++;
            console.error(`✗ Failed: ${roleData.name} - ${error.message}`);
            return { success: false, error: error.message, roleData };
        }
    },

    // Generate predefined roles
    async generateRoles(onProgress = null) {
        console.log(`\n=== Generating Roles ===`);

        const predefinedRoles = [
            { name: 'Super Admin', permissions: ['read', 'write', 'delete', 'admin'] },
            { name: 'Admin', permissions: ['read', 'write', 'delete'] },
            { name: 'Manager', permissions: ['read', 'write'] },
            { name: 'Editor', permissions: ['read', 'write'] },
            { name: 'Viewer', permissions: ['read'] },
            { name: 'Contributor', permissions: ['read', 'write'] },
            { name: 'Guest', permissions: ['read'] }
        ];

        const results = {
            successful: [],
            failed: []
        };

        for (let i = 0; i < predefinedRoles.length; i++) {
            const roleData = {
                name: predefinedRoles[i].name,
                description: `${predefinedRoles[i].name} role`,
                permissions: predefinedRoles[i].permissions,
                status: 'active'
            };

            const result = await this.createSingleRole(roleData);

            if (result.success) {
                results.successful.push(result.data);
            } else {
                results.failed.push(result);
            }

            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total: predefinedRoles.length,
                    successful: results.successful.length,
                    failed: results.failed.length,
                    percentage: ((i + 1) / predefinedRoles.length) * 100
                });
            }

            await this.delay(200);
        }

        console.log(`\n✓ Role generation complete:`);
        console.log(`  Success: ${results.successful.length}`);
        console.log(`  Failed: ${results.failed.length}`);

        return results;
    },

    // Generate all data
    async generateAll(userCount, groupCount, options = {}) {
        console.log('\n╔════════════════════════════════════╗');
        console.log('║   Test Data Generation Started     ║');
        console.log('╚════════════════════════════════════╝');
        console.log(`\nTarget: ${userCount} users, ${groupCount} groups, 7 roles`);

        this.resetStats();

        const results = {
            roles: null,
            groups: null,
            users: null
        };

        try {
            // Phase 1: Roles
            console.log('\n📊 Phase 1/3: Creating Roles...');
            results.roles = await this.generateRoles(options.onRolesProgress);

            // Phase 2: Groups
            console.log('\n👥 Phase 2/3: Creating Groups...');
            results.groups = await this.generateGroups(groupCount, options.onGroupsProgress);

            // Phase 3: Users
            console.log('\n🧑‍💼 Phase 3/3: Creating Users...');
            results.users = await this.generateUsers(userCount, {
                batchSize: options.userBatchSize || 5,
                delayBetweenBatches: options.delayBetweenBatches || 1000,
                onProgress: options.onUsersProgress
            });

            // Final summary
            console.log('\n╔════════════════════════════════════╗');
            console.log('║     Generation Complete! 🎉        ║');
            console.log('╚════════════════════════════════════╝');
            console.log(`\n📊 Final Statistics:`);
            console.log(`   Roles:  ${this.stats.rolesCreated} ✓  ${this.stats.rolesFailed} ✗`);
            console.log(`   Groups: ${this.stats.groupsCreated} ✓  ${this.stats.groupsFailed} ✗`);
            console.log(`   Users:  ${this.stats.usersCreated} ✓  ${this.stats.usersFailed} ✗`);

            return results;
        } catch (error) {
            console.error('\n✗ Generation failed:', error);
            throw error;
        }
    },

    // Helper delay
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
