from app.database.connection import supabase

def is_duplicate(phone):

    result = supabase.table(
        "riders"
    ).select(
        "*"
    ).eq(
        "phone",
        phone
    ).execute()

    return len(result.data) > 0