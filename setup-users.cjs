// HRA Users Setup Script - Creates complete user structure
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./hogrisk.db', (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to HRA database');
});

// Complete user structure for Volvo Cars HRA system
const users = [
    // System Administrators
    { username: 'admin.main', passhash: 'admin123', name: 'Main Administrator', role: 'admin', description: 'Main system administrator' },
    { username: 'admin.safety', passhash: 'safety123', name: 'Safety Administrator', role: 'admin', description: 'Safety department admin' },
    { username: 'admin.it', passhash: 'it123', name: 'IT Administrator', role: 'admin', description: 'IT department admin' },
    
    // Superintendents (Department/Area Managers)
    { username: 'super.production', passhash: 'prod123', name: 'Production Superintendent', role: 'superintendent', description: 'Production superintendent' },
    { username: 'super.maintenance', passhash: 'maint123', name: 'Maintenance Superintendent', role: 'superintendent', description: 'Maintenance superintendent' },
    { username: 'super.quality', passhash: 'qual123', name: 'Quality Superintendent', role: 'superintendent', description: 'Quality superintendent' },
    { username: 'super.logistics', passhash: 'log123', name: 'Logistics Superintendent', role: 'superintendent', description: 'Logistics superintendent' },
    
    // Work Leaders (Arbetsledare) - Shift coordinators
    { username: 'workleader.day', passhash: 'day123', name: 'Day Shift Leader', role: 'arbetsledare', description: 'Day shift work leader' },
    { username: 'workleader.evening', passhash: 'eve123', name: 'Evening Shift Leader', role: 'arbetsledare', description: 'Evening shift work leader' },
    { username: 'workleader.night', passhash: 'night123', name: 'Night Shift Leader', role: 'arbetsledare', description: 'Night shift work leader' },
    { username: 'workleader.weekend', passhash: 'week123', name: 'Weekend Shift Leader', role: 'arbetsledare', description: 'Weekend shift work leader' },
    
    // Supervisors (Line managers/Team leaders)
    { username: 'supervisor.bodyshop', passhash: 'body123', name: 'Body Shop Supervisor', role: 'supervisor', description: 'Body shop supervisor' },
    { username: 'supervisor.paintshop', passhash: 'paint123', name: 'Paint Shop Supervisor', role: 'supervisor', description: 'Paint shop supervisor' },
    { username: 'supervisor.assembly1', passhash: 'asm1123', name: 'Assembly 1 Supervisor', role: 'supervisor', description: 'Assembly line 1 supervisor' },
    { username: 'supervisor.assembly2', passhash: 'asm2123', name: 'Assembly 2 Supervisor', role: 'supervisor', description: 'Assembly line 2 supervisor' },
    { username: 'supervisor.engine', passhash: 'eng123', name: 'Engine Shop Supervisor', role: 'supervisor', description: 'Engine shop supervisor' },
    { username: 'supervisor.logistics', passhash: 'log123', name: 'Logistics Supervisor', role: 'supervisor', description: 'Logistics supervisor' },
    { username: 'supervisor.quality', passhash: 'qual123', name: 'Quality Supervisor', role: 'supervisor', description: 'Quality control supervisor' },
    { username: 'supervisor.maintenance', passhash: 'maint123', name: 'Maintenance Supervisor', role: 'supervisor', description: 'Maintenance supervisor' },
    
    // Underhåll (Maintenance staff)
    { username: 'erik.larsson', passhash: 'erik123', name: 'Erik Larsson', role: 'underhall', description: 'Maintenance technician - Electrical' },
    { username: 'anna.andersson', passhash: 'anna123', name: 'Anna Andersson', role: 'underhall', description: 'Maintenance technician - Mechanical' },
    { username: 'lars.nilsson', passhash: 'lars123', name: 'Lars Nilsson', role: 'underhall', description: 'Maintenance technician - Hydraulics' },
    { username: 'maria.berg', passhash: 'maria123', name: 'Maria Berg', role: 'underhall', description: 'Maintenance technician - Pneumatics' },
    { username: 'johan.lindqvist', passhash: 'johan123', name: 'Johan Lindqvist', role: 'underhall', description: 'Maintenance technician - Robotics' },
    { username: 'petra.karlsson', passhash: 'petra123', name: 'Petra Karlsson', role: 'underhall', description: 'Maintenance technician - Welding' },
    { username: 'mikael.svensson', passhash: 'mike123', name: 'Mikael Svensson', role: 'underhall', description: 'Maintenance technician - Paint systems' },
    { username: 'christina.persson', passhash: 'chris123', name: 'Christina Persson', role: 'underhall', description: 'Maintenance technician - Assembly tools' },
    { username: 'stefan.olsson', passhash: 'stefan123', name: 'Stefan Olsson', role: 'underhall', description: 'Maintenance technician - Conveyors' },
    { username: 'lena.gustafsson', passhash: 'lena123', name: 'Lena Gustafsson', role: 'underhall', description: 'Maintenance technician - HVAC' },
    { username: 'robert.holm', passhash: 'robert123', name: 'Robert Holm', role: 'underhall', description: 'Maintenance technician - Safety systems' },
    { username: 'ingrid.danielsson', passhash: 'ingrid123', name: 'Ingrid Danielsson', role: 'underhall', description: 'Maintenance technician - Fire safety' },
    { username: 'tommy.engstrom', passhash: 'tommy123', name: 'Tommy Engström', role: 'underhall', description: 'Maintenance technician - Compressed air' },
    { username: 'helena.lundberg', passhash: 'helena123', name: 'Helena Lundberg', role: 'underhall', description: 'Maintenance technician - Water systems' },
    { username: 'anders.westberg', passhash: 'anders123', name: 'Anders Westberg', role: 'underhall', description: 'Maintenance technician - Power systems' }
];

