// Check database schema
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./hogrisk.db', (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to HRA database');
});

// Check the users table schema
db.all("PRAGMA table_info(users)", (err, rows) => {
    if (err) {
        console.error('❌ Error getting table info:', err.message);
    } else {
        console.log('📋 Users table schema:');
        console.table(rows);
    }
    
    // Also check if there are any existing users
    db.all("SELECT * FROM users LIMIT 5", (err, rows) => {
        if (err) {
            console.error('❌ Error getting users:', err.message);
        } else {
            console.log('\n👥 Existing users (first 5):');
            console.table(rows);
        }
        db.close();
    });
});