# Plify Web v2

YouTube 영상은 MP3, 플레이리스트는 ZIP으로 요청한 기기에 저장하는 광고 없는 반응형 웹 앱입니다. 원래 데스크톱 앱과 서버 제어 GUI는 변경하지 않았습니다.

## 서버 앱 업데이트

Apple Silicon / macOS 26 이상: `dist/Plify-Server-Public-AppleSilicon.zip`을 풀고 기존 서버 앱을 종료한 뒤 새 `Plify Server.app`을 실행하세요. Python, FFmpeg, Node, yt-dlp, cloudflared가 포함되어 있어 별도 설치가 필요 없습니다. 앱은 ad-hoc 서명이며 Apple 공증은 없습니다. 기존 터널 토큰과 설정은 유지됩니다.

방문자는 접속 키 없이 https://plify-web.vercel.app 에서 바로 사용할 수 있습니다. 맥미니의 서버 앱은 켜져 있어야 합니다.

## 코드와 횟수 변경

1. 맥미니에서 http://127.0.0.1:8765/admin 을 엽니다.
2. 서버 앱의 ‘접속 키 복사’로 로컬 관리 화면을 엽니다. 이 키는 방문자에게 공유하지 않습니다.
3. ‘일반 사용자 시간당 요청 횟수’와 ‘새 다운로드 코드’를 저장합니다. 재시작 없이 적용됩니다.

기본값은 최근 1시간에 **링크 접수 또는 재시도 3회**입니다. 같은 IP(IPv6는 /64)는 횟수를 공유하며 쿠키를 지워도 초기화되지 않습니다. 플레이리스트 한 링크는 1회로 계산합니다. 접수된 링크가 변환에 실패하더라도 1회로 계산하며, 서버가 바빠 접수하지 않은 요청은 계산하지 않습니다.

사이트 오른쪽 위 ‘다운로드 코드’에서 인증하면 시간당 횟수 제한이 24시간 해제됩니다. 코드 변경·사용 중지는 기존 인증도 해제합니다. 코드는 서버에서 salted PBKDF2 해시로 보관하며 조회할 수 없습니다. 잘못된 입력은 IP당 15분에 5회로 제한됩니다.

‘서버 보호 한도’는 코드 인증 사용자에게도 적용됩니다. 기본값은 플레이리스트 10곡, 영상 30분, 대기열 50곡, 곡별 원본 100MB, 처리 15분, 전체 임시 파일 2GB, 디스크 여유 2GB입니다.

## 다운로드와 저장

파일은 브라우저의 다운로드 위치에 저장됩니다. 자동 다운로드가 차단되면 해당 요청의 MP3/ZIP 받기를 누르세요. 브라우저의 실제 디스크 저장 완료 여부는 서버에서 확인할 수 없습니다.

맥미니는 `~/Library/Application Support/Plify Server/web-transfers/`만 임시 저장에 사용합니다. 전송 후 1시간, 준비됐지만 받지 않은 파일은 24시간 뒤 정리합니다(서버 실행 중). 기존 `~/Music/Plify Web/`은 유지합니다. 설정, DB, 터널 토큰은 기존 Application Support 경로에 남습니다.

## 구조와 보안

- Vercel: 정적 화면 + `api/public/[action].js` 게이트웨이
- Mac mini: Python API, yt-dlp 변환, 임시 파일 전송
- 익명 HttpOnly 세션으로 요청을 분리합니다. 클라이언트가 임의 소유자 ID를 지정할 수 없습니다.
- Vercel이 확인한 IP와 요청 내용을 Ed25519로 서명합니다. 비밀키는 Vercel production Sensitive 환경 변수 `PLIFY_GATEWAY_PRIVATE_KEY`에만 있고 맥미니에는 공개 검증키만 있습니다.
- 기존 전체 상태·파일·취소 API와 관리 화면은 맥미니 로컬에서만 접근할 수 있습니다.
- MP3/ZIP은 10분짜리 1회용 링크와 Vercel 외부 rewrite로 스트리밍합니다.
- 다운로드 코드와 관리자 접속 키는 공개 JS에 포함하지 않습니다.

## 개발

```sh
cd web-app
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python server.py
```

로컬 UI는 http://127.0.0.1:8765 입니다. 개발 실행에는 FFmpeg/ffprobe와 Node 또는 Deno가 필요합니다. 소스 데이터는 `web-app/data/`에 저장합니다.

```sh
../.venv/bin/python -m unittest discover -s tests -q
node --test tests/test_browser_download.cjs tests/test_gateway.cjs
```

번들 빌드: `../.venv/bin/python packaging/build_server.py`. 웹 앱 전용 native 도구 빌드는 `packaging/build_native.py`를 사용합니다. 원래 데스크톱 앱의 vendor 파일은 유지합니다. 자세한 연결 절차는 [DEPLOYMENT.md](DEPLOYMENT.md)에 있습니다.
