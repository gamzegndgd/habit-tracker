from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from dotenv import load_dotenv
from pydantic import BaseModel
import os

# .env dosyasındaki gizli bilgileri yükle
load_dotenv()

# Supabase bağlantısını kur
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SECRET_KEY")
)

# FastAPI uygulamasını başlat
app = FastAPI()

# Frontend'in backend'e erişmesine izin ver (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Test endpoint'i - backend çalışıyor mu diye kontrol ederiz
@app.get("/")
def root():
    return {"message": "Habit Tracker API çalışıyor!"}


# --- VERİ MODELLERİ ---
# Frontend'den gelen verinin nasıl görünmesi gerektiğini tanımlıyoruz
class HabitCreate(BaseModel):
    name: str
    user_id: str

class HabitLog(BaseModel):
    user_id: str
    date: str

# --- ENDPOINT'LER ---

# Kullanıcının tüm alışkanlıklarını getir
@app.get("/habits/{user_id}")
def get_habits(user_id: str):
    result = supabase.table("habits")\
        .select("*")\
        .eq("user_id", user_id)\
        .execute()
    return result.data

# Yeni alışkanlık ekle
@app.post("/habits")
def create_habit(habit: HabitCreate):
    result = supabase.table("habits")\
        .insert({"name": habit.name, "user_id": habit.user_id})\
        .execute()
    return result.data

# Alışkanlık sil
@app.delete("/habits/{habit_id}")
def delete_habit(habit_id: str):
    result = supabase.table("habits")\
        .delete()\
        .eq("id", habit_id)\
        .execute()
    return {"message": "Silindi"}

# O günü "yaptım" olarak işaretle
@app.post("/habits/{habit_id}/log")
def log_habit(habit_id: str, log: HabitLog):
    result = supabase.table("habit_logs")\
        .insert({
            "habit_id": habit_id,
            "user_id": log.user_id,
            "date": log.date
        })\
        .execute()
    return result.data

# Streak hesapla
@app.get("/habits/{habit_id}/streak")
def get_streak(habit_id: str):
    result = supabase.table("habit_logs")\
        .select("date")\
        .eq("habit_id", habit_id)\
        .order("date", desc=True)\
        .execute()
    
    dates = [entry["date"] for entry in result.data]
    
    if not dates:
        return {"streak": 0}
    
    from datetime import date, timedelta
    streak = 0
    today = date.today()
    
    for i, d in enumerate(dates):
        expected = today - timedelta(days=i)
        if d == str(expected):
            streak += 1
        else:
            break
    
    return {"streak": streak}