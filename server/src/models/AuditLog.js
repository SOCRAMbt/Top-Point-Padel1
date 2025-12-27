const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    action: {
        type: DataTypes.STRING, // 'cancel_reservation', 'update_price', etc.
        allowNull: false
    },
    entity_type: {
        type: DataTypes.STRING // 'Reservation', 'User', 'System'
    },
    entity_id: {
        type: DataTypes.STRING
    },
    details: {
        type: DataTypes.JSON // Store changed values or generic info
    },
    ip_address: {
        type: DataTypes.STRING
    },
    user_id: {
        type: DataTypes.UUID
    }
}, {
    timestamps: true,
    underscored: true
});

module.exports = AuditLog;
