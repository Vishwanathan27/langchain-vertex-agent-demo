# Database System Documentation

## Overview

The SwarnaAI application uses PostgreSQL as its primary database with Knex.js as the query builder and migration tool. This document outlines the database architecture, migration system, and maintenance procedures.

## Database Architecture

### Core Tables

#### 1. roles
- **Purpose**: Stores user role definitions and permissions
- **Location**: `src/db/migrations/001_create_roles_table.js`
- **Fields**:
  - `id`: Primary key (UUID)
  - `name`: Role name (admin, user, viewer)
  - `description`: Role description
  - `permissions`: JSON array of permissions
  - `created_at`: Timestamp
  - `updated_at`: Timestamp

#### 2. users
- **Purpose**: Stores user account information
- **Location**: `src/db/migrations/002_create_users_table.js`
- **Fields**:
  - `id`: Primary key (UUID)
  - `email`: Unique email address
  - `password_hash`: Bcrypt hashed password
  - `first_name`: User's first name
  - `last_name`: User's last name
  - `role_id`: Foreign key to roles table
  - `is_active`: Boolean flag
  - `last_login`: Timestamp
  - `created_at`: Timestamp
  - `updated_at`: Timestamp

#### 3. metal_prices
- **Purpose**: Stores historical and current metal price data
- **Location**: `src/db/migrations/003_create_metal_prices_table.js`
- **Fields**:
  - `id`: Primary key (UUID)
  - `metal`: Metal symbol (XAU, XAG, XPT, XPD)
  - `currency`: Currency code (INR, USD, EUR)
  - `price`: Current price per ounce
  - `price_gram_24k`: Price per gram (24k)
  - `price_gram_22k`: Price per gram (22k)
  - `price_gram_18k`: Price per gram (18k)
  - `high`: 24-hour high
  - `low`: 24-hour low
  - `open`: Opening price
  - `close`: Closing price
  - `change`: Price change from previous close
  - `change_percent`: Percentage change
  - `ask`: Ask price
  - `bid`: Bid price
  - `symbol`: Trading symbol
  - `exchange`: Exchange name
  - `provider`: Data provider (goldapi, metalpriceapi, etc.)
  - `price_timestamp`: Time of price data
  - `is_historical`: Boolean flag
  - `created_at`: Timestamp
  - `updated_at`: Timestamp

#### 4. api_logs
- **Purpose**: Tracks API calls and performance metrics
- **Location**: `src/db/migrations/004_create_api_logs_table.js`
- **Fields**:
  - `id`: Primary key (UUID)
  - `provider`: API provider name
  - `endpoint`: API endpoint called
  - `method`: HTTP method
  - `request_params`: JSON request parameters
  - `response_data`: JSON response data
  - `status_code`: HTTP status code
  - `error_message`: Error message if failed
  - `response_time_ms`: Response time in milliseconds
  - `success`: Boolean success flag
  - `created_at`: Timestamp

#### 5. user_sessions
- **Purpose**: Manages user authentication sessions
- **Location**: `src/db/migrations/005_create_user_sessions_table.js`
- **Fields**:
  - `id`: Primary key (UUID)
  - `user_id`: Foreign key to users table
  - `session_token`: JWT token hash
  - `ip_address`: Client IP address
  - `user_agent`: Client user agent
  - `expires_at`: Session expiration time
  - `is_active`: Boolean flag
  - `created_at`: Timestamp
  - `updated_at`: Timestamp

#### 6. user_activity
- **Purpose**: Logs user activities for audit purposes
- **Location**: `src/db/migrations/006_create_user_activity_table.js`
- **Fields**:
  - `id`: Primary key (UUID)
  - `user_id`: Foreign key to users table
  - `action`: Action performed
  - `details`: JSON activity details
  - `ip_address`: Client IP address
  - `user_agent`: Client user agent
  - `created_at`: Timestamp

## Migration System

### Overview
The application uses Knex.js migrations for database schema management. Migrations are versioned and executed in order.

### Migration Files Location
- **Path**: `src/db/migrations/`
- **Naming Convention**: `XXX_descriptive_name.js` (e.g., `001_create_roles_table.js`)

### Running Migrations

#### Development Environment
```bash
# Run all pending migrations
npm run migrate

# Rollback last migration
npm run migrate:rollback

# Check migration status
npm run migrate:status

# Create new migration
npm run migrate:make migration_name
```

#### Production Environment
```bash
# Run migrations in production
NODE_ENV=production npm run migrate
```

### Migration Best Practices

1. **Versioning**: Always use sequential numbering for migrations
2. **Rollback**: Always include a `down` function for rollback capability
3. **Data Safety**: Use transactions for complex migrations
4. **Testing**: Test migrations in development environment first
5. **Backup**: Always backup database before running migrations in production

### Example Migration Structure

