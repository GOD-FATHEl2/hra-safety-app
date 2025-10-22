#!/usr/bin/env node

/**
 * HRA User Management Script
 * Quick tool for managing users and roles in the HRA application
 */

const sqlite3 = require('sqlite3').verbose();
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const db = new sqlite3.Database('./hogrisk.db', (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to HRA database');
});

const roles = ['underhall', 'supervisor', 'superintendent', 'arbetsledare', 'admin'];

function showMenu() {
    console.log('\n🔐 HRA User Management Tool');
    console.log('===============================');
    console.log('1. View all users');
    console.log('2. Create new user');
    console.log('3. Update user role');
    console.log('4. Delete user');
    console.log('5. View users by role');
    console.log('6. Create sample users');
    console.log('7. Exit');
    console.log('===============================');
}

function viewAllUsers() {
    console.log('\n📋 All Users:');
    db.all('SELECT username, role, created_at FROM users ORDER BY role, username', (err, rows) => {
        if (err) {
            console.error('❌ Error:', err.message);
        } else {
            console.table(rows);
        }
        showMenu();
        askForChoice();
    });
}

function createUser() {
    rl.question('Enter username: ', (username) => {
        rl.question('Enter temporary password: ', (password) => {
            console.log('\nAvailable roles:');
            roles.forEach((role, index) => {
                console.log(`${index + 1}. ${role}`);
            });
            rl.question('Select role (1-5): ', (roleChoice) => {
                const roleIndex = parseInt(roleChoice) - 1;
                if (roleIndex >= 0 && roleIndex < roles.length) {
                    const role = roles[roleIndex];
                    
                    db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
                        [username, password, role], function(err) {
                        if (err) {
                            console.error('❌ Error creating user:', err.message);
                        } else {
                            console.log(`✅ User created: ${username} with role: ${role}`);
                        }
                        showMenu();
                        askForChoice();
                    });
                } else {
                    console.log('❌ Invalid role selection');
                    showMenu();
                    askForChoice();
                }
            });
        });
    });
}

function updateUserRole() {
    rl.question('Enter username to update: ', (username) => {
        console.log('\nAvailable roles:');
        roles.forEach((role, index) => {
            console.log(`${index + 1}. ${role}`);
        });
        rl.question('Select new role (1-5): ', (roleChoice) => {
            const roleIndex = parseInt(roleChoice) - 1;
            if (roleIndex >= 0 && roleIndex < roles.length) {
                const role = roles[roleIndex];
                
                db.run('UPDATE users SET role = ? WHERE username = ?', 
                    [role, username], function(err) {
                    if (err) {
                        console.error('❌ Error updating user:', err.message);
                    } else if (this.changes === 0) {
                        console.log('❌ User not found');
                    } else {
                        console.log(`✅ User ${username} updated to role: ${role}`);
                    }
                    showMenu();
                    askForChoice();
                });
            } else {
                console.log('❌ Invalid role selection');
                showMenu();
                askForChoice();
            }
        });
    });
}

function deleteUser() {
    rl.question('Enter username to delete: ', (username) => {
        rl.question(`Are you sure you want to delete user "${username}"? (yes/no): `, (confirm) => {
            if (confirm.toLowerCase() === 'yes') {
                db.run('DELETE FROM users WHERE username = ?', [username], function(err) {
                    if (err) {
                        console.error('❌ Error deleting user:', err.message);
                    } else if (this.changes === 0) {
                        console.log('❌ User not found');
                    } else {
                        console.log(`✅ User ${username} deleted`);
                    }
                    showMenu();
                    askForChoice();
                });
            } else {
                console.log('❌ Deletion cancelled');
                showMenu();
                askForChoice();
            }
        });
    });
}

function viewUsersByRole() {
    console.log('\nSelect role to view:');
    roles.forEach((role, index) => {
        console.log(`${index + 1}. ${role}`);
    });
    rl.question('Select role (1-5): ', (roleChoice) => {
        const roleIndex = parseInt(roleChoice) - 1;
        if (roleIndex >= 0 && roleIndex < roles.length) {
            const role = roles[roleIndex];
            
            db.all('SELECT username, created_at FROM users WHERE role = ? ORDER BY username', 
                [role], (err, rows) => {
                if (err) {
                    console.error('❌ Error:', err.message);
                } else {
                    console.log(`\n👥 Users with role "${role}":`);
                    console.table(rows);
                }
                showMenu();
                askForChoice();
            });
        } else {
            console.log('❌ Invalid role selection');
            showMenu();
            askForChoice();
        }
    });
}

function createSampleUsers() {
    const sampleUsers = [
        { username: 'admin.test', password: 'admin123', role: 'admin' },
        { username: 'supervisor.test', password: 'temp123', role: 'supervisor' },
        { username: 'superintendent.test', password: 'temp123', role: 'superintendent' },
        { username: 'arbetsledare.test', password: 'temp123', role: 'arbetsledare' },
        { username: 'underhall.test', password: 'temp123', role: 'underhall' },
    ];

    console.log('\n🔧 Creating sample users...');
    
    let completed = 0;
    sampleUsers.forEach(user => {
        db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
            [user.username, user.password, user.role], function(err) {
            completed++;
            if (err) {
                console.log(`❌ Error creating ${user.username}: ${err.message}`);
            } else {
                console.log(`✅ Created: ${user.username} (${user.role})`);
            }
            
            if (completed === sampleUsers.length) {
                console.log('\n✅ Sample users creation complete!');
                showMenu();
                askForChoice();
            }
        });
    });
}

function askForChoice() {
    rl.question('\nEnter your choice (1-7): ', (choice) => {
        switch(choice) {
            case '1':
                viewAllUsers();
                break;
            case '2':
                createUser();
                break;
            case '3':
                updateUserRole();
                break;
            case '4':
                deleteUser();
                break;
            case '5':
                viewUsersByRole();
                break;
            case '6':
                createSampleUsers();
                break;
            case '7':
                console.log('👋 Goodbye!');
                db.close();
                rl.close();
                process.exit(0);
                break;
            default:
                console.log('❌ Invalid choice. Please enter 1-7.');
                showMenu();
                askForChoice();
        }
    });
}

// Start the application
console.log('🚀 Starting HRA User Management Tool...');
showMenu();
askForChoice();