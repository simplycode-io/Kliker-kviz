const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

// Files for storing data
const resultsFile = 'results.json';
const quizzesFile = 'quizzes.json';

// Admin authentication
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'tajna123';
const adminTokens = new Map(); // Store active tokens
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
  if (!fs.existsSync(filePath)) {
    return fallback;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch (error) {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function loadQuizzes() {
  return readJson(quizzesFile, defaultQuizzes);
}

function saveQuizzes(quizzes) {
  writeJson(quizzesFile, quizzes);
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
  if (!fs.existsSync(resultsFile)) {
    writeJson(resultsFile, []);
  }
  if (!fs.existsSync(quizzesFile)) {
    saveQuizzes(defaultQuizzes);
  }
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

app.get('/quizzes', requireAdminToken, (req, res) => {
  const quizzes = loadQuizzes();
  res.json(quizzes.map(({ id, name, createdAt }) => ({ id, name, createdAt })));
});

app.post('/quizzes', requireAdminToken, (req, res) => {
  const { name, sourceQuizId } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ success: false, error: 'Neispravan naziv kviza' });
  }
  const quizzes = loadQuizzes();
  const ids = quizzes.map((quiz) => quiz.id);
  const id = generateQuizId(name, ids);
  let questions = defaultQuestions;

  if (sourceQuizId) {
    const sourceQuiz = quizzes.find((quiz) => quiz.id === sourceQuizId);
    if (!sourceQuiz) {
      return res.status(400).json({ success: false, error: 'Kviz za kopiranje nije pronađen' });
    }
    questions = JSON.parse(JSON.stringify(sourceQuiz.questions));
  }

  const newQuiz = {
    id,
    name: name.trim(),
    questions,
    createdAt: new Date().toISOString()
  };
  quizzes.push(newQuiz);
  saveQuizzes(quizzes);
  res.json({ success: true, quiz: { id: newQuiz.id, name: newQuiz.name } });
});

app.get('/questions', requireAdminToken, (req, res) => {
  const quizId = req.query.quizId || 'default';
  const quizzes = loadQuizzes();
  const quiz = quizzes.find((q) => q.id === quizId);
  if (!quiz) {
    return res.status(404).json({ success: false, error: 'Kviz nije pronađen' });
  }
  res.json({ id: quiz.id, name: quiz.name, questions: quiz.questions });
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
  const quizzes = loadQuizzes();
  const quiz = quizzes.find((q) => q.id === quizId);
  if (!quiz) {
    return res.status(404).json({ success: false, error: 'Kviz nije pronađen' });
  }
  quiz.questions = newQuestions;
  saveQuizzes(quizzes);
  res.json({ success: true });
});

app.post('/save-result', (req, res) => {
  const { ime, prezime, score, vreme, answers, quizId = 'default' } = req.body;
  const results = readJson(resultsFile, []);
  results.push({ quizId, ime, prezime, score, vreme, answers, timestamp: new Date().toISOString() });
  writeJson(resultsFile, results);
  res.json({ success: true });
});

app.get('/results', (req, res) => {
  const quizId = req.query.quizId;
  let results = readJson(resultsFile, []);
  if (quizId) {
    results = results.filter((result) => result.quizId === quizId);
  }
  const sortedResults = results.slice().sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.vreme - b.vreme;
  });
  res.json(sortedResults);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});