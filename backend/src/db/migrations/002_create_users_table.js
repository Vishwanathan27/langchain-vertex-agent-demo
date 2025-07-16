exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.increments('id').primary();
    table.string('email', 255).notNullable().unique();
    table.string('username', 100).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('first_name', 100);
    table.string('last_name', 100);
    table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('SET NULL');
    table.boolean('is_active').defaultTo(true);
    table.boolean('email_verified').defaultTo(false);
    table.timestamp('last_login_at');
    table.json('preferences').defaultTo('{}');
    table.timestamps(true, true);
    
    // Indexes
    table.index('email');
    table.index('username');
    table.index('role_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};