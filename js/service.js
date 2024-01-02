function logError(error) {
    console.error('There was a problem:', error.message);    
}

function callApi(url, requestInfo, loading, handleResponse, handleData, handleError = logError) {
    loading(true);
    fetch(url, requestInfo)
    .then( response => {
        if (!response.ok) {
            throw Error(response.statusText);
        }
        return handleResponse(response);
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