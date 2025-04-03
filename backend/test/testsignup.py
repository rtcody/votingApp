import requests

url = "http://127.0.0.1:5000/api/v1/signup"
data = {
    "username": "rylan",
    "email": "rylan@example.com",
    "password": "secure123"
}

response = requests.post(url, json=data)

print(response.status_code)
print(response.json())
