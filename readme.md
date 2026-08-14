# 🎵 Plify

Plify는 YouTube 채널을 일정 주기로 확인하여 새로운 커버곡 및 노래만 자동으로 감지하고, 지정된 플레이리스트에 자동으로 분류하여 추가해주는 자동화 프로그램입니다.

## 📋 준비

### 1. Google Cloud 설정

먼저 [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트를 생성한 후 YouTube Data API v3를 활성화해야 합니다.

1. Google Cloud Console에서 프로젝트를 생성합니다.
2. API 및 서비스 → 라이브러리로 이동합니다.
3. 상단 검색창에서 `YouTube Data API v3`를 검색한 후 사용을 클릭합니다.
4. API 및 서비스 → 사용자 인증 정보로 이동합니다.
5. 사용자 인증 정보 만들기 → OAuth 클라이언트 ID를 선택합니다.
6. "액세스할 데이터는 무엇인가요?"에서 사용자 데이터를 선택하고 다음을 클릭합니다.
7. 앱 이름과 사용자 지원 이메일을 자유롭게 입력한 후 저장 및 계속을 클릭합니다.
8. 범위 설정은 별도로 변경하지 않고 저장 및 계속을 클릭합니다.
9. OAuth 클라이언트 ID의 애플리케이션 유형을 데스크톱 앱으로 선택합니다.
10. 이름을 자유롭게 입력한 후 만들기를 클릭합니다.

사용자 인증 정보가 생성되면 JSON 파일을 다운로드한 후 파일명을 `client_secret.json`으로 변경하여 `auth.py`와 같은 폴더에 넣어주세요.

### 2. 테스트 사용자 등록

OAuth 동의 화면에서 대상 설정을 외부로 변경한 후, 앱 게시 상태가 테스트 중인지 확인해주세요.

이후 테스트 사용자에서 Add Users를 클릭하고, 인증에 사용할 Google 계정의 이메일 주소를 추가합니다.

> ⚠️ 인증 과정에서는 여기에 등록한 Google 계정으로 로그인해야 합니다.

---

## 📦 설치

프로젝트 폴더에서 아래 명령어를 실행하여 필요한 라이브러리를 설치합니다.

```bash
pip install -r requirements.txt
```

---

## 🔐 인증

최초 1회 `auth.py`를 실행하여 Google 계정 인증을 진행합니다.

```bash
python auth.py
```

인증 과정에서 다음과 같은 경고가 표시될 수 있습니다.

> Google에서 확인하지 않은 앱
> 현재 테스트 중인 앱에 대한 액세스 권한을 받았습니다. 아는 개발자가 초대한 경우에만 계속해야 합니다.

계속을 클릭하여 인증을 진행하면 됩니다.

인증이 완료되면 다음과 같은 문구가 표시됩니다.

> The authentication flow has completed. You may close this window.

이 문구가 표시되었다면 인증이 정상적으로 완료된 것입니다.

인증이 완료되면 프로젝트 폴더에 `token.json`이 자동으로 생성됩니다.

### ❗ "액세스 차단됨" 오류가 발생하는 경우

다음과 같은 메시지가 표시될 수 있습니다.

> 액세스 차단됨: {앱 이름}은(는) 조직 내에서만 사용할 수 있습니다.

이 경우 Google Cloud Console의 OAuth 동의 화면 → 대상 → 테스트 사용자에서 인증에 사용할 Google 계정이 올바르게 등록되어 있는지 확인해주세요.

---

# ⚙️ 관리

## 채널 및 플레이리스트 관리 (`manager.py`)

`manager.py`를 실행하면 감시할 YouTube 채널과 영상을 저장할 플레이리스트를 설정할 수 있습니다.

```bash
python manager.py
```

### 메뉴

1. 리스트 보기
   현재 등록되어 있는 채널과 플레이리스트의 매핑을 확인합니다.

2. 매핑 추가
   감시할 YouTube 채널과 영상을 추가할 플레이리스트를 등록합니다.

채널 및 플레이리스트 링크를 입력하면 필요한 ID를 자동으로 변환합니다.

3. 매핑 삭제
   등록되어 있는 채널 및 플레이리스트 매핑을 삭제합니다.

### YouTube 채널 핸들

YouTube 채널의 핸들은 채널 URL에서 `@` 뒤에 있는 부분입니다.

예를 들어 다음과 같은 주소가 있다면:

```text
https://www.youtube.com/@youtubekorea
```

채널 핸들은 다음과 같습니다.

```text
@youtubekorea
```

---

# 🚀 가동 (`main.py`)

설정이 완료되었다면 `main.py`를 실행하여 YouTube 채널 감시를 시작할 수 있습니다.

```bash
python main.py
```

프로그램은 설정된 주기에 따라 등록된 채널을 확인하고, 새로운 커버곡 및 노래 영상을 찾아 지정된 플레이리스트에 자동으로 추가합니다.

---

# 🛠️ 설정 가이드

`main.py` 파일 상단의 설정값을 변경하여 프로그램의 동작 방식을 원하는 대로 조정할 수 있습니다.

## 1. 기본 설정

### `CHECK_INTERVAL`

YouTube 채널을 확인하는 주기를 초 단위로 설정합니다.

기본값은 `3600`초(1시간)입니다.

```python
CHECK_INTERVAL = 3600
```

예를 들어 10분마다 확인하려면 다음과 같이 설정합니다.

```python
CHECK_INTERVAL = 600
```

### `ENABLE_EMAIL_NOTICE`

새로운 영상이 플레이리스트에 추가되었을 때 이메일 알림을 받을지 여부를 설정합니다.

```python
ENABLE_EMAIL_NOTICE = False
```

이메일 알림을 사용하려면 `True`로 변경합니다.

```python
ENABLE_EMAIL_NOTICE = True
```

---

## 2. 이메일 알림 설정

`ENABLE_EMAIL_NOTICE`를 `True`로 설정한 경우 아래 설정값을 본인의 정보로 변경해야 합니다.

### `EMAIL_ADDRESS`

알림을 발송하고 수신할 Gmail 주소를 입력합니다.

```python
EMAIL_ADDRESS = "example@gmail.com"
```

### `EMAIL_PASSWORD`

Google 계정의 일반 비밀번호가 아닌 16자리 앱 비밀번호를 입력해야 합니다.

```python
EMAIL_PASSWORD = "xxxxxxxxxxxxxxxx"
```

> ⚠️ 일반 Google 계정 비밀번호는 사용할 수 없습니다.
> 이메일 알림 기능을 사용하는 경우 Google 계정에서 앱 비밀번호를 별도로 발급받아야 합니다.

---

# 🤝 협력

Plify의 개선 제안과 버그 리포트는 언제나 환영합니다!

특히 다음과 같은 기능에 대한 Pull Request(PR)를 기다리고 있습니다.

* 더욱 정교한 노래/커버곡 판별 알고리즘
* YouTube Shorts 판별 알고리즘 개선
* 기타 자동화 기능 및 편의성 개선

버그를 발견했거나 새로운 기능을 제안하고 싶다면 Issue 또는 Pull Request를 통해 알려주세요.