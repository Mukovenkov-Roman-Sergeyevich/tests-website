import json
import secrets
from typing import List, Optional
from fastapi import FastAPI, Response, Cookie, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://localhost:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_json(filename, default):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return default

def save_json(filename, data):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

users_db = load_json('users.json', {"admin": "123"})
quizzes_db = load_json('quizzes.json', [])
results_db = load_json('results.json', [])
tokens = {}

class OptionModel(BaseModel):
    text: str
    result_index: int

class QuestionModel(BaseModel):
    text: str
    options: List[OptionModel]

class QuizCreateModel(BaseModel):
    title: str
    result_names: List[str]
    questions: List[QuestionModel]

class ResultModel(BaseModel):
    quiz_title: str
    result_text: str
    date: str

def get_current_user(access_token: Optional[str] = Cookie(None)):
    if access_token is None or access_token not in tokens:
        raise HTTPException(status_code=401, detail="Auth required")
    return tokens[access_token]

@app.post("/login-cookie")
def login(response: Response, username: str, password: str):
    if username not in users_db:
        users_db[username] = password
        save_json('users.json', users_db)
    
    if users_db[username] != password:
        raise HTTPException(status_code=400, detail="Wrong password")

    token = secrets.token_urlsafe(32)
    tokens[token] = username
    
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite='none',
        secure=True
    )
    return {"message": "Logged in", "username": username}

@app.get("/quizzes")
def get_quizzes():
    return [
        {"id": i, "title": q["title"], "author": q.get("author", "Unknown")} 
        for i, q in enumerate(quizzes_db)
    ]

@app.get("/quizzes/{quiz_id}")
def get_quiz(quiz_id: int):
    if quiz_id < 0 or quiz_id >= len(quizzes_db):
        raise HTTPException(status_code=404, detail="Not found")
    return quizzes_db[quiz_id]

@app.post("/quizzes")
def create_quiz(quiz: QuizCreateModel, username: str = Depends(get_current_user)):
    new_quiz = quiz.dict()
    new_quiz["author"] = username
    
    quizzes_db.append(new_quiz)
    save_json('quizzes.json', quizzes_db)
    
    return {"message": "Created", "id": len(quizzes_db) - 1}

@app.post("/results")
def save_result(result: ResultModel, username: str = Depends(get_current_user)):
    record = result.dict()
    record["username"] = username
    
    results_db.append(record)
    save_json('results.json', results_db)
    
    return {"message": "Saved"}

@app.get("/my-results")
def get_my_results(username: str = Depends(get_current_user)):
    return [r for r in results_db if r["username"] == username]

@app.post("/logout")
def logout(response: Response, access_token: Optional[str] = Cookie(None)):
    if access_token in tokens:
        del tokens[access_token]
    response.delete_cookie("access_token")
    return {"message": "Logged out"}