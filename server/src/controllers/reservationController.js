const Reservation = require('../models/Reservation');
const User = require('../models/User');
const Block = require('../models/Block');
const { Op } = require('sequelize');
const paymentService = require('../services/paymentService');

// Helper to check overlap
const checkOverlap = async (date, startTime, endTime, excludeId = null) => {
    // 1. Check existing reservations
    const whereClause = {
        date,
        status: { [Op.notIn]: ['cancelled'] } // confirmed or pending_payment
    };

    if (excludeId) {
        whereClause.id = { [Op.ne]: excludeId };
    }

    const reservations = await Reservation.findAll({
        where: whereClause
    });

    const isReserved = reservations.some(r => {
        // Strict overlap: (StartA < EndB) and (EndA > StartB)
        // Note: Time strings "HH:mm:ss" work with string comparison for same-day
        return (startTime < r.end_time) && (endTime > r.start_time);
    });

    if (isReserved) return { error: 'Horario ocupado por otra reserva' };

    // 2. Check blocks
    const blocks = await Block.findAll({
        where: { date }
    });

    const isBlocked = blocks.some(b => {
        return (startTime < b.end_time) && (endTime > b.start_time);
    });

    if (isBlocked) return { error: 'Horario bloqueado por administración' };

    return null; // Available
};

const suggestNearby = async (date, startTime, duration) => {
    // Determine target total minutes
    const [h, m] = startTime.split(':').map(Number);
    const targetBase = h * 60 + m;
    const dur = parseInt(duration);

    // Search +- 3 hours
    const candidates = [];
    for (let offset = -180; offset <= 180; offset += 30) {
        if (offset === 0) continue;

        const testBase = targetBase + offset;
        if (testBase < 8 * 60 || testBase > 23 * 60) continue; // Operating hours 8-23

        const testH = Math.floor(testBase / 60);
        const testM = testBase % 60;

        const testStart = `${String(testH).padStart(2, '0')}:${String(testM).padStart(2, '0')}:00`;
        const testEndH = Math.floor((testBase + dur) / 60);
        const testEndM = (testBase + dur) % 60;
        const testEnd = `${String(testEndH).padStart(2, '0')}:${String(testEndM).padStart(2, '0')}:00`;

        const collision = await checkOverlap(date, testStart, testEnd);
        if (!collision) {
            candidates.push(testStart.substring(0, 5));
        }
        if (candidates.length >= 3) break;
    }
    return candidates;
};

