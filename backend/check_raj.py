import sqlite3
conn = sqlite3.connect('d:/road-warrior-ev/backend/road_warrior.db')
conn.row_factory = sqlite3.Row
cur = conn.cursor()
cur.execute('SELECT * FROM users WHERE phone="9876598765"')
user = cur.fetchone()
if user:
    print('User:', dict(user))
    cur.execute('SELECT * FROM profiles WHERE user_id=?', (user['id'],))
    profile = cur.fetchone()
    if profile:
        print('Profile:', dict(profile))
    else:
        print('No profile found')
else:
    print('User not found')
