const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Url = sequelize.define('Url', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  originalUrl: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  shortCode: {
    type: DataTypes.STRING(10),
    unique: true,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  clicks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'urls',
  timestamps: true,
  updatedAt: false, // only createdAt is needed
});

module.exports = Url;
