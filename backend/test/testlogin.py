import requests

# Corrected URL to match the Flask route
url = 'http://127.0.0.1:5000/api/v1/login'

# Test data for login
login_data = {
    'username': 'rylan',  # Replace with a valid username
    'password': 'secure123'  # Replace with the corresponding password
}

# Send POST request
response = requests.post(url, json=login_data)

# Check response
if response.status_code == 200:
    print("Login successful!")
elif response.status_code == 401:
    print("Invalid credentials!")
elif response.status_code == 404:
    print("User not found!")
else:
    print(f"Error: {response.status_code} - {response.text}")
