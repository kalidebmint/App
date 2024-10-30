const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('feed_app', 'feed_user', 'U%DxK,zgyk?N209u', {
  host: 'localhost',
  dialect: 'postgres',
});

module.exports = sequelize;
