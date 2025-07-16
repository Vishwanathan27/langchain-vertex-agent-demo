exports.up = function(knex) {
  return knex.schema.createTable('user_activity', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('action', 100).notNullable();
    table.string('details', 500);
    table.string('ip_address', 45);
    table.text('user_agent');
    table.json('metadata');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('user_id');
    table.index('action');
    table.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user_activity');
};