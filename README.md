# SwarnaAI - Intelligent Precious Metals Trading Platform

## Overview

SwarnaAI is a comprehensive real-time precious metals price tracking and analysis platform built with modern web technologies. The application provides live price feeds, historical data analysis, AI-powered market insights, and a robust API abstraction layer supporting multiple data providers.

## Architecture

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│                 │    │                 │    │                 │
│ • React/TypeScript │ │ • Node.js       │    │ • PostgreSQL    │
│ • Tailwind CSS    │ │ • Express.js    │    │ • Knex.js       │
│ • Framer Motion   │ │ • WebSocket     │    │ • Migrations    │
│ • Real-time UI    │ │ • JWT Auth      │    │ • Seeding       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────┐
         │            External APIs                        │
         │                                                 │
         │ • GoldAPI.io      • MetalPriceAPI.com          │
         │ • Google Vertex AI • Real-time Data Feeds      │
         └─────────────────────────────────────────────────┘
```

### Key Features

- **Real-time Price Tracking**: Live precious metals prices with WebSocket updates
- **Multi-Provider Support**: Seamless switching between API providers (MetalPriceAPI, GoldAPI)
- **Database-Only Mode**: Production-ready offline mode with scheduled sync
- **AI-Powered Insights**: Google Vertex AI (Gemini 2.5-flash) for intelligent market analysis
- **Smart AI Assistant**: Context-aware chat and automated market insights
- **1-Year Historical Data**: Complete historical price tracking and analysis
- **Role-Based Access Control**: Secure authentication with user roles
- **Gold-Focused Design**: Premium gold-themed UI with smooth animations
- **Responsive Design**: Mobile-first responsive interface with modern UX
- **Dark Mode**: Theme switching with persistent preferences

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **Animations**: Framer Motion for smooth transitions
- **State Management**: Context API with custom hooks
- **Charts**: Recharts for data visualization
- **Build Tool**: Vite for fast development

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Knex.js ORM
- **Authentication**: JWT with role-based access control
- **Real-time**: WebSocket for live price updates
- **AI Integration**: Google Vertex AI for market insights
- **Documentation**: Swagger/OpenAPI 3.0
- **Testing**: Jest for unit and integration tests

### Infrastructure
- **Database**: PostgreSQL with connection pooling
- **Caching**: In-memory caching with TTL
- **Scheduling**: Node-cron for automated tasks
- **Monitoring**: Comprehensive logging and metrics
- **Security**: Helmet.js, CORS, rate limiting

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/swarnaai.git
   cd swarnaai
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Backend environment
   cd backend
   cp .env.example .env
   
   # Configure environment variables
   nano .env
   ```

4. **Database Setup**
   ```bash
   # Create database
   createdb swarnaai_dev
   
   # Run migrations
   npm run migrate
   
   # Seed initial data
   npm run seed
   ```

5. **Start Development Servers**
   ```bash
   # Start backend (Terminal 1)
   cd backend
   npm run dev
   
   # Start frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

### Production Deployment

1. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Start Production Server**
   ```bash
   cd backend
   NODE_ENV=production npm start
   ```

## Configuration

### Environment Variables

#### Backend (.env)
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=swarnaai_prod
DB_USER=postgres
DB_PASSWORD=your_password

# API Configuration
PRIMARY_API_PROVIDER=db
GOLDAPI_KEY=your_goldapi_key
METALPRICEAPI_KEY=your_metalpriceapi_key

# Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Data Sync
DATA_SYNC_INTERVAL=0 0 * * *  # Daily at midnight
SYNC_API_PROVIDER=metalpriceapi

# Google AI
GOOGLE_APPLICATION_CREDENTIALS=service-account.json
PROJECT_ID=your_project_id
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3001
VITE_APP_NAME=SwarnaAI
```

## API Documentation

### Base URL
- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

### Authentication
```bash
# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

# Register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Metals API
```bash
# Get all live prices
GET /api/metals/live

# Get specific metal price
GET /api/metals/gold/live

# Get historical price
GET /api/metals/gold/historical/20240115

