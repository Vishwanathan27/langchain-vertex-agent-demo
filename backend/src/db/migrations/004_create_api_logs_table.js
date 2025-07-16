exports.up = function(knex) {
  return knex.schema.createTable('api_logs', function(table) {
    table.increments('id').primary();
    table.string('provider', 50).notNullable();
    table.string('endpoint', 255).notNullable();
    table.string('method', 10).notNullable();
    table.json('request_params');
    table.json('response_data');
    table.integer('status_code');
    table.string('error_message', 1000);
    table.integer('response_time_ms');
    table.boolean('success').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('provider');
    table.index('success');
    table.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('api_logs');
};