function createUsers() {
    console.log('🔧 Creating complete user structure for HRA system...\n');
    
    let completed = 0;
    let created = 0;
    let skipped = 0;
    
    // Group users by role for better output
    const roleGroups = {
        admin: [],
        superintendent: [],
        arbetsledare: [],
        supervisor: [],
        underhall: []
    };
    
    users.forEach(user => {
        db.run('INSERT INTO users (username, passhash, name, role, active, created_at) VALUES (?, ?, ?, ?, 1, datetime("now"))', 
            [user.username, user.passhash, user.name, user.role], function(err) {
            completed++;
            
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    console.log(`⚠️  User already exists: ${user.username}`);
                    skipped++;
                } else {
                    console.log(`❌ Error creating ${user.username}: ${err.message}`);
                }
            } else {
                console.log(`✅ Created: ${user.username} (${user.role}) - ${user.description}`);
                created++;
                roleGroups[user.role].push(user);
            }
            
            if (completed === users.length) {
                console.log('\n' + '='.repeat(80));
                console.log('🎯 USER CREATION SUMMARY');
                console.log('='.repeat(80));
                console.log(`✅ Successfully created: ${created} users`);
                console.log(`⚠️  Already existed: ${skipped} users`);
                console.log(`📊 Total attempted: ${users.length} users\n`);
                
                // Show role distribution
                console.log('👥 ROLE DISTRIBUTION:');
                console.log('='.repeat(40));
                Object.keys(roleGroups).forEach(role => {
                    const count = roleGroups[role].length;
                    if (count > 0) {
                        console.log(`${role.toUpperCase()}: ${count} users`);
                    }
                });
                
                // Show login credentials for testing
                console.log('\n🔐 QUICK TEST LOGINS:');
                console.log('='.repeat(40));
                console.log('Admin access: admin.main / admin123');
                console.log('Supervisor: supervisor.bodyshop / body123');
                console.log('Maintenance: erik.larsson / erik123');
                console.log('Work Leader: workleader.day / day123');
                
                console.log('\n📋 NEXT STEPS:');
                console.log('='.repeat(40));
                console.log('1. Start your HRA server: node server.js');
                console.log('2. Go to: http://localhost:8080');
                console.log('3. Login with any credentials above');
                console.log('4. Test different role permissions');
                console.log('5. Access user management as admin');
                
                db.close();
            }
        });
    });
}

// Check if users table exists first
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
    if (err) {
        console.error('❌ Error checking for users table:', err.message);
        process.exit(1);
    }
    
    if (!row) {
        console.log('❌ Users table does not exist. Please run the server first to create the database schema.');
        process.exit(1);
    }
    
    createUsers();
});