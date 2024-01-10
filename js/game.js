// constants 
const baseUrl = 'https://terdle-server.fly.dev'
//const baseUrl = 'http://localhost:9000'
const MAX_ROWS = 6;
const NUMB_LETTERS = 5;

// game-related variables
let game = {
    currentGuess: { row: 0, col: 0 },
    isLoggedIn: false,
    isLoading: false,
    currentGame: null,
};

let popupAction = closePopup;
let inPopup = false;

function initializeGame() {
    document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);
}

function restoreUserSession() {
    loggedIn(getUserFromLocalStorage());
    getGame();
}

function getUserFromLocalStorage() {
    return JSON.parse(localStorage.getItem('user'));
}

function handleDOMContentLoaded() {
    displayLeaderboard();
    initGameBoard();
    restoreUserSession();

    let guessLetters = document.querySelectorAll('.guess-letter');
    guessLetters.forEach((letter) => {
        letter.addEventListener('keydown', handleKeyDown);
    })

    let keyboardButtons = document.querySelectorAll('.keyboard-letter');
    keyboardButtons.forEach( (button) => {
        button.addEventListener('click', handleKeyboardButtonClick);
    })

    let keyboardEnter = document.getElementById('keyboard-enter');
    keyboardEnter.addEventListener('click', handleKeyboardEnterClick);

    let keyboardBack = document.getElementById('keyboard-backspace');
    keyboardBack.addEventListener('click', handleKeyboardBackClick);

    let randomGameButton = document.getElementById('random-game-button');
    randomGameButton.addEventListener('click', startGame);
}

function handleKeyboardButtonClick(e) {
    console.log('handleKeyboardButtonClick');

    if (game.currentGame && !game.isLoading && !inPopup) {
        unselectGuess();
        let key = e.target.innerText;
        console.log(`PRESSED ${key}`);
        let guessId = `guess${game.currentGuess.row}${game.currentGuess.col}`
        document.getElementById(guessId).innerText = key.toUpperCase();
        if (game.currentGuess.col < 4) {
            game.currentGuess.col++
        }
        selectGuess();
    }
}

function handleKeyboardEnterClick() {
    if (game.currentGame && !game.isLoading && !inPopup) {
        unselectGuess();
        let guess = ''
        let complete = true;
        for (let i = 0; i < NUMB_LETTERS; i++) {
            let guessId = `guess${game.currentGuess.row}${i}`
            let guessElement = document.getElementById(guessId)
            guess = guess + guessElement.innerText

            if (!guessElement.innerText.match(/[a-zA-Z]/i)) {
                complete = false
            }
        }
        if (complete) {
            updateGame(guess);
        }
        selectGuess();
    }
}

function handleKeyboardBackClick() {
    if (game.currentGame && !game.isLoading && !inPopup) {
        unselectGuess();
        let guessId = `guess${game.currentGuess.row}${game.currentGuess.col}`
        document.getElementById(guessId).innerText = ' ';
        if (game.currentGuess.col > 0) {
            game.currentGuess.col--
        }
        selectGuess();
    }
}

function handleKeyDown(e) {

    console.log(`IN handleKeyDown: ${e.target}`)

    if (game.currentGame && !game.isLoading && !inPopup) {

        selectGuess();

        e.preventDefault();

        let key = e.key

        unselectGuess();
        if (key.length === 1 && key.match(/[a-zA-Z]/i)) {
            let guessId = `guess${game.currentGuess.row}${game.currentGuess.col}`
            document.getElementById(guessId).innerText = key.toUpperCase();
            if (game.currentGuess.col < 4) {
                unselectGuess();
                game.currentGuess.col++
                selectGuess();

            }
        } else if (key == "Backspace") {
            let guessId = `guess${game.currentGuess.row}${game.currentGuess.col}`
            let guessElement = document.getElementById(guessId)
            guessElement.innerText = ' '
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
                if (guessElement.innerText.match(/[a-zA-Z]/i)) {

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
                guess = guess + guessElement.innerText

                if (!guessElement.innerText.match(/[a-zA-Z]/i)) {
                    complete = false
                }
            }
            if (complete) {
                updateGame(guess);
            }
        }
        selectGuess();
    }
}

function initGameBoard() {

    let gameTableElement = document.getElementById('game-table')

    for (let r = 0; r < MAX_ROWS; r++) {

        let rowElement = document.createElement('tr');

        for (let c = 0; c < NUMB_LETTERS; c++) {
            let guessElement = document.createElement('td');

            let guessId = `guess${r}${c}`

            guessElement.id = guessId
            guessElement.tabIndex = 0;
            //guessElement.classList.add('no-match')
            guessElement.classList.add('guess-letter')
            guessElement.innerText = ' '
            guessElement.onclick = "onClickGuess()"

            rowElement.appendChild(guessElement);
        }
        gameTableElement.appendChild(rowElement);
    }
}

