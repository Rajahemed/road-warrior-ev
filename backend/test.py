import urllib.request
import json
import urllib.error

data = json.dumps({'full_name':'Test','phone':'5555555555','password':'test'}).encode()
req = urllib.request.Request('http://127.0.0.1:8000/riders/register', data=data, headers={'Content-Type': 'application/json'})

try:
    urllib.request.urlopen(req)
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code)
    print(e.read().decode())
except Exception as e:
    print("Exception:", e)
