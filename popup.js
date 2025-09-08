
document.addEventListener('DOMContentLoaded', function () {
    const clickButton = document.getElementById('startBut');
    const optionsButton = document.getElementById('optionsBtn');

    clickButton.addEventListener('click', async () => {
        const jsonUrl = 'urls.json';

        fetch(jsonUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                console.log(data, "first data")
                chrome.runtime.sendMessage({ action: 'start', links: data });
            })
            .catch(error => {
                console.error('Error fetching JSON:', error);
            });
    });

    optionsButton.addEventListener('click', () => {
        // Open the options page
        chrome.runtime.openOptionsPage();
    });
});

