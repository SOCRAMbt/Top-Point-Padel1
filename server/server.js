require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/database');
const User = require('./src/models/User');
const Reservation = require('./src/models/Reservation');
const Block = require('./src/models/Block');
const Setting = require('./src/models/Setting');
const Payment = require('./src/models/Payment');
const Waitlist = require('./src/models/Waitlist');
const AuditLog = require('./src/models/AuditLog');
const startCronJobs = require('./src/jobs/cronJobs');

// Define Associations
User.hasMany(Reservation, { foreignKey: 'user_id' });
Reservation.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Waitlist, { foreignKey: 'user_id' });
Waitlist.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(AuditLog, { foreignKey: 'user_id' });
AuditLog.belongsTo(User, { foreignKey: 'user_id' });

// Reservation belongs to Payment (one payment per reservation usually, or one-to-one)
// Payment has one Reservation
// Reservation.belongsTo(Payment, { foreignKey: 'mp_preference_id', targetKey: 'mp_preference_id' }); // Commented out to prevent FK error during creation before Payment exists

const PORT = process.env.PORT || 5050;

async function startServer() {
    try {
        console.log('Connecting to Database...');
        await sequelize.authenticate();
        console.log('✅ Connected to Database');

        // Sync DB
        // Switched to alter: true to PRESERVE DATA across restarts while updating schema
        await sequelize.sync({ alter: true });
        console.log('✅ Database synchronized');

        startCronJobs();
        console.log('✅ Cron jobs started');

        // Seed Admin if not exists - WRAPPED IN TRY/CATCH to prevent crash
        try {
            const adminEmail = 'admin@tpp.com';
            const admin = await User.findOne({ where: { email: adminEmail } });
            if (!admin) {
                console.log('Seeding admin user...');
                await User.create({
                    email: adminEmail,
                    full_name: 'Admin TPP',
                    role: 'admin',
                    auth_method: 'local',
                    phone: '0000000000'
                });
                console.log('✅ Admin user created');
            } else {
                console.log('ℹ️ Admin user already exists');
            }
        } catch (seedError) {
            console.error('⚠️ Seeding warning:', seedError.message);
            // Do not crash server for seeding error
        }

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n🎾 TPP SERVER RUNNING ON PORT ${PORT}`);
            console.log(`➜ API: http://localhost:${PORT}/api`);
        });

    } catch (error) {
        console.error('❌ Unable to start server:', error);
        // Retry logic or fallback could go here
    }
}

// Global Error Handlers to prevent crash
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err);
});

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err);
});

startServer();
