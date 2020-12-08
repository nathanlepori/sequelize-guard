import * as sequelize from 'sequelize/types/lib/sequelize';
import { Model, ModelType, QueryInterface, Sequelize } from 'sequelize';
import EventEmitter = NodeJS.EventEmitter;
import NodeCache from 'node-cache';
import { SyncOptions } from 'sequelize/types/lib/sequelize';

declare module 'sequelize/types/lib/sequelize' {
  interface Sequelize {
    guard: SequelizeGuard;
  }
}

type Action = 'view' | 'create' | 'update' | 'delete' | '*' | 'approve';

interface SequelizeGuardOptions<TModel extends ModelType = typeof _GuardUser> {
  prefix?: string;
  primaryKey?: string;
  timestamps?: boolean;
  paranoid?: boolean;
  debug?: boolean;
  UserModel?: TModel;
  userPk?: string;
  safeGuardDeletes?: boolean;
  userCache?: boolean;
  userCacheTtl?: number;
}

interface GuardUser {
  assignRole(role: string): Promise<this>;
  assignRoles(roles: string[]): Promise<RoleUser>;
  rmAssignedRoles(roles: string[]): Promise<void>;
  can(permission: string): Promise<boolean>;
  cant(permission: string): Promise<boolean>;
  isAllOf(roles: string[]): Promise<boolean>;
  isAnyOf(roles: string[]): Promise<boolean>;
  isA(role: string): Promise<boolean>;
  isAn(role: string): Promise<boolean>;
  roles(): Promise<GuardRole>;
}

/* ---------- Models ---------- */
declare class GuardResource extends Model<GuardResource> {
  id: number;
  name: string;
  description: string;
}

declare class GuardPermission extends Model<GuardPermission> {
  id: number;
  name: string;
  description: string;
  resource: string;
  action: string;
  allow: number;
}

declare class GuardRole extends Model<GuardRole> {
  id: number;
  name: string;
  description: string;
  parent_id: number;

  Permissions?: GuardPermission[];
  RoleUser?: RoleUser;
}

declare class RolePermission extends Model<RolePermission> {
  id: number;
  role_id: number;
  permission_id: number;
}

/**
 * Default guard user that is used when no UserModel is provided in SequelizeGuard constructor's options.
 */
declare class _GuardUser extends Model<_GuardUser> {
  id: number;
  name: string;
  email: string;
}

declare class RoleUser extends Model<RoleUser> {
  id: number;
  role_id: number;
  user_id: any;
}

interface GuardModels<TModel extends ModelType = typeof _GuardUser> {
  GuardResource: typeof GuardResource;
  GuardRole: typeof GuardRole;
  GuardPermission: typeof GuardPermission;
  RolePermission: typeof RolePermission;
  GuardUser: TModel;
  RoleUser: typeof RoleUser;
}

declare class SequelizeGuard<TModel extends ModelType = typeof _GuardUser> {
  constructor(seql: Sequelize, options: SequelizeGuardOptions<TModel>);
  static migration: {
    up(queryInterface: QueryInterface, Sequelize: Sequelize, opts?: SequelizeGuardOptions<TModel>): Promise<void>;
    down(queryInterface: QueryInterface, Sequelize: Sequelize, opts?: SequelizeGuardOptions<TModel>): Promise<void>;
  };
  static seeder: {
    up(queryInterface: QueryInterface, Sequelize: Sequelize, opts?: SequelizeGuardOptions<TModel>): Promise<Object>;
    down(queryInterface: QueryInterface, Sequelize: Sequelize, opts?: SequelizeGuardOptions<TModel>): Promise<Object>;
  };
  sync(options?: SyncOptions): Promise<this>;
  models(): GuardModels<TModel>;
  init(): GuardControl;
  allow(role: string, actions: Action[] | Action, resources: string[] | string): Promise<{
    role: GuardRole,
    permissions: GuardPermission[]
  }>;
  userIsA(user: TModel, role: string): Promise<boolean>;
  createPerms(resources: string | string[], actions: Action | Action[], options?: {
    names?: string[],
    all?: boolean,
    json?: false
  }): Promise<GuardPermission[]>;
  createPerms(resources: string | string[], actions: Action | Action[], options?: {
    names?: string[],
    all?: boolean,
    json?: true
  }): Promise<string[]>;
  createPerms(resources: string | string[], actions: Action | Action[], options?: {
    names?: string[],
    all?: boolean,
    json?: boolean
  }): Promise<GuardPermission[]> | Promise<string[]>;
  createPermsBulk(permissions: GuardPermission[], options: {
    all?: boolean,
    json?: false
  }): Promise<GuardPermission[]>;
  createPermsBulk(permissions: GuardPermission[], options: {
    all?: boolean,
    json?: true
  }): Promise<string[]>;
  createPermsBulk(permissions: GuardPermission[], options: {
    all?: boolean,
    json?: boolean
  }): Promise<GuardPermission[]> | Promise<string[]>;
  findPerms(args: Partial<GuardPermission & {search: boolean}>): Promise<GuardPermission>;
  makeRole(role: string): Promise<{role: GuardRole, created: boolean}>;
  makeRoles(roles: string | string[]): Promise<GuardRole[]>;
  deleteRoles(roles: string | string[]): Promise<number>;
  allRoles(): Promise<GuardRole[]>;
  getRole(role: string): Promise<GuardRole>;
  findRoles(args: {
    name?: string,
    names?: string[],
    search?: boolean
  }): Promise<GuardRole[]>;
  addPermsToRole(role: string, actions: Action | Action[], resources: string | string[]): Promise<{
    role: GuardRole,
    permissions: GuardPermission[]
  }>;
  rmPermsFromRole(role: string, actions: Action | Action[], resources: string | string[]): Promise<{
    role: GuardRole,
    permissions: GuardPermission[],
    permsRemoved: GuardPermission[]
  }>
  assignRole(user: TModel, role: string): Promise<TModel>;
  assignRoles(user: TModel, roles: string[]): Promise<RoleUser>;
  rmAssignedRoles(user: TModel, roles: string | string[]): Promise<void>;
  onRolesCreated(cb: (...args: any[]) => void): () => EventEmitter;
  onRolesDeleted(cb: (...args: any[]) => void): () => EventEmitter;
  onPermsCreated(cb: (...args: any[]) => void): () => EventEmitter;
  onPermsAddedToRole(cb: (...args: any[]) => void): () => EventEmitter;
  onPermsRemovedFromRole(cb: (...args: any[]) => void): () => EventEmitter;
  makeUser(user: Partial<TModel>): Promise<TModel>;
  getUserRoles(user: TModel): Promise<GuardRole>;

  resetCache(): NodeCache;
  getCache(): Promise<NodeCache>;
  resetUserCache(): NodeCache;
  getUserCache(): NodeCache;

  userHasRoles(user: TModel, roles: string): Promise<boolean>;
  userHasAllRoles(user: TModel, roles: string): Promise<boolean>;
}

declare class GuardControl {
  constructor(guard: SequelizeGuard);

  allow(roles: string): this;
  to(actions: Action[] | Action): this;
  on(resources: string[] | string): this;
  commit(): Promise<{
    role: GuardRole,
    permissions: GuardPermission[]
  }>;
}

export default SequelizeGuard;

export type {
  SequelizeGuardOptions,
  GuardUser
}
