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
    displayLeaderboard();
    initGameBoard();
    restoreUserSession();
    document.addEventListener('keydown', handleKeyDown);
}

function handleKeyDown(e) {

    if (game.isLoggedIn) {

        selectGuess();

        e.preventDefault();

        let key = e.key

        unselectGuess();
        if (key.length === 1 && key.match(/[a-zA-Z]/i)) {
            let guessId = `guess${game.currentGuess.row}${game.currentGuess.col}`
            document.getElementById(guessId).value = key.toUpperCase();
            if (game.currentGuess.col < 4) {

                unselectGuess();

                game.currentGuess.col++


                selectGuess();

            }
        } else if (key == "Backspace") {
            let guessId = `guess${game.currentGuess.row}${game.currentGuess.col}`
            let guessElement = document.getElementById(guessId)
            guessElement.value = ''
            if (game.currentGuess.col > 0) {

                unselectGuess();

                game.currentGuess.col--

                selectGuess();

            }
        } else if (key == "ArrowLeft") {
            if (game.currentGuess.col > 0) {

                unselectGuess();

                game.currentGuess.col--


                selectGuess();

            }
        } else if (key == "ArrowRight") {
            if (game.currentGuess.col < 4) {
                let guessId = `guess${game.currentGuess.row}${game.currentGuess.col}`
                let guessElement = document.getElementById(guessId)
                if (guessElement.value.match(/[a-zA-Z]/i)) {

                    unselectGuess();

                    game.currentGuess.col++


                    selectGuess();

                }
            }
        } else if (key == "Enter") {
            let guess = ''
            let complete = true;
            for (let i = 0; i < NUMB_LETTERS; i++) {
                let guessId = `guess${game.currentGuess.row}${i}`
                let guessElement = document.getElementById(guessId)
                guess = guess + guessElement.value

                if (!guessElement.value.match(/[a-zA-Z]/i)) {
                    complete = false
                }
            }
            if (complete) {

                updateGame(guess);

                if (game.currentGuess.row < MAX_ROWS - 1) {

                    unselectGuess();

                    game.currentGuess.row++
                    game.currentGuess.col = 0


                    selectGuess();

                }
            }
        }
        selectGuess();
    }
}

function initGameBoard() {

    let gameTableElement = document.getElementById('game-table')

    for (let r = 0; r < MAX_ROWS; r++) {

        let rowElement = document.createElement('tr');
        //   rowElement.classList.add('elementToFadeInAndOut')


        for (let c = 0; c < NUMB_LETTERS; c++) {
            let cellElement = document.createElement('td');
            cellElement.classList.add('guess-cell');
            rowElement.appendChild(cellElement);


            let guessElement = document.createElement('input');

            let guessId = `guess${r}${c}`

            guessElement.id = guessId
            guessElement.classList.add('no-match')
            guessElement.classList.add('guess-letter')
            guessElement.valu = ''
            guessElement.type = "text";
            guessElement.inputmode = "text";
            guessElement.maxLength = 1;
            guessElement.readOnly = true;
            guessElement.onclick = "onClickGuess()"

            cellElement.appendChild(guessElement);
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
                // Set the current game ID
                localStorage.setItem('gameId', data.gameId);
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
            loading,
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
                loading,
                (data) => {
                    game.currentGame = data;
                    console.log(`got current game ${game.currentGame.gameId}`)
                    fillInGameTable();

                    if (game.currentGame.guesses.length >= MAX_ROWS || game.currentGame.success) {
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

function getUserGames() {
    var user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        var token = localStorage.getItem('token');
        var userId = user.id;

        callApi(`${baseUrl}/users/${userId}/games`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            },
            loading,
            (data) => {
                console.log(`user: ${user.id}`);
                // TODO: display statistics from user games
            }
        );
    }
}

function fillInGameTable() {
    if (game.currentGame) {
        let matches = game.currentGame.matches;

        if (matches) {

            for (let i = 0; i < matches.length; ++i) {
                for (let j = 0; j < NUMB_LETTERS; ++j) {

                    let guessId = `guess${i}${j}`
                    let guessElement = document.getElementById(guessId)
                    guessElement.value = matches[i][j].char.toUpperCase()

                    if (matches[i][j].match === "EXACT_MATCH") {
                        guessElement.classList.add("exact-match")

                    } else if (matches[i][j].match === "WRONG_LOCATION") {
                        guessElement.classList.add("match")

                    } else {
                        guessElement.classList.add("no-match")
                    }
                }
            }

            unselectGuess();

            game.currentGuess.row = matches.length;
            if (game.currentGuess.row >= MAX_ROWS) {
                game.currentGuess.row = MAX_ROWS - 1;
            }
            game.currentGuess.col = 0;

            selectGuess();
        }
    } else {
        for (let i = 0; i < MAX_ROWS; ++i) {
            for (let j = 0; j < NUMB_LETTERS; ++j) {

                let guessId = `guess${i}${j}`
                let guessElement = document.getElementById(guessId)
                guessElement.value = ''
                guessElement.classList.remove("exact-match")
                guessElement.classList.remove("match")
                guessElement.classList.add("no-match")
            }
        }

        unselectGuess();

        game.currentGuess.row = 0;
        game.currentGuess.col = 0;


        selectGuess();


    }
}

function onClickGuess(event) {
    unselectGuess();
    event.preventDefault();
    selectGuess();
}

function selectGuess() {
    let guessId = `guess${game.currentGuess.row}${game.currentGuess.col}`
    let guessElement = document.getElementById(guessId)
    guessElement.parentElement.classList.add("selected")
    guessElement.readOnly = false;
    guessElement.blur();
    guessElement.focus();
}

function unselectGuess() {
    let guessId = `guess${game.currentGuess.row}${game.currentGuess.col}`
    let guessElement = document.getElementById(guessId)
    guessElement.parentElement.classList.remove("selected")
    guessElement.readOnly = true;
    guessElement.blur();
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

    callApi(`${baseUrl}/login`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
        },
        loading,
        (data) => {
            const token = data.token;
            const user = data.user;

            // Save the user ID and token to localStorage for later use
            localStorage.setItem('user', JSON.stringify(user));
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
    document.getElementById("password").textContent = '';

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

function loading(isLoading) {
    console.log(`LOADING: ${isLoading}`);
    if (isLoading) {
        console.log('Display loading screen');
    } else {
        console.log('Display normal screen');
    }
}

function displayLeaderboard() {
    let leaderData = [
        {
            user: 'amicoolyet',
            avg: 3.45
        },
        {
            user: 'username_copied',
            avg: 3.84
        },
        {
            user: 'jshout',
            avg: 3.92
        },
        {
            user: 'gr8feet',
            avg: 4.11
        },
        {
            user: 'brrrrr',
            avg: 4.12
        },
        {
            user: 'uglee_duk',
            avg: 4.16
        },
        {
            user: '2gr82fly',
            avg: 4.35
        },
        {
            user: 'bee_bauwa',
            avg: 4.67
        },
        {
            user: 'snoopy_q',
            avg: 5.22
        }
    ]


    const tbody = document.getElementById('leader-table-body');
    leaderData.forEach((leader)=>{
        const row = document.createElement('tr');
        tbody.appendChild(row);
        const userData = document.createElement('td');
        const avgData = document.createElement('td');
        row.appendChild(userData);
        row.appendChild(avgData);
        userData.innerText = leader.user;
        avgData.innerText = leader.avg;
    })


}





// Call the initializeGame function to start the application
initializeGame();