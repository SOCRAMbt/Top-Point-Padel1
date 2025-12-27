const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const googleStrategyConfig = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback', // Relative or full URL
    scope: ['profile', 'email'],
    passReqToCallback: true
};

module.exports = (passport) => {
    passport.use(new GoogleStrategy(googleStrategyConfig,
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                // 1. Check if user exists by google_id
                let user = await User.findOne({ where: { google_id: profile.id } });

                if (user) {
                    // Update login time
                    user.last_login = new Date();
                    await user.save();
                    return done(null, user);
                }

                // 2. Check by email
                const email = profile.emails[0]?.value;
                user = await User.findOne({ where: { email } });

                if (user) {
                    // exists but different auth method? Link it.
                    user.google_id = profile.id;
                    if (user.auth_method === 'local' || user.auth_method === 'otp') {
                        // Optional: update auth_method or keep dual
                    }
                    user.foto_url = profile.photos[0]?.value;
                    user.email_verificado = profile.emails[0]?.verified;
                    user.last_login = new Date();
                    await user.save();
                    return done(null, user);
                }

                // 3. Create new user
                user = await User.create({
                    google_id: profile.id,
                    email: email,
                    full_name: profile.displayName,
                    foto_url: profile.photos[0]?.value,
                    email_verificado: profile.emails[0]?.verified,
                    auth_method: 'google',
                    role: 'user', // Default role
                    last_login: new Date()
                });

                return done(null, user);

            } catch (error) {
                console.error('Google Auth Error:', error);
                return done(error, null);
            }
        }
    ));

    // Serialization
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findByPk(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
};
