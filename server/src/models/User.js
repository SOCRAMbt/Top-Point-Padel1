const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: { isEmail: true }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user'
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true
    },
    auth_method: {
        type: DataTypes.ENUM('google', 'otp', 'local'),
        defaultValue: 'google'
    },
    google_id: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true
    },
    foto_url: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    email_verificado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    calendar_synced: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    refresh_token: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    last_login: { // ultimo_login
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true,
    underscored: true
});

module.exports = User;
