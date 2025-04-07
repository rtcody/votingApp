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

document.getElementById('createPollForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const question = document.getElementById('questionInput').value;
    const expiresAt = document.getElementById('expiresInput').value || null;


    if (!question) {
        document.getElementById('createPollMessage').innerText = '❌ Poll question is required!';
        return;
    }

    const payload = {
        question: question,
        expires_at: expiresAt
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