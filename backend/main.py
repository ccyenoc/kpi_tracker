from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# import routers
from routes import auth_routes, user_routes, kpi_routes,report_routes

# create app
app = FastAPI()

# CORS (allow frontend to call backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # later you can restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# include routers
app.include_router(auth_routes.router, prefix="/api")
app.include_router(user_routes.router, prefix="/api")
app.include_router(kpi_routes.router, prefix="/api")
app.include_router(report_routes.router, prefix="/api")


# optional test route
@app.get("/")
def root():
    return {"message": "Backend is running"}