function startGame() {

    startGameLocal();
    //startGameRemote();
}

function startGameLocal() {

    const date = new Date();
    const user = getUserFromLocalStorage();
    const userId = user ? user.id : 0;

    localStorage.setItem('gameId', 0);

    game.currentGame = {
        gameId: 0,
        word: "happy",
        date: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
        type: "RANDOM",
        userId: userId,
        guesses: [],
        success: false,
        matches: []
    };
    localStorage.setItem('game', JSON.stringify(game.currentGame));

    console.log('!!!start game=');
    console.log(game);

    fillInGameTable();

    let randomGameButton = document.getElementById('random-game-button');
    randomGameButton.innerText = 'Restart Game';
}

function startGameRemote() {
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
    updateGameLocal(guessValue);
    // updateGameRemote(guessValue);
}

function updateGameLocal(guessValue) {
    guessValue = guessValue.toLowerCase();

    if (!TERDLE_GUESS_WORDS.includes(guessValue) && !TERDLE_WORDS.includes(guessValue)) {
        showPopup(`${guessValue.toUpperCase()} is not a TErdle word!`);
    } else {

        console.log('!!!update game=');
        console.log(game);


        game.currentGame.guesses.push(guessValue.toLowerCase());
        game.currentGame.matches = [];


        // update matches
        game.currentGame.guesses.forEach((guess) => {
            let misses = [];
            let matches = [];
            for (let i = 0; i < guess.length; i++) {
                let ch = game.currentGame.word[i];
                if (ch === guess[i]) {
                    matches[i] = {
                        match: 'EXACT_MATCH',
                        char: ch
                    }
                } else {
                    misses.push(ch);
                }
            }
            for (let i = 0; i < guess.length && misses.length > 0; i++) {
                let ch = guess[i];
                if (game.currentGame.word[i] !== ch) {
                    var index = misses.indexOf(ch);
                    if (index !== -1) {
                        misses.splice(index, 1);
                        matches[i] = {
                            match: 'WRONG_LOCATION',
                            char: ch
                        };
                    } else {
                        matches[i] = {
                            match: 'NO_MATCH',
                            char: ch
                        };
                    }
                }
            }
            game.currentGame.matches.push(matches);
            game.currentGame.success = game.currentGame.guesses.includes(game.currentGame.word);
        });
        localStorage.setItem('game', JSON.stringify(game.currentGame));
    }
    getGame();
}

function updateGameRemote(guessValue) {
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
            (response) => {
                getGame(true);
            },
            (data) => {
            },
            (error) => {
                console.error(`error: !!!${error.message}`);
                // TODO :  assuming that this is what the error is...
                showPopup(`${guessValue.toUpperCase()} is not a TErdle word!`);
                getGame(false, true);
            }
        );
    }
}


function getGame(flipLastRow = false, error = false) {
    getGameLocal(flipLastRow, error);
    // getGameRemote(flipLastRow, error);

}

function getGameLocal(flipLastRow = false, error = false) {
    game.currentGame = JSON.parse(localStorage.getItem('game'));

    fillInGameTable();
    if (game.currentGame != null) {

        console.log('!!!get game');
        console.log(game);

        if (game.currentGame.guesses.length >= MAX_ROWS || game.currentGame.success) {
            let popupMsg = game.currentGame.success ?
                `You solved it in ${game.currentGame.guesses.length} tries!` :
                `Sorry, you didn't win.<br>  The word is ${game.currentGame.word}.`;
            showPopup(popupMsg, 'Play Again', endGame);
        }
    }
}

function getGameRemote(flipLastRow = false, error = false) {
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
                (response) => {
                    return response.json();
                },
                (data) => {
                    game.currentGame = data;
                    console.log(`got current game ${game.currentGame.gameId}`)
                    fillInGameTable(flipLastRow, error);

                    if (game.currentGame.guesses.length >= MAX_ROWS || game.currentGame.success) {
                        let popupMsg = game.currentGame.success ?
                            `You solved it in ${game.currentGame.guesses.length} tries!` :
                            `Sorry, you didn't win.<br>  The word is ${game.currentGame.word}.`;
                        showPopup(popupMsg, 'Play Again', endGame);
                    }
                }
            );
        }
    }
}

function showPopup(message, buttonText = 'OK', action = closePopup) {
    document.getElementById("popupMsg").style.display = "flex";
    document.getElementById("popupBtn").style.display = buttonText;
    document.getElementById("popupMsgText").innerHTML = message;
    document.getElementById("main").style.filter = "blur(2px)";
    popupAction = action;
    inPopup = true;
}

