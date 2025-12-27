const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Mock OTP Store (In production, use Redis)
const otpStore = new Map();

// Rate limiting store for OTP requests
const otpRateLimitStore = new Map();
const OTP_RATE_LIMIT = 3; // Max requests
const OTP_RATE_WINDOW = 10 * 60 * 1000; // 10 minutes

// Phone validation regex (Argentina and international)
const PHONE_REGEX = /^(\+?54)?[1-9]\d{9,10}$/;

// Sanitize and validate phone number
const sanitizePhone = (phone) => {
    if (!phone) return null;
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    // Remove leading + if present for storage consistency
    if (cleaned.startsWith('+')) {
        cleaned = cleaned.substring(1);
    }
    // Remove Argentina country code if present
    if (cleaned.startsWith('54')) {
        cleaned = cleaned.substring(2);
    }
    // Remove leading 0 if present
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }
    return cleaned;
};

// Check rate limit for phone
const checkRateLimit = (phone) => {
    const now = Date.now();
    const key = `otp_${phone}`;
    const record = otpRateLimitStore.get(key);

    if (!record) {
        otpRateLimitStore.set(key, { count: 1, firstRequest: now });
        return { allowed: true, remaining: OTP_RATE_LIMIT - 1 };
    }

    // Reset if window expired
    if (now - record.firstRequest > OTP_RATE_WINDOW) {
        otpRateLimitStore.set(key, { count: 1, firstRequest: now });
        return { allowed: true, remaining: OTP_RATE_LIMIT - 1 };
    }

    // Check if limit exceeded
    if (record.count >= OTP_RATE_LIMIT) {
        const resetIn = Math.ceil((record.firstRequest + OTP_RATE_WINDOW - now) / 1000);
        return { allowed: false, resetIn, remaining: 0 };
    }

    // Increment counter
    record.count++;
    otpRateLimitStore.set(key, record);
    return { allowed: true, remaining: OTP_RATE_LIMIT - record.count };
};

exports.currentUser = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }
        const user = await User.findByPk(req.user.id);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.logout = (req, res) => {
    req.logout && req.logout();
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
};

