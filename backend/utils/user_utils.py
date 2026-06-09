def build_user_profile_document(user_data):
    is_dict = isinstance(user_data, dict)
    return {
        "name": user_data["name"] if isinstance(user_data, dict) else user_data.name,
        "email": user_data["email"] if isinstance(user_data, dict) else user_data.email,
        "phone": (user_data["phone"] if isinstance(user_data, dict) else user_data.phone) or "",
        "role": user_data["role"] if isinstance(user_data, dict) else user_data.role,
        "department": user_data["department"] if isinstance(user_data, dict) else user_data.department,
    }

def build_public_user_document(user_id: str, user_profile: dict) -> dict:
    return {
        "id": user_id,
        **build_user_profile_document(user_profile),
    }