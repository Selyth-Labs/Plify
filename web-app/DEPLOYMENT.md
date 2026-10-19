# 맥미니 + Vercel 연결 가이드

완성 형태: Vercel 웹 화면 → HTTPS → plify-api.selyth.xyz → Cloudflare Tunnel → 맥미니의 Plify Server.app.

Vercel은 HTML/CSS/JS만 배포합니다. Python, FFmpeg, Node, yt-dlp, cloudflared는 서버 앱에 포함되어 맥미니에서 실행됩니다. 맥미니에는 Python·Homebrew를 설치할 필요가 없습니다. 이 빌드는 Apple Silicon(M1 이상), macOS 26 이상용입니다.

## 1. 서버 앱 옮기기

1. `dist/Plify-Server-AppleSilicon.zip`을 맥미니로 옮겨 압축을 풉니다.
2. `Plify Server.app`을 응용 프로그램 폴더로 옮겨 실행합니다.
3. 처음에는 `로컬 서버 실행 중 · 터널 토큰 등록 필요`라고 표시됩니다.

개인용 ad-hoc 서명 빌드이며 Apple 공증은 없습니다. macOS가 실행을 차단하면 직접 만든 앱임을 확인하고 시스템 설정의 개인정보 보호 및 보안에서 실행을 허용하세요. 보안 경고의 최종 허용은 사용자가 직접 진행합니다.

## 2. Cloudflare 터널 만들기 — 최초 1회

Cloudflare에 selyth.xyz가 등록되어 있고 DNS가 활성화되어 있다는 전제입니다. 이미 쓰는 DNS 레코드와 충돌하지 않는 이름을 선택하세요.

1. Cloudflare 대시보드에서 **Zero Trust / Cloudflare One → Networks → Connectors / Tunnels**로 이동합니다. 메뉴 표시는 계정 UI에 따라 다를 수 있습니다.
2. 터널을 만들고 **Cloudflared** 유형을 선택합니다. 이름은 `plify-macmini`로 지정합니다.
3. 연결 프로그램 설치 화면에 나오는 명령에서 **터널 토큰 부분만** 복사합니다. `--token` 뒤의 긴 문자열입니다. 터미널에서 설치 명령을 실행하지 않아도 됩니다. cloudflared는 앱에 들어 있습니다.
4. 맥미니 앱의 **Cloudflare 터널 토큰**에 붙여넣습니다. 토큰을 채팅이나 GitHub에 올리지 마세요.
5. 터널의 **Published application routes / Public Hostname**에 아래 값을 등록합니다.

| 항목 | 값 |
| --- | --- |
| Subdomain | `plify-api` |
| Domain | `selyth.xyz` |
| Path | 비워둠 |
| Service Type | `HTTP` |
| Service URL | `127.0.0.1:8765` |

6. 저장합니다. 앱에서 **설정 저장 · 서버 시작**을 누릅니다. 터널 연결이 등록되면 앱에 `Cloudflare 연결됨`이 표시되고 Cloudflare에서도 Healthy 상태인지 확인합니다.

공유기 포트 포워딩은 필요하지 않습니다. 앱을 끄면 터널과 서버가 함께 종료됩니다. 고정 주소는 https://plify-api.selyth.xyz 입니다. 이 주소는 파일/API용이며 웹 화면은 Vercel 주소로 여세요. API에는 앱의 접속 키가 필요합니다.

Cloudflare Access의 브라우저 로그인 정책은 이 API 호스트에 추가하지 않는 구성을 전제로 합니다. 현재 앱은 Bearer 접속 키와 허용 웹 주소로 API를 보호합니다. Access를 추가하려면 별도 연동이 필요합니다.

## 3. Vercel에 웹 화면 배포 — 최초 1회

완성된 배포 소스는 `dist/vercel-web/`, 압축 파일은 `dist/Plify-Web-Vercel.zip`입니다. 이 폴더에는 화면과 `vercel.json`만 있고 Python, 음악 파일, 접속 키, 터널 토큰은 없습니다.

### GitHub 화면을 사용하는 방법

1. GitHub에서 새 저장소를 만듭니다.
2. `Plify-Web-Vercel.zip`을 압축 해제하고, **그 안의 내용**을 저장소 루트에 업로드합니다. 저장소 루트에 `vercel.json`과 `static/`이 있어야 합니다.
3. Vercel의 **Add New → Project → Import Git Repository**에서 그 저장소를 선택합니다.
4. Framework Preset은 **Other**, Root Directory는 기본값, Build Command는 비움, Output Directory는 **static**으로 지정합니다. `vercel.json`에도 이 설정이 들어 있습니다.
5. Deploy를 누르고 발급된 `https://프로젝트명.vercel.app` 주소를 복사합니다.

기존 전체 저장소에서 배포한다면 Root Directory를 `web-app`으로 설정합니다. 개인 DB·키·토큰 파일은 업로드하지 마세요. 배포에는 별도 환경 변수가 필요하지 않습니다.

## 4. 웹 화면과 맥미니 연결 — 최초 1회

