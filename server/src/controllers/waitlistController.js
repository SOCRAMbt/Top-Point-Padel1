const Waitlist = require('../models/Waitlist');
const User = require('../models/User');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');

exports.getWaitlist = async (req, res) => {
    try {
        const list = await Waitlist.findAll({
            include: [{ model: User, attributes: ['full_name', 'email'] }],
            order: [['createdAt', 'DESC']]
        });

        // Format for frontend
        const formatted = list.map(item => ({
            id: item.id,
            date: item.date,
            start_time: item.start_time,
            status: item.status,
            created_date: item.createdAt,
            user_name: item.User?.full_name,
            user_email: item.User?.email,
            expires_at: item.expires_at,
            duration: 60 // Default or field if exists
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteEntry = async (req, res) => {
    try {
        await Waitlist.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.notifyUser = async (req, res) => {
    try {
        const item = await Waitlist.findByPk(req.params.id, { include: User });
        if (!item) return res.status(404).json({ error: 'Entry not found' });

        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins to book

        item.status = 'notified';
        item.notified_at = new Date();
        item.expires_at = expiresAt;
        await item.save();

        // Send Email
        const url = `${process.env.CLIENT_URL || 'http://localhost:5173'}/booking/confirm?waitlistId=${item.id}`;
        // Assuming notificationService is available via require
        // But need to require it at top of file
        await notificationService.sendWaitlistNotification(item.User, url);

        res.json({ message: 'Notificado', item });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
