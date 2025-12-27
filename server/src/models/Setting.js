const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Setting = sequelize.define('Setting', {
    key: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    value: {
        type: DataTypes.JSON, // Store flexible values (number, string, object)
        allowNull: false
    }
}, {
    timestamps: true,
    underscored: true
});

module.exports = Setting;
