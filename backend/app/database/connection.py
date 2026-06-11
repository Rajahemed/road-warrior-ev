from supabase import create_client
from app.config import settings

import json
import os

DB_FILE = "road_warrior_data.json"

class MockSupabase:
    def __init__(self):
        if os.path.exists(DB_FILE):
            with open(DB_FILE, "r") as f:
                try:
                    self.db = json.load(f)
                except json.JSONDecodeError:
                    self.db = {"riders": [], "referrals": []}
        else:
            self.db = {"riders": [], "referrals": []}

    def _save(self):
        with open(DB_FILE, "w") as f:
            json.dump(self.db, f, indent=2)

    def table(self, table_name):
        return MockTable(self.db, table_name, self._save)

class MockTable:
    def __init__(self, db, table_name, save_cb):
        self.db = db
        self.table_name = table_name
        self.save_cb = save_cb
        if self.table_name not in self.db:
            self.db[self.table_name] = []
        self._data = self.db[self.table_name]
        self._filtered = list(self._data)
        self._pending_update = None

    def select(self, *args):
        return self

    def insert(self, data):
        if isinstance(data, list):
            for d in data:
                self.db[self.table_name].append(d)
                self._filtered.append(d)
        else:
            self.db[self.table_name].append(data)
            self._filtered.append(data)
        self._did_insert = True
        return self

    def update(self, data):
        self._pending_update = data
        return self

    def eq(self, field, value):
        self._filtered = [item for item in self._filtered if item.get(field) == value]
        return self
        
    def neq(self, field, value):
        self._filtered = [item for item in self._filtered if item.get(field) != value]
        return self

    def order(self, column, desc=False, **kwargs):
        self._filtered = sorted(self._filtered, key=lambda x: x.get(column, 0), reverse=desc)
        return self

    def limit(self, count, **kwargs):
        self._filtered = self._filtered[:count]
        return self

    def execute(self):
        if self._pending_update:
            for item in self._filtered:
                item.update(self._pending_update)
            self._pending_update = None
            self.save_cb()
            
        elif getattr(self, "_did_insert", False):
            self.save_cb()
            self._did_insert = False

        class Result:
            def __init__(self, data):
                self.data = data
        return Result(self._filtered)

supabase = None

# If user hasn't provided real keys, use the In-Memory Mock Database
if not settings.SUPABASE_URL or settings.SUPABASE_URL == "https://xxxxxxxx.supabase.co":
    print("WARNING: Using In-Memory Mock Database because Supabase keys are not set.")
    supabase = MockSupabase()
else:
    try:
        supabase = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY
        )
    except Exception as e:
        print("ERROR connecting to Supabase, falling back to mock DB:", e)
        supabase = MockSupabase()