exports.up = function(knex) {
  return knex.schema.createTable('metal_prices', function(table) {
    table.increments('id').primary();
    table.string('metal', 10).notNullable(); // XAU, XAG, XPT, XPD
    table.string('currency', 10).notNullable(); // INR, USD, EUR
    table.decimal('price', 15, 6).notNullable(); // Price per ounce
    table.decimal('price_gram_24k', 15, 6);
    table.decimal('price_gram_22k', 15, 6);
    table.decimal('price_gram_18k', 15, 6);
    table.decimal('high', 15, 6);
    table.decimal('low', 15, 6);
    table.decimal('open', 15, 6);
    table.decimal('close', 15, 6);
    table.decimal('change', 15, 6);
    table.decimal('change_percent', 8, 4);
    table.decimal('ask', 15, 6);
    table.decimal('bid', 15, 6);
    table.string('symbol', 20);
    table.string('exchange', 50);
    table.string('provider', 50).notNullable(); // metalpriceapi, goldapi
    table.timestamp('price_timestamp').notNullable();
    table.boolean('is_historical').defaultTo(false);
    table.timestamps(true, true);
    
    // Indexes
    table.index(['metal', 'currency']);
    table.index('price_timestamp');
    table.index('provider');
    table.index('is_historical');
    table.unique(['metal', 'currency', 'price_timestamp', 'provider']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('metal_prices');
};