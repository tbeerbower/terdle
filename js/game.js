// constants 
const baseUrl = 'https://terdle-server.fly.dev'
//const baseUrl = 'http://localhost:9000'
const MAX_ROWS = 6;
const NUMB_LETTERS = 5;

// game-related variables
let game = {
    currentGuess: { row: 0, col: 0 },
    isLoggedIn: false,
    currentGame: null,
};

function initializeGame() {
    document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);
}

function restoreUserSession() {
    // Extract repeated logic into functions
    const user = getUserFromLocalStorage();
    if (user) {
        loggedIn(user);
        getGame();
    }
}

function getUserFromLocalStorage() {
    return JSON.parse(localStorage.getItem('user'));
}

function handleDOMContentLoaded() {
    initGameBoard();
    restoreUserSession();
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
            for (let i = 0; i < NUMB_LETTERS; i++) {
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

                if (game.currentGuess.row < MAX_ROWS - 1) {
                    game.currentGuess.row++
                    game.currentGuess.col = 0
                }
            }
            console.log("Guess=" + guess);
        }
        selectGuess();
    }
}

function initGameBoard() {

    console.log('initializing game board!');

    let gameTableElement = document.getElementById('game-table')

    for (let r = 0; r < MAX_ROWS; r++) {

        let rowElement = document.createElement('tr');
     //   rowElement.classList.add('elementToFadeInAndOut')


        for (let c = 0; c < NUMB_LETTERS; c++) {
           let guessElement = document.createElement('td');

           let guessId = `guess${r}${c}`

           guessElement.id = guessId
           guessElement.classList.add('no-match')
           guessElement.classList.add('guess-letter')
           guessElement.innerHTML = '&nbsp'

           rowElement.appendChild(guessElement);
        }
        gameTableElement.appendChild(rowElement);
    }
}

function startGame() {
    var user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        var token = localStorage.getItem('token');
        var userId = user.id;

        const gameData = {
            type: "RANDOM"
        };

        fetch(`${baseUrl}/users/${userId}/games`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(gameData),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Handle successful game creation response
            console.log('Game created successfully', data);

            // Set the current game ID
            localStorage.setItem('gameId',data.gameId);
            getGame();
    
        })
        .catch(error => {
            // Handle errors during game creation
            console.error('There was a problem creating the game:', error.message);
        }); 

    }
}

function updateGame(guessValue) {
    var user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        var token = localStorage.getItem('token');
        var userId = user.id;
        var gameId = localStorage.getItem('gameId');

        let previousGuesses = game.currentGame.guesses;
        if (!previousGuesses) {
            previousGuesses = []
        }

        previousGuesses.push(guessValue.toLowerCase());

        const guessData = {
            guesses: previousGuesses
        };

        callApi(`${baseUrl}/users/${userId}/games/${gameId}`, 
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(guessData),
            },
            () => {
                  getGame();
            },
            (error) => {
                console.error('There was a problem:', error.message);    
                getGame();
            }
        );
    }
}


function getGame() {
    var user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        var token = localStorage.getItem('token');
        var userId = user.id;
        var gameId = localStorage.getItem('gameId');

        if (gameId) {

            callApi(`${baseUrl}/users/${userId}/games/${gameId}`, 
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                },
                (data) => {
                    game.currentGame = data;
                    console.log(`got current game ${game.currentGame.gameId}`)
                    fillInGameTable();

                    if (game.currentGame.guesses.length >= MAX_ROWS || game.currentGame.success ) {
                        document.getElementById("gameOver").style.display = "flex";
                        if (game.currentGame.success) {
                            document.getElementById("gameOverText").innerHTML = `You solved it in ${game.currentGame.guesses.length} tries!`;
                        } else {
                            document.getElementById("gameOverText").innerHTML = `Sorry, you didn't win.<br>  The word is ${game.currentGame.word}.`;
                        }
                        document.getElementById("main").style.filter = "blur(2px)";
                    }

                }
            );
        }
    }
}

function fillInGameTable() {
    unselectGuess();
    if (game.currentGame) {
        let matches = game.currentGame.matches;

        console.log(`matches = ${matches}`)
        if (matches) {


            for (let i = 0; i < matches.length; ++i) {
                for (let j = 0; j < NUMB_LETTERS; ++j) {
        
                    let guessId = `guess${i}${j}`
                    let guessElement = document.getElementById(guessId)
                    guessElement.textContent = matches[i][j].char.toUpperCase()
        
                    if (matches[i][j].match === "EXACT_MATCH") {
                        guessElement.classList.add("exact-match")
        
                    } else if (matches[i][j].match === "WRONG_LOCATION") {
                        guessElement.classList.add("match")
        
                    } else {
                        guessElement.classList.add("no-match")
                    }
                }
            }

            game.currentGuess.row = matches.length;
            if (game.currentGuess.row >= MAX_ROWS) {
                game.currentGuess.row = MAX_ROWS - 1;
            }
            game.currentGuess.col = 0;

            console.log(`fill in row ${game.currentGuess.row} col ${game.currentGuess.col}`)
        }
    } else {
        for (let i = 0; i < MAX_ROWS; ++i) {
            for (let j = 0; j < NUMB_LETTERS; ++j) {
    
                let guessId = `guess${i}${j}`
                let guessElement = document.getElementById(guessId)
                guessElement.innerHTML = '&nbsp'
                guessElement.classList.remove("exact-match")
                guessElement.classList.remove("match")
                guessElement.classList.add("no-match")
            }
        }
        game.currentGuess.row = 0;
        game.currentGuess.col = 0;

    }  
    selectGuess();
}


function selectGuess() {
    let guessId = `guess${game.currentGuess.row}${game.currentGuess.col}`

    console.log(`selecting guess${game.currentGuess.row}${game.currentGuess.col}`)

    let guessElement = document.getElementById(guessId)
    guessElement.classList.add("selected") 
}

function unselectGuess() {
    let guessId = `guess${game.currentGuess.row}${game.currentGuess.col}`
    let guessElement = document.getElementById(guessId)
    guessElement.classList.remove("selected") 
}

function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const loginData = {
        username: username,
        password: password
    };

    document.getElementById("login-form").style.display = "none";
    document.getElementById("login-wait").style.display = "flex";
    document.getElementById("login-status").style.display = "none";

    callApi( `${baseUrl}/login`, 
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
        },
        (data) => {
            const token = data.token;
            const user = data.user;

            // Save the user ID and token to localStorage for later use
            localStorage.setItem('user',JSON.stringify(user));
            localStorage.setItem('token', token);

            loggedIn(user);
            startGame();
        }
    );
}

function loggedIn(user) {
    game.isLoggedIn = true;
    document.getElementById("login-form").style.display = "none";
    document.getElementById("login-wait").style.display = "none";
    document.getElementById("login-status").style.display = "flex";
    document.getElementById("logged-in-username").textContent = user.username;
}

function logout() {
    document.getElementById("login-form").style.display = "flex";
    document.getElementById("login-wait").style.display = "none";
    document.getElementById("login-status").style.display = "none";
    document.getElementById("logged-in-username").textContent = '';
    document.getElementById("username").textContent = '';
    document.getElementById("password").textContent= '';

    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('game');
    game.isLoggedIn = false;
}

function endGame() {
    document.getElementById("gameOver").style.display = "none";
    document.getElementById("main").style.filter = "none";
    game.currentGame = null
    localStorage.removeItem('gameId');
    fillInGameTable();
    startGame();
}

function logError(error) {
    console.error('There was a problem:', error.message);    
}


// Call the initializeGame function to start the application
initializeGame();