# Get chart data
GET /api/metals/gold/chart/1D

# Get 1-year timeframe data
GET /api/metals/timeframe?start_date=2024-01-01&end_date=2025-01-01

# Convert between metals
POST /api/metals/convert
{
  "from": "XAU",
  "to": "INR",
  "amount": 1
}
```

### AI API
```bash
# Get AI assistant insights
GET /api/metals/ai/assistant

# Get market insights
GET /api/metals/ai/market-insights

# Chat with AI
POST /api/metals/ai/chat
{
  "query": "What is the gold trend?",
  "context": { "selectedMetal": "gold" }
}
```

### Admin API
```bash
# Switch API provider
POST /api/admin/provider/switch
{
  "provider": "db"
}

# Trigger manual sync
POST /api/admin/sync/trigger

# Get sync status
GET /api/admin/sync/status
```

### WebSocket API
```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3001');

// Subscribe to metals
ws.send(JSON.stringify({
  type: 'subscribe',
  metals: ['gold', 'silver', 'platinum', 'palladium']
}));

// Handle price updates
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'priceUpdate') {
    console.log('Price update:', message.data);
  }
};
```

## Database Schema

### Core Tables

#### Users & Authentication
- `roles` - User roles and permissions
- `users` - User accounts and profiles
- `user_sessions` - JWT session management
- `user_activity` - Audit logging

#### Metals Data
- `metal_prices` - Current and historical price data
- `api_logs` - API call tracking and statistics

### Migrations
```bash
# Create new migration
npm run migrate:make migration_name

# Run migrations
npm run migrate

# Rollback migration
npm run migrate:rollback
```

## Development

### Project Structure
```
swarnaai/
├── backend/
│   ├── src/
│   │   ├── auth/          # Authentication logic
│   │   ├── db/            # Database migrations & seeds
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Utility functions
│   │   └── websocket/     # WebSocket server
│   ├── docs/              # Documentation
│   └── tests/             # Test files
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
└── docs/                  # Project documentation
```

### Code Style
- **ESLint**: Configured for TypeScript and React
- **Prettier**: Consistent code formatting
- **Naming**: camelCase for variables, PascalCase for components
- **Comments**: JSDoc for functions and classes

### Testing
```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test

# Run integration tests
npm run test:integration
```

## Features

### 1. Real-time Price Updates
- WebSocket-based live price feeds
- Automatic reconnection handling
- Price change notifications
- Historical price tracking

### 2. Multi-Provider API Support
- GoldAPI.io integration
- MetalPriceAPI.com integration
- Automatic fallback mechanisms
- Runtime provider switching

### 3. Database-Only Mode
- Production-ready offline operation
- Scheduled data synchronization
- Configurable sync intervals
- Comprehensive error handling

### 4. AI-Powered Insights
- Google Vertex AI integration
- Market trend analysis
- Price prediction models
- Natural language insights

### 5. User Management
- JWT-based authentication
- Role-based access control
- User activity logging
- Session management

### 6. Responsive Design
- Mobile-first approach
- Dark/light theme support
- Smooth animations
- Accessibility features

## Documentation

### System Documentation
- [Database System](./backend/docs/DATABASE_SYSTEM.md)
- [WebSocket System](./backend/docs/WEBSOCKET_SYSTEM.md)
- [API Abstraction](./backend/docs/API_ABSTRACTION.md)
- [API Documentation](./backend/docs/api-documentation.md)

### Quick Start Guides
- [Backend Setup](./backend/README.md)
- [Frontend Setup](./frontend/README.md)
- [Database Setup](./backend/docs/DATABASE_SYSTEM.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## Support

- **API Documentation**: Available at `/api-docs` when running the backend
- **GitHub Issues**: For bug reports and feature requests
- **Documentation**: Comprehensive guides in the `/docs` folder
- **Community**: Discussions and support in GitHub Discussions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Acknowledgments

- Google Vertex AI for AI capabilities
- GoldAPI.io for precious metals data
- MetalPriceAPI.com for market data
- React and Node.js communities
