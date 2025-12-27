const { google } = require('googleapis');
const User = require('../models/User');

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.SERVER_URL || 'http://localhost:5050'}/api/auth/google/calendar/callback`
);

exports.getAuthUrl = () => {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar.events'],
        prompt: 'consent'
    });
};

exports.handleCallback = async (code, userId) => {
    console.log(`🔄 Calendar: Exchanging code for tokens (User ${userId})...`);
    try {
        const { tokens } = await oauth2Client.getToken(code);
        console.log('✅ Calendar: Tokens received from Google.');

        if (tokens.refresh_token) {
            console.log('🔑 Calendar: Refresh Token received! Saving to DB...');
        } else {
            console.warn('⚠️ Calendar: NO Refresh Token received. User might have connected before without "prompt: consent".');
        }

        const user = await User.findByPk(userId);
        if (user) {
            if (tokens.refresh_token) {
                user.refresh_token = tokens.refresh_token;
            }
            user.calendar_synced = true;
            await user.save();
            console.log('💾 Calendar: User updated in DB.');
        } else {
            console.error('❌ Calendar: User not found in DB during callback.');
        }
        return tokens;
    } catch (e) {
        console.error('❌ Calendar Exchange Error:', e.response?.data || e.message);
        throw e;
    }
};

exports.createEvent = async (reservation) => {
    console.log(`📅 Calendar: Attempting to create event for reservation ${reservation.id}`);
    try {
        const user = await User.findByPk(reservation.user_id);

        if (!user) {
            console.log('❌ Calendar: User not found for reservation');
            return;
        }

        console.log(`👤 User found: ${user.email}. Synced: ${user.calendar_synced}. HasToken: ${!!user.refresh_token}`);

        if (!user.calendar_synced) {
            console.log('ℹ️ Calendar: User has not enabled calendar sync. Skipping.');
            return;
        }

        if (!user.refresh_token) {
            console.error('❌ Calendar: User has synced=true but NO refresh_token. Re-auth required.');
            return;
        }

        oauth2Client.setCredentials({ refresh_token: user.refresh_token });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const startTime = reservation.start_time.substring(0, 5); // HH:mm
        const endTime = reservation.end_time.substring(0, 5); // HH:mm

        const event = {
            summary: `🎾 Padel - Cancha Reservada`,
            description: `Tu reserva en Top Point Padel.\nID: ${reservation.id}\nDuración: ${reservation.duration} minutos`,
            start: {
                dateTime: `${reservation.date}T${startTime}:00`,
                timeZone: 'America/Argentina/Buenos_Aires',
            },
            end: {
                dateTime: `${reservation.date}T${endTime}:00`,
                timeZone: 'America/Argentina/Buenos_Aires',
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: 30 },
                    { method: 'popup', minutes: 60 },
                ],
            },
        };

        // console.log('📦 Event Payload:', JSON.stringify(event, null, 2));

        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });

        reservation.google_calendar_event_id = response.data.id;
        await reservation.save();

        console.log(`✅ Calendar event created! Link: ${response.data.htmlLink}`);
        return response.data;
    } catch (error) {
        console.error('❌ FATAL Error creating Google Calendar event:', error.message);
        if (error.response) {
            console.error('🔴 API Error Response:', JSON.stringify(error.response.data, null, 2));
        }
        // Don't fail the request if calendar sync fails
    }
};
