import json
import os
import re
from auth import get_authenticated_service

CONFIG_FILE = "config.json"


def load_config():
    if not os.path.exists(CONFIG_FILE):
        return []
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_config(config):
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=4, ensure_ascii=False)


def extract_channel_input(url):
    match = re.search(r'(?:@|channel/)([\w-]+)', url)
    return match.group(1) if match else url


def extract_playlist_id(url):
    match = re.search(r'list=([\w-]+)', url)
    return match.group(1) if match else url


def get_channel_id_from_handle(youtube, handle):
    if not handle.startswith('@'):
        handle = '@' + handle

    try:
        response = youtube.channels().list(
            part='id',
            forHandle=handle
        ).execute()

        if 'items' in response and response['items']:
            return response['items'][0]['id']
    except Exception as e:
        print(e)
    return None


def show_list():
    config = load_config()
    print("\n=== 리스트 ===")
    if not config:
        print("비어있습니다.")
    for i, item in enumerate(config, 1):
        print(f"{i}. 채널: {item['channel_id']} -> 플레이리스트: {item['playlist_id']}")
    print("========================")


def add_mapping():
    youtube = get_authenticated_service()

    channel_input = input("채널 링크 또는 핸들(@) 입력: ").strip()
    playlist_input = input("저장할 재생목록 링크 입력: ").strip()

    temp_id = extract_channel_input(channel_input)

    if not temp_id.startswith('UC'):
        print(f"핸들({temp_id})을 채널 ID로 변환 중...")
        actual_id = get_channel_id_from_handle(youtube, temp_id)
        if actual_id:
            c_id = actual_id
            print(f"변환된 채널 ID : {c_id}")
        else:
            print("채널 ID를 찾을 수 없습니다. 핸들을 다시 확인해주세요.")
            return
    else:
        c_id = temp_id

    p_id = extract_playlist_id(playlist_input)

    config = load_config()
    config.append({"channel_id": c_id, "playlist_id": p_id})
    save_config(config)
    print(f"\n추가 완료! ({c_id} -> {p_id})")


def delete_mapping():
    show_list()
    config = load_config()
    if not config: return

    try:
        idx = int(input("\n삭제할 번호 입력 (취소: 0): "))
        if idx == 0: return
        removed = config.pop(idx - 1)
        save_config(config)
        print(f"삭제 완료: {removed['channel_id']}")
    except (ValueError, IndexError):
        print("잘못된 번호입니다.")


def main_menu():
    while True:
        print("\n[ Plify 매니저 ]")
        print("1. 리스트 보기")
        print("2. 매핑 추가")
        print("3. 매핑 삭제")
        print("4. 종료")

        choice = input("\n메뉴 선택: ")

        if choice == '1':
            show_list()
        elif choice == '2':
            add_mapping()
        elif choice == '3':
            delete_mapping()
        elif choice == '4':
            break
        else:
            print("다시 선택해주세요.")


if __name__ == "__main__":
    main_menu()