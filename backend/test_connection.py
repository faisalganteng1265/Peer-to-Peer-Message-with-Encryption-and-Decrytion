import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

print("Testing Supabase connection...")
print(f"URL: {url}")
print(f"Key: {key[:20]}..." if key else "Key: None")

try:
    supabase = create_client(url, key)
    result = supabase.table("users").select("*").limit(1).execute()
    print("\n✓ Connection successful!")
    print(f"Users table exists: {result}")
except Exception as e:
    print(f"\n✗ Connection failed: {e}")
