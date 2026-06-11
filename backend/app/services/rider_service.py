from app.database.connection import supabase

def save_rider(data):

    return (
        supabase
        .table("riders")
        .insert(data)
        .execute()
    )