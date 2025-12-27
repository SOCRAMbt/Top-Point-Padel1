const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reservation = sequelize.define('Reservation', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    date: {
        type: DataTypes.DATEONLY, // YYYY-MM-DD
        allowNull: false
    },
    start_time: {
        type: DataTypes.TIME, // HH:mm:ss
        allowNull: false
    },
    end_time: {
        type: DataTypes.TIME, // HH:mm:ss
        allowNull: false
    },
    duration: {
        type: DataTypes.INTEGER, // 60 or 90
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending_payment', 'confirmed', 'cancelled'),
        defaultValue: 'pending_payment'
    },
    payment_method: {
        type: DataTypes.ENUM('mercadopago', 'manual'),
        allowNull: false
    },
    total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    google_event_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mp_preference_id: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true,
    underscored: true
});

module.exports = Reservation;