// Google Callback Handler
exports.googleCallback = (req, res) => {
    const token = jwt.sign(
        { id: req.user.id, email: req.user.email, role: req.user.role },
        process.env.JWT_SECRET || 'secret_key',
        { expiresIn: '30d' }
    );

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/login/success?token=${token}`);
};

// OTP Implementation with Rate Limiting and Validation
exports.sendOtp = async (req, res) => {
    try {
        let { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ error: 'Teléfono requerido' });
        }

        // Sanitize phone number
        phone = sanitizePhone(phone);

        // Validate phone format
        if (!phone || phone.length < 8 || phone.length > 12) {
            return res.status(400).json({
                error: 'Número de teléfono inválido. Debe tener entre 8 y 12 dígitos.'
            });
        }

        // Check rate limit
        const rateCheck = checkRateLimit(phone);
        if (!rateCheck.allowed) {
            return res.status(429).json({
                error: `Demasiados intentos. Esperá ${rateCheck.resetIn} segundos.`,
                retryAfter: rateCheck.resetIn
            });
        }

        // Generate 6 digit code
        let code = Math.floor(100000 + Math.random() * 900000).toString();

        // DEV MODE: Fixed code for easy mobile testing
        if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
            code = '123456';
            console.log(`[DEV OTP] Fixed Code for ${phone}: ${code}`);
        }

        console.log(`[OTP] Code for ${phone}: ${code} (Remaining attempts: ${rateCheck.remaining})`);

        // Store OTP with 5 min expiry
        otpStore.set(phone, {
            code,
            expires: Date.now() + 5 * 60 * 1000,
            attempts: 0
        });

        // In production, remove dev_code and send via real SMS provider
        res.json({
            message: 'Código enviado',
            dev_code: code, // Remove in production
            remaining_attempts: rateCheck.remaining
        });
    } catch (error) {
        console.error('OTP Send Error:', error);
        res.status(500).json({ error: 'Error al enviar código' });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        let { phone, code } = req.body;

        if (!phone || !code) {
            return res.status(400).json({ error: 'Teléfono y código requeridos' });
        }

        // Sanitize phone (same as sendOtp)
        phone = sanitizePhone(phone);

        if (!phone) {
            return res.status(400).json({ error: 'Número de teléfono inválido' });
        }

        // Sanitize code - only digits
        code = code.replace(/\D/g, '');

        if (code.length !== 6) {
            return res.status(400).json({ error: 'El código debe tener 6 dígitos' });
        }

        const record = otpStore.get(phone);

        if (!record) {
            return res.status(400).json({ error: 'Código expirado o no solicitado' });
        }

        // Check expiry first
        if (Date.now() > record.expires) {
            otpStore.delete(phone);
            return res.status(400).json({ error: 'Código expirado. Solicitá uno nuevo.' });
        }

        // Brute force protection - max 5 attempts per code
        if (record.attempts >= 5) {
            otpStore.delete(phone);
            return res.status(429).json({
                error: 'Demasiados intentos fallidos. Solicitá un nuevo código.'
            });
        }

        // Check code
        if (record.code !== code) {
            record.attempts = (record.attempts || 0) + 1;
            otpStore.set(phone, record);
            const remaining = 5 - record.attempts;
            return res.status(400).json({
                error: `Código incorrecto. Te quedan ${remaining} intentos.`
            });
        }

        // Success - delete OTP record
        otpStore.delete(phone);

        // Find or Create User
        let user = await User.findOne({ where: { phone } });
        if (!user) {
            user = await User.create({
                phone,
                role: 'user',
                auth_method: 'otp'
            });
            console.log(`[AUTH] New user created via OTP: ${phone}`);
        } else {
            console.log(`[AUTH] User logged in via OTP: ${phone}`);
        }

        // Generate Token
        const token = jwt.sign(
            { id: user.id, phone: user.phone, role: user.role },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '30d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        res.json({ user, token });
    } catch (error) {
        console.error('OTP Verify Error:', error);
        res.status(500).json({ error: 'Error al verificar código' });
    }
};

// Google Calendar Sync
const googleCalendarService = require('../services/googleCalendarService');

exports.connectCalendar = (req, res) => {
    const url = googleCalendarService.getAuthUrl();
    res.json({ url });
};

exports.calendarCallback = async (req, res) => {
    const { code } = req.query;
    console.log('🔄 Auth: Calendar callback received with code length:', code ? code.length : 0);

    // Scenario 1: Cookie survived redirect (ideal)
    if (req.user) {
        console.log('👤 Auth: User session found during callback. Processing direct sync...');
        try {
            await googleCalendarService.handleCallback(code, req.user.id);
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            return res.redirect(`${clientUrl}/profile?calendar_synced=true`);
        } catch (error) {
            console.error('❌ Calendar sync error (Direct):', error);
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            return res.redirect(`${clientUrl}/profile?error=sync_failed`);
        }
    }

    // Scenario 2: Cookie lost
    console.warn('⚠️ Auth: No user session in callback. Redirecting code to frontend for manual sync.');
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    return res.redirect(`${clientUrl}/profile?calendar_code=${code}`);
};

exports.logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    });
    res.json({ message: 'Sesión cerrada exitosamente' });
};

exports.syncCalendar = async (req, res) => {
    const { code } = req.body;
    console.log('🔄 Auth: Manual sync request received from frontend.');
    try {
        if (!req.user) throw new Error('No user in session for manual sync');
        await googleCalendarService.handleCallback(code, req.user.id);
        res.json({ message: 'Calendario sincronizado' });
    } catch (error) {
        console.error('❌ Auth: Manual sync failed:', error);
        res.status(500).json({ error: 'Fallo la sincronización manual: ' + error.message });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.findAll({ order: [['created_at', 'DESC']] });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
