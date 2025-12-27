const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Waitlist = sequelize.define('Waitlist', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    date: {
        type: DataTypes.DATEONLY, // YYYY-MM-DD
        allowNull: false
    },
    start_time: {
        type: DataTypes.TIME, // HH:MM
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('waiting', 'notified', 'converted', 'expired'),
        defaultValue: 'waiting'
    },
    notified_at: {
        type: DataTypes.DATE
    },
    notification_token: {
        type: DataTypes.STRING
    },
    expires_at: {
        type: DataTypes.DATE
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    timestamps: true,
    underscored: true
});

module.exports = Waitlist;
