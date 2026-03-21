const path = require('path');
const fs = require('fs');        
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

let dbPromise;

async function getDb() {
  if (!dbPromise) {
    const dbDir = path.join(__dirname, 'data');
    fs.mkdirSync(dbDir, { recursive: true }); 

    dbPromise = open({
      filename: path.join(__dirname, 'data', 'portal.sqlite'),
      driver: sqlite3.Database,
    });

    const db = await dbPromise;
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        avatar_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  return dbPromise;
}

module.exports = { getDb };