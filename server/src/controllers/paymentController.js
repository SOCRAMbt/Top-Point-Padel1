const paymentService = require('../services/paymentService');
const Reservation = require('../models/Reservation');
const Payment = require('../models/Payment');
const { Payment: MPPayment, MercadoPagoConfig } = require('mercadopago');

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || 'test' });

exports.createPreference = async (req, res) => {
    // This is now likely called via reservation creation internally
    res.status(501).json({ message: "Use create reservation endpoint" });
};

exports.handleWebhook = async (req, res) => {
    try {
        const { type, data } = req.body;
        // Basic handling for 'payment' topic
        const id = (data && data.id) || req.query['data.id'] || req.query.id;

        if (id) {
            const payment = new MPPayment(client);
            const paymentData = await payment.get({ id });

            if (paymentData) {
                const status = paymentData.status; // approved, pending, rejected
                const externalRef = paymentData.external_reference; // reservation ID

                const reservation = await Reservation.findByPk(externalRef);
                if (reservation) {
                    if (status === 'approved') {
                        reservation.status = 'confirmed';
                        // Create Payment record log
                        await Payment.create({
                            amount: paymentData.transaction_amount,
                            method: 'mercadopago',
                            status: 'approved',
                            external_reference: String(externalRef), // MP Ref
                            mp_payment_id: String(id),
                            description: paymentData.description
                        });
                    } else if (status === 'rejected' || status === 'cancelled') {
                        reservation.status = 'cancelled';
                    }
                    await reservation.save();
                }
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error("Webhook error:", error);
        res.sendStatus(500); // MP expects 200 or it retries, but 500 logs error
    }
};
