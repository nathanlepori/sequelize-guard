var lodash = require('lodash');
const { DataTypes } = require('sequelize');
var defaultOpts = require('../defaultOptions');
var { tables, schemas, timestamps } = require('./guard-schema');

module.exports = {
  tables,
  schemas,
  defaultOpts,
  up: async function (queryInterface, Sequelize, opts) {
    // Set default UserModel on the default options
    const GuardUser = Sequelize.guard._models.GuardUser;
    var options = lodash.assign({}, defaultOpts, {UserModel: GuardUser}, opts || {});
    var prefix = options.prefix;
    // var tables = Object.keys(defaults);

    schemas.role_user = Object.assign(schemas.role_user, {
      role_id: {
        type: DataTypes.INTEGER,
        references: {
          model: options.prefix + options.tables.roles,
          key: 'id',
        },
        onDelete: 'cascade',
      },
      user_id: {
        type: options.userPkType,
        references: {
          model: options.UserModel.getTableName(),
          key: options.userPk,
        },
        onDelete: 'cascade',
      }
    });

    return Promise.all(
      lodash.each(tables, function (table) {
        return queryInterface.createTable(
          prefix + table,
          lodash.assign(
            {},
            schemas[table],
            options.timestamps ? timestamps.basic : {},
            options.timestamps && options.paranoid ? timestamps.paranoid : {}
          )
        );
      })
    );
  },

  down: function (queryInterface, Sequelize, opts) {
    var options = lodash.assign({}, defaultOpts, opts || {});
    var prefix = options.prefix;
    // var tables = Object.keys(defaults);

    return Promise.all(
      lodash.each(tables, function (table) {
        return queryInterface.dropTable(prefix + table);
      })
    );
  },
};
