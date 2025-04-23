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

document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('[data-tab-target]');
    const tabContents = document.querySelectorAll('[data-tab-content]');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = document.querySelector(tab.dataset.tabTarget);
            
            tabContents.forEach(tabContent => {
                tabContent.classList.remove('active');
            });
            
            tabs.forEach(tab => {
                tab.classList.remove('active');
            });
            
            tab.classList.add('active');
            target.classList.add('active');

            // Load polls when clicking on the Vote tab
            if (tab.dataset.tabTarget === '#vote') {
                loadPolls();
            }
        });
    });
    
    // Set up form submission
    const createPollForm = document.getElementById('createPollForm');
    if (createPollForm) {
        createPollForm.addEventListener('submit', createPoll);
    }
    
    // Add option button functionality
    const addOptionBtn = document.getElementById('addOptionBtn');
    if (addOptionBtn) {
        addOptionBtn.addEventListener('click', addOption);
    }

    // Load polls initially if on Vote tab
    if (document.querySelector('#vote.active')) {
        loadPolls();
    }
});

function loadPolls() {
    fetch('http://127.0.0.1:5000/api/v1/polls')
        .then(response => response.json())
        .then(data => {
            // Handle the list of polls
            const pollsListDiv = document.getElementById('pollsList');
            pollsListDiv.innerHTML = ''; // Clear previous content
            
            if (data.length > 0) {
                data.forEach(poll => {
                    const pollElement = document.createElement('div');
                    pollElement.className = 'poll-item';
                    
                    // Check if poll is a string or object and display accordingly
                    if (typeof poll === 'object') {
                        pollElement.innerHTML = `<h3>${poll.question}</h3>`;
                        
                        // If poll has options, display them
                        if (poll.options && poll.options.length > 0) {
                            const optionsList = document.createElement('ul');
                            poll.options.forEach(option => {
                                const optionItem = document.createElement('li');
                                optionItem.textContent = option;
                                optionsList.appendChild(optionItem);
                            });
                            pollElement.appendChild(optionsList);
                        }
                    } else {
                        pollElement.innerHTML = `<h3>${poll}</h3>`;
                    }
                    
                    pollsListDiv.appendChild(pollElement);
                });
            } else {
                pollsListDiv.textContent = 'No polls available at the moment.';
            }
        })
        .catch(error => {
            console.error('Error loading polls:', error);
            const pollsListDiv = document.getElementById('pollsList');
            pollsListDiv.textContent = `Error fetching polls: ${error.message}`;
        });
}

function createPoll(event) {
    event.preventDefault();
    
    const questionInput = document.getElementById('questionInput');
    const expiresInput = document.getElementById('expiresInput');
    const usernameInput = document.getElementById('usernameInput');
    const passwordInput = document.getElementById('passwordInput');
    const optionInputs = document.querySelectorAll('.optionInput');
    const message = document.getElementById('createPollMessage');
    
    // Validate all inputs are filled
    if (!questionInput.value || !expiresInput.value || !usernameInput.value || !passwordInput.value) {
        message.textContent = '❌ Please fill in all required fields.';
        return;
    }
    
    
    // Create poll data object
    const pollData = {
        question: questionInput.value,
        expires_at: expiresInput.value,
        username: usernameInput.value,
        password: passwordInput.value,
        options: options
    };
    
    // Send data to API
    fetch('http://127.0.0.1:5000/api/v1/create_poll', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(pollData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.poll_id) {
            message.textContent = `✅ Poll created successfully! Poll ID: ${data.poll_id}`;
            createPollForm.reset();
            
            // Switch to vote tab after successful creation
            setTimeout(() => {
                document.querySelector('[data-tab-target="#vote"]').click();
            }, 2000);
        } else {
            message.textContent = `❌ Error: ${data.message || 'Failed to create poll'}`;
        }
    })
    .catch(error => {
        console.error('Error creating poll:', error);
        message.textContent = `❌ Error creating poll: ${error.message}`;
    });
}