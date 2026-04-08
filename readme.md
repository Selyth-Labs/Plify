# 🎵 YouTube Auto Playlist & Cover Song Collector

유튜브 채널을 일정 시간마다 확인하여 새로운 커버곡 및 노래 영상만 자동으로 추출하고, 지정된 플레이리스트에 분류하여 추가해주는 자동화 코드입니다.

## 🚀 Quick Start

### 1. Prerequisites
* [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성 후 **YouTube Data API v3** 활성화
* OAuth 2.0 클라이언트 ID를 생성하고 다운로드 후, `client_secret.json`으로 이름을 변경하여 `auth.py`와 동일한 폴더에 넣어주세요.

### 2. Installation
```bash
pip install -r requirements.txt
```

### 3. Authentication
최초 1회 실행하여 구글 계정 인증을 완료합니다. 인증 후 `token.json`이 자동 생성됩니다.
```bash
python auth.py
```
앱을 프로덕션으로 게시하지 않고 사용하실 경우, [Google Cloud Console](https://console.cloud.google.com/)에서 **YouTube Data API v3**의 관리 탭으로 들어가, **OAuth 동의** -> **대상**에서 **테스트 사용자** 섹션에 본인의 이메일을 추가해야 인증이 정상적으로 진행됩니다.
---

## ⚙️ Management

### 채널 및 플레이리스트 관리 (`manager.py`)
매니저를 실행하여 채널과 저장할 플레이리스트를 설정합니다. 핸들 주소를 넣으면 자동으로 고유 ID를 추출합니다.
```bash
python manager.py
```
* **1. 리스트 보기**: 현재 설정된 매핑 확인
* **2. 매핑 추가**: 채널 링크 및 플레이리스트 링크 입력 (자동 ID 변환 지원)
* **3. 매핑 삭제**: 등록된 설정 제거

### 봇 가동 (`main.py`)
설정된 주기마다 채널을 감시하고 작업을 수행합니다.
```bash
python main.py
```

---

## 🛠️ Configuration Guide

`main.py`와 `notifier.py` 파일 상단의 변수를 수정하여 봇의 동작 방식을 개인 설정에 맞게 변경할 수 있습니다.

### 1. 기본 동작 설정 (`main.py`)
* **`CHECK_INTERVAL`**: 채널을 확인하는 주기입니다. (단위: 초 / 기본값: `3600`)
  * 예: `600`으로 설정 시 10분마다 확인합니다.
* **`ENABLE_EMAIL_NOTICE`**: 노래가 추가되었을 때 이메일 알림을 보낼지 여부를 결정합니다. (`True` 또는 `False`로 입력 / 기본값: `False`)

### 2. 이메일 알림 설정 (`notifier.py`)
이메일 알림 기능을 활성화(`ENABLE_EMAIL_NOTICE = True`)한 경우, 아래 정보를 반드시 본인의 정보로 수정해야 합니다.
* **`EMAIL_ADDRESS`**: 알림을 보낼 본인의 Gmail 주소를 입력합니다. (발송 및 수신 공용)
* **`EMAIL_PASSWORD`**: 구글 계정 설정에서 발급받은 16자리 앱 비밀번호를 입력합니다. (일반 계정 비밀번호는 작동하지 않습니다.)

---

## 🤝 Contribution
개선 제안이나 버그 리포트는 언제나 환영합니다! 특히 더 정교한 노래 판별 또는 쇼츠 판별 알고리즘에 대한 PR을 기다립니다.

---