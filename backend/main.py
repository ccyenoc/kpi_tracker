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