let questions = [];
let currentQuizId = new URLSearchParams(window.location.search).get('quizId') || 'default';
let currentQuizName = 'Kviz';
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

let currentQuestionIndex = 0;
let score = 0;
let timeLeft = 15 * 60; // 15 minutes in seconds
let timer;
let deadline = null;
let answers = [];
let ime, prezime;

const STORAGE_KEY = 'kviz-progress';
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const finishBtn = document.getElementById('finish-btn');

document.getElementById('start-btn').addEventListener('click', startQuiz);
document.getElementById('prev-btn').addEventListener('click', prevQuestion);
document.getElementById('next-btn').addEventListener('click', nextQuestion);
document.getElementById('finish-btn').addEventListener('click', finishQuiz);
document.getElementById('restart-btn').addEventListener('click', restartQuiz);
document.getElementById('admin-link').addEventListener('click', () => window.location.href = 'admin.html');

loadQuestions();

async function loadQuestions() {
    try {
        const response = await fetch(`/questions?quizId=${encodeURIComponent(currentQuizId)}`);
        if (!response.ok) {
            throw new Error('Neuspešno učitavanje pitanja.');
        }
        const data = await response.json();
        questions = data.questions || defaultQuestions;
        currentQuizName = data.name || 'Kviz';
        timeLeft = data.duration || 900; // Use quiz duration from API, default to 15 minutes
        document.getElementById('quiz-name').textContent = currentQuizName;
    } catch (error) {
        console.error('Greška pri učitavanju pitanja:', error);
        questions = defaultQuestions;
        document.getElementById('quiz-name').textContent = currentQuizName;
    }
    restoreState();
}

function startQuiz() {
    ime = document.getElementById('ime').value.trim();
    prezime = document.getElementById('prezime').value.trim();
    if (!ime || !prezime) {
        alert('Molimo unesite ime i prezime.');
        return;
    }
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    finishBtn.style.display = 'none';
    deadline = Date.now() + timeLeft * 1000;
    saveState();
    updateTimer();
    startTimer();
    showQuestion();
}

function startTimer() {
    if (!deadline) {
        deadline = Date.now() + timeLeft * 1000;
    }
    timer = setInterval(() => {
        timeLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        updateTimer();
        saveState();
        if (timeLeft <= 0) {
            clearInterval(timer);
            finishQuiz();
        }
    }, 1000);
}

function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timer').textContent = `Vreme: ${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function showQuestion() {
    const question = questions[currentQuestionIndex];
    document.getElementById('question').textContent = question.question;
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.textContent = option;
        optionDiv.addEventListener('click', () => selectOption(index));
        optionsContainer.appendChild(optionDiv);
    });

    const savedAnswer = answers[currentQuestionIndex];
    if (savedAnswer !== undefined) {
        const options = document.querySelectorAll('.option');
        if (options[savedAnswer]) {
            options[savedAnswer].classList.add('selected');
        }
    }

    const hasAnswer = answers[currentQuestionIndex] !== undefined;
    saveState();
    prevBtn.disabled = currentQuestionIndex === 0;

    if (currentQuestionIndex === questions.length - 1) {
        nextBtn.style.display = 'none';
        finishBtn.style.display = 'inline-block';
        finishBtn.disabled = !hasAnswer;
    } else {
        nextBtn.style.display = 'inline-block';
        nextBtn.disabled = !hasAnswer;
        finishBtn.style.display = 'none';
    }

    updateProgress();
}

function selectOption(index) {
    const options = document.querySelectorAll('.option');
    options.forEach(option => option.classList.remove('selected'));
    options[index].classList.add('selected');
    answers[currentQuestionIndex] = index;
    saveState();
    if (currentQuestionIndex === questions.length - 1) {
        finishBtn.disabled = false;
    } else {
        nextBtn.disabled = false;
    }
}

function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        showQuestion();
        saveState();
    }
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion();
        saveState();
    }
}

function updateProgress() {
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    document.getElementById('progress-bar').style.setProperty('--progress', `${progress}%`);
    document.getElementById('progress-text').textContent = `Pitanje ${currentQuestionIndex + 1} od ${questions.length}`;
}

function saveState() {
    const state = {
        currentQuestionIndex,
        timeLeft,
        deadline,
        answers,
        ime,
        prezime,
        quizStarted: document.getElementById('quiz-screen').style.display === 'block'
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function restoreState() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        return;
    }
    try {
        const state = JSON.parse(stored);
        if (!state) {
            return;
        }
        currentQuestionIndex = state.currentQuestionIndex ?? 0;
        answers = Array.isArray(state.answers) ? state.answers : [];
        ime = state.ime ?? '';
        prezime = state.prezime ?? '';
        deadline = state.deadline ?? null;

        if (state.quizStarted) {
            if (deadline) {
                timeLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
            }

            document.getElementById('ime').value = ime;
            document.getElementById('prezime').value = prezime;
            document.getElementById('start-screen').style.display = 'none';
            document.getElementById('quiz-screen').style.display = 'block';
            prevBtn.disabled = currentQuestionIndex === 0;
            updateTimer();
            startTimer();
            showQuestion();

            if (timeLeft <= 0) {
                clearInterval(timer);
                finishQuiz();
            }
        } else {
            document.getElementById('ime').value = ime;
            document.getElementById('prezime').value = prezime;
        }
    } catch (err) {
        console.error('Ne mogu da učitam stanje kviza:', err);
        localStorage.removeItem(STORAGE_KEY);
    }
}

function clearState() {
    localStorage.removeItem(STORAGE_KEY);
    deadline = null;
}

function finishQuiz() {
    clearInterval(timer);
    score = answers.reduce((sum, answer, index) => {
        if (answer === questions[index].correct) {
            return sum + 1;
        }
        return sum;
    }, 0);
    const vreme = 15 * 60 - timeLeft;
    saveResult(ime, prezime, score, vreme, answers);
    clearState();
    showResult(score, vreme);
}

function saveResult(ime, prezime, score, vreme, answers) {
    fetch('/save-result', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ime, prezime, score, vreme, answers, quizId: currentQuizId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Rezultat sačuvan.');
        }
    })
    .catch(error => console.error('Greška pri čuvanju:', error));
}

function showResult(score, vreme) {
    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
    document.getElementById('score-display').textContent = `Tačnih odgovora: ${score} od ${questions.length}`;
    const minutes = Math.floor(vreme / 60);
    const seconds = vreme % 60;
    document.getElementById('time-display').textContent = `Vreme provedeno: ${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function restartQuiz() {
    clearState();
    // Reset all variables
    currentQuestionIndex = 0;
    score = 0;
    timeLeft = 15 * 60;
    deadline = null;
    answers = [];
    ime = '';
    prezime = '';
    
    // Reset UI
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'block';
    document.getElementById('ime').value = '';
    document.getElementById('prezime').value = '';
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    nextBtn.style.display = 'inline-block';
    finishBtn.style.display = 'none';
    finishBtn.disabled = true;
}
