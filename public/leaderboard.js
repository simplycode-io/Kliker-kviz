const leaderboardTableBody = document.querySelector('#leaderboard-table tbody');
const leaderboardMessage = document.getElementById('leaderboard-message');
const logoutBtn = document.getElementById('logout-btn');
const leaderboardHeading = document.getElementById('leaderboard-heading');
const languageSelect = document.getElementById('language-select');

const urlParams = new URLSearchParams(window.location.search);
const quizId = urlParams.get('quizId');

// Initialize language support
function initializeLanguageSelect() {
    const currentLang = getCurrentLanguage();
    languageSelect.innerHTML = `
        <option value="sr" ${currentLang === 'sr' ? 'selected' : ''}>Srpski</option>
        <option value="en" ${currentLang === 'en' ? 'selected' : ''}>English</option>
    `;
    languageSelect.addEventListener('change', (e) => {
        setLanguage(e.target.value);
        translatePage(e.target.value);
    });
}

function getAdminToken() {
    return sessionStorage.getItem('admin-token');
}

function logoutAdmin() {
    const token = getAdminToken();
    if (token) {
        fetch('/admin/logout', {
            method: 'POST',
            headers: { 'x-admin-token': token }
        }).catch(e => console.error(e));
    }
    sessionStorage.removeItem('admin-token');
    window.location.href = 'admin.html';
}

function formatDate(iso) {
    const date = new Date(iso);
    return date.toLocaleString('sr-RS', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function loadLeaderboard() {
    try {
        let quizName = null;
        if (quizId) {
            const quizResponse = await fetch('/quizzes');
            if (quizResponse.ok) {
                const quizzes = await quizResponse.json();
                const quiz = quizzes.find((q) => q.id === quizId);
                if (quiz) {
                    quizName = quiz.name;
                    leaderboardHeading.textContent = `Rang lista: ${quizName}`;
                }
            }
        }

        const resultUrl = quizId ? `/results?quizId=${encodeURIComponent(quizId)}` : '/results';
        const response = await fetch(resultUrl);
        if (!response.ok) {
            throw new Error('Neuspešno učitavanje rang liste.');
        }
        const results = await response.json();
        if (!Array.isArray(results) || results.length === 0) {
            leaderboardMessage.textContent = 'Trenutno nema rezultata za prikaz.';
            return;
        }

        leaderboardTableBody.innerHTML = '';
        results.forEach((result, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${result.ime || '-'}</td>
                <td>${result.prezime || '-'}</td>
                <td>${result.score}</td>
                <td>${result.vreme}</td>
                <td>${formatDate(result.timestamp)}</td>
            `;
            leaderboardTableBody.appendChild(row);
        });
    } catch (error) {
        leaderboardMessage.textContent = 'Greška pri učitavanju rang liste.';
        console.error(error);
    }
}

logoutBtn.addEventListener('click', logoutAdmin);
logoutBtn.style.display = getAdminToken() ? 'inline-flex' : 'none';
initializeLanguageSelect();
translatePage();
loadLeaderboard();