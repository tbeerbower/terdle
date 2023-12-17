function updateApi() {

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