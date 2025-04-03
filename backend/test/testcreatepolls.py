import requests
import json

# URL of the Flask create_poll route (replace with your actual Flask server URL)
url = 'http://127.0.0.1:5000/api/v1/create_poll'

# Test data for creating a poll (adjust with real values if needed)
poll_data = {
    'question': 'What is your favorite programming language?',
    'created_by': 1,  # Assuming the user with ID 1 is creating the poll
    'expires_at': '2025-01-01T12:00:00'  # Optional expiration date for the poll
}

# Send POST request to the create_poll route
response = requests.post(url, json=poll_data)

# Check the status code of the response
if response.status_code == 201:
    print("Poll created successfully!")
    print("Response JSON:", json.dumps(response.json(), indent=4))
elif response.status_code == 400:
    print("Bad request. Missing data or invalid input.")
    print("Response JSON:", json.dumps(response.json(), indent=4))
elif response.status_code == 500:
    print("Server error. Something went wrong while creating the poll.")
    print("Response JSON:", json.dumps(response.json(), indent=4))
else:
    print(f"Unexpected response: {response.status_code}")
    print("Response JSON:", json.dumps(response.json(), indent=4))
