const sequelize = require('../config/db');
const User = require('./userModel');
const Url = require('./urlModel');
const Visit = require('./visitModel');

// Define associations
User.hasMany(Url, { foreignKey: 'userId', onDelete: 'CASCADE' });
Url.belongsTo(User, { foreignKey: 'userId' });

Url.hasMany(Visit, { foreignKey: 'urlId', onDelete: 'CASCADE' });
Visit.belongsTo(Url, { foreignKey: 'urlId' });

module.exports = {
  sequelize,
  User,
  Url,
  Visit,
};
