const User = require('./src/models/User');
const sequelize = require('./src/config/database');
const fs = require('fs');

function log(msg) {
    fs.appendFileSync('db_log.txt', msg + '\n');
}

async function checkUsers() {
    try {
        if (fs.existsSync('db_log.txt')) fs.unlinkSync('db_log.txt');
        await sequelize.authenticate();
        const users = await User.findAll();

        log('--- DIAGNÓSTICO DE USUARIOS ---');
        if (users.length === 0) {
            log('❌ No hay usuarios en la DB.');
        }

        users.forEach(u => {
            log(`Usuario: ${u.email || u.phone}`);
            log(`  - Calendar Synced: ${u.calendar_synced}`);
            log(`  - Has Refresh Token: ${!!u.refresh_token}`);
            if (u.refresh_token) {
                log(`  - Token Length: ${u.refresh_token.length}`);
                log(`  - Token Preview: ${u.refresh_token.substring(0, 10)}...`);
            } else {
                log('  - ❌ TOKEN MISSING');
            }
        });
        log('-------------------------------');
        process.exit();
    } catch (e) {
        log('ERROR: ' + e.toString());
        process.exit(1);
    }
}

checkUsers();
