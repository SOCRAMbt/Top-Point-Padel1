const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    method: {
        type: DataTypes.ENUM('mercadopago', 'manual'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'refunded'),
        defaultValue: 'pending'
    },
    external_reference: {
        type: DataTypes.STRING, // MP Reference ID
        unique: true
    },
    mp_preference_id: {
        type: DataTypes.STRING
    },
    mp_payment_id: {
        type: DataTypes.STRING
    },
    description: {
        type: DataTypes.STRING
    }
}, {
    timestamps: true,
    underscored: true
});

module.exports = Payment;
