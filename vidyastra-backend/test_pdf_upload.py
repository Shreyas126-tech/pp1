import requests
import io

base_url = "http://localhost:8000/api"

r = requests.post(f"{base_url}/auth/login", data={"username": "testupload@example.com", "password": "password"})
if r.status_code == 200:
    token = r.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Let's import PyPDF2 to create a valid minimal PDF
    from PyPDF2 import PdfWriter
    writer = PdfWriter()
    writer.add_blank_page(width=72, height=72)
    fake_pdf = io.BytesIO()
    writer.write(fake_pdf)
    fake_pdf.seek(0)
    
    files = {"file": ("test.pdf", fake_pdf, "application/pdf")}
    r = requests.post(f"{base_url}/documents/upload", headers=headers, files=files)
    print("PDF Upload:", r.status_code, r.text)
