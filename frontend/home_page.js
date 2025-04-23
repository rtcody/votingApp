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

    // Fetch polls and their vote summaries
    function fetchPolls() {
        // Get all polls
        fetch('http://127.0.0.1:5000/api/v1/polls')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch polls: ${response.statusText}`);
                }
                return response.json();
            })
            .then(polls => {
                console.log("Fetched polls:", polls);
                
                // Get vote summaries
                return fetch('http://127.0.0.1:5000/api/v1/votes_summary')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Failed to fetch vote summaries: ${response.statusText}`);
                        }
                        return response.json();
                    })
                    .then(voteSummaries => {
                        console.log("Fetched vote summaries:", voteSummaries);
                        displayPolls(polls, voteSummaries);
                    });
            })
            .catch(error => {
                console.error('Error:', error);
                const pollsListDiv = document.getElementById('pollsList');
                pollsListDiv.innerHTML = `<div class="error">Error loading polls: ${error.message}</div>`;
            });
    }

    // Display polls with their vote counts
    function displayPolls(polls, voteSummaries) {
        const pollsListDiv = document.getElementById('pollsList');
        pollsListDiv.innerHTML = ''; // Clear existing content
        
        if (!polls || polls.length === 0) {
            pollsListDiv.innerHTML = '<div class="no-polls">No polls available at the moment.</div>';
            return;
        }
        
        polls.forEach((poll, index) => {
            const pollElement = document.createElement('div');
            pollElement.className = 'poll-item';
            
            // Extract poll ID and question
            let pollId, question;
            
            // Handle different poll data formats
            if (typeof poll === 'object') {
                pollId = poll.id || poll.poll_id;
                question = poll.question;
            } else {
                // If poll is a string, use the index as ID and the string as question
                pollId = index + 1; // Use 1-based index for IDs
                question = poll;
            }
            
            // Find vote summary for this poll
            const voteSummary = voteSummaries.find(vs => 
                vs.poll_id === pollId || 
                parseInt(vs.poll_id) === pollId
            );
            
            const votesFor = voteSummary ? voteSummary.votes_for : 0;
            const votesAgainst = voteSummary ? voteSummary.votes_against : 0;
            
            console.log(`Poll ${pollId}: ${question} - For: ${votesFor}, Against: ${votesAgainst}`);
            
            // Create poll HTML
            pollElement.innerHTML = `
                <h3>${question}</h3>
                <div class="vote-summary">
                    <span class="votes-for">👍 ${votesFor}</span>
                    <span style="margin: 0 10px;">•</span>
                    <span class="votes-against">👎 ${votesAgainst}</span>
                </div>
                <div class="vote-buttons">
                    <button class="vote-button upvote" data-poll-id="${pollId}" data-vote="agree">
                        <span style="font-size: 18px;">👍</span> Agree
                    </button>
                    <button class="vote-button downvote" data-poll-id="${pollId}" data-vote="disagree">
                        <span style="font-size: 18px;">👎</span> Disagree
                    </button>
                    <span class="vote-message" id="vote-message-${pollId}"></span>
                </div>
            `;
            
            pollsListDiv.appendChild(pollElement);
            
            // Add event listeners to buttons
            const upvoteBtn = pollElement.querySelector('.upvote');
            const downvoteBtn = pollElement.querySelector('.downvote');
            
            upvoteBtn.addEventListener('click', () => recordVote(pollId, 'agree', `vote-message-${pollId}`));
            downvoteBtn.addEventListener('click', () => recordVote(pollId, 'disagree', `vote-message-${pollId}`));
        });
    }

    // Record a vote and update UI
    function recordVote(pollId, vote, messageElementId) {
        const voteData = {
            poll_id: pollId,
            vote: vote
        };
        
        console.log(`Recording vote: Poll ID ${pollId}, Vote: ${vote}`);
        
        fetch('http://127.0.0.1:5000/api/v1/record_vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(voteData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || response.statusText);
                });
            }
            return response.json();
        })
        .then(data => {
            // Update UI to show vote was recorded
            const messageElement = document.getElementById(messageElementId);
            messageElement.textContent = '✅ Vote recorded!';
            messageElement.style.color = '#4CAF50';
            
            // Update vote counts in UI
            const pollElement = messageElement.closest('.poll-item');
            const votesForElement = pollElement.querySelector('.votes-for');
            const votesAgainstElement = pollElement.querySelector('.votes-against');
            
            if (vote === 'agree') {
                const currentVotes = parseInt(votesForElement.textContent.split(' ')[1] || '0');
                votesForElement.textContent = `👍 ${currentVotes + 1}`;
            } else {
                const currentVotes = parseInt(votesAgainstElement.textContent.split(' ')[1] || '0');
                votesAgainstElement.textContent = `👎 ${currentVotes + 1}`;
            }
            
            // Clear message after 3 seconds
            setTimeout(() => {
                messageElement.textContent = '';
            }, 3000);
        })
        .catch(error => {
            console.error('Error recording vote:', error);
            const messageElement = document.getElementById(messageElementId);
            messageElement.textContent = `❌ ${error.message}`;
            messageElement.style.color = '#F44336';
            
            // Clear error message after 3 seconds
            setTimeout(() => {
                messageElement.textContent = '';
            }, 3000);
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