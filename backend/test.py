import urllib.request
import json
import urllib.error
req = urllib.request.Request(
    'https://road-warrior-ev.onrender.com/auth/register',
    data=json.dumps({'full_name':'Test', 'phone':'8888888888', 'email':'test2@test.com', 'password':'password123', 'recaptcha_token':'dummy'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
import urllib.request, json
try:
    urllib.request.urlopen(req)
    print('Home:', urllib.request.urlopen('https://road-warrior-ev.onrender.com/').read().decode('utf-8'))
except Exception as e:
    print(e.read().decode('utf-8'))
    print('Home Error:', getattr(e, 'code', str(e)))
req2 = urllib.request.Request('https://road-warrior-ev.onrender.com/auth/register', data=json.dumps({'full_name':'Test', 'phone':'8888888888', 'email':'test2@test.com', 'password':'password123', 'recaptcha_token':'dummy'}).encode('utf-8'), headers={'Content-Type': 'application/json'})
try:
    print(urllib.request.urlopen(req2).read().decode('utf-8'))
except Exception as e:
    print('Register Error:', getattr(e, 'code', str(e)), e.read().decode('utf-8') if hasattr(e, 'read') else '')
