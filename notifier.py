import smtplib
from email.message import EmailMessage

EMAIL_ADDRESS = ""
EMAIL_PASSWORD = ""


def send_completion_email(song_title):
    msg = EmailMessage()
    msg['Subject'] = f"유튜브오토플레이리스트 알림"
    msg['From'] = EMAIL_ADDRESS
    msg['To'] = EMAIL_ADDRESS

    content = f"새로운 노래 '{song_title}'이(가) 재생목록에 추가되었습니다."
    msg.set_content(content)

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            smtp.send_message(msg)
        print(f"이메일 알림 발송 완료")
    except Exception as e:
        print(f"이메일 발송 실패..")
        print(e)