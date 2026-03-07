# Task Manager Client

Frontend application untuk Task Manager System - aplikasi manajemen tugas, maintenance, dan production monitoring.

## Tech Stack

- **React 18** - UI Library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool & dev server
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Query** - Data fetching & caching
- **Recharts** - Charts & data visualization
- **Lucide React** - Icon library
- **React Quill** - Rich text editor
- **dnd-kit** - Drag and drop functionality

## Features

### Task Management
- Kanban Board dengan drag & drop
- Sprint management
- Epic & ticket tracking
- Team performance dashboard

### Maintenance Management
- Work Orders management
- Asset tracking & detail
- Maintenance calendar
- Maintenance KPI dashboard

### Production
- Production schedule
- Production downtime tracking
- Production KPI monitoring
- Downtime classifications
- Failure codes management

### AI Features
- AI Reports generation
- AI Settings configuration

### Other Features
- User authentication (Login/Register)
- Department management
- User management & profiles
- Dark/Light theme support
- Real-time notifications

## Getting Started

### Prerequisites

- Node.js 18+
- npm atau yarn

### Installation

```bash
# Clone repository
git clone https://github.com/doedheth/task-manager-client.git
cd task-manager-client

# Install dependencies
npm install

# Run development server
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

### Environment Variables

Buat file `.env` di root project:

```env
VITE_API_URL=http://localhost:3000
```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── Dashboard/    # Dashboard components
│   ├── maintenance/  # Maintenance components
│   └── ...
├── context/          # React Context providers
├── hooks/            # Custom React hooks
├── pages/            # Page components
│   ├── AIReports/    # AI Reports pages
│   ├── Dashboard/    # Dashboard pages
│   └── ...
├── providers/        # App providers
├── services/         # API services
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## Related Projects

- [task-manager-server](https://github.com/doedheth/task-manager-server) - Backend API

## License

Private - All rights reserved