exports.checkAvailability = async (req, res) => {
    try {
        const { date, startTime, duration } = req.query; // duration: 60 or 90
        if (!date || !startTime || !duration) return res.status(400).json({ error: 'Datos incompletos' });

        // Calculate end time
        const [hours, minutes] = startTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + parseInt(duration);
        const endHours = Math.floor(totalMinutes / 60);
        const endMins = totalMinutes % 60;
        const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}:00`;
        const startTimeFormatted = `${startTime}:00`;

        const collision = await checkOverlap(date, startTimeFormatted, endTime);
        if (collision) {
            const suggestions = await suggestNearby(date, startTimeFormatted, duration);
            return res.json({ available: false, message: collision.error, suggestions });
        }

        res.json({ available: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getReservations = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        const whereClause = {
            status: { [Op.ne]: 'cancelled' }
        };

        if (start_date && end_date) {
            whereClause.date = { [Op.between]: [start_date, end_date] };
        }

        const reservations = await Reservation.findAll({
            where: whereClause,
            include: [{ model: User, attributes: ['full_name', 'email', 'phone'] }],
            order: [['date', 'ASC'], ['start_time', 'ASC']]
        });
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createReservation = async (req, res) => {
    try {
        const { date, start_time, duration, payment_method } = req.body;
        console.log('📝 Create Reservation Request:', { body: req.body, user: req.user });

        const user = req.user;

        if (!user || !user.id) {
            console.error('❌ User not authenticated in createReservation');
            return res.status(401).json({ error: 'Usuario no autenticado (Sesión inválida)' });
        }

        // Validation
        if (![60, 90].includes(parseInt(duration))) {
            return res.status(400).json({ error: 'Duración inválida (60 o 90 min)' });
        }

        // Calculate end time
        const [hours, minutes] = start_time.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + parseInt(duration);
        const endHours = Math.floor(totalMinutes / 60);
        const endMins = totalMinutes % 60;
        const end_time = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}:00`;
        const formattedStartTime = `${start_time}:00`;

        // Anti-overlap
        console.log('Checking overlap for:', { date, formattedStartTime, end_time });
        const collision = await checkOverlap(date, formattedStartTime, end_time);
        if (collision) {
            console.log('Collision detected:', collision);
            return res.status(400).json({ error: collision.error });
        }

        // Calculate Price (Get from Setting or hardcode for now/MVP)
        // Assume base price calculation here.
        let price = 0;
        // Logic to get price... simplified:
        price = parseInt(duration) === 60 ? 20000 : 30000; // Example placeholder

        // Create Reservation
        const reservation = await Reservation.create({
            date,
            start_time: formattedStartTime,
            end_time,
            duration: parseInt(duration),
            status: 'pending_payment',
            payment_method,
            total_price: price,
            user_id: user.id
        });

        // Handle Payment
        if (payment_method === 'mercadopago') {
            const preference = await paymentService.createPreference(reservation, user);
            reservation.mp_preference_id = preference.id;

            // FIX: Auto-confirm in Dev Mode because local webhooks don't work for Real MP
            // This allows testing the Calendar Sync flow without deploying to a public server
            const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
            const isMock = preference.init_point && preference.init_point.includes('mock=true');

            if (isMock || isDev) {
                if (isDev && !isMock) {
                    console.log('⚠️ Dev Mode: Auto-confirming Real MP reservation (No Webhooks locally)');
                }

                reservation.status = 'confirmed';
                await reservation.save();

                // Sync with Google Calendar
                try {
                    const googleCalendarService = require('../services/googleCalendarService');
                    const event = await googleCalendarService.createEvent(reservation);
                    console.log('📅 Calendar sync result:', event ? 'Success' : 'Skipped/Failed');
                } catch (calErr) {
                    console.error('Calendar Sync Error:', calErr.message);
                }

                return res.json({ reservation, init_point: preference.init_point });
            }

            await reservation.save();
            return res.json({ reservation, init_point: preference.init_point });
        } else if (payment_method === 'manual') {
            // Send email details?
            return res.json({ reservation, message: 'Reserva creada. Esperando pago manual.' });
        }

        res.status(400).json({ error: 'Método de pago inválido' });

    } catch (error) {
        console.error('❌ Error creating reservation:', error);
        res.status(500).json({ error: 'Error interno al crear reserva: ' + error.message, details: error.toString() });
    }
};

