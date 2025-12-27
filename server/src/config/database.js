const { Sequelize } = require('sequelize');
require('dotenv').config();
const path = require('path');

let sequelize;

if (process.env.DATABASE_URL) {
    // Production (Railway/Render) - PostgreSQL
    console.log('🔄 Database: detected DATABASE_URL, using PostgreSQL');
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // Necessary for most cloud providers
            }
        }
    });
} else {
    // Local Development - SQLite
    console.log('🔄 Database: using SQLite (Local Development)');
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, '../../tpp_v3.sqlite'),
        logging: false
    });
}

module.exports = sequelize;
