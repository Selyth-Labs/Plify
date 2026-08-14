import re

def is_shorts_duration(duration_str):
    if not duration_str or 'H' in duration_str:
        return False
    match_m = re.search(r'(\d+)M', duration_str)
    match_s = re.search(r'(\d+)S', duration_str)
    minutes = int(match_m.group(1)) if match_m else 0
    seconds = int(match_s.group(1)) if match_s else 0
    return (minutes * 60) + seconds <= 65


def get_latest_videos(youtube, channel_id, max_results=5):
    channel_response = youtube.channels().list(
        part='contentDetails',
        id=channel_id
    ).execute()
    uploads_id = channel_response['items'][0]['contentDetails']['relatedPlaylists']['uploads']

    playlist_response = youtube.playlistItems().list(
        part='snippet',
        playlistId=uploads_id,
        maxResults=max_results * 2
    ).execute()

    video_ids = [item['snippet']['resourceId']['videoId'] for item in playlist_response['items']]

    videos_details = youtube.videos().list(
        part='contentDetails,snippet',
        id=','.join(video_ids)
    ).execute()

    clean_videos = []
    for item in videos_details['items']:
        duration = item['contentDetails']['duration']

        if is_shorts_duration(duration):
            continue

        clean_videos.append({
            'video_id': item['id'],
            'title': item['snippet']['title'],
            'description': item['snippet'].get('description', ''),
            'duration': duration
        })

        if len(clean_videos) >= max_results:
            break

    return clean_videos

def insert_video_to_playlist(youtube, playlist_id, video_id):
    print(f"영상({video_id})을 재생목록({playlist_id})에 추가하는 중..")

    try:
        request = youtube.playlistItems().insert(
            part="snippet",
            body={
                "snippet": {
                    "playlistId": playlist_id,
                    "resourceId": {"kind": "youtube#video", "videoId": video_id}
                }
            }
        )
        response = request.execute()
        print(f"동영상({video_id})을 재생목록({playlist_id})에 추가하였습니다.")
        return response
    except Exception as e:
        print(e)
        return None