import initSqlJs from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcryptjs';
import { migrateMachineParameterOrder } from './migrations/add_machine_parameter_order';

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'taskmanager.db');

interface SampleDepartment {
  name: string;
  description: string;
  color: string;
}

interface SampleUser {
  email: string;
  name: string;
  role: string;
  dept: number;
}

interface SampleSprint {
  name: string;
  goal: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface SampleTicket {
  key: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  reporter: number;
  dept: number;
  epic: number | null;
  points: number | null;
  sprint: number | null;
  assignees: number[];
}

interface SampleNotification {
  user_id: number;
  type: string;
  title: string;
  message: string;
  ticket_id: number;
  ticket_key: string;
  actor_id: number;
  actor_name: string;
  is_read: number;
}

async function setup(): Promise<void> {
  console.log('🔧 Setting up database...');

  const SQL = await initSqlJs();
  const db = new SQL.Database();

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  console.log('📦 Creating tables...');

  // Create tables
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      whatsapp TEXT,
      role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'manager', 'supervisor', 'member')),
      department_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
    );

    -- Departments table
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#3B82F6',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Sprints table
    CREATE TABLE IF NOT EXISTS sprints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      goal TEXT,
      start_date DATE,
      end_date DATE,
      status TEXT DEFAULT 'planning' CHECK(status IN ('planning', 'active', 'completed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tickets table
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_key TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT DEFAULT 'task' CHECK(type IN ('bug', 'task', 'story', 'epic')),
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
      status TEXT DEFAULT 'todo' CHECK(status IN ('todo', 'in_progress', 'review', 'done')),
      story_points INTEGER,
      reporter_id INTEGER NOT NULL,
      assignee_id INTEGER,
      department_id INTEGER,
      epic_id INTEGER,
      sprint_id INTEGER,
      due_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
      FOREIGN KEY (epic_id) REFERENCES tickets(id) ON DELETE SET NULL,
      FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE SET NULL
    );

    -- Comments table
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      ticket_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Attachments table
    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mimetype TEXT,
      size INTEGER,
      ticket_id INTEGER NOT NULL,
      uploaded_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Activity log table
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Ticket counter for generating ticket keys
    CREATE TABLE IF NOT EXISTS ticket_counter (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      counter INTEGER DEFAULT 0
    );

    -- Ticket assignees (many-to-many relationship)
    CREATE TABLE IF NOT EXISTS ticket_assignees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(ticket_id, user_id)
    );

    -- Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      ticket_id INTEGER,
      ticket_key TEXT,
      actor_id INTEGER,
      actor_name TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL,
      FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Chat conversations table
    CREATE TABLE IF NOT EXISTS chat_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      summary TEXT,
      is_active INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Chat messages table
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system', 'tool')),
      content TEXT NOT NULL,
      context_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
    );

    -- User context table
    CREATE TABLE IF NOT EXISTS user_context (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      preferences TEXT DEFAULT '{}',
      frequent_topics TEXT DEFAULT '[]',
      favorite_tickets TEXT DEFAULT '[]',
      last_queries TEXT DEFAULT '[]',
      insights TEXT DEFAULT '{}',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations (user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages (conversation_id);
    CREATE INDEX IF NOT EXISTS idx_user_context_user_id ON user_context (user_id);
    );

    -- Machine Parameters tables
    CREATE TABLE IF NOT EXISTS machine_parameters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      section TEXT NOT NULL, -- e.g. 'Temp Extruder', 'Speed'
      unit TEXT,
      setting_a_min REAL,
      setting_a_max REAL,
      setting_b_min REAL,
      setting_b_max REAL,
      setting_c_min REAL,
      setting_c_max REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS machine_parameter_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL,
      production_date DATE NOT NULL,
      shift TEXT, -- e.g. 'Shift 1', 'Shift 2'
      product_name TEXT,
      operator_name TEXT,
      created_by INTEGER, -- User ID
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS machine_parameter_values (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      set_id INTEGER NOT NULL,
      parameter_id INTEGER NOT NULL,
      value REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (set_id) REFERENCES machine_parameter_sets(id) ON DELETE CASCADE,
      FOREIGN KEY (parameter_id) REFERENCES machine_parameters(id) ON DELETE CASCADE
    );

    -- Create indexes for machine parameters tables
    CREATE INDEX IF NOT EXISTS idx_machine_parameters_asset ON machine_parameters(asset_id);
    CREATE INDEX IF NOT EXISTS idx_machine_parameter_sets_asset_date ON machine_parameter_sets(asset_id, production_date);
    CREATE INDEX IF NOT EXISTS idx_machine_parameter_values_set ON machine_parameter_values(set_id);
  `);

  // Initialize ticket counter
  db.run('INSERT OR IGNORE INTO ticket_counter (id, counter) VALUES (1, 0)');

  // Run migrations
  migrateMachineParameterOrder();

  console.log('✅ Tables created successfully');

  // Create default departments
  const departments: SampleDepartment[] = [
    { name: 'Engineering', description: 'Software Development Team', color: '#3B82F6' },
    { name: 'Design', description: 'UI/UX Design Team', color: '#8B5CF6' },
    { name: 'Marketing', description: 'Marketing & Growth Team', color: '#10B981' },
    { name: 'Support', description: 'Customer Support Team', color: '#F59E0B' },
  ];

  departments.forEach(dept => {
    db.run('INSERT OR IGNORE INTO departments (name, description, color) VALUES (?, ?, ?)', [
      dept.name,
      dept.description,
      dept.color,
    ]);
  });

  console.log('✅ Default departments created');

  // Create admin user
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(
    'INSERT OR IGNORE INTO users (email, password, name, role, department_id) VALUES (?, ?, ?, ?, ?)',
    ['admin@taskmanager.com', adminPassword, 'Administrator', 'admin', 1]
  );

  // Create sample users
  const samplePassword = bcrypt.hashSync('password123', 10);
  const sampleUsers: SampleUser[] = [
    { email: 'john@taskmanager.com', name: 'John Doe', role: 'manager', dept: 1 },
    { email: 'jane@taskmanager.com', name: 'Jane Smith', role: 'member', dept: 2 },
    { email: 'bob@taskmanager.com', name: 'Bob Wilson', role: 'member', dept: 1 },
  ];

  sampleUsers.forEach(user => {
    db.run(
      'INSERT OR IGNORE INTO users (email, password, name, role, department_id) VALUES (?, ?, ?, ?, ?)',
      [user.email, samplePassword, user.name, user.role, user.dept]
    );
  });

  console.log('✅ Sample users created');

  // Create sample sprints
  const today = new Date();
  const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  const fourWeeksFromNow = new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000);

  const sampleSprints: SampleSprint[] = [
    {
      name: 'Sprint 1 - Foundation',
      goal: 'Setup core infrastructure and basic authentication',
      start_date: today.toISOString().split('T')[0],
      end_date: twoWeeksFromNow.toISOString().split('T')[0],
      status: 'active',
    },
    {
      name: 'Sprint 2 - Features',
      goal: 'Implement main features and UI components',
      start_date: twoWeeksFromNow.toISOString().split('T')[0],
      end_date: fourWeeksFromNow.toISOString().split('T')[0],
      status: 'planning',
    },
  ];

  sampleSprints.forEach(sprint => {
    db.run(
      'INSERT OR IGNORE INTO sprints (name, goal, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)',
      [sprint.name, sprint.goal, sprint.start_date, sprint.end_date, sprint.status]
    );
  });

  console.log('✅ Sample sprints created');

  // Create sample tickets - Epic first (TM-1) with story points and sprint
  const sampleTickets: SampleTicket[] = [
    {
      key: 'TM-1',
      title: 'User Management System',
      type: 'epic',
      priority: 'high',
      status: 'in_progress',
      reporter: 1,
      dept: 1,
      epic: null,
      points: null,
      sprint: null,
      assignees: [1],
    },
    {
      key: 'TM-2',
      title: 'Setup project infrastructure',
      type: 'task',
      priority: 'high',
      status: 'done',
      reporter: 1,
      dept: 1,
      epic: 1,
      points: 3,
      sprint: 1,
      assignees: [3, 4],
    },
    {
      key: 'TM-3',
      title: 'Design landing page mockups',
      type: 'story',
      priority: 'medium',
      status: 'in_progress',
      reporter: 1,
      dept: 2,
      epic: 1,
      points: 5,
      sprint: 1,
      assignees: [2],
    },
    {
      key: 'TM-4',
      title: 'Fix login page layout bug',
      type: 'bug',
      priority: 'critical',
      status: 'todo',
      reporter: 2,
      dept: 1,
      epic: 1,
      points: 2,
      sprint: 1,
      assignees: [3, 1],
    },
    {
      key: 'TM-5',
      title: 'Create API documentation',
      type: 'task',
      priority: 'low',
      status: 'todo',
      reporter: 3,
      dept: 1,
      epic: null,
      points: 8,
      sprint: 2,
      assignees: [],
    },
    {
      key: 'TM-6',
      title: 'Mobile App Development',
      type: 'epic',
      priority: 'medium',
      status: 'todo',
      reporter: 1,
      dept: 1,
      epic: null,
      points: null,
      sprint: null,
      assignees: [2, 3],
    },
  ];

  sampleTickets.forEach((ticket, index) => {
    const ticketId = index + 1;
    db.run(
      'INSERT OR IGNORE INTO tickets (ticket_key, title, type, priority, status, reporter_id, department_id, epic_id, story_points, sprint_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        ticket.key,
        ticket.title,
        ticket.type,
        ticket.priority,
        ticket.status,
        ticket.reporter,
        ticket.dept,
        ticket.epic,
        ticket.points,
        ticket.sprint,
      ]
    );

    // Add assignees
    ticket.assignees.forEach(userId => {
      db.run('INSERT INTO ticket_assignees (ticket_id, user_id) VALUES (?, ?)', [ticketId, userId]);
    });
  });

  // Update ticket counter
  db.run('UPDATE ticket_counter SET counter = 6 WHERE id = 1');

  console.log('✅ Sample tickets created');

  // Create sample notifications
  const sampleNotifications: SampleNotification[] = [
    {
      user_id: 1,
      type: 'assigned',
      title: 'New Assignment',
      message: 'You have been assigned to TM-4: Fix login page layout bug',
      ticket_id: 4,
      ticket_key: 'TM-4',
      actor_id: 2,
      actor_name: 'John Doe',
      is_read: 0,
    },
    {
      user_id: 1,
      type: 'comment',
      title: 'New Comment',
      message: 'John Doe commented on TM-1: User Management System',
      ticket_id: 1,
      ticket_key: 'TM-1',
      actor_id: 2,
      actor_name: 'John Doe',
      is_read: 0,
    },
    {
      user_id: 1,
      type: 'status',
      title: 'Status Changed',
      message: 'TM-2 status changed to Done',
      ticket_id: 2,
      ticket_key: 'TM-2',
      actor_id: 3,
      actor_name: 'Jane Smith',
      is_read: 1,
    },
    {
      user_id: 2,
      type: 'assigned',
      title: 'New Assignment',
      message: 'You have been assigned to TM-3: Design landing page mockups',
      ticket_id: 3,
      ticket_key: 'TM-3',
      actor_id: 1,
      actor_name: 'Administrator',
      is_read: 0,
    },
    {
      user_id: 3,
      type: 'mention',
      title: 'Mentioned',
      message: 'Administrator mentioned you in TM-2',
      ticket_id: 2,
      ticket_key: 'TM-2',
      actor_id: 1,
      actor_name: 'Administrator',
      is_read: 0,
    },
  ];

  sampleNotifications.forEach(notif => {
    db.run(
      'INSERT INTO notifications (user_id, type, title, message, ticket_id, ticket_key, actor_id, actor_name, is_read) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        notif.user_id,
        notif.type,
        notif.title,
        notif.message,
        notif.ticket_id,
        notif.ticket_key,
        notif.actor_id,
        notif.actor_name,
        notif.is_read,
      ]
    );
  });

  console.log('✅ Sample notifications created');

  // Save database to file
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);

  console.log('');
  console.log('🎉 Database setup complete!');
  console.log('');
  console.log('📧 Admin Login:');
  console.log('   Email: admin@taskmanager.com');
  console.log('   Password: admin123');
  console.log('');
  console.log('📧 Sample User Login:');
  console.log('   Email: john@taskmanager.com');
  console.log('   Password: password123');
  console.log('');

  db.close();
}

setup().catch(console.error);
