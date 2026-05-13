import os
import time
import json
from auth import get_authenticated_service
from youtube_api import get_latest_videos, insert_video_to_playlist
from analyzer import is_music_video
from notifier import send_completion_email

CONFIG_FILE = "config.json"
PROCESSED_FILE = "processed_ids.txt"

ENABLE_EMAIL_NOTICE = False
CHECK_INTERVAL = 3600
EMAIL_ADDRESS = ""
EMAIL_PASSWORD = ""


def load_config():
    if not os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)
        return []
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_processed_ids():
    if not os.path.exists(PROCESSED_FILE):
        return set()
    with open(PROCESSED_FILE, 'r') as f:
        return set(line.strip() for line in f)


def save_processed_id(task_key):
    with open(PROCESSED_FILE, 'a') as f:
        f.write(f"{task_key}\n")


def run_bot():
    print(f"\n{time.strftime('%Y-%m-%d %H:%M:%S')} - 업데이트 확인 시작")

    try:
        youtube = get_authenticated_service()
        processed_ids = load_processed_ids()
        configs = load_config()

        for setup in configs:
            target_channel = setup['channel_id']
            target_playlist = setup['playlist_id']

            print(f"\n채널 확인 중: {target_channel} -> 📋 {target_playlist}")

            latest_videos = get_latest_videos(youtube, target_channel, max_results=5)

            for video in latest_videos:
                video_id = video['video_id']
                title = video['title']
                description = video.get('description', '')
                duration = video.get('duration', '')

                task_key = f"{video_id}_{target_playlist}"

                if task_key in processed_ids:
                    print(f"이미 처리된 영상입니다: {title}")
                    continue

                if not is_music_video(title, description, duration):
                    print(f"노래가 아니라고 판단되었습니다: {title}")
                    save_processed_id(task_key)
                    continue

                print(f"새로운 노래를 발견했습니다. 추가를 시도합니다: {title}")
                result = insert_video_to_playlist(youtube, target_playlist, video_id)

                if result:
                    save_processed_id(task_key)
                    if ENABLE_EMAIL_NOTICE:
                        send_completion_email(title, EMAIL_ADDRESS, EMAIL_PASSWORD)

    except Exception as e:
        print(e)


def main():
    print("유튜브오토플레이리스트 가동")
    while True:
        run_bot()
        print(f"\n{CHECK_INTERVAL}초 대기 후 다음 작업을 시작합니다...")
        time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    main()