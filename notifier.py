import smtplib
from email.message import EmailMessage

def send_completion_email(song_title, email_address, email_password):
    msg = EmailMessage()
    msg['Subject'] = "Plify - 새로운 노래 추가 알림"
    msg['From'] = email_address
    msg['To'] = email_address

    content = f"새로운 노래가 재생목록에 추가되었습니다.\n\n곡명: {song_title}"
    msg.set_content(content)

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(email_address, email_password)
            smtp.send_message(msg)
        print(f"이메일 알림 발송 완료")
    except Exception as e:
        print(e)