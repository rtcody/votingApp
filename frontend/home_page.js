const tabs = document.querySelectorAll('[data-tab-target]')
const tabContents = document.querySelectorAll('[data-tab-content]')
tabs.forEach(tab => 
{
    tab.addEventListener('click', () =>
    {
        const target = document.querySelector(tab.dataset.tabTarget)
        tabContents.forEach(tabContent => {
            tabContent.classList.remove('active')
        })
        tabs.forEach(tab => {
            tab.classList.remove('active')
        })
        tab.classList.add('active')
        target.classList.add('active')
    })
}
)

document.addEventListener('DOMContentLoaded', function() {
    // Make sure form exists before adding listener
    const createPollForm = document.getElementById('createPollForm');
    if (createPollForm) {
        createPollForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const question = document.getElementById('questionInput').value.trim();
            const expiresAt = document.getElementById('expiresInput').value || null;
            const username = document.getElementById('usernameInput').value.trim();
            const password = document.getElementById('passwordInput').value.trim();

            // Check if required fields are filled
            if (!question || !username || !password) {
                document.getElementById('createPollMessage').innerText = '❌ Error: Question, username, and password are required!';
                return;
            }

            const payload = {
                question: question,
                expires_at: expiresAt,
                username: username,
                password: password
            };

            try {
                const res = await fetch('http://127.0.0.1:5000/api/v1/create_poll', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await res.json();

                if (res.ok) {
                    document.getElementById('createPollMessage').innerText = `✅ Poll created! Poll ID: ${result.poll_id}`;
                    document.getElementById('createPollForm').reset();
                } else {
                    document.getElementById('createPollMessage').innerText = `❌ Error: ${result.message || 'Something went wrong'}`;
                }
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('createPollMessage').innerText = `❌ Error: ${error.message}`;
            }
        });
    }

    // Fetch polls for the Vote tab
    function fetchPolls() {
        fetch('http://127.0.0.1:5000/api/v1/polls')
            .then(response => response.json())
            .then(data => {
                const pollsListDiv = document.getElementById('pollsList');
                pollsListDiv.innerHTML = ''; // Clear existing content
                
                if (data && data.length > 0) {
                    data.forEach(poll => {
                        const pollElement = document.createElement('div');
                        pollElement.className = 'poll-item';
                        pollElement.innerHTML = `<h3>${typeof poll === 'object' ? poll.question : poll}</h3>`;
                        pollsListDiv.appendChild(pollElement);
                    });
                } else {
                    pollsListDiv.textContent = 'No polls available at the moment.';
                }
            })
            .catch(error => {
                const pollsListDiv = document.getElementById('pollsList');
                pollsListDiv.textContent = `Error fetching polls: ${error.message}`;
            });
    }

    // Load polls when the Vote tab is clicked
    const voteTab = document.querySelector('[data-tab-target="#vote"]');
    if (voteTab) {
        voteTab.addEventListener('click', fetchPolls);
    }

    // Initial load of polls if on the Vote tab
    if (document.querySelector('#vote.active')) {
        fetchPolls();
    }
});