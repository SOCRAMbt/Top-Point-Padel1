const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

exports.sendConfirmation = async (reservation, user) => {
    try {
        await transporter.sendMail({
            from: '"TPP Padel" <no-reply@tpp.com>',
            to: user.email,
            subject: 'Reserva Confirmada',
            text: `Hola ${user.full_name}, tu reserva para el ${reservation.date} a las ${reservation.start_time} ha sido confirmada.`,
            html: `<h1>Reserva Confirmada</h1><p>Te esperamos el <b>${reservation.date}</b> a las <b>${reservation.start_time}</b>.</p>`
        });
    } catch (error) {
        console.error('Email error:', error);
    }
};

exports.sendReminder = async (reservation, user) => {
    try {
        await transporter.sendMail({
            from: '"TPP Padel" <no-reply@tpp.com>',
            to: user.email,
            subject: 'Recordatorio de Reserva',
            text: `Tu partido está por comenzar en 30 minutos (${reservation.start_time}).`,
        });
    } catch (error) {
        console.error('Email error:', error);
    }
};

exports.sendWaitlistNotification = async (waitlistEntry, url) => {
    try {
        await transporter.sendMail({
            from: '"TPP Padel" <no-reply@tpp.com>',
            to: waitlistEntry.email, // Ensure email is fetched/passed
            subject: '¡Turno Disponible!',
            html: `<p>Se ha liberado un turno. <a href="${url}">Resérvalo aquí</a>. Tienes 5 minutos.</p>`
        });
    } catch (error) {
        console.error('Email error:', error);
    }
};
