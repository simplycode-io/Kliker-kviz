const adminList = document.getElementById('admin-list');
const addQuestionBtn = document.getElementById('add-question-btn');
const saveQuestionsBtn = document.getElementById('save-questions-btn');
const adminMessage = document.getElementById('admin-message');
const adminLoginContainer = document.getElementById('admin-login');
const adminPanelContainer = document.getElementById('admin-panel');
const adminPasswordInput = document.getElementById('admin-password');
const adminLoginBtn = document.getElementById('admin-login-btn');
const adminLoginMessage = document.getElementById('admin-login-message');
const logoutBtn = document.getElementById('logout-btn');
const quizSelect = document.getElementById('quiz-select');
const createQuizName = document.getElementById('create-quiz-name');
const createQuizBtn = document.getElementById('create-quiz-btn');
const copyQuizName = document.getElementById('copy-quiz-name');
const copyQuizBtn = document.getElementById('copy-quiz-btn');
const quizLink = document.getElementById('quiz-link');
const leaderboardLink = document.getElementById('leaderboard-link');

const ADMIN_PASSWORD = 'tajna123';
let questions = [];
let currentQuizId = 'default';

async function loadQuizzes() {
    try {
        const response = await fetch('/quizzes');
        if (!response.ok) throw new Error('Neuspešno učitavanje kvizova.');
        const quizzes = await response.json();
        populateQuizSelect(quizzes);
        if (!quizzes.some((quiz) => quiz.id === currentQuizId)) {
            currentQuizId = quizzes.length ? quizzes[0].id : 'default';
        }
        setCurrentQuiz(currentQuizId, quizzes);
    } catch (error) {
        adminMessage.textContent = 'Greška pri učitavanju kvizova.';
        console.error(error);
    }
}

function populateQuizSelect(quizzes) {
    quizSelect.innerHTML = '';
    quizzes.forEach((quiz) => {
        const option = document.createElement('option');
        option.value = quiz.id;
        option.textContent = quiz.name;
        quizSelect.appendChild(option);
    });
}

async function loadQuestions() {
    try {
        const response = await fetch(`/questions?quizId=${encodeURIComponent(currentQuizId)}`);
        if (!response.ok) throw new Error('Neuspešno učitavanje pitanja.');
        const data = await response.json();
        questions = data.questions || [];
        renderQuestions();
        updateQuizLink(data.id, data.name);
    } catch (error) {
        adminMessage.textContent = 'Greška pri učitavanju pitanja.';
        console.error(error);
    }
}

function updateQuizLink(quizId, quizName) {
    const link = `${window.location.origin}/?quizId=${quizId}`;
    quizLink.innerHTML = `Aktivan kviz: <strong>${quizName}</strong> — <a href="${link}" target="_blank">Otvorite kviz</a>`;
    leaderboardLink.href = `leaderboard.html?quizId=${quizId}`;
}

function setCurrentQuiz(quizId, quizzes = []) {
    currentQuizId = quizId;
    quizSelect.value = quizId;
    updateQuizLink(quizId, quizzes.find((quiz) => quiz.id === quizId)?.name || 'Kviz');
    loadQuestions();
}

function setAdminView(authenticated) {
    if (authenticated) {
        adminLoginContainer.style.display = 'none';
        adminPanelContainer.style.display = 'block';
        logoutBtn.style.display = 'inline-flex';
        loadQuizzes();
    } else {
        adminLoginContainer.style.display = 'block';
        adminPanelContainer.style.display = 'none';
        logoutBtn.style.display = 'none';
        adminPasswordInput.value = '';
        adminLoginMessage.textContent = '';
    }
}

function showAdminPanel() {
    setAdminView(true);
}

function checkAdminPassword() {
    const value = adminPasswordInput.value.trim();
    if (value === ADMIN_PASSWORD) {
        sessionStorage.setItem('admin-authenticated', 'true');
        setAdminView(true);
    } else {
        adminLoginMessage.textContent = 'Pogrešna lozinka. Pokušajte ponovo.';
    }
}

function logoutAdmin() {
    sessionStorage.removeItem('admin-authenticated');
    setAdminView(false);
}

function initAdminAccess() {
    const authenticated = sessionStorage.getItem('admin-authenticated') === 'true';
    setAdminView(authenticated);
}

