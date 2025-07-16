exports.up = function(knex) {
  return knex.schema.createTable('user_sessions', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('session_token', 255).notNullable().unique();
    table.string('ip_address', 45);
    table.text('user_agent');
    table.timestamp('expires_at').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Indexes
    table.index('user_id');
    table.index('session_token');
    table.index('expires_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user_sessions');
};