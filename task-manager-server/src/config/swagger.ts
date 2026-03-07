import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Manager API',
      version: '1.0.0',
      description: 'REST API untuk Task Manager System - Manajemen tugas, maintenance, dan production monitoring',
      contact: {
        name: 'API Support',
        email: 'support@taskmanager.com',
      },
    },
    servers: [
      {
        url: '/',
        description: 'Current server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'User ID' },
            username: { type: 'string', description: 'Username' },
            email: { type: 'string', format: 'email', description: 'Email address' },
            role: { type: 'string', enum: ['admin', 'user', 'supervisor'], description: 'User role' },
            department_id: { type: 'integer', nullable: true, description: 'Department ID' },
            created_at: { type: 'string', format: 'date-time', description: 'Created timestamp' },
          },
        },
        Ticket: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Ticket ID' },
            title: { type: 'string', description: 'Ticket title' },
            description: { type: 'string', description: 'Ticket description' },
            status: { type: 'string', enum: ['open', 'in_progress', 'resolved', 'closed'], description: 'Ticket status' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Priority level' },
            created_by: { type: 'integer', description: 'Creator user ID' },
            assigned_to: { type: 'integer', nullable: true, description: 'Assigned user ID' },
            created_at: { type: 'string', format: 'date-time', description: 'Created timestamp' },
            updated_at: { type: 'string', format: 'date-time', description: 'Updated timestamp' },
          },
        },
        WorkOrder: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Work Order ID' },
            title: { type: 'string', description: 'Work order title' },
            description: { type: 'string', description: 'Work order description' },
            status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'], description: 'Status' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Priority' },
            asset_id: { type: 'integer', nullable: true, description: 'Related asset ID' },
            work_type: { type: 'string', description: 'Type of work' },
            scheduled_date: { type: 'string', format: 'date', description: 'Scheduled date' },
            created_at: { type: 'string', format: 'date-time', description: 'Created timestamp' },
          },
        },
        Asset: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Asset ID' },
            name: { type: 'string', description: 'Asset name' },
            asset_code: { type: 'string', description: 'Asset code' },
            category: { type: 'string', description: 'Asset category' },
            location: { type: 'string', description: 'Asset location' },
            status: { type: 'string', enum: ['active', 'inactive', 'maintenance'], description: 'Status' },
            created_at: { type: 'string', format: 'date-time', description: 'Created timestamp' },
          },
        },
        DowntimeEvent: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Downtime event ID' },
            asset_id: { type: 'integer', description: 'Asset ID' },
            classification_code: { type: 'string', description: 'Classification code' },
            start_time: { type: 'string', format: 'date-time', description: 'Start time' },
            end_time: { type: 'string', format: 'date-time', nullable: true, description: 'End time' },
            duration_minutes: { type: 'integer', description: 'Duration in minutes' },
            notes: { type: 'string', description: 'Notes' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management' },
      { name: 'Tickets', description: 'Ticket management' },
      { name: 'Work Orders', description: 'Work order management' },
      { name: 'Assets', description: 'Asset management' },
      { name: 'Downtime', description: 'Downtime tracking' },
      { name: 'Maintenance', description: 'Maintenance operations' },
      { name: 'AI', description: 'AI-powered features' },
      { name: 'Reports', description: 'Reporting endpoints' },
      { name: 'Dashboard', description: 'Dashboard analytics' },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/routes/v2/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
