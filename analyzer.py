import re

def is_shorts(duration_str):
    if not duration_str:
        return False

    if 'H' in duration_str:
        return False

    match_m = re.search(r'(\d+)M', duration_str)
    match_s = re.search(r'(\d+)S', duration_str)

    minutes = int(match_m.group(1)) if match_m else 0
    seconds = int(match_s.group(1)) if match_s else 0

    total_seconds = (minutes * 60) + seconds

    return 0 < total_seconds <= 60

def is_music_video(title, description="", duration=""):
    if is_shorts(duration):
        return False

    if "#shorts" in title.lower() or "#shorts" in description.lower():
        return False

    music_keywords = r'(cover|커버|music|official|song|m/v|inst\.)'
    if re.search(music_keywords, title, re.IGNORECASE):
        return True

    desc_lower = description.lower()
    if "music credit" in desc_lower or "music video credit" in desc_lower:
        return True

    return False