from fastapi import FastAPI
from steam_auth import router
from suggestions import router as suggestions_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.include_router(router)
app.include_router(suggestions_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # W produkcji zastąp konkretnymi adresami
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)