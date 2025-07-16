const bcrypt = require('bcrypt');

exports.seed = async function(knex) {
  // Delete existing entries
  await knex('users').del();
  await knex('roles').del();
  
  // Reset sequences
  await knex.raw('ALTER SEQUENCE roles_id_seq RESTART WITH 1');
  await knex.raw('ALTER SEQUENCE users_id_seq RESTART WITH 1');
  
  // Insert roles
  const roles = await knex('roles').insert([
    {
      name: 'admin',
      description: 'Full system access',
      permissions: JSON.stringify([
        'read_all_data',
        'write_all_data',
        'manage_users',
        'manage_roles',
        'switch_api_providers',
        'view_admin_panel',
        'manage_system_settings'
      ])
    },
    {
      name: 'user',
      description: 'Standard user access',
      permissions: JSON.stringify([
        'read_metal_prices',
        'read_historical_data',
        'convert_currencies',
        'view_charts'
      ])
    },
    {
      name: 'premium',
      description: 'Premium user with extended access',
      permissions: JSON.stringify([
        'read_metal_prices',
        'read_historical_data',
        'convert_currencies',
        'view_charts',
        'access_advanced_analytics',
        'export_data',
        'set_price_alerts'
      ])
    }
  ]).returning('*');
  
  // Create admin user
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  const adminPassword = await bcrypt.hash('admin123', saltRounds);
  
  await knex('users').insert([
    {
      email: 'admin@swarnai.com',
      username: 'admin',
      password_hash: adminPassword,
      first_name: 'System',
      last_name: 'Administrator',
      role_id: roles.find(r => r.name === 'admin').id,
      is_active: true,
      email_verified: true,
      preferences: JSON.stringify({
        theme: 'dark',
        currency: 'INR',
        notifications: true
      })
    }
  ]);
  
  console.log('✅ Roles and admin user seeded successfully');
  console.log('   Admin login: admin@swarnai.com / admin123');
};