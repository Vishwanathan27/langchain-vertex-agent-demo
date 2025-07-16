const db = require('../db/connection');

class RBAC {
  constructor() {
    this.permissions = {
      // Data access permissions
      'read_metal_prices': 'View live metal prices',
      'read_historical_data': 'View historical price data',
      'read_all_data': 'View all system data',
      'write_all_data': 'Modify all system data',
      
      // User management permissions
      'manage_users': 'Create, update, delete users',
      'manage_roles': 'Create, update, delete roles',
      'view_user_activity': 'View user activity logs',
      
      // System management permissions
      'manage_system_settings': 'Modify system configuration',
      'switch_api_providers': 'Switch between API providers',
      'view_admin_panel': 'Access admin dashboard',
      'manage_api_keys': 'Manage API keys and secrets',
      
      // Feature permissions
      'convert_currencies': 'Use currency conversion features',
      'view_charts': 'View price charts and analytics',
      'access_advanced_analytics': 'Access advanced analytics features',
      'export_data': 'Export data to various formats',
      'set_price_alerts': 'Create and manage price alerts',
      
      // API permissions
      'api_access': 'Access API endpoints',
      'api_admin': 'Access admin API endpoints'
    };
  }

  // Check if user has permission
  async hasPermission(userId, permission) {
    const user = await db('users')
      .join('roles', 'users.role_id', 'roles.id')
      .select('roles.permissions')
      .where('users.id', userId)
      .andWhere('users.is_active', true)
      .first();

    if (!user) {
      return false;
    }

    const userPermissions = user.permissions || [];
    return userPermissions.includes(permission);
  }

  // Check if user has any of the specified permissions
  async hasAnyPermission(userId, permissions) {
    const user = await db('users')
      .join('roles', 'users.role_id', 'roles.id')
      .select('roles.permissions')
      .where('users.id', userId)
      .andWhere('users.is_active', true)
      .first();

    if (!user) {
      return false;
    }

    const userPermissions = user.permissions || [];
    return permissions.some(permission => userPermissions.includes(permission));
  }

  // Check if user has all specified permissions
  async hasAllPermissions(userId, permissions) {
    const user = await db('users')
      .join('roles', 'users.role_id', 'roles.id')
      .select('roles.permissions')
      .where('users.id', userId)
      .andWhere('users.is_active', true)
      .first();

    if (!user) {
      return false;
    }

    const userPermissions = user.permissions || [];
    return permissions.every(permission => userPermissions.includes(permission));
  }

  // Get user permissions
  async getUserPermissions(userId) {
    const user = await db('users')
      .join('roles', 'users.role_id', 'roles.id')
      .select('roles.permissions', 'roles.name as role_name')
      .where('users.id', userId)
      .andWhere('users.is_active', true)
      .first();

    if (!user) {
      return { permissions: [], role: null };
    }

    return {
      permissions: user.permissions || [],
      role: user.role_name
    };
  }

  // Create role
  async createRole(roleData) {
    const { name, description, permissions } = roleData;
    
    // Check if role already exists
    const existingRole = await db('roles').where('name', name).first();
    if (existingRole) {
      throw new Error('Role with this name already exists');
    }

    // Validate permissions
    const validPermissions = Object.keys(this.permissions);
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
    if (invalidPermissions.length > 0) {
      throw new Error(`Invalid permissions: ${invalidPermissions.join(', ')}`);
    }

    const [role] = await db('roles').insert({
      name,
      description,
      permissions: JSON.stringify(permissions),
      is_active: true
    }).returning('*');

    return role;
  }

  // Update role
  async updateRole(roleId, updates) {
    const { name, description, permissions, is_active } = updates;
    
    const updateData = {};
    
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    if (permissions) {
      // Validate permissions
      const validPermissions = Object.keys(this.permissions);
      const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
      if (invalidPermissions.length > 0) {
        throw new Error(`Invalid permissions: ${invalidPermissions.join(', ')}`);
      }
      updateData.permissions = JSON.stringify(permissions);
    }

    const [role] = await db('roles')
      .where('id', roleId)
      .update(updateData)
      .returning('*');

    return role;
  }

  // Assign role to user
  async assignRole(userId, roleId) {
    // Check if role exists
    const role = await db('roles').where('id', roleId).first();
    if (!role) {
      throw new Error('Role not found');
    }

    // Update user role
    await db('users')
      .where('id', userId)
      .update({ role_id: roleId });

    return true;
  }

  // Get all roles
  async getAllRoles() {
    return await db('roles').select('*').orderBy('name');
  }

  // Get role by ID
  async getRoleById(roleId) {
    return await db('roles').where('id', roleId).first();
  }

  // Delete role
  async deleteRole(roleId) {
    // Check if role is in use
    const usersWithRole = await db('users').where('role_id', roleId).count('id as count').first();
    if (parseInt(usersWithRole.count) > 0) {
      throw new Error('Cannot delete role that is assigned to users');
    }

    await db('roles').where('id', roleId).del();
    return true;
  }

  // Get all available permissions
  getAvailablePermissions() {
    return this.permissions;
  }
}

module.exports = new RBAC();