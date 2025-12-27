const { MercadoPagoConfig, Preference } = require('mercadopago');
const Reservation = require('../models/Reservation');
const Payment = require('../models/Payment');
const User = require('../models/User');

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-000000' });

exports.createPreference = async (reservation, user) => {
    // Mock for dev if no valid token
    if (!process.env.MP_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN.includes('your_mp_access_token')) {
        console.log('Using Mock Payment Preference (Dev Mode)');
        return {
            id: 'mock_pref_id',
            init_point: `${process.env.CLIENT_URL || 'http://localhost:5173'}/booking/success?mock=true&reservation_id=${reservation.id}`
        };
    }

    const preference = new Preference(client);

    try {
        const result = await preference.create({
            body: {
                items: [
                    {
                        id: reservation.id,
                        title: `Reserva Padel - ${reservation.date} ${reservation.start_time}`,
                        quantity: 1,
                        unit_price: Number(reservation.total_price),
                        currency_id: 'ARS',
                    }
                ],
                payer: {
                    name: user.full_name || 'Usuario',
                    email: user.email || 'email@test.com',
                    phone: {
                        area_code: '',
                        number: user.phone || ''
                    }
                },
                back_urls: {
                    success: `${process.env.CLIENT_URL || 'http://localhost:5173'}/booking/success`,
                    failure: `${process.env.CLIENT_URL || 'http://localhost:5173'}/booking/failure`,
                    pending: `${process.env.CLIENT_URL || 'http://localhost:5173'}/booking/pending`
                },
                auto_return: 'approved',
                external_reference: reservation.id,
                notification_url: `${process.env.SERVER_URL || 'http://localhost:5050'}/api/webhook/mercadopago`
            }
        });
        return result;
    } catch (error) {
        console.error('Mercado Pago Error:', error);
        throw new Error('Error al crear preferencia de pago: ' + error.message);
    }
};

exports.handleWebhook = async (query) => {
    // Process webhook logic (usually checking receiving payment ID and verifying status)
    // For simplicity, we assume we receive `data.id` or `id` depending on topic.
    // In production, verify signature.

    // This part requires `Payment` generic class from SDK or just fetch generic.
    // We will leave the structure here.
    return { status: 'ok' };
};
