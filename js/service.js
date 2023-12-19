function logError(error) {
    console.error('There was a problem:', error.message);    
}

function callApi(url, requestInfo, loading, handleData, handleError = logError) {
    loading(true);
    fetch(url, requestInfo)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then( data => {
        handleData(data);
        loading(false);
    })
    .catch(error => {
        handleError(error);
        loading(false);
    });
}