let level = parseInt(localStorage.getItem("currentLevel") || "1");
let words = levelWords[level];
let selected = words[Math.floor(Math.random() * words.length)];
let word = selected.word.toUpperCase();
let hintText = selected.hint;
let guessed = [];

let chances = level === 1 ? 7 : level === 2 ? 5 : 3;
let timeLeft = level === 1 ? 60 : level === 2 ? 45 : 30;
let timerId;

const hintElement = document.getElementById("hint");
const wordBox = document.getElementById("word");
const statusBox = document.getElementById("status");

initGame();

function initGame() {
    if(hintElement) hintElement.innerHTML = "💡 " + hintText;
    if(statusBox) statusBox.innerHTML = "Attempts: " + "❤️".repeat(chances);
    displayWord();
    createKeyboard();
    setupTopBar();
    startTimer();
}

function setupTopBar() {
    const topBar = document.createElement("div");
    topBar.style = "display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;";
    
    const timerDisplay = document.createElement("div");
    timerDisplay.id = "timer";
    timerDisplay.style = "font-family: monospace; color: #00d4ff; font-size: 1.4rem; font-weight: bold; background: rgba(0,0,0,0.3); padding: 5px 15px; border-radius: 5px; border: 1px solid #00d4ff;";
    
    const hintBtn = document.createElement("button");
    hintBtn.id = "hintBtn";
    hintBtn.innerHTML = "🔍 REVEAL LETTER (-10s)";
    hintBtn.style = "background: rgba(255, 215, 0, 0.1); border: 1px solid #ffd700; color: #ffd700; padding: 8px 12px; cursor: pointer; border-radius: 5px; font-size: 0.75rem; font-weight: bold; transition: 0.3s;";
    hintBtn.onclick = useHint;

    topBar.appendChild(timerDisplay);
    topBar.appendChild(hintBtn);
    document.querySelector(".game-container").prepend(topBar);
}

// --- NEW: KEYBOARD SUPPORT LOGIC ---
document.addEventListener("keydown", (event) => {
    // Only process if the scoreboard isn't visible
    const sb = document.getElementById("scoreBoard");
    if (sb && sb.style.display === "flex") return;

    const key = event.key.toUpperCase();
    
    // Check if the key is a letter (A-Z)
    if (key.length === 1 && key >= "A" && key <= "Z") {
        // Find the on-screen button for this letter
        const buttons = document.querySelectorAll("#keyboard button");
        buttons.forEach(btn => {
            if (btn.innerText === key && !btn.disabled) {
                guess(key, btn); // Trigger the guess
            }
        });
    }
});

function useHint() {
    if (timeLeft <= 10) return;
    let remaining = word.split("").filter(l => !guessed.includes(l));
    if (remaining.length > 1) {
        let randomLetter = remaining[Math.floor(Math.random() * remaining.length)];
        timeLeft -= 10;
        updateTimerDisplay();
        guessed.push(randomLetter);
        displayWord();
        const buttons = document.querySelectorAll("#keyboard button");
        buttons.forEach(btn => { if (btn.innerText === randomLetter) btn.disabled = true; });
        if (word.split("").every(l => guessed.includes(l))) {
            clearInterval(timerId);
            triggerWin();
        }
    }
}

function startTimer() {
    updateTimerDisplay();
    timerId = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerId);
            triggerLoss("TIME EXPIRED");
        }
    }, 1000);
}

function updateTimerDisplay() {
    const td = document.getElementById("timer");
    if(td) {
        td.innerText = `00:${timeLeft < 10 ? '0' + timeLeft : timeLeft}`;
        td.style.color = timeLeft <= 10 ? "#ff4757" : "#00d4ff";
    }
}

function displayWord() {
    if(wordBox) wordBox.innerHTML = word.split("").map(l => (guessed.includes(l) ? l : "_")).join(" ");
}

function createKeyboard() {
    const kb = document.getElementById("keyboard");
    if(!kb) return;
    kb.innerHTML = "";
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(l => {
        let btn = document.createElement("button");
        btn.innerText = l;
        btn.onclick = () => guess(l, btn);
        kb.appendChild(btn);
    });
}

function guess(letter, btn) {
    btn.disabled = true;
    // Add a visual 'pressed' effect for physical keys
    btn.style.background = word.includes(letter) ? "#22c55e" : "#ef4444"; 
    
    if (word.includes(letter)) {
        guessed.push(letter);
        displayWord();
        if (word.split("").every(l => guessed.includes(l))) {
            clearInterval(timerId);
            triggerWin();
        }
    } else {
        chances--;
        if(statusBox) statusBox.innerHTML = "Attempts: " + "❤️".repeat(chances);
        if (chances === 0) {
            clearInterval(timerId);
            triggerLoss("MISSION FAILED");
        }
    }
}


function triggerWin() {
    // ... existing logic (confetti, etc.) ...
    
    let finalScore = (chances * 20) + timeLeft; // Calculate score
    saveToLeaderboard(finalScore); // SAVE IT!
    
    setTimeout(() => showScoreboard("win"), 1000);
}

function triggerLoss(reason) {
    if(wordBox) wordBox.innerHTML = word; 
    setTimeout(() => {
        document.getElementById("scoreStatus").innerText = reason;
        showScoreboard("lose");
    }, 1000);
}

function showScoreboard(status) {
    const sb = document.getElementById("scoreBoard");
    const st = document.getElementById("scoreText");
    const starContainer = document.getElementById("starRating");
    
    if (starContainer) {
        let starCount = 0;
        if (status === "win") {
            if (chances >= (level === 1 ? 6 : level === 2 ? 4 : 2)) starCount = 3;
            else if (chances >= (level === 1 ? 4 : level === 2 ? 2 : 1)) starCount = 2;
            else starCount = 1;
        }
        starContainer.innerHTML = "⭐".repeat(starCount) + "☆".repeat(3 - starCount);
    }
    if(st) st.innerText = status === "win" ? (chances * 20 + timeLeft) : 0;
    if(sb) sb.style.display = "flex"; 
}

function goToNextLevel() {
    let next = level + 1;
    if (levelWords[next]) {
        localStorage.setItem("currentLevel", next);
        window.location.href = `level${next}.html`;
    } else {
        window.location.href = "levels.html";
    }
}

function saveToLeaderboard(finalScore) {
    const playerName = localStorage.getItem("player") || "GUEST";
    let leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]");

    // Add new score
    leaderboard.push({ name: playerName, score: finalScore });

    // Keep only top 10 and save
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    
    localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
}