function renderQuestions() {
    adminList.innerHTML = '';

    questions.forEach((question, index) => {
        const row = document.createElement('div');
        row.className = 'admin-question-row';
        row.innerHTML = `
            <div class="admin-question-header">
                <h2>Pitanje ${index + 1}</h2>
                <button class="delete-question-btn">Obriši</button>
            </div>
            <label>Pitanje:</label>
            <textarea class="admin-question-text" data-index="${index}">${question.question}</textarea>
            <div class="admin-options">
                ${question.options.map((option, optionIndex) => `
                    <div class="admin-option-row">
                        <input type="text" class="admin-option-input" data-index="${index}" data-option="${optionIndex}" value="${option}">
                        <label>
                            <input type="radio" name="correct-${index}" value="${optionIndex}" ${question.correct === optionIndex ? 'checked' : ''}>
                            Tačno
                        </label>
                    </div>
                `).join('')}
            </div>
        `;

        const deleteBtn = row.querySelector('.delete-question-btn');
        deleteBtn.addEventListener('click', () => {
            questions.splice(index, 1);
            renderQuestions();
        });

        adminList.appendChild(row);
    });
}

function addQuestion() {
    questions.push({
        question: 'Novo pitanje',
        options: ['Opcija 1', 'Opcija 2', 'Opcija 3', 'Opcija 4'],
        correct: 0
    });
    renderQuestions();
}

function gatherQuestions() {
    const rows = document.querySelectorAll('.admin-question-row');
    const updated = [];

    rows.forEach((row, index) => {
        const questionText = row.querySelector('.admin-question-text').value.trim();
        const optionInputs = row.querySelectorAll('.admin-option-input');
        const options = Array.from(optionInputs).map(input => input.value.trim() || '');
        const correctInput = row.querySelector(`input[name="correct-${index}"]:checked`);
        const correct = correctInput ? Number(correctInput.value) : 0;

        updated.push({
            question: questionText || 'Bez pitanja',
            options,
            correct
        });
    });

    return updated;
}

async function saveQuestions() {
    const updatedQuestions = gatherQuestions();
    try {
        const response = await fetch(`/questions?quizId=${encodeURIComponent(currentQuizId)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedQuestions)
        });
        const data = await response.json();
        if (data.success) {
            adminMessage.textContent = 'Pitanja su uspešno sačuvana.';
        } else {
            adminMessage.textContent = 'Greška pri čuvanju pitanja.';
        }
    } catch (error) {
        adminMessage.textContent = 'Greška pri čuvanju pitanja.';
        console.error(error);
    }
}

async function createQuiz() {
    const name = createQuizName.value.trim();
    if (!name) {
        adminMessage.textContent = 'Unesite naziv za novi kviz.';
        return;
    }
    try {
        const response = await fetch('/quizzes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const data = await response.json();
        if (data.success) {
            adminMessage.textContent = `Kviz "${data.quiz.name}" je kreiran.`;
            createQuizName.value = '';
            currentQuizId = data.quiz.id;
            await loadQuizzes();
        } else {
            adminMessage.textContent = data.error ? `Greška pri kreiranju kviza: ${data.error}` : 'Greška pri kreiranju kviza.';
        }
    } catch (error) {
        adminMessage.textContent = 'Greška pri kreiranju kviza.';
        console.error(error);
    }
}

async function copyQuiz() {
    const name = copyQuizName.value.trim();
    if (!name) {
        adminMessage.textContent = 'Unesite naziv za novu kopiju kviza.';
        return;
    }
    try {
        const response = await fetch('/quizzes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, sourceQuizId: currentQuizId })
        });
        const data = await response.json();
        if (data.success) {
            adminMessage.textContent = `Kviz "${data.quiz.name}" je kreiran kao kopija.`;
            copyQuizName.value = '';
            currentQuizId = data.quiz.id;
            await loadQuizzes();
        } else {
            adminMessage.textContent = data.error ? `Greška pri kopiranju kviza: ${data.error}` : 'Greška pri kopiranju kviza.';
        }
    } catch (error) {
        adminMessage.textContent = 'Greška pri kopiranju kviza.';
        console.error(error);
    }
}

addQuestionBtn.addEventListener('click', addQuestion);
saveQuestionsBtn.addEventListener('click', saveQuestions);
createQuizBtn.addEventListener('click', createQuiz);
copyQuizBtn.addEventListener('click', copyQuiz);
quizSelect.addEventListener('change', () => setCurrentQuiz(quizSelect.value));
adminLoginBtn.addEventListener('click', checkAdminPassword);
logoutBtn.addEventListener('click', logoutAdmin);
adminPasswordInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        checkAdminPassword();
    }
});

initAdminAccess();