exports.cancelReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const reservation = await Reservation.findByPk(id);

        if (!reservation) return res.status(404).json({ error: 'Reserva no encontrada' });

        if (req.user.role !== 'admin' && req.user.id !== reservation.user_id) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        reservation.status = 'cancelled';
        await reservation.save();

        // TODO: Handle refund logics if paid (manual or automatic)

        res.json({ message: 'Reserva cancelada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getStats = async (req, res) => {
    try {
        const now = new Date();
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // 1. Basic Counts & Revenue (Current Month)
        const thisMonthReservations = await Reservation.findAll({
            where: {
                date: { [Op.between]: [startOfCurrentMonth.toISOString().split('T')[0], endOfCurrentMonth.toISOString().split('T')[0]] },
                status: ['confirmed', 'paid', 'completed']
            },
            include: [{ model: User, attributes: ['email', 'full_name'] }]
        });

        const thisMonthRevenue = thisMonthReservations.reduce((sum, r) => sum + Number(r.total_price || 0), 0);
        const totalHours = thisMonthReservations.reduce((sum, r) => sum + (r.duration || 60) / 60, 0);

        // 2. Last Month for Growth Calculation
        const lastMonthReservations = await Reservation.findAll({
            where: {
                date: { [Op.between]: [startOfLastMonth.toISOString().split('T')[0], endOfLastMonth.toISOString().split('T')[0]] },
                status: ['confirmed', 'paid', 'completed']
            }
        });
        const lastMonthRevenue = lastMonthReservations.reduce((sum, r) => sum + Number(r.total_price || 0), 0);

        const revenueGrowth = lastMonthRevenue > 0
            ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
            : 100;

        // 3. Unique Users & ARPU
        const uniqueUsers = new Set(thisMonthReservations.map(r => r.user_id)).size;
        const arpu = uniqueUsers > 0 ? (thisMonthRevenue / uniqueUsers).toFixed(0) : 0;

        // 4. Cancellation Rate (All time or recent?) -> Let's do last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentReservations = await Reservation.findAll({
            where: {
                date: { [Op.gte]: thirtyDaysAgo.toISOString().split('T')[0] }
            },
            include: [{ model: User, attributes: ['email', 'full_name'] }]
        });

        const cancelledCount = recentReservations.filter(r => r.status === 'cancelled').length;
        const cancellationRate = recentReservations.length > 0
            ? ((cancelledCount / recentReservations.length) * 100).toFixed(1)
            : 0;

        // 5. Occupancy By Hour & Day (Last 30 days)
        const byHour = {};
        for (let h = 8; h < 23; h++) {
            byHour[h] = { hour: `${h}:00`, count: 0, revenue: 0 };
        }

        const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const byDay = DAYS.map(d => ({ day: d, count: 0, revenue: 0 })); // 0-6 index

        // Use confirmed reservations from last 30 days
        const successfulRecent = recentReservations.filter(r => ['confirmed', 'paid', 'completed'].includes(r.status));

        successfulRecent.forEach(r => {
            // Hour
            const hour = parseInt(r.start_time.split(':')[0]);
            if (byHour[hour]) {
                byHour[hour].count++;
                byHour[hour].revenue += Number(r.total_price || 0);
            }

            // Day of week
            // date string YYYY-MM-DD to day index. Note: manual parsing to avoid timezone offset issues recommended
            const [y, m, d] = r.date.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            const dayIndex = dateObj.getDay(); // 0 is Sunday

            if (byDay[dayIndex]) {
                byDay[dayIndex].count++;
                byDay[dayIndex].revenue += Number(r.total_price || 0);
            }
        });

        // 6. Revenue By Day (For Area Chart - Last 30 days)
        const revenueByDayMap = {};
        successfulRecent.forEach(r => {
            const d = r.date; // YYYY-MM-DD
            revenueByDayMap[d] = (revenueByDayMap[d] || 0) + Number(r.total_price || 0);
        });

        // Fill dates
        const revenueByDay = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const displayDate = `${d.getDate()}/${d.getMonth() + 1}`;

            revenueByDay.push({
                date: displayDate,
                fullDate: dateStr,
                revenue: revenueByDayMap[dateStr] || 0
            });
        }

        // 7. Top Customers
        const userSpend = {};
        successfulRecent.forEach(r => {
            const email = r.User ? r.User.email : 'unknown';
            const name = r.User ? (r.User.full_name || r.User.email) : 'Unknown';

            if (!userSpend[email]) {
                userSpend[email] = {
                    email: email,
                    name: name,
                    count: 0,
                    total: 0,
                    hours: 0
                };
            }
            const u = userSpend[email];
            u.count++;
            u.total += Number(r.total_price || 0);
            u.hours += (r.duration || 60) / 60;
        });

        const topCustomers = Object.values(userSpend)
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        // 8. Waitlist stats (Mocked or real if Waitlist model populates)
        // const waitlistCount = await Waitlist.count({ where: { status: 'waiting' } });
        // const waitlistConverted = await Waitlist.count({ where: { status: 'converted' } });
        const avgWaitlistSize = 0; // Replace with DB call
        const waitlistConversion = 0;

        // 9. Payment Methods
        const paymentMethods = {};
        successfulRecent.forEach(r => {
            const m = r.payment_method || 'unknown';
            paymentMethods[m] = (paymentMethods[m] || 0) + 1;
        });

        // 10. Avg Lead Time
        // created_at vs date
        let totalLeadDays = 0;
        let leadCount = 0;
        successfulRecent.forEach(r => {
            const created = new Date(r.createdAt);
            const [y, m, d] = r.date.split('-').map(Number);
            const booking = new Date(y, m - 1, d);
            const diffTime = Math.abs(booking - created);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            totalLeadDays += diffDays;
            leadCount++;
        });
        const avgLeadTime = leadCount > 0 ? (totalLeadDays / leadCount).toFixed(1) : 0;

        // Peak Hours
        const peakHours = Object.values(byHour)
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

        res.json({
            thisMonthRevenue,
            revenueGrowth,
            totalHours,
            uniqueUsers,
            cancellationRate,
            occupancyByHour: Object.values(byHour),
            occupancyByDay: byDay,
            revenueByDay,
            topCustomers,
            avgLeadTime,
            paymentMethods,
            avgWaitlistSize,
            waitlistConversion,
            arpu,
            peakHours,
            thisMonthReservations: thisMonthReservations.length
        });

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Error calculating stats' });
    }
};