1. 맥미니 앱의 **허용할 Vercel 웹 주소**에 실제 발급된 `https://프로젝트명.vercel.app`을 입력합니다. 경로 없이 도메인까지만 입력합니다. 사용자 지정 도메인이 있다면 쉼표로 함께 넣을 수 있습니다.
2. **설정 저장 · 서버 시작**을 누릅니다.
3. Vercel 웹 화면을 열면 서버 연결 창이 나타납니다.
4. 서버 주소에 `https://plify-api.selyth.xyz`를 입력합니다.
5. 맥미니 앱의 **접속 키 복사**를 눌러 웹 화면의 **접속 키**에 붙여넣습니다. Cloudflare 터널 토큰과 다른 값입니다.
6. 연결을 누르고 YouTube 영상/플레이리스트 링크를 입력합니다.
7. 변환이 완료되면 **파일 받기**로 접속한 휴대폰/PC에 MP3를 저장할 수 있습니다. 원본 MP3는 맥미니에도 남습니다.

접속 키는 현재 브라우저 탭의 sessionStorage에만 보관됩니다. 탭의 세션이 사라지면 다시 입력해야 합니다. 서버 주소만 localStorage에 보관합니다. Google 로그인이나 YouTube API 키는 필요하지 않습니다.

## 이후 매번 사용할 때

1. 맥미니에서 **Plify Server.app 더블클릭**.
2. 저장된 설정으로 로컬 서버와 터널이 자동 시작됩니다.
3. 휴대폰/PC에서 Vercel 웹 주소를 열고 다운로드합니다.

서버가 켜져 있는 동안에는 자동 유휴 잠자기를 억제합니다. 수동 잠자기, 로그아웃, 전원 종료, 네트워크 중단 중에는 사용할 수 없습니다. 앱 창을 닫으면 서버와 터널도 종료됩니다. 재부팅 후 자동 실행하려면 macOS **시스템 설정 → 일반 → 로그인 항목**에 앱을 추가하세요. 이는 사용자 로그인 후 실행하는 방식이며 로그인 전 시스템 서비스는 아닙니다.

## 파일 위치

- 음악: `~/Music/Plify Web/`
- DB·서버 설정·접속 키·터널 토큰: `~/Library/Application Support/Plify Server/`
- 앱을 업데이트해도 위 데이터는 유지됩니다. 접속 키와 터널 토큰은 사용자 전용 권한(0600)으로 저장됩니다.

## 연결이 안 될 때

- 앱에서 시작 실패: 다른 Plify Server가 이미 실행 중인지 확인하세요. 기본 포트는 8765입니다.
- Cloudflare 502: 앱 로컬 서버 실행 여부와 터널 Service URL `http://127.0.0.1:8765`를 확인하세요.
- 터널 종료됨: 토큰이 올바른지 확인하고 시작 버튼을 누르세요. cloudflared는 연결 손실 시 내부적으로 재연결을 시도하지만 프로세스 종료 시에는 시작 버튼으로 다시 실행합니다.
- 웹 연결 실패: 실제 접속 중인 Vercel 도메인이 앱의 허용 웹 주소와 정확히 일치하는지 확인하세요. Preview 배포 주소는 별도이므로 Production 주소를 사용하는 편이 간단합니다.
- 접속 키 오류: 앱에서 접속 키를 다시 복사하세요. 터널 토큰을 웹에 넣으면 안 됩니다.
- 영상 조회/다운로드 실패: 웹의 실행 기록에서 원인을 확인하세요. 로그인 필요한 영상은 지원하지 않습니다. YouTube 측 변경으로 yt-dlp 업데이트가 필요한 경우 새 서버 앱으로 교체해야 합니다.

## 공식 참고

- Cloudflare Tunnel 시작: https://developers.cloudflare.com/tunnel/get-started/
- 터널 토큰 파일: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/configure-tunnels/run-parameters/#token-file
- Vercel 설정 파일: https://vercel.com/docs/project-configuration/vercel-json

## 개발자 빌드

일반 사용자는 빌드가 필요하지 않습니다. 원본 프로젝트의 `packaging/vendor`에 FFmpeg/ffprobe/Node가 준비되어 있어야 합니다. 기존 `packaging/build_tools.sh` 및 라이선스/소스 번들을 재사용합니다. cloudflared 2026.10.1 darwin-arm64 자산은 공식 GitHub에서 내려받아 API 자산 digest(아카이브)와 릴리스 본문의 SHA256(실행 파일)을 확인합니다.

```sh
.venv/bin/python web-app/packaging/build_server.py
PATH=/usr/bin:/bin 'web-app/dist/Plify Server.app/Contents/MacOS/PlifyServer' --self-test --gui
```

macOS 26 이상 arm64 빌드입니다. Intel Mac에는 별도 빌드가 필요합니다. `--self-test`는 로컬 생성 음원을 번들 yt-dlp와 FFmpeg로 변환하고 MP3 메타데이터·썸네일, API 인증·CORS 및 GUI 초기화를 확인합니다. 실제 YouTube와 Cloudflare/Vercel 계정 연동은 포함하지 않습니다.
