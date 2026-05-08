const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { getQuizzes, getQuiz, saveQuiz, deleteQuiz, updateQuizName, saveResult, getResults } = require('./db');

const app = express();
const port = process.env.PORT || 3000;

// Files for storing data - NOW USING DATABASE
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'tajna123';
const adminTokens = new Map();
const tokenExpiry = 24 * 60 * 60 * 1000; // 24 hours

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function validateAdminToken(token) {
  if (!adminTokens.has(token)) return false;
  const data = adminTokens.get(token);
  if (Date.now() > data.expiresAt) {
    adminTokens.delete(token);
    return false;
  }
  return true;
}

function requireAdminToken(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || !validateAdminToken(token)) {
    return res.status(401).json({ success: false, error: 'Neautentifikovan pristup' });
  }
  next();
}

const defaultQuestions = [
  {
    question: "Koja je boja neba?",
    options: ["Plava", "Zelena", "Crvena", "Žuta"],
    correct: 0
  },
  {
    question: "Koliko nogu ima pauk?",
    options: ["6", "8", "10", "4"],
    correct: 1
  },
  {
    question: "Koji je glavni grad Srbije?",
    options: ["Novi Sad", "Beograd", "Niš", "Kragujevac"],
    correct: 1
  },
  {
    question: "Šta je 2 + 2?",
    options: ["3", "4", "5", "6"],
    correct: 1
  },
  {
    question: "Koja životinja je poznata kao 'kralj džungle'?",
    options: ["Slon", "Lav", "Tigar", "Majmun"],
    correct: 1
  },
  {
    question: "Koliko dana ima u nedelji?",
    options: ["5", "6", "7", "8"],
    correct: 2
  },
  {
    question: "Koja planeta je najbliža Suncu?",
    options: ["Zemlja", "Mars", "Merkur", "Venera"],
    correct: 2
  },
  {
    question: "Šta koristimo da bismo videli?",
    options: ["Uši", "Nos", "Oči", "Usta"],
    correct: 2
  },
  {
    question: "Koja je najveća životinja na svetu?",
    options: ["Slon", "Kit", "Nosorog", "Žirafa"],
    correct: 1
  },
  {
    question: "Koliko sati ima u danu?",
    options: ["12", "24", "36", "48"],
    correct: 1
  },
  {
    question: "Koja boja je jabuka?",
    options: ["Plava", "Zelena", "Crvena", "Žuta"],
    correct: 2
  },
  {
    question: "Šta je H2O?",
    options: ["Voda", "Vazduh", "Zemlja", "Vatra"],
    correct: 0
  },
  {
    question: "Koliko prstiju ima na jednoj ruci?",
    options: ["4", "5", "6", "7"],
    correct: 1
  },
  {
    question: "Koja je najbrža životinja na kopnu?",
    options: ["Lav", "Gepard", "Zec", "Konj"],
    correct: 1
  },
  {
    question: "Šta je glavni sastojak hleba?",
    options: ["Mleko", "Brašno", "Šećer", "So"],
    correct: 1
  },
  {
    question: "Koliko kontinenata ima na Zemlji?",
    options: ["5", "6", "7", "8"],
    correct: 2
  },
  {
    question: "Koja je najveća ptica?",
    options: ["Orao", "Noj", "Papagaj", "Golub"],
    correct: 1
  },
  {
    question: "Šta je 10 - 3?",
    options: ["6", "7", "8", "9"],
    correct: 1
  },
  {
    question: "Koja životinja spava zimi?",
    options: ["Medved", "Lav", "Majmun", "Slon"],
    correct: 0
  },
  {
    question: "Koliko meseci ima u godini?",
    options: ["10", "11", "12", "13"],
    correct: 2
  }
];

const defaultQuizzes = [
  {
    id: 'default',
    name: 'Opšti kviz',
    questions: defaultQuestions,
    createdAt: new Date().toISOString()
  }
];

function readJson(filePath, fallback) {
  // Deprecated - using database instead
  return fallback;
}

function writeJson(filePath, data) {
  // Deprecated - using database instead
}

function loadQuizzes() {
  return getQuizzes();
}

function initializeDefaultQuiz() {
  const existing = getQuiz('default');
  if (!existing) {
    saveQuiz('default', 'Opšti kviz', defaultQuestions);
  }
}