```javascript
exports.up = async function(knex) {
  return knex.schema.createTable('table_name', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  return knex.schema.dropTable('table_name');
};
```

## Seeding System

### Overview
Database seeding is used to populate initial data required for the application to function.

### Seed Files Location
- **Path**: `src/db/seeds/`
- **Naming Convention**: `XXX_descriptive_name.js`

### Running Seeds

```bash
# Run all seeds
npm run seed

# Run specific seed
npm run seed:run seed_name
```

### Example Seed Structure

```javascript
exports.seed = async function(knex) {
  // Clear existing data
  await knex('table_name').del();
  
  // Insert seed data
  await knex('table_name').insert([
    { name: 'Example 1', value: 'value1' },
    { name: 'Example 2', value: 'value2' }
  ]);
};
```

## Connection Management

### Configuration
Database connection is configured in `knexfile.js`:

```javascript
module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'swarnaai_dev',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password'
    },
    migrations: {
      directory: './src/db/migrations'
    },
    seeds: {
      directory: './src/db/seeds'
    }
  }
};
```

### Connection Pool
- **Min Connections**: 2
- **Max Connections**: 10
- **Idle Timeout**: 30 seconds
- **Acquire Timeout**: 60 seconds

## Maintenance Procedures

### Regular Maintenance

#### 1. Database Backup
```bash
# Create backup
pg_dump -h localhost -U username -d database_name > backup.sql

# Restore from backup
psql -h localhost -U username -d database_name < backup.sql
```

#### 2. Performance Monitoring
- Monitor query performance using `EXPLAIN ANALYZE`
- Check for missing indexes
- Monitor connection pool usage
- Review slow query logs

#### 3. Data Cleanup
The application includes automated cleanup procedures:

```javascript
// Clean old API logs (older than 30 days)
await dataService.cleanOldData(30);

// Clean old user sessions
await knex('user_sessions')
  .where('expires_at', '<', new Date())
  .del();
```

### Troubleshooting

#### Common Issues

1. **Migration Failures**
   - Check migration syntax
   - Ensure database user has necessary permissions
   - Review database logs

2. **Connection Issues**
   - Verify database server is running
   - Check connection parameters
   - Review firewall settings

3. **Performance Issues**
   - Analyze slow queries
   - Check for missing indexes
   - Monitor connection pool

#### Debugging Queries

```javascript
// Enable query logging
const knex = require('knex')({
  client: 'postgresql',
  connection: {
    // connection config
  },
  debug: true  // Enable query logging
});
```

## Security Considerations

### Access Control
- Use environment variables for sensitive configuration
- Implement role-based access control (RBAC)
- Regularly rotate database credentials

### Data Protection
- Encrypt sensitive data at rest
- Use SSL/TLS for database connections
- Implement proper backup encryption

### Audit Trail
- Log all database operations
- Track user activities
- Monitor API usage

## Performance Optimization

### Indexing Strategy
- Create indexes on frequently queried columns
- Use composite indexes for multi-column queries
- Monitor index usage and remove unused indexes

### Query Optimization
- Use query builder efficiently
- Avoid N+1 query problems
- Implement proper pagination

### Connection Pool Optimization
- Configure appropriate pool sizes
- Monitor connection usage
- Use connection pooling for high-traffic scenarios

## Development Workflow

### Local Development
1. Start PostgreSQL database
2. Run migrations: `npm run migrate`
3. Run seeds: `npm run seed`
4. Start application: `npm run dev`

### Testing
1. Use separate test database
2. Run migrations for test environment
3. Seed test data
4. Run tests with proper cleanup

### Production Deployment
1. Backup existing database
2. Run migrations in production
3. Monitor application logs
4. Verify data integrity

## Monitoring and Alerting

### Key Metrics
- Database connection count
- Query response times
- Error rates
- Storage usage

### Alerting Rules
- High connection usage (>80%)
- Slow query detection (>5 seconds)
- Migration failures
- Backup failures

## Disaster Recovery

### Backup Strategy
- Daily automated backups
- Weekly full backups
- Monthly backup testing
- Offsite backup storage

### Recovery Procedures
1. Assess damage scope
2. Restore from latest backup
3. Apply incremental changes
4. Verify data integrity
5. Resume normal operations

## FAQ

### Q: How do I add a new table?
A: Create a new migration file using `npm run migrate:make table_name` and define the table structure in the `up` function.

### Q: How do I modify an existing table?
A: Create a new migration file to alter the table. Never modify existing migration files.

### Q: How do I handle data migrations?
A: Create a migration that includes both schema changes and data transformation logic.

### Q: How do I optimize database performance?
A: Use appropriate indexes, optimize queries, and monitor performance metrics regularly.

### Q: How do I handle database connection issues?
A: Check connection parameters, verify database server status, and review application logs.