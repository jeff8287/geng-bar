# 🍸 칵테일 매니지먼트 시스템

칵테일 메뉴와 재고를 체계적으로 관리할 수 있는 웹 애플리케이션입니다.

## ✨ 주요 기능

### 🍹 메뉴 관리
- **카테고리별 분류**: REFRESHING, SWEET/CREAMY, COMPLEX/BOOZY
- **상세 정보**: 재료, 난이도, 가격, 제조시간, 맛 프로필
- **추천 시스템**: 인기 칵테일 표시
- **검색 및 필터링**: 이름, 카테고리, 난이도, 알코올 도수별 검색

### 📦 재고 관리
- **실시간 재고 현황**: 수량, 단위, 상태 표시
- **자동 상태 업데이트**: 수량에 따른 상태 자동 변경
- **재고 조정**: 수량 증가/감소, 수정, 추가
- **부족 재고 알림**: 낮은 수량 재료 자동 감지
- **데이터 내보내기**: CSV 형식으로 재고 데이터 다운로드

### 🎛️ 관리자 기능
- **통합 관리**: 메뉴와 재고를 한 곳에서 관리
- **데이터 분석**: 차트를 통한 시각적 분석
- **사용자 친화적 인터페이스**: 직관적인 관리 도구

## 🚀 설치 및 실행

### 1. 의존성 설치
```bash
pip install -r requirements.txt
```

### 2. 애플리케이션 실행
```bash
python main.py
```

### 3. 웹 브라우저에서 접속
```
http://localhost:8000
```

## 🏗️ 기술 스택

- **Backend**: FastAPI (Python)
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5
- **Icons**: Font Awesome 6
- **Charts**: Chart.js
- **Data Storage**: JSON 파일 기반

## 📁 프로젝트 구조

```
cocktail_webapp/
├── main.py                 # FastAPI 메인 애플리케이션
├── requirements.txt        # Python 의존성
├── README.md              # 프로젝트 문서
├── templates/             # HTML 템플릿
│   ├── index.html        # 메인 페이지
│   ├── menu.html         # 메뉴 페이지
│   ├── stock.html        # 재고 관리 페이지
│   └── admin.html        # 관리자 페이지
├── static/                # 정적 파일
│   ├── css/
│   │   └── style.css     # 메인 스타일시트
│   └── js/
│       ├── main.js       # 공통 JavaScript
│       ├── menu.js       # 메뉴 페이지 JavaScript
│       ├── stock.js      # 재고 관리 JavaScript
│       └── admin.js      # 관리자 페이지 JavaScript
└── data/                  # 데이터 파일 (자동 생성)
    ├── cocktails.json    # 칵테일 데이터
    └── stock.json        # 재고 데이터
```

## 🎯 사용법

### 메인 페이지
- 시스템 개요 및 추천 칵테일 확인
- 각 기능 페이지로 이동

### 메뉴 페이지
- 카테고리별 칵테일 브라우징
- 검색 및 필터링으로 원하는 칵테일 찾기
- 칵테일 상세 정보 확인
- 즐겨찾기 기능

### 재고 관리 페이지
- 실시간 재고 현황 확인
- 재고 수량 조정 (증가/감소)
- 새 재료 추가
- 부족 재고 모니터링
- 데이터 내보내기

### 관리자 페이지
- 칵테일 메뉴 추가/수정/삭제
- 재고 데이터 관리
- 데이터 분석 및 차트 확인

## 🔧 API 엔드포인트

### 칵테일 관련
- `GET /api/cocktails` - 모든 칵테일 조회
- `GET /api/cocktails/{category}` - 카테고리별 칵테일 조회
- `POST /api/cocktails` - 새 칵테일 추가
- `PUT /api/cocktails/{id}` - 칵테일 수정
- `DELETE /api/cocktails/{id}` - 칵테일 삭제

### 재고 관련
- `GET /api/stock` - 재고 현황 조회

## 🎨 UI/UX 특징

- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원
- **모던한 인터페이스**: Bootstrap 5 기반 현대적 디자인
- **애니메이션**: 부드러운 전환 효과와 호버 애니메이션
- **직관적 네비게이션**: 사용자 친화적인 메뉴 구조
- **색상 코딩**: 상태별 색상 구분으로 빠른 인식

## 📊 데이터 구조

### 칵테일 데이터
```json
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
  "recommended": true,
  "alcohol_level": "Medium",
  "flavor_profile": ["Citrus", "Refreshing", "Light"],
  "price": 12000,
  "prep_time": "3-4 minutes"
}
```

### 재고 데이터
```json
{
  "spirits": {
    "gin": {
      "quantity": 5,
      "unit": "bottles",
      "status": "available"
    }
  }
}
```

## 🚀 향후 개발 계획

- [ ] 사용자 인증 시스템
- [ ] 주문 관리 시스템
- [ ] 판매 통계 및 리포트
- [ ] 모바일 앱 연동
- [ ] 데이터베이스 연동 (PostgreSQL/MySQL)
- [ ] 실시간 알림 시스템
- [ ] 다국어 지원

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.

---

**🍸 완벽한 칵테일을 위한 스마트 매니지먼트 시스템**