function generateQuizId(name, existingIds) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'kviz';
  let id = base;
  let count = 1;
  while (existingIds.includes(id)) {
    id = `${base}-${count++}`;
  }
  return id;
}

function ensureFiles() {
  // Deprecated - database initializes on load
  initializeDefaultQuiz();
}

ensureFiles();

app.use(express.json());
app.use(express.static('public'));

app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Pogrešna lozinka' });
  }
  const token = generateToken();
  adminTokens.set(token, {
    createdAt: Date.now(),
    expiresAt: Date.now() + tokenExpiry
  });
  res.json({ success: true, token });
});

app.post('/admin/logout', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (token) {
    adminTokens.delete(token);
  }
  res.json({ success: true });
});

app.get('/quizzes', (req, res) => {
  const quizzes = loadQuizzes();
  res.json(quizzes.map(q => ({ id: q.id, name: q.name, createdAt: q.createdAt })));
});

app.post('/quizzes', requireAdminToken, (req, res) => {
  const { name, sourceQuizId } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ success: false, error: 'Neispravan naziv kviza' });
  }
  const quizzes = loadQuizzes();
  const ids = quizzes.map(q => q.id);
  const id = generateQuizId(name, ids);
  let questions = defaultQuestions;

  if (sourceQuizId) {
    const sourceQuiz = getQuiz(sourceQuizId);
    if (!sourceQuiz) {
      return res.status(400).json({ success: false, error: 'Kviz za kopiranje nije pronađen' });
    }
    questions = JSON.parse(sourceQuiz.questions);
  }

  saveQuiz(id, name.trim(), questions);
  res.json({ success: true, quiz: { id, name: name.trim() } });
});

app.patch('/quizzes/:id', requireAdminToken, (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ success: false, error: 'Neispravan naziv kviza' });
  }
  
  if (id === 'default') {
    return res.status(403).json({ success: false, error: 'Ne možete preimenovati podrazumevani kviz' });
  }
  
  const quiz = getQuiz(id);
  if (!quiz) {
    return res.status(404).json({ success: false, error: 'Kviz nije pronađen' });
  }
  
  updateQuizName(id, name.trim());
  res.json({ success: true, quiz: { id, name: name.trim() } });
});

app.delete('/quizzes/:id', requireAdminToken, (req, res) => {
  const { id } = req.params;
  
  if (id === 'default') {
    return res.status(403).json({ success: false, error: 'Ne možete obrisati podrazumevani kviz' });
  }
  
  const quiz = getQuiz(id);
  if (!quiz) {
    return res.status(404).json({ success: false, error: 'Kviz nije pronađen' });
  }
  
  deleteQuiz(id);
  res.json({ success: true });
});

app.get('/questions', (req, res) => {
  const quizId = req.query.quizId || 'default';
  const quiz = getQuiz(quizId);
  if (!quiz) {
    return res.status(404).json({ success: false, error: 'Kviz nije pronađen' });
  }
  res.json({ id: quiz.id, name: quiz.name, questions: JSON.parse(quiz.questions) });
});

app.post('/questions', requireAdminToken, (req, res) => {
  const quizId = req.query.quizId;
  if (!quizId) {
    return res.status(400).json({ success: false, error: 'Nedostaje quizId' });
  }
  const newQuestions = req.body;
  if (!Array.isArray(newQuestions)) {
    return res.status(400).json({ success: false, error: 'Neispravan format pitanja' });
  }
  const quiz = getQuiz(quizId);
  if (!quiz) {
    return res.status(404).json({ success: false, error: 'Kviz nije pronađen' });
  }
  saveQuiz(quizId, quiz.name, newQuestions);
  res.json({ success: true });
});

app.post('/save-result', (req, res) => {
  const { ime, prezime, score, vreme, answers, quizId = 'default' } = req.body;
  
  const quiz = getQuiz(quizId);
  if (!quiz) {
    return res.status(400).json({ success: false, error: 'Kviz nije pronađen' });
  }
  
  saveResult(quizId, ime, prezime, score, vreme, answers);
  res.json({ success: true });
});

app.get('/results', (req, res) => {
  const quizId = req.query.quizId;
  const results = getResults(quizId);
  
  const formatted = results.map(r => ({
    quizId: r.quizId,
    ime: r.ime,
    prezime: r.prezime,
    score: r.score,
    vreme: r.vreme,
    answers: JSON.parse(r.answers),
    timestamp: r.timestamp
  }));
  
  res.json(formatted);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});