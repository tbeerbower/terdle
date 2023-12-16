function callApi(url, requestInfo, handleData, handleError = logError) {
    fetch(url, requestInfo)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(handleData)
    .catch(error => {
        handleError(error);
    });
}