from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
import json
from pathlib import Path
from typing import List, Dict, Optional
import uvicorn

app = FastAPI(title="Cocktail Management System", version="1.0.0")

# 정적 파일과 템플릿 설정
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# 데이터 파일 경로
DATA_DIR = Path("data")
COCKTAILS_FILE = DATA_DIR / "cocktails.json"
STOCK_FILE = DATA_DIR / "stock.json"

# 데이터 디렉토리 생성
DATA_DIR.mkdir(exist_ok=True)

# 샘플 데이터 생성 함수
def create_sample_data():
    if not COCKTAILS_FILE.exists():
        sample_cocktails = [
            {
                "id": 1,
                "name": "GIN FIZZ",
                "category": "REFRESHING",
                "ingredients": ["gin", "lemon juice", "simple syrup", "club soda"],
                "description": "상큼하고 시원한 진 기반 칵테일",
                "difficulty": "Easy",
                "glass": "Highball",
                "ice": "Cubes",
                "garnish": "Lemon wheel",
                "recommended": True,
                "alcohol_level": "Medium",
                "flavor_profile": ["Citrus", "Refreshing", "Light"],
                "price": 12000,
                "prep_time": "3-4 minutes"
            },
            {
                "id": 2,
                "name": "MOSCOW MULE",
                "category": "REFRESHING",
                "ingredients": ["vodka", "lime juice", "ginger ale"],
                "description": "진저의 매운맛과 라임의 상큼함이 어우러진 칵테일",
                "difficulty": "Easy",
                "glass": "Copper Mug",
                "ice": "Cubes",
                "garnish": "Lime wheel, mint sprig",
                "recommended": True,
                "alcohol_level": "Medium",
                "flavor_profile": ["Ginger", "Citrus", "Spicy"],
                "price": 11000,
                "prep_time": "2-3 minutes"
            },
            {
                "id": 3,
                "name": "NEGRONI",
                "category": "COMPLEX / BOOZY",
                "ingredients": ["gin", "campari", "sweet vermouth"],
                "description": "진, 캄파리, 베르무트의 완벽한 조화",
                "difficulty": "Easy",
                "glass": "Old Fashioned",
                "ice": "Large cube",
                "garnish": "Orange peel",
                "recommended": True,
                "alcohol_level": "High",
                "flavor_profile": ["Bitter", "Herbal", "Complex"],
                "price": 13000,
                "prep_time": "2-3 minutes"
            },
            {
                "id": 4,
                "name": "ESPRESSO MARTINI",
                "category": "SWEET / CREAMY",
                "ingredients": ["vodka", "espresso", "baileys", "simple syrup"],
                "description": "커피와 크림의 달콤한 조화",
                "difficulty": "Medium",
                "glass": "Cocktail",
                "ice": "Shake with ice",
                "garnish": "Coffee beans",
                "recommended": True,
                "alcohol_level": "Medium",
                "flavor_profile": ["Coffee", "Creamy", "Sweet"],
                "price": 14000,
                "prep_time": "4-5 minutes"
            },
            {
                "id": 5,
                "name": "OLD FASHIONED",
                "category": "COMPLEX / BOOZY",
                "ingredients": ["whisky", "aromatic bitters", "simple syrup"],
                "description": "클래식한 위스키 칵테일의 정석",
                "difficulty": "Medium",
                "glass": "Old Fashioned",
                "ice": "Large cube",
                "garnish": "Orange peel, cherry",
                "recommended": True,
                "alcohol_level": "High",
                "flavor_profile": ["Bold", "Woody", "Complex"],
                "price": 15000,
                "prep_time": "3-4 minutes"
            }
        ]
        
        with open(COCKTAILS_FILE, 'w', encoding='utf-8') as f:
            json.dump(sample_cocktails, f, ensure_ascii=False, indent=2)
    
    if not STOCK_FILE.exists():
        sample_stock = {
            "spirits": {
                "gin": {"quantity": 5, "unit": "bottles", "status": "available"},
                "whisky": {"quantity": 3, "unit": "bottles", "status": "available"},
                "vodka": {"quantity": 4, "unit": "bottles", "status": "available"},
                "rum": {"quantity": 2, "unit": "bottles", "status": "available"},
                "tequila": {"quantity": 2, "unit": "bottles", "status": "available"},
                "mezcal": {"quantity": 1, "unit": "bottles", "status": "available"},
                "brandy": {"quantity": 2, "unit": "bottles", "status": "available"}
            },
            "liqueurs": {
                "campari": {"quantity": 2, "unit": "bottles", "status": "available"},
                "sweet_vermouth": {"quantity": 2, "unit": "bottles", "status": "available"},
                "limoncello": {"quantity": 1, "unit": "bottles", "status": "available"},
                "disaronno": {"quantity": 1, "unit": "bottles", "status": "available"},
                "baileys": {"quantity": 2, "unit": "bottles", "status": "available"}
            },
            "mixers": {
                "club_soda": {"quantity": 10, "unit": "bottles", "status": "available"},
                "ginger_ale": {"quantity": 8, "unit": "bottles", "status": "available"},
                "tonic_water": {"quantity": 6, "unit": "bottles", "status": "available"}
            },
            "juices": {
                "lemon_juice": {"quantity": 5, "unit": "bottles", "status": "available"},
                "lime_juice": {"quantity": 5, "unit": "bottles", "status": "available"},
                "orange_juice": {"quantity": 3, "unit": "bottles", "status": "available"},
                "pineapple_juice": {"quantity": 2, "unit": "bottles", "status": "available"}
            },
            "syrups": {
                "simple_syrup": {"quantity": 3, "unit": "bottles", "status": "available"},
                "honey_syrup": {"quantity": 2, "unit": "bottles", "status": "available"}
            },
            "bitters": {
                "angostura": {"quantity": 2, "unit": "bottles", "status": "available"},
                "orange_bitters": {"quantity": 1, "unit": "bottles", "status": "available"}
            },
            "herbs": {
                "mint": {"quantity": 5, "unit": "bunches", "status": "available"},
                "basil": {"quantity": 3, "unit": "bunches", "status": "available"},
                "rosemary": {"quantity": 2, "unit": "bunches", "status": "available"}
            },
            "fruits": {
                "lemon": {"quantity": 20, "unit": "pieces", "status": "available"},
                "lime": {"quantity": 20, "unit": "pieces", "status": "available"},
                "orange": {"quantity": 15, "unit": "pieces", "status": "available"}
            }
        }
        
        with open(STOCK_FILE, 'w', encoding='utf-8') as f:
            json.dump(sample_stock, f, ensure_ascii=False, indent=2)

