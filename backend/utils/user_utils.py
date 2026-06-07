def build_user_profile_document(user_data):
    is_dict = isinstance(user_data, dict)
    return {
        "name": user_data.get("name") if is_dict else user_data.name,
        "email": user_data.get("email") if is_dict else user_data.email,
        "phone": (user_data.get("phone") if is_dict else user_data.phone) or "",
        "role": user_data.get("role") if is_dict else user_data.role,
        "department": user_data.get("department") if is_dict else user_data.department,
    }

def build_public_user_document(user_id: str, user_profile: dict) -> dict:
    return {
        "id": user_id,
        **build_user_profile_document(user_profile),
    }