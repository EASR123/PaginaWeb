const sqlite3 = require('sqlite3').verbose();
const DBSOURCE = "db.sqlite";

const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
      // Cannot open database
      console.error(err.message)
      throw err
    } else {
        console.log('Connected to the SQLite database.')
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE, 
            password TEXT,             
            CONSTRAINT username_unique UNIQUE (username)
            )`);
        // Removed placeholder data insertion for users table for clarity here
        // It's better to handle seeding or initial data separately if needed.

        db.run(`CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
            )`,
        (err) => {
            if (err) {
                // Table already created or error
                console.error("Error creating posts table:", err.message);
            } else {
                console.log("Posts table created or already exists.");
                // Placeholder posts (optional, for testing)
                // const insertPost = 'INSERT INTO posts (title, content, user_id) VALUES (?,?,?)';
                // db.run(insertPost, ["First Post", "Content of the first post", 1]);
                // db.run(insertPost, ["Second Post", "Content of the second post", 2]);
            }
        });
    }
});
const { Octokit } = require('octokit');

async function backupToGitHub() {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  
  const content = fs.readFileSync(DBSOURCE, 'base64');
  
  await octokit.rest.gists.create({
    files: {
      [DB_KEY]: { content }
    },
    public: false,
    description: 'Backup de la base de datos'
  });
}

module.exports = db;
