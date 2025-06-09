const sqlite3 = require('sqlite3').verbose();
const { Octokit } = require('octokit');
const fs = require('fs');
const path = require('path');

// Configuración
const DBSOURCE = "db.sqlite";
const DB_KEY = 'db_backup.sqlite';
const BACKUP_METHOD = process.env.BACKUP_METHOD || 'github'; // 'github' o 's3'

// Inicializa la base de datos
const db = new sqlite3.Database(DBSOURCE, async (err) => {
  if (err) {
    console.error(err.message);
    throw err;
  }

  console.log('Connected to the SQLite database.');
  
  try {
    // 1. Intentar restaurar backup si existe
    if (BACKUP_METHOD === 'github') {
      await restoreFromGitHub();
    } else {
      await downloadDatabaseFromS3();
    }
    
    // 2. Crear tablas si no existen
    await createTables();
    
    console.log('Database initialization complete.');
  } catch (initError) {
    console.error('Error during database initialization:', initError);
  }
});

// ======================
// Backup con GitHub Gists
// ======================
async function backupToGitHub() {
  try {
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN no está configurado');
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const content = fs.readFileSync(DBSOURCE, 'base64');
    
    const response = await octokit.rest.gists.create({
      files: {
        [DB_KEY]: { content }
      },
      public: false,
      description: `Backup de la base de datos - ${new Date().toISOString()}`
    });
    
    console.log('Backup en GitHub creado:', response.data.html_url);
    return response.data.id; // Retorna el ID del gist para futuras actualizaciones
  } catch (error) {
    console.error('Error en backupToGitHub:', error);
    throw error;
  }
}

async function restoreFromGitHub() {
  try {
    if (!process.env.GITHUB_TOKEN || !process.env.GIST_ID) {
      console.log('No hay configuración para restaurar desde GitHub');
      return;
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const response = await octokit.rest.gists.get({
      gist_id: process.env.GIST_ID
    });

    const file = response.data.files[DB_KEY];
    if (file && file.content) {
      fs.writeFileSync(DBSOURCE, Buffer.from(file.content, 'base64'));
      console.log('Base de datos restaurada desde GitHub Gist');
    }
  } catch (error) {
    console.error('Error al restaurar desde GitHub:', error);
  }
}

// ======================
// Funciones comunes
// ======================
function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE, 
        password TEXT,
        CONSTRAINT username_unique UNIQUE (username)
      )`, (err) => {
        if (err) return reject(err);
        
        db.run(`CREATE TABLE IF NOT EXISTS posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )`, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  });
}

// Backup periódico
setInterval(async () => {
  try {
    if (BACKUP_METHOD === 'github') {
      await backupToGitHub();
    } else {
      await backupDatabaseToS3();
    }
  } catch (error) {
    console.error('Error en backup periódico:', error);
  }
}, 3600000); // Cada hora

// Manejo de cierre
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

async function gracefulShutdown() {
  console.log('Realizando backup final...');
  try {
    if (BACKUP_METHOD === 'github') {
      await backupToGitHub();
    } else {
      await backupDatabaseToS3();
    }
    db.close();
    process.exit(0);
  } catch (error) {
    console.error('Error durante el cierre:', error);
    process.exit(1);
  }
}

module.exports = db;
