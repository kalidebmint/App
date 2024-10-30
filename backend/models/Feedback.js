const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Business = require('./Business');

const Feedback = sequelize.define('Feedback', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  feedback: {
    type: DataTypes.TEXT,
  },
  businessId: {
    type: DataTypes.INTEGER,
    references: {
      model: Business,
      key: 'id',
    },
  },
});

module.exports = Feedback;