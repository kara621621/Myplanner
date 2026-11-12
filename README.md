# My Campus Planner

부산대학교 국제대학원생을 위한 반응형 개인 일정 관리 웹앱. HTML, CSS, JavaScript로 구성되어 별도 설치 과정이나 Apps Script 없이 실행합니다.

## 실행

```sh
npm run dev
```

브라우저에서 http://localhost:5173 을 엽니다. `index.html`을 직접 여는 대신 개발 서버로 실행하세요. `npm run check`는 JavaScript 구문을 확인합니다.

## 기능

- 월간 캘린더와 월별 목록, 날짜 클릭으로 일정 생성
- 일정 추가, 수정, 삭제, 완료 체크
- 유형별 필터, 제목·메모 검색, 완료 상태 필터
- 오늘의 일정, 7일 내 할 일, 완료율 요약
- 샘플 없이 지정된 Google Sheets의 실제 일정만 표시
- 시작 시 Google 연결 화면 표시, 같은 탭의 유효한 인증으로 새로고침 시 자동 재연결
- Google Identity Services OAuth + Google Sheets REST API 연결
- 모바일 반응형 및 키보드 탐색, 대화상자

## 구글시트 연결

1. 스프레드시트에 `Events` 탭을 만들고 A1:G1에 아래 헤더를 입력합니다.

```
id	title	category	date	time	memo	completed
```

2. date는 YYYY-MM-DD, time은 HH:mm 형식의 일반 텍스트를 권장합니다. completed는 체크박스 또는 TRUE/FALSE입니다. category는 Class / Assignment / Research / Team Project / Personal 중 하나입니다.
3. Google Cloud에서 Sheets API를 활성화합니다.
4. Google Auth Platform에서 외부/테스트 모드로 구성하고 본인 계정을 테스트 사용자에 추가합니다. 데이터 액세스 범위에 `https://www.googleapis.com/auth/spreadsheets`를 추가합니다. 이 권한은 특정 파일 하나에 한정되지 않습니다. 공개 서비스 확장 시 `drive.file`과 Picker 방식을 검토하세요.
5. 웹 애플리케이션 OAuth 클라이언트를 만들고 JavaScript 원본에 `http://localhost`, `http://localhost:5173`, 실제 배포 origin을 등록합니다.
6. 앱의 구글시트 연결 설정에서 클라이언트 ID와 스프레드시트 URL 또는 ID를 입력합니다.

클라이언트 비밀키나 API 키는 사용하지 않습니다. 접근 토큰은 메모리와 현재 탭의 sessionStorage에 만료 시각과 함께 보관합니다. 같은 탭에서 새로고침하면 유효한 토큰으로 실제 시트 일정을 자동으로 다시 읽습니다. 탭 종료 또는 토큰 만료 후에는 Google 연결 버튼으로 다시 승인합니다. refresh token은 사용하거나 저장하지 않습니다. 시트는 비공개로 유지하세요.

앱은 지정된 Google Sheets를 일정 데이터 원본으로 사용합니다. 샘플과 기존 로컬 일정은 표시하거나 업로드하지 않습니다. 연결을 해제하면 화면은 빈 상태로 돌아가며 시트의 일정은 보존됩니다. 처음 접속하면 ID가 입력된 연결 화면을 바로 표시합니다. 저장 성공 후 화면을 갱신하고, 실패 시 기존 상태를 보존합니다. 삭제는 해당 행 A:G의 값을 비웁니다. 이 앱은 개인용으로 설계되어 다중 사용자의 동시 편집 충돌 처리는 제공하지 않습니다. 시트에서 직접 수정한 내용은 재연결 시 불러옵니다.

## 파일

- dist/index.html: 화면과 폼
- dist/style.css: 디자인과 반응형 레이아웃
- dist/app.js: 일정 관리, 로컬 저장, Sheets 연동
- server.mjs: 개발용 정적 서버

Google 연결은 실제 클라이언트 ID 및 시트와 사용자 동의 후 테스트할 수 있습니다.

Vercel 주소에서 Google 연결을 사용하려면 OAuth 클라이언트의 승인된 JavaScript 원본에 `https://planner-nu-opal.vercel.app`을 등록하세요. Google의 브라우저 토큰 방식은 사용자 동작으로 인증을 시작해야 하므로 첫 승인과 만료 후 승인을 자동으로 건너뛸 수 없습니다.
