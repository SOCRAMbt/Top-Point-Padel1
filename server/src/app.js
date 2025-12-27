const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const apiRoutes = require('./routes/api');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
    origin: true, // Allow checks relative to request origin (for local network testing)
    methods: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Passport Config
const session = require('express-session');
const passport = require('passport');
require('./config/passport')(passport);

app.use(session({
    secret: process.env.COOKIE_KEY || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000
    }
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api', apiRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', mode: 'sqlite_migrated', timestamp: new Date() });
});

module.exports = app;
