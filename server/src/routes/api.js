const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const blockController = require('../controllers/blockController');
const settingController = require('../controllers/settingController');
const authController = require('../controllers/authController');
const paymentController = require('../controllers/paymentController');
const waitlistController = require('../controllers/waitlistController');
const { protect, requireAdmin } = require('../middlewares/authMiddleware');

const passport = require('passport');

// --- Auth Routes ---
router.get('/auth/me', protect, authController.currentUser);
router.post('/auth/logout', authController.logout);
router.post('/auth/otp/send', authController.sendOtp);
router.post('/auth/otp/verify', authController.verifyOtp);

router.post('/auth/logout', authController.logout);

// Google OAuth
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    authController.googleCallback
);
router.get('/auth/google/calendar/callback', authController.calendarCallback);

// Calendar Sync
router.get('/auth/calendar/connect', protect, authController.connectCalendar);
router.post('/auth/calendar/sync', protect, authController.syncCalendar);
router.get('/auth/users', requireAdmin, authController.getUsers);

// --- Waitlist Routes ---
router.get('/waitlist', requireAdmin, waitlistController.getWaitlist);
router.delete('/waitlist/:id', requireAdmin, waitlistController.deleteEntry);
router.post('/waitlist/:id/notify', requireAdmin, waitlistController.notifyUser);

// --- Reservation Routes ---
router.get('/reservations/availability', reservationController.checkAvailability);
router.get('/reservations', protect, reservationController.getReservations);
router.post('/reservations', protect, reservationController.createReservation);
router.patch('/reservations/:id/cancel', protect, reservationController.cancelReservation); // User cancel
router.delete('/reservations/:id', protect, reservationController.cancelReservation); // Keep delete verb acting as cancel for compatibility or admin

// --- Payment Routes ---
router.post('/payments/preference', protect, paymentController.createPreference);
router.post('/webhooks/mercadopago', paymentController.handleWebhook);

// --- Block Routes (Admin) ---
router.get('/blocks', requireAdmin, blockController.getBlocks);
router.post('/blocks', requireAdmin, blockController.createBlock);
router.delete('/blocks/:id', requireAdmin, blockController.deleteBlock);

// --- Settings Routes (Admin) ---
router.get('/settings', requireAdmin, settingController.getSettings);
router.put('/settings', requireAdmin, settingController.updateSettings);

// --- Stats Route ---
router.get('/stats', requireAdmin, reservationController.getStats);

module.exports = router;
