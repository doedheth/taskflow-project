/**
 * Migration: Add Chat Memory Tables
 * - chat_conversations: Stores conversation sessions
 * - chat_messages: Stores individual messages
 * - user_context: Stores smart context (preferences, frequently asked topics)
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../../data/taskmanager.db');

async function migrate() {
  console.log('🔧 Adding chat memory tables...');

  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  try {
    // Create chat_conversations table
    db.run(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT,
        summary TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Created chat_conversations table');

    // Create chat_messages table
    db.run(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        context_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Created chat_messages table');

    // Create user_context table for smart memory
    db.run(`
      CREATE TABLE IF NOT EXISTS user_context (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        preferences TEXT DEFAULT '{}',
        frequent_topics TEXT DEFAULT '[]',
        favorite_tickets TEXT DEFAULT '[]',
        last_queries TEXT DEFAULT '[]',
        insights TEXT DEFAULT '{}',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Created user_context table');

    // Create indexes for better performance
    db.run('CREATE INDEX IF NOT EXISTS idx_chat_conv_user ON chat_conversations(user_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_chat_msg_conv ON chat_messages(conversation_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_user_context_user ON user_context(user_id)');
    console.log('✅ Created indexes');

    // Save database
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);

    console.log('🎉 Chat memory migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    db.close();
  }
}

migrate().catch(console.error);
