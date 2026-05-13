import os
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/youtube']

def get_authenticated_service():
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("기존 토큰을 갱신합니다..")
            creds.refresh(Request())
        else:
            print("로그인이 필요합니다. 브라우저 창을 확인해주세요.")
            flow = InstalledAppFlow.from_client_secrets_file(
                'client_secret.json', SCOPES)
            creds = flow.run_local_server(port=0)

        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    return build('youtube', 'v3', credentials=creds)


if __name__ == "__main__":
    # print("--- 유튜브 API 인증 테스트 ---")
    service = get_authenticated_service()
    if service:
        print("인증 성공! 'token.json' 파일이 생성/갱신되었습니다.")
    else:
        print("인증에 실패하였습니다. 필수 작업을 완료하였는지 확인해주세요.")