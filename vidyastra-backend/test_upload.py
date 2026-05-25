import requests

base_url = "http://localhost:8000/api"

# 1. Register a test user
test_user = {"email": "testupload@example.com", "password": "password", "full_name": "Test User"}
r = requests.post(f"{base_url}/auth/register", json=test_user)
print("Register:", r.status_code, r.text)

# 2. Login
r = requests.post(f"{base_url}/auth/login", data={"username": "testupload@example.com", "password": "password"})
print("Login:", r.status_code, r.text)
if r.status_code == 200:
    token = r.json().get("access_token")
    # 3. Upload a file
    headers = {"Authorization": f"Bearer {token}"}
    files = {"file": ("hello.txt", b"Hello, this is a test upload.")}
    r = requests.post(f"{base_url}/documents/upload", headers=headers, files=files)
    print("Upload:", r.status_code, r.text)
