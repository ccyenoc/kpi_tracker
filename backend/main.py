from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# import routers
from routes import auth_routes, user_routes, kpi_routes,report_routes

# create app
app = FastAPI()

# CORS (allow frontend to call backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000",
                  "http://localhost:5173",
                  "http://localhost:5174",
                  "http://127.0.0.1:5173",
                  "http://127.0.0.1:5174",
                  "https://bookish-zebra-7v5796xrxgj5cp64w-5173.app.github.dev"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Print Firebase configuration status
print_config_status()

# Initialize Firebase Admin SDK
try:
    if not firebase_admin._apps:
        cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
        firebase_admin.initialize_app(cred, FIREBASE_ADMIN_CONFIG)
    db = firestore.client()
    print("Firebase Admin SDK initialized successfully")
    print(f"Connected to project: {FIREBASE_ADMIN_CONFIG.get('projectId')}")
    print(f"Primary user data collection: {USERDATA_COLLECTION}")
except Exception as e:
    print(f"Firebase initialization error: {e}")
    print("Please ensure serviceAccountKey.json exists in the backend directory")
    db = None


# Pydantic models for request/response
class UserRegistration(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = None  # Phone is optional
    role: str
    department: str


class UserLogin(BaseModel):
    email: str
    password: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None  # Allow empty string
    department: Optional[str] = None


class PasswordUpdate(BaseModel):
    currentPassword: str
    newPassword: str
    confirmPassword: str


class UserResponse(BaseModel):
    success: bool
    message: str
    user: Optional[dict] = None
    dashboard: Optional[str] = None
    requiresEmailVerification: Optional[bool] = False


USER_PROFILE_FIELDS = ("name", "email", "phone", "role", "department")


# Helper functions for password hashing and JWT
def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against bcrypt hash."""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def create_jwt_token(user_id: str, email: str) -> str:
    """Create a JWT token for the user."""
    payload = {"user_id": user_id, "email": email, "exp": time.time() + (24 * 3600)}
    return jwt.encode(payload, "SECRET_KEY_CHANGE_IN_PROD", algorithm="HS256")


def verify_jwt_token(token: str) -> dict:
    """Verify and decode JWT token."""
    return jwt.decode(token, "SECRET_KEY_CHANGE_IN_PROD", algorithms=["HS256"])


def build_user_profile_document(user_data: UserRegistration | dict) -> dict:
    """Create the exact Firestore profile document shape for a user."""
    return {
        "name": user_data["name"] if isinstance(user_data, dict) else user_data.name,
        "email": user_data["email"] if isinstance(user_data, dict) else user_data.email,
        "phone": (user_data["phone"] if isinstance(user_data, dict) else user_data.phone) or "",
        "role": user_data["role"] if isinstance(user_data, dict) else user_data.role,
        "department": user_data["department"] if isinstance(user_data, dict) else user_data.department,
    }


def build_public_user_document(user_id: str, user_profile: dict) -> dict:
    """Return the frontend-safe user shape with the generated user ID."""
    return {
        "id": user_id,
        **build_user_profile_document(user_profile),
    }


def save_user_profile_document(user_ref, user_profile: dict) -> None:
    """Overwrite a Firestore profile document with only the allowed fields."""
    user_ref.set(build_user_profile_document(user_profile))


def create_user_documents(users_ref, user_data: UserRegistration, hashed_password: str) -> tuple[str, dict]:
    """Create a brand-new user profile and auth record without overwriting existing documents."""
    base_profile = build_user_profile_document(user_data)
    attempt_number = 0

    while True:
        attempt_number += 1
        print(f"[register] create_user_documents attempt {attempt_number} for email={getattr(user_data, 'email', None)}")
        user_id = allocate_next_user_id(users_ref)
        print(f"[register] candidate user_id={user_id}")
        user_ref = users_ref.document(user_id)
        auth_ref = db.collection(USERAUTH_COLLECTION).document(user_id)

        try:
            user_ref.create(base_profile)
            auth_ref.create({
                "userId": user_id,
                "email": user_data.email,
                "password_hash": hashed_password,
            })
            return user_id, base_profile
        except AlreadyExists:
            # ID was already taken; try again with the next candidate (do NOT delete existing docs)
            print(f"[register] collision for {user_id} (AlreadyExists). Retrying...")
            if attempt_number >= 10:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Unable to allocate a new user ID after multiple attempts"
                )
            continue
        except Exception as e:
            # Non-AlreadyExists error during create: log traceback, retry a few times, then fail
            print(f"[register] exception during create_user_documents attempt {attempt_number}: {e}")
            traceback.print_exc()
            if attempt_number >= 10:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed creating user documents: {str(e)}"
                )
            continue


def save_user_auth_document(user_id: str, email: str, password_hash: str) -> None:
    """Store password hashes outside of userData so profile docs stay clean."""
    db.collection(USERAUTH_COLLECTION).document(user_id).set({
        "userId": user_id,
        "email": email,
        "password_hash": password_hash,
    })


def get_user_auth_hash(user_id: str) -> str:
    """Load the password hash for a user from the auth collection."""
    auth_doc = db.collection(USERAUTH_COLLECTION).document(user_id).get()
    if not auth_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Authentication record not found")

    auth_data = auth_doc.to_dict() or {}
    return auth_data.get("password_hash", "")


def allocate_next_user_id(users_ref) -> str:
    """Allocate the next user ID using a transactional counter to guarantee sequential increment.

    This uses a Firestore document `systemCounters/userIdCounter` to atomically increment
    the `nextUserNumber` value so new signups receive sequential IDs (user_101, user_102...).
    If the counter doesn't exist yet we compute a safe starting point from existing user IDs.
    """
    @firestore.transactional
    def allocate_tx(transaction, users_ref_inner):
        counter_ref = db.collection(USER_COUNTER_COLLECTION).document(USER_COUNTER_DOC)
        counter_snapshot = counter_ref.get(transaction=transaction)

        if counter_snapshot.exists:
            counter_data = counter_snapshot.to_dict() or {}
            try:
                next_user_number = int(counter_data.get("nextUserNumber", 100)) + 1
            except Exception as e:
                print(f"[allocate] invalid counter data: {counter_data}; error: {e}")
                traceback.print_exc()
                next_user_number = 101
        else:
            # Initialize counter from the highest existing user_ number
            existing_numbers = []
            for user_snapshot in users_ref_inner.stream():
                user_id = user_snapshot.id
                if not user_id.startswith("user_"):
                    continue
                try:
                    existing_numbers.append(int(user_id.split("_", 1)[1]))
                except (IndexError, ValueError):
                    continue

            next_user_number = (max(existing_numbers) if existing_numbers else 100) + 1

        transaction.set(counter_ref, {"nextUserNumber": next_user_number})
        print(f"[allocate] counter set to nextUserNumber={next_user_number}")
        return f"user_{next_user_number}"

    transaction = db.transaction()
    try:
        return allocate_tx(transaction, users_ref)
    except Exception as e:
        print(f"[allocate] exception during allocate_tx: {e}")
        traceback.print_exc()
        raise


@app.get("/")
def root():
    return {"message": "KPI Tracker Backend API - use /api/* endpoints", "status": "ok"}


@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    firebase_status = "connected" if db is not None else "not_configured"
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "firebase_connected": db is not None,
        "firebase_status": firebase_status,
        "service_account_key_exists": os.path.exists(SERVICE_ACCOUNT_KEY_PATH),
        "version": "1.0.0"
    }


@app.post("/api/register", response_model=UserResponse)
def register_user(user_data: UserRegistration):
    """Register a new user with Firestore (no Firebase Auth)"""
    try:
        # Validate required fields (phone is optional)
        required_fields = ['name', 'email', 'password', 'role', 'department']
        for field in required_fields:
            field_value = getattr(user_data, field)
            if not field_value or (isinstance(field_value, str) and not field_value.strip()):
                print(f"[register] Missing or empty required field: {field} = '{field_value}'")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Missing required field: {field}"
                )

        # Validate role
        if user_data.role not in ['staff', 'manager']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role must be 'staff' or 'manager'"
            )

        # Create user in Firestore with bcrypt password hash
        if db:
            print(f"Using Firestore for registration: {user_data.email}")
            try:
                # Check if user already exists in Firestore
                users_ref = db.collection(USERDATA_COLLECTION)
                existing_user = list(users_ref.where(filter=FieldFilter('email', '==', user_data.email)).stream())
                if existing_user:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Email already registered"
                    )

                # Hash password
                hashed_password = hash_password(user_data.password)

                # Create fresh Firestore documents and never overwrite an existing user
                try:
                    user_id, user_profile_doc = create_user_documents(users_ref, user_data, hashed_password)
                except Exception as inner_e:
                    print(f"[register] exception while creating user documents: {inner_e}")
                    traceback.print_exc()
                    raise
                print(f"Created user in Firestore: {user_id}")

                # Return user data with the generated user ID
                user_response = build_public_user_document(user_id, user_profile_doc)

                return UserResponse(
                    success=True,
                    message="Registration successful! You can now log in.",
                    user=user_response,
                    requiresEmailVerification=False
                )

            except HTTPException:
                raise
            except Exception as firebase_error:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Firebase error: {str(firebase_error)}"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Firebase/Firestore not configured. Please check your setup."
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@app.post("/api/login")
def login_user(credentials: UserLogin):
    """Login user with role-based navigation using Firestore"""
    try:
        if not credentials.email or not credentials.password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email and password are required"
            )

        if db:
            print(f"Using Firestore for login: {credentials.email}")
            try:
                # Find user by email in Firestore
                users_ref = db.collection(USERDATA_COLLECTION)
                users = list(users_ref.where(filter=FieldFilter('email', '==', credentials.email)).stream())
                
                if not users:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid email or password"
                    )

                user_doc = users[0]
                user_id = user_doc.id
                user_data = user_doc.to_dict() or {}

                # Verify password from the dedicated auth collection
                password_hash = get_user_auth_hash(user_id)
                if not verify_password(credentials.password, password_hash):
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid email or password"
                    )

                # Create JWT token
                token = create_jwt_token(user_id, credentials.email)

                # Determine dashboard based on role
                dashboard_url = "/staff/dashboard"
                if user_data.get('role') == 'manager':
                    dashboard_url = "/manager/dashboard"

                # Keep the userData document in the clean profile-only format
                save_user_profile_document(db.collection(USERDATA_COLLECTION).document(user_id), user_data)

                # Return user data with the generated user ID
                user_response = build_public_user_document(user_id, user_data)

                return {
                    "success": True,
                    "message": "Login successful!",
                    "user": user_response,
                    "dashboard": dashboard_url,
                    "token": token
                }

            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Login failed: {str(e)}"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Firebase/Firestore not configured. Please check your setup."
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@app.post("/api/logout")
def logout_user(request: Request):
    """Logout user (JWT token is invalidated on client side by removing from localStorage)."""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")

        token = auth_header.split(' ', 1)[1]
        verify_jwt_token(token)  # Just verify the token is valid
        return {"success": True, "message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Logout failed: {str(e)}")


# include routers
app.include_router(auth_routes.router, prefix="/api")
app.include_router(user_routes.router, prefix="/api")
app.include_router(kpi_routes.router, prefix="/api")
app.include_router(report_routes.router, prefix="/api")


# optional test route
@app.get("/")
def root():
    return {"message": "Backend is running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)