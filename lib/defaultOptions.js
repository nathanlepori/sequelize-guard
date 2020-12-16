var defaultOpts = {
  tables: {
    meta: 'meta',
    parents: 'parents',
    permissions: 'permissions',
    resources: 'resources',
    roles: 'roles',
    users: 'users',
  },
  prefix: 'guard_',
  primaryKey: 'id',
  timestamps: false,
  paranoid: false,
  debug: false,
  UserModel: null,
  userPk: 'id', //User Primary Key
  userPkType: 'INTEGER',
  safeGuardDeletes: true,
  userCache: true,
  userCacheTtl: 60,
};

module.exports = defaultOpts;
