# Home Cocktail Bar

홈 칵테일 바를 위한 메뉴 관리 및 주문 지원 웹 애플리케이션.
보유한 재료(stock)를 기반으로 제조 가능한 칵테일을 자동으로 필터링하고, 게스트에게 메뉴를 제공합니다.

## 주요 기능

- **칵테일 메뉴** — 카테고리별 브라우징, 검색, 재료 기반 가용성 필터링
- **칵테일 상세** — 레시피, 재료, 난이도, 글래스 타입, 가니쉬, 맛 프로필
- **리뷰 시스템** — 게스트가 칵테일에 별점과 코멘트를 남길 수 있음
- **재고 관리** — 재료별 상태 관리 (in_stock / low / out_of_stock)
- **관리자 대시보드** — 칵테일 CRUD, 재고 관리, 필터 모드 설정 (strict / flexible)
- **인증** — 관리자 로그인 (JWT) + 게스트 닉네임 접속

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts |
| Backend | FastAPI, SQLAlchemy 2.0, Pydantic v2, Alembic |
| Database | PostgreSQL 15 |
| Infra | Docker Compose |

## 프로젝트 구조

```
cocktail/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI 앱 엔트리포인트
│   │   ├── config.py          # 환경 설정
│   │   ├── database.py        # DB 연결
│   │   ├── models/            # SQLAlchemy 모델 (Cocktail, Ingredient, Review, User, Settings)
│   │   ├── schemas/           # Pydantic 스키마
│   │   ├── services/          # 비즈니스 로직
│   │   ├── routers/           # API 라우터 (menu, cocktails, ingredients, reviews, auth, admin)
│   │   └── seed/              # 초기 데이터 시드
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/             # LoginPage, MenuPage, CocktailDetailPage, Admin*
│   │   ├── components/        # 재사용 컴포넌트
│   │   ├── contexts/          # AuthContext
│   │   ├── api/               # API 클라이언트
│   │   └── types/             # TypeScript 타입
│   └── package.json
├── stock.yaml                 # 보유 재료 목록
├── menu-all.md                # 전체 메뉴 데이터
├── docker-compose.yml
└── .env.example
```

## 시작하기

### 사전 요구사항

- Docker & Docker Compose

### 실행

```bash
# 1. 환경변수 설정
cp .env.example .env

# 2. 컨테이너 빌드 및 실행
docker compose up -d --build

# 3. 확인
curl http://localhost:8000/health
# → {"status": "ok"}
```

- **Backend API**: http://localhost:8000
- **API 문서 (Swagger)**: http://localhost:8000/docs
- **Frontend**: 별도 실행 필요 (아래 참고)

### 프론트엔드 개발 서버

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

## API 엔드포인트

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/health` | 헬스 체크 | - |
| GET | `/api/menu/` | 칵테일 메뉴 목록 | - |
| GET | `/api/menu/{id}` | 칵테일 상세 | - |
| GET | `/api/ingredients/` | 재료 목록 | Admin |
| GET | `/api/cocktails/` | 칵테일 관리 목록 | Admin |
| GET | `/api/reviews/{cocktail_id}` | 리뷰 조회 | - |
| POST | `/api/auth/admin/login` | 관리자 로그인 | - |
| POST | `/api/auth/guest` | 게스트 접속 | - |
| GET | `/api/admin/settings` | 앱 설정 조회 | Admin |

## 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `DATABASE_URL` | `postgresql://cocktail:cocktail@localhost:5432/cocktail_db` | PostgreSQL 연결 URL |
| `SECRET_KEY` | `change-me-in-production` | JWT 시크릿 키 |
| `ADMIN_USERNAME` | `admin` | 관리자 계정 |
| `ADMIN_PASSWORD` | `admin` | 관리자 비밀번호 |
| `CORS_ORIGINS` | `*` | 허용 CORS 오리진 |
| `MEDIA_DIR` | `media/cocktails` | 칵테일 이미지 저장 경로 |

## 라이선스

Private
