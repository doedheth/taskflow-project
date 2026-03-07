import bcrypt from 'bcryptjs';
import { prepare, saveDb } from '../db';

export function seedSampleData(): void {
  console.log('🌱 Seeding sample data...');

  try {
    // 1. Default Departments
    const deptCount = prepare('SELECT COUNT(*) as count FROM departments').get() as { count: number };
    if (deptCount.count === 0) {
      const departments = [
        ['Engineering', 'Software Development Team', '#3B82F6'],
        ['Design', 'UI/UX Design Team', '#8B5CF6'],
        ['Marketing', 'Marketing & Growth Team', '#10B981'],
        ['Support', 'Customer Support Team', '#F59E0B'],
      ];
      const stmt = prepare('INSERT OR IGNORE INTO departments (name, description, color) VALUES (?, ?, ?)');
      departments.forEach(dept => stmt.run(...dept));
      console.log('✅ Seeded default departments');
    }

    // 2. Admin & Sample Users
    const userCount = prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    if (userCount.count === 0) {
      const adminPassword = bcrypt.hashSync('admin123', 10);
      const samplePassword = bcrypt.hashSync('password123', 10);

      prepare('INSERT OR IGNORE INTO users (email, password, name, role, department_id) VALUES (?, ?, ?, ?, ?)').run(
        'admin@taskmanager.com', adminPassword, 'Administrator', 'admin', 1
      );

      const sampleUsers = [
        ['john@taskmanager.com', samplePassword, 'John Doe', 'manager', 1],
        ['jane@taskmanager.com', samplePassword, 'Jane Smith', 'member', 2],
        ['bob@taskmanager.com', samplePassword, 'Bob Wilson', 'member', 1],
      ];
      const stmt = prepare('INSERT OR IGNORE INTO users (email, password, name, role, department_id) VALUES (?, ?, ?, ?, ?)');
      sampleUsers.forEach(user => stmt.run(...user));
      console.log('✅ Seeded sample users');
    }

    // 3. Sample Sprints
    const sprintCount = prepare('SELECT COUNT(*) as count FROM sprints').get() as { count: number };
    if (sprintCount.count === 0) {
      const today = new Date();
      const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
      const fourWeeksFromNow = new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000);

      const sampleSprints = [
        ['Sprint 1 - Foundation', 'Setup core infrastructure', today.toISOString().split('T')[0], twoWeeksFromNow.toISOString().split('T')[0], 'active'],
        ['Sprint 2 - Features', 'Implement main features', twoWeeksFromNow.toISOString().split('T')[0], fourWeeksFromNow.toISOString().split('T')[0], 'planning'],
      ];
      const stmt = prepare('INSERT OR IGNORE INTO sprints (name, goal, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)');
      sampleSprints.forEach(sprint => stmt.run(...sprint));
      console.log('✅ Seeded sample sprints');
    }

    // 4. Sample Tickets
    const ticketCount = prepare('SELECT COUNT(*) as count FROM tickets').get() as { count: number };
    if (ticketCount.count === 0) {
      const sampleTickets = [
        ['TM-1', 'User Management System', 'epic', 'high', 'in_progress', 1, 1, null, null, null],
        ['TM-2', 'Setup project infrastructure', 'task', 'high', 'done', 1, 1, 1, 3, 1],
        ['TM-3', 'Design landing page mockups', 'story', 'medium', 'in_progress', 1, 2, 1, 5, 1],
        ['TM-4', 'Fix login page layout bug', 'bug', 'critical', 'todo', 2, 1, 1, 2, 1],
        ['TM-5', 'Create API documentation', 'task', 'low', 'todo', 3, 1, null, 8, 2],
        ['TM-6', 'Mobile App Development', 'epic', 'medium', 'todo', 1, 1, null, null, null],
      ];
      const stmt = prepare('INSERT OR IGNORE INTO tickets (ticket_key, title, type, priority, status, reporter_id, department_id, epic_id, story_points, sprint_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      sampleTickets.forEach(ticket => stmt.run(...ticket));

      // Add assignees for sample tickets
      const assignees = [
        [1, 1], [2, 3], [2, 4], [3, 2], [4, 3], [4, 1], [6, 2], [6, 3]
      ];
      const assigneeStmt = prepare('INSERT OR IGNORE INTO ticket_assignees (ticket_id, user_id) VALUES (?, ?)');
      assignees.forEach(a => assigneeStmt.run(...a));

      prepare('UPDATE ticket_counter SET counter = 6 WHERE id = 1').run();
      console.log('✅ Seeded sample tickets');
    }

    saveDb();
    console.log('✅ Sample data seeding completed');
  } catch (error) {
    console.error('❌ Sample data seeding failed:', error);
  }
}