function closePopup() {
    document.getElementById("popupMsg").style.display = "none";
    document.getElementById("main").style.filter = "none";
    popupAction = closePopup;
    inPopup = false;
    selectGuess();
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
            (response) => {
                return response.json();
            },
            (data) => {
                console.log(`user: ${user.id}`);
                // TODO: display statistics from user games
            }
        );
    }
}

function fillInGameTable(flipLastRow = false, error = false) {
    if (game.currentGame && game.currentGame.guesses && game.currentGame.guesses.length > 0) {
        let matches = game.currentGame.matches;

        if (matches) {

            for (let i = 0; i < matches.length; ++i) {
                let isLastRow = i === matches.length - 1;
                for (let j = 0; j < NUMB_LETTERS; ++j) {

                    let guessId = `guess${i}${j}`
                    let guessElement = document.getElementById(guessId)
                    guessElement.innerText = matches[i][j].char.toUpperCase()

                    let keyId = `keyboard-${matches[i][j].char.toLowerCase()}`;
                    let keyElement = document.getElementById(keyId)

                    if (matches[i][j].match === "EXACT_MATCH") {
                        guessElement.classList.add("exact-match")
                        keyElement.classList.add("exact-match")

                    } else if (matches[i][j].match === "WRONG_LOCATION") {
                        guessElement.classList.add("match")
                        keyElement.classList.add("match")

                    } else {
                        guessElement.classList.add("no-match")
                        keyElement.classList.add("no-match")
                    }

                }
            }

            unselectGuess();

            game.currentGuess.row = matches.length;
            if (game.currentGuess.row >= MAX_ROWS) {
                game.currentGuess.row = MAX_ROWS - 1;
            }
            game.currentGuess.col = 0;

            selectGuess(error);
        }
    } else {
        for (let i = 0; i < MAX_ROWS; ++i) {
            for (let j = 0; j < NUMB_LETTERS; ++j) {

                let guessId = `guess${i}${j}`
                let guessElement = document.getElementById(guessId)
                guessElement.innerText = ' '
                guessElement.classList.remove("exact-match")
                guessElement.classList.remove("match")
                guessElement.classList.remove("no-match")
            }
        }

        let keyButtons = document.querySelectorAll('#keyboard button');
        keyButtons.forEach((button) => {
            button.classList.remove("exact-match")
            button.classList.remove("match")
            button.classList.remove("no-match")
        });

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

function selectGuess(error = false) {
    let guessId = `guess${game.currentGuess.row}${game.currentGuess.col}`
    let guessElement = document.getElementById(guessId)
    guessElement.classList.add("selected")
    guessElement.focus({ focusVisible: true, preventScroll: false });
    console.log(`Selected ${guessId} with error ${error}`)

    if (error) {
        guessElement.parentElement.classList.add("vibrate");
        setInterval(() => {
            guessElement.parentElement.classList.remove("vibrate");
        }, 1000)
    }
}

function unselectGuess() {
    let guessId = `guess${game.currentGuess.row}${game.currentGuess.col}`
    let guessElement = document.getElementById(guessId)
    guessElement.blur();
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

    callApi(`${baseUrl}/login`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
        },
        loading,
        (response) => {
            return response.json();
        },
        (data) => {


            console.log("LOGGED IN!!!");
            console.log(data);
            const token = data.token;
            const user = data.user;
            console.log(user);

            // Save the user ID and token to localStorage for later use
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', token);

            loggedIn(user);
        }
    );
}

function loggedIn(user) {
    let randomGameButton = document.getElementById('random-game-button');
    let dailyGameButton = document.getElementById('daily-game-button');
    if (user) {
        game.isLoggedIn = true;
        document.getElementById("login-form").style.display = "none";
        document.getElementById("login-wait").style.display = "none";
        document.getElementById("login-status").style.display = "flex";
        document.getElementById("logged-in-username").textContent = user.username;

        randomGameButton.style.display = 'inline-block';
        dailyGameButton.style.display = 'inline-block';
    } else {
        document.getElementById("login-form").style.display = "flex";
        document.getElementById("login-wait").style.display = "none";
        document.getElementById("login-status").style.display = "none";
        document.getElementById("logged-in-username").textContent = '';
        document.getElementById("username").textContent = '';
        document.getElementById("password").textContent = '';

        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('game');
        localStorage.removeItem('gameId');
        game.isLoggedIn = false;
        randomGameButton.style.display = 'inline-block';
        dailyGameButton.style.display = 'none';
    }
}

function logout() {
    loggedIn(null);
}

function endGame() {
    closePopup();
    game.currentGame = null
    localStorage.removeItem('game');
    localStorage.removeItem('gameId');
    let randomGameButton = document.getElementById('random-game-button');
    randomGameButton.innerText = 'New Game';
}

function loading(isLoading) {
    console.log(`LOADING: ${isLoading}`);
    game.isLoading = isLoading;
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
    leaderData.forEach((leader) => {
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