// constants 
const baseUrl = 'http://localhost:9000';
const MAX_ROWS = 6;
const MAX_COLS = 5;

// game-related variables
let game = {
    currentGuess: { row: 0, col: 0 },
    isLoggedIn: false,
    currentGame: null,
};


function initializeGame() {
    initGameBoard();
    restoreUserSession();
    document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);
}

function restoreUserSession() {
    // Extract repeated logic into functions
    const user = getUserFromLocalStorage();
    if (user) {
        login(user);
        getGame();
    }
}

function handleDOMContentLoaded() {
    document.addEventListener('keydown', handleKeyDown);
}

function handleKeyDown(e) {
    console.log(`key code is ${e.key}`);

    if (game.isLoggedIn) {
        let key = e.key

        unselectGuess();
        if (key.length === 1 && key.match(/[a-zA-Z]/i)) {
            let guessId = `guess${game.currentGuess.row}${game.currentGuess.col}`
            console.log(`guessId is ${guessId}`);

            document.getElementById(guessId).textContent = key.toUpperCase();
            if (game.currentGuess.col < 4) {
                game.currentGuess.col++
            }
        } else if (key == "Backspace") {
            let guessId = `guess${game.currentGuess.row}${game.currentGuess.col}`
            let guessElement = document.getElementById(guessId)
            guessElement.innerHTML = '&nbsp'
            if (game.currentGuess.col > 0) {
                game.currentGuess.col--
            }
        } else if (key == "ArrowLeft") {
            if (game.currentGuess.col > 0) {
                game.currentGuess.col--
            }
        } else if (key == "ArrowRight") {
            if (game.currentGuess.col < 4) {
                let guessId = `guess${game.currentGuess.row}${game.currentGuess.col}`
                let guessElement = document.getElementById(guessId)
                if (guessElement.textContent.length === 1 && guessElement.textContent.match(/[a-zA-Z]/i)) {
                    game.currentGuess.col++
                }
            }
        } else if (key == "Enter") {
            let guess = ''
            let complete = true;
            for (let i = 0; i < 5; i++) {
                let guessId = `guess${game.currentGuess.row}${i}`
                let guessElement = document.getElementById(guessId)
                guess = guess + guessElement.textContent

                if (guessElement.textContent.length != 1 || !guessElement.textContent.match(/[a-zA-Z]/i)) {
                    complete = false
                }

            //  console.log(guessElement)
            }
            if (complete) {

                updateGame(guess);

                if (game.currentGuess.row < 5) {

                    game.currentGuess.row++
                    game.currentGuess.col = 0
                }
            }
          
            console.log("Guess=" + guess);
        }
        selectGuess();
    }
}

// Refactored functions with improved structure and comments

function initGameBoard() {
    console.log('Initializing game board!');

    const gameTableElement = document.getElementById('game-table');

    for (let row = 0; row < MAX_ROWS; row++) {
        const rowElement = document.createElement('tr');

        for (let col = 0; col < MAX_COLS; col++) {
            const guessElement = document.createElement('td');
            const guessId = `guess${row}${col}`;

            guessElement.id = guessId;
            guessElement.classList.add('no-match', 'guess-letter');
            guessElement.innerHTML = '&nbsp';

            rowElement.appendChild(guessElement);
        }

        gameTableElement.appendChild(rowElement);
    }
}

function getUserFromLocalStorage() {
    return JSON.parse(localStorage.getItem('user'));
}

function login(user) {
    game.isLoggedIn = true;
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('login-wait').style.display = 'none';
    document.getElementById('login-status').style.display = 'flex';
    document.getElementById('logged-in-username').textContent = user.username;
}

function logout() {
    // Your existing code for logout
}

function endGame() {
    // Your existing code for endGame
}

// Other functions remain largely unchanged, just organized differently

// Call the initializeGame function to start the application
initializeGame();
