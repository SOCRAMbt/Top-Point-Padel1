const cron = require('node-cron');
const Reservation = require('../models/Reservation');
const Waitlist = require('../models/Waitlist');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const { Op } = require('sequelize');

module.exports = function startCronJobs() {
    console.log('⏰ Cron jobs initialized');

    // 1. Reminders (Every 5 mins)
    cron.schedule('*/5 * * * *', async () => {
        try {
            const now = new Date();
            // Start range: now + 25 mins, End range: now + 35 mins (target 30 mins)
            const startRange = new Date(now.getTime() + 25 * 60000);
            const endRange = new Date(now.getTime() + 35 * 60000);

            // We need to query reservations by constructing Date from `date` + `start_time`
            // This is database specific and hard with `findAll`.
            // Easier: Fetch reservations for TODAY that are confirmed. AND filter in memory.
            // Or assume `date` is YYYY-MM-DD.

            const todayStr = now.toISOString().split('T')[0];
            const reservations = await Reservation.findAll({
                where: {
                    date: todayStr,
                    status: 'confirmed'
                },
                include: [User]
            });

            for (const r of reservations) {
                // Construct DateTime
                const [h, m, s] = r.start_time.split(':').map(Number);
                const rDate = new Date(r.date); // Sets to midnight UTC usually
                // Safe way: parse date string + start_time
                const slotTime = new Date(`${r.date}T${r.start_time}`);

                // Adjust if timezone issues, but assuming local consistent strings:
                if (slotTime >= startRange && slotTime <= endRange) {
                    // Check if User synced calendar
                    if (!r.User.calendar_synced) {
                        console.log(`[REMINDER] Sending to ${r.User.email}`);
                        await notificationService.sendReminder(r, r.User);
                    }
                }
            }
        } catch (error) {
            console.error('Cron error (reminders):', error);
        }
    });

    // 2. Waitlist Rotation (Every 1 min)
    cron.schedule('* * * * *', async () => {
        try {
            // Find EXPIRED notifications
            const expireditems = await Waitlist.findAll({
                where: {
                    status: 'notified',
                    expires_at: { [Op.lt]: new Date() }
                }
            });

            for (const item of expireditems) {
                item.status = 'expired';
                await item.save();

                // Find NEXT person
                // ... Logic to find next in line for same date/time
                const nextInLine = await Waitlist.findOne({
                    where: {
                        date: item.date,
                        start_time: item.start_time,
                        status: 'waiting'
                    },
                    order: [['createdAt', 'ASC']],
                    include: [User]
                });

                if (nextInLine) {
                    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
                    nextInLine.status = 'notified';
                    nextInLine.notified_at = new Date();
                    nextInLine.expires_at = expiresAt;
                    // generate unique token if needed for link
                    await nextInLine.save();

                    const url = `${process.env.CLIENT_URL}/booking/confirm?waitlistId=${nextInLine.id}`;
                    await notificationService.sendWaitlistNotification(nextInLine.User, url);
                }
            }
        } catch (error) {
            console.error('Cron error (waitlist):', error);
        }
    });
};
