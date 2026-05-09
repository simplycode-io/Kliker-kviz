const Database = require('better-sqlite3');
const path = require('path');

// Create or open database
const dbPath = process.env.DB_PATH || path.join('/data', 'kviz.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
function initializeDatabase() {
  // Create quizzes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      questions TEXT NOT NULL,
      duration INTEGER DEFAULT 900,
      createdAt TEXT NOT NULL
    )
  `);

  // Add duration column if it doesn't exist (migration)
  try {
    db.prepare('SELECT duration FROM quizzes LIMIT 1').get();
  } catch (error) {
    db.exec('ALTER TABLE quizzes ADD COLUMN duration INTEGER DEFAULT 900');
  }

  // Create results table
  db.exec(`
    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quizId TEXT NOT NULL,
      ime TEXT NOT NULL,
      prezime TEXT NOT NULL,
      score INTEGER NOT NULL,
      vreme INTEGER NOT NULL,
      answers TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (quizId) REFERENCES quizzes(id)
    )
  `);
}

// Quiz functions
function getQuizzes() {
  const stmt = db.prepare('SELECT * FROM quizzes');
  return stmt.all();
}

function getQuiz(id) {
  const stmt = db.prepare('SELECT * FROM quizzes WHERE id = ?');
  return stmt.get(id);
}

function saveQuiz(id, name, questions, duration = 900) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO quizzes (id, name, questions, duration, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, name, JSON.stringify(questions), duration, new Date().toISOString());
}

function deleteQuiz(id) {
  // First delete all results for this quiz (due to foreign key constraint)
  const deleteResults = db.prepare('DELETE FROM results WHERE quizId = ?');
  deleteResults.run(id);
  
  // Then delete the quiz itself
  const deleteQuizStmt = db.prepare('DELETE FROM quizzes WHERE id = ?');
  deleteQuizStmt.run(id);
}

function updateQuizName(id, newName) {
  const stmt = db.prepare('UPDATE quizzes SET name = ? WHERE id = ?');
  stmt.run(newName, id);
}

function updateQuizDuration(id, duration) {
  const stmt = db.prepare('UPDATE quizzes SET duration = ? WHERE id = ?');
  stmt.run(duration, id);
}

// Results functions
function saveResult(quizId, ime, prezime, score, vreme, answers) {
  const stmt = db.prepare(`
    INSERT INTO results (quizId, ime, prezime, score, vreme, answers, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(quizId, ime, prezime, score, vreme, JSON.stringify(answers), new Date().toISOString());
}

function getResults(quizId = null) {
  let stmt;
  if (quizId) {
    stmt = db.prepare('SELECT * FROM results WHERE quizId = ? ORDER BY score DESC, vreme ASC');
    return stmt.all(quizId);
  } else {
    stmt = db.prepare('SELECT * FROM results ORDER BY score DESC, vreme ASC');
    return stmt.all();
  }
}

// Initialize on load
initializeDatabase();

module.exports = {
  db,
  getQuizzes,
  getQuiz,
  saveQuiz,
  deleteQuiz,
  updateQuizName,
  updateQuizDuration,
  saveResult,
  getResults
};
