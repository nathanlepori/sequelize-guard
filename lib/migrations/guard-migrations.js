var lodash = require('lodash');
const { DataTypes } = require('sequelize');
var defaultOpts = require('../defaultOptions');
var { tables, schemas, timestamps } = require('./guard-schema');

module.exports = {
  tables,
  schemas,
  defaultOpts,
  up: async function (queryInterface, Sequelize, opts) {
    var options = lodash.assign({}, defaultOpts, opts || {});
    var prefix = options.prefix;
    // var tables = Object.keys(defaults);

    let userColId = `user_id`;
    let roleColId = `role_id`;

    let roleUserSchema = {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
    };
    roleUserSchema[`${roleColId}`] = {
      type: DataTypes.INTEGER,
      references: {
        model: options.prefix + options.tables.roles,
        key: 'id',
      },
      onDelete: 'cascade',
    };
    roleUserSchema[`${userColId}`] = {
      type: options.userPkType,
      references: {
        model: options.UserModel.getTableName(),
        key: options.userPk,
      },
      onDelete: 'cascade',
    };

    const res = await Promise.all(
      lodash.each(lodash.pull(tables, 'role_user'), function (table) {
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

    // role_user needs to be created separately
    await queryInterface.createTable(
      prefix + 'role_user',
      lodash.assign(
        {},
        roleUserSchema,
        options.timestamps ? timestamps.basic : {},
        options.timestamps && options.paranoid ? timestamps.paranoid : {}
      )
    );
    return res;
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