# 데이터 로드 함수
def load_cocktails() -> List[Dict]:
    if COCKTAILS_FILE.exists():
        with open(COCKTAILS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def load_stock() -> Dict:
    if STOCK_FILE.exists():
        with open(STOCK_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

# 데이터 저장 함수
def save_cocktails(cocktails: List[Dict]):
    with open(COCKTAILS_FILE, 'w', encoding='utf-8') as f:
        json.dump(cocktails, f, ensure_ascii=False, indent=2)

def save_stock(stock: Dict):
    with open(STOCK_FILE, 'w', encoding='utf-8') as f:
        json.dump(stock, f, ensure_ascii=False, indent=2)

@app.on_event("startup")
async def startup_event():
    create_sample_data()

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    cocktails = load_cocktails()
    return templates.TemplateResponse("index.html", {"request": request, "cocktails": cocktails})

@app.get("/menu", response_class=HTMLResponse)
async def menu(request: Request):
    cocktails = load_cocktails()
    return templates.TemplateResponse("menu.html", {"request": request, "cocktails": cocktails})

@app.get("/stock", response_class=HTMLResponse)
async def stock(request: Request):
    stock_data = load_stock()
    return templates.TemplateResponse("stock.html", {"request": request, "stock": stock_data})

@app.get("/admin", response_class=HTMLResponse)
async def admin(request: Request):
    cocktails = load_cocktails()
    stock_data = load_stock()
    return templates.TemplateResponse("admin.html", {"request": request, "cocktails": cocktails, "stock": stock_data})

# API 엔드포인트들
@app.get("/api/cocktails")
async def get_cocktails():
    return load_cocktails()

@app.get("/api/cocktails/{category}")
async def get_cocktails_by_category(category: str):
    cocktails = load_cocktails()
    filtered = [c for c in cocktails if c["category"].upper() == category.upper()]
    return filtered

@app.get("/api/stock")
async def get_stock():
    return load_stock()

@app.post("/api/cocktails")
async def add_cocktail(cocktail: Dict):
    cocktails = load_cocktails()
    cocktail["id"] = max([c["id"] for c in cocktails], default=0) + 1
    cocktails.append(cocktail)
    save_cocktails(cocktails)
    return {"message": "Cocktail added successfully", "cocktail": cocktail}

@app.put("/api/cocktails/{cocktail_id}")
async def update_cocktail(cocktail_id: int, cocktail: Dict):
    cocktails = load_cocktails()
    for i, c in enumerate(cocktails):
        if c["id"] == cocktail_id:
            cocktail["id"] = cocktail_id
            cocktails[i] = cocktail
            save_cocktails(cocktails)
            return {"message": "Cocktail updated successfully", "cocktail": cocktail}
    raise HTTPException(status_code=404, detail="Cocktail not found")

@app.delete("/api/cocktails/{cocktail_id}")
async def delete_cocktail(cocktail_id: int):
    cocktails = load_cocktails()
    cocktails = [c for c in cocktails if c["id"] != cocktail_id]
    save_cocktails(cocktails)
    return {"message": "Cocktail deleted successfully"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)





