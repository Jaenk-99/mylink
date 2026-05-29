# 마이링크 (MyLink) - 데이터베이스 모델링 (Firebase Firestore)

Firestore의 NoSQL 문서 지향 데이터베이스(Document Database) 특성을 고려하여, 다음과 같이 컬렉션(Collection)과 문서(Document) 구조를 설계합니다.

## 1. `users` 컬렉션
사용자 프로필 및 인증 정보를 관리하는 최상위 컬렉션입니다.

- **문서 ID**: Firebase Auth에서 발급된 `uid`
- **필드 구조**:
  - `username` (string): 고유 URL용 사용자 ID (예: `mylink.com/{username}`). 유일한(unique) 값을 가져야 함.
  - `email` (string): 구글 소셜 로그인으로 수집된 이메일 주소
  - `displayName` (string): 화면에 표시될 사용자 닉네임 (기본값은 구글 프로필 이름)
  - `bio` (string): 사용자 자기소개 (최대 150~200자)
  - `profileImageUrl` (string): Firebase Storage에 업로드된 프로필 사진 URL
  - `createdAt` (timestamp): 계정 생성 일시
  - `updatedAt` (timestamp): 최근 프로필 수정 일시

---

## 2. `links` 서브 컬렉션 (Subcollection)
각 사용자가 등록한 링크들을 관리합니다. `users/{uid}/links` 경로에 저장됩니다. 링크 순서 변경 기능이 제외되었으므로, 기본적으로 `createdAt`을 기준으로 리스트를 정렬하여 보여줍니다.

- **문서 경로**: `users/{uid}/links/{linkId}`
- **문서 ID**: Firestore 자동 생성 ID
- **필드 구조**:
  - `title` (string): 링크 블록에 표시될 제목
  - `url` (string): 연결될 실제 웹사이트 주소
  - `faviconUrl` (string): 자동으로 추출된 해당 웹사이트의 파비콘(Favicon) 이미지 URL
  - `clickCount` (number): 해당 링크가 클릭된 횟수 (추후 고도화 대비 기본값 `0` 설정)
  - `createdAt` (timestamp): 링크 생성 일시 (오름차순 혹은 내림차순 정렬의 기준)
  - `updatedAt` (timestamp): 링크 수정 일시

---

## 3. `usernames` 컬렉션 (고유 ID 중복 검사 최적화용)
Firestore에서는 `users` 컬렉션에서 `username` 필드로 쿼리를 날려 중복을 검사할 수 있지만, 빠르고 효율적인 중복 체크와 트랜잭션 관리를 위해 `username` 자체를 문서 ID로 사용하는 별도의 인덱스 컬렉션을 관리하는 것이 좋습니다.

- **컬렉션 명**: `usernames`
- **문서 ID**: 사용자가 입력한 `username` 텍스트 자체 (예: "jaenk123")
- **필드 구조**:
  - `uid` (string): 해당 `username`을 소유한 사용자의 UID (참조 무결성 유지)
  - `createdAt` (timestamp): 해당 ID 선점 일시
