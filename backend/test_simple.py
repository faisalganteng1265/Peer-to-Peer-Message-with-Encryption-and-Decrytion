import requests

url = "https://kfbnwopzaubvqawiikxp.supabase.co/rest/v1/"
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmYm53b3B6YXVidnFhd2lpa3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NjI1MDAsImV4cCI6MjA4MTUzODUwMH0.k1ij0faBjOuRuI172eFpZ__lu2nosYlXpvCSdBvFNmI"
}

try:
    print("Testing with requests library...")
    response = requests.get(url, headers=headers, timeout=10)
    print(f"Status: {response.status_code}")
    print("Connection successful!")
except Exception as e:
    print(f"Failed: {e}")
