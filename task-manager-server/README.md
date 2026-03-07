# Task Manager Server

Backend API untuk Task Manager System - RESTful API untuk manajemen tugas, maintenance, dan production monitoring.

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **SQL.js** - SQLite database (in-memory/file-based)
- **JWT** - Authentication
- **OpenAI** - AI integration
- **Multer** - File uploads
- **Node-cron** - Scheduled jobs

## Features

### Core API
- User authentication (JWT-based)
- Role-based access control
- RESTful API endpoints

### Task Management
- Tickets CRUD
- Epics & Sprints management
- Comments system
- Dashboard analytics

### Maintenance Management
- Work Orders API
- Asset management
- Maintenance scheduling
- Downtime tracking

### AI Integration
- AI-powered reports
- Predictive maintenance
- Smart work order suggestions
- Duplicate detection
- Task prioritization

### Other Features
- File uploads
- Notifications
- Quick actions
- Department management

## Getting Started

### Prerequisites

- Node.js 18+
- npm atau yarn

### Installation

```bash
# Clone repository
git clone https://github.com/doedheth/task-manager-server.git
cd task-manager-server

# Install dependencies
npm install

# Setup database
npm run db:setup

# Run development server
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with ts-node |
| `npm run dev:watch` | Start with auto-reload (nodemon) |
| `npm run build` | Compile TypeScript |
| `npm start` | Run production build |
| `npm run db:setup` | Initialize database |
| `npm run db:migrate` | Run database migrations |
| `npm test` | Run tests |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

### Environment Variables

Buat file `.env` di root project:

```env
# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# OpenAI (optional, for AI features)
OPENAI_API_KEY=your-openai-api-key
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |

### Tickets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v2/tickets` | Get all tickets |
| POST | `/api/v2/tickets` | Create ticket |
| GET | `/api/v2/tickets/:id` | Get ticket by ID |
| PUT | `/api/v2/tickets/:id` | Update ticket |
| DELETE | `/api/v2/tickets/:id` | Delete ticket |

### Work Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v2/work-orders` | Get all work orders |
| POST | `/api/v2/work-orders` | Create work order |
| GET | `/api/v2/work-orders/:id` | Get work order by ID |
| PUT | `/api/v2/work-orders/:id` | Update work order |

### Maintenance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/maintenance/assets` | Get all assets |
| GET | `/api/maintenance/calendar` | Get maintenance calendar |
| GET | `/api/maintenance/kpi` | Get maintenance KPIs |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v2/ai/reports` | Generate AI report |
| GET | `/api/v2/ai/settings` | Get AI settings |
| POST | `/api/v2/ai/predict` | Get AI predictions |

## Project Structure

```
src/
├── controllers/      # Request handlers
├── database/         # Database setup & migrations
│   └── migrations/   # Migration files
├── jobs/             # Scheduled jobs (cron)
├── middleware/       # Express middleware
├── models/           # Data models & repositories
├── routes/           # API route definitions
│   └── v2/           # API v2 routes
├── services/         # Business logic
│   └── ai/           # AI services
├── types/            # TypeScript type definitions
└── index.ts          # Application entry point
```

## Testing

```bash
# Run all tests
npm test

# Run with watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Related Projects

- [task-manager-client](https://github.com/doedheth/task-manager-client) - Frontend React App

## License

Private - All rights reserved
