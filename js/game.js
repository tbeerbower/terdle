//const baseUrl = 'https://terdle-server.fly.dev'
const baseUrl = 'http://localhost:9000'


let currentGuessRow = 0;
let currentGuessCol = 0;
let isLoggedIn = false;
let currentGame = null; 

document.addEventListener('DOMContentLoaded', (event) => {


    initGameBoard()

    var user = JSON.parse(localStorage.getItem('user'));
    if (user != null) {
        loggedIn(user);
        getGame();
    }

    document.addEventListener('keydown', logKey);
    function logKey(e) {

        console.log(`key code is ${e.key}`);

        if (isLoggedIn) {
            let key = e.key

            unselectGuess();
            if (key.length === 1 && key.match(/[a-zA-Z]/i)) {
                let guessId = `guess${currentGuessRow}${currentGuessCol}`
                console.log(`guessId is ${guessId}`);

                document.getElementById(guessId).textContent = key.toUpperCase();
                if (currentGuessCol < 4) {
                    currentGuessCol++
                }
            } else if (key == "Backspace") {
                let guessId = `guess${currentGuessRow}${currentGuessCol}`
                let guessElement = document.getElementById(guessId)
                guessElement.innerHTML = '&nbsp'
                if (currentGuessCol > 0) {
                    currentGuessCol--
                }
            } else if (key == "ArrowLeft") {
                if (currentGuessCol > 0) {
                    currentGuessCol--
                }
            } else if (key == "ArrowRight") {
                if (currentGuessCol < 4) {
                    let guessId = `guess${currentGuessRow}${currentGuessCol}`
                    let guessElement = document.getElementById(guessId)
                    if (guessElement.textContent.length === 1 && guessElement.textContent.match(/[a-zA-Z]/i)) {
                        currentGuessCol++
                    }
                }
            } else if (key == "Enter") {
                let guess = ''
                let complete = true;
                for (let i = 0; i < 5; i++) {
                    let guessId = `guess${currentGuessRow}${i}`
                    let guessElement = document.getElementById(guessId)
                    guess = guess + guessElement.textContent

                    if (guessElement.textContent.length != 1 || !guessElement.textContent.match(/[a-zA-Z]/i)) {
                        complete = false
                    }

                //  console.log(guessElement)
                }
                if (complete) {

                    updateGame(guess);

                    if (currentGuessRow < 5) {

                        currentGuessRow++
                        currentGuessCol = 0
                    }
                }
              
                console.log("Guess=" + guess);
            }
            selectGuess();
        }
    }
});

function initGameBoard() {

    console.log('initializing game board!');

    let gameTableElement = document.getElementById('game-table')

    for (let r = 0; r < 6; r++) {

        let rowElement = document.createElement('tr');
     //   rowElement.classList.add('elementToFadeInAndOut')


        for (let c = 0; c < 5; c++) {
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

        let previousGuesses = currentGame.guesses;
        if (!previousGuesses) {
            previousGuesses = []
        }

        previousGuesses.push(guessValue.toLowerCase());

        const guessData = {
            guesses: previousGuesses
        };

        fetch(`${baseUrl}/users/${userId}/games/${gameId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(guessData),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            getGame();
        })
        .catch(error => {
            // Handle errors during game update
            console.error('There was a problem updating the game:', error.message);
            getGame();
        }); 
    }
}


function getGame() {
    var user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        var token = localStorage.getItem('token');
        var userId = user.id;
        var gameId = localStorage.getItem('gameId');

        if (gameId) {
            fetch(`${baseUrl}/users/${userId}/games/${gameId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                currentGame = data;
                console.log(`got current game ${currentGame.gameId}`)
                fillInGameTable();

                if (currentGame.guesses.length >= 6 || currentGame.success ) {
                    document.getElementById("gameOver").style.display = "block";
                    if (currentGame.success) {
                        document.getElementById("gameOverText").textContent = `You solved it in ${currentGame.guesses.length} tries!`;
                    } else {
                        document.getElementById("gameOverText").textContent = `Sorry you didn't win.  The word is ${currentGame.word}.`;
                    }
                    
                }

            })
            .catch(error => {
                // Handle errors during game creation
                console.error('There was a problem getting the game:', error.message);
            }); 
        }
    }
}

function fillInGameTable() {
    unselectGuess();
    if (currentGame) {
        let game = currentGame;
        let matches = game.matches;

        console.log(`matches = ${matches}`)
        if (matches) {


            for (let i = 0; i < matches.length; ++i) {
                for (let j = 0; j < 5; ++j) {
        
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

            currentGuessRow = matches.length;
            if (currentGuessRow > 5) {
                currentGuessRow = 5;
            }
            currentGuessCol = 0;

            console.log(`fill in row ${currentGuessRow} col ${currentGuessCol}`)
        }
    } else {
        for (let i = 0; i < 6; ++i) {
            for (let j = 0; j < 5; ++j) {
    
                let guessId = `guess${i}${j}`
                let guessElement = document.getElementById(guessId)
                guessElement.innerHTML = '&nbsp'
                guessElement.classList.remove("exact-match")
                guessElement.classList.remove("match")
                guessElement.classList.add("no-match")
            }
        }
        currentGuessRow = 0;
        currentGuessCol = 0;

    }  
    selectGuess();
}


function selectGuess() {
    let guessId = `guess${currentGuessRow}${currentGuessCol}`

    console.log(`selecting guess${currentGuessRow}${currentGuessCol}`)

    let guessElement = document.getElementById(guessId)
    guessElement.classList.add("selected") 
}

function unselectGuess() {
    let guessId = `guess${currentGuessRow}${currentGuessCol}`
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

    fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Handle successful login response
        console.log('Login successful', data);

        // Assuming you want to extract the token and user details
        const token = data.token;
        const user = data.user;

        // Save the user ID and token to localStorage for later use
        localStorage.setItem('user',JSON.stringify(user));
        localStorage.setItem('token', token);

        loggedIn(user);
        startGame();

    })
    .catch(error => {
        // Handle errors during login
        console.error('There was a problem with the login:', error.message);
    });
}

function loggedIn(user) {
    isLoggedIn = true;
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
    isLoggedIn = false;
}

function endGame() {
    document.getElementById("gameOver").style.display = "none";
    currentGame = null
    localStorage.removeItem('gameId');
    fillInGameTable();
    startGame();
}
