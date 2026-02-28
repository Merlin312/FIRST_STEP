#!/usr/bin/env python3
"""
Generate Ukrainian TTS audio files for all unique Ukrainian words/phrases
in the app's word lists, then auto-generate the Expo asset registry.

Requirements:
    pip install gtts

Usage (run from project root):
    python scripts/generate-uk-audio.py

Output:
    assets/audio/uk/uk_NNNN.mp3   — one MP3 per unique Ukrainian text
    constants/audio-uk.ts          — auto-generated Expo require() registry

Re-running is safe: existing MP3 files are skipped (only new words are fetched).
"""

import os
import re
import time

WORD_FILES = [
    'constants/words.ts',
    'constants/words-es.ts',
    'constants/words-de.ts',
]

AUDIO_DIR = 'assets/audio/uk'
REGISTRY_FILE = 'constants/audio-uk.ts'

# Matches:  ua: 'бути'  or  ua: "бути"
UA_PATTERN = re.compile(r"""ua:\s*['"]([^'"]+)['"]""")


def extract_ua_values(filepath: str) -> list:
    with open(filepath, encoding='utf-8') as f:
        content = f.read()
    return UA_PATTERN.findall(content)


def main():
    try:
        from gtts import gTTS
    except ImportError:
        print("ERROR: gtts is not installed.")
        print("Install it with:  pip install gtts")
        return

    # Collect unique Ukrainian texts in stable insertion order
    seen = set()
    ordered = []
    for filepath in WORD_FILES:
        if not os.path.exists(filepath):
            print(f"WARNING: {filepath} not found, skipping")
            continue
        for ua in extract_ua_values(filepath):
            if ua not in seen:
                seen.add(ua)
                ordered.append(ua)

    print(f"Found {len(ordered)} unique Ukrainian texts across all word files")

    os.makedirs(AUDIO_DIR, exist_ok=True)

    mapping = {}  # ua_text -> mp3_filename
    errors = []

    for i, ua in enumerate(ordered, start=1):
        filename = f'uk_{i:04d}.mp3'
        filepath = os.path.join(AUDIO_DIR, filename)

        if os.path.exists(filepath):
            print(f'  [{i:>3}/{len(ordered)}] skip  {filename}  "{ua}"')
        else:
            print(f'  [{i:>3}/{len(ordered)}] fetch {filename}  "{ua}"')
            try:
                tts = gTTS(text=ua, lang='uk', slow=False)
                tts.save(filepath)
                time.sleep(0.35)  # gentle rate-limiting to avoid 429s
            except Exception as e:
                print(f'    ERROR: {e}')
                errors.append((ua, str(e)))
                continue

        mapping[ua] = filename

    # Write registry TypeScript file
    registry_lines = [
        '// AUTO-GENERATED — do not edit manually.',
        '// To regenerate: python scripts/generate-uk-audio.py',
        '//',
        '// prettier-ignore',
        'export const UK_AUDIO: Record<string, ReturnType<typeof require>> = {',
    ]
    for ua, filename in mapping.items():
        escaped = ua.replace('\\', '\\\\').replace("'", "\\'")
        registry_lines.append(f"  '{escaped}': require('../assets/audio/uk/{filename}'),")
    registry_lines.append('};')
    registry_lines.append('')

    with open(REGISTRY_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(registry_lines))

    print(f'\n✓ Registry written → {REGISTRY_FILE}  ({len(mapping)} entries)')
    print(f'✓ Audio files      → {AUDIO_DIR}/')

    if errors:
        print(f'\n⚠  {len(errors)} error(s) during generation:')
        for ua, msg in errors:
            print(f'   "{ua}": {msg}')
        print('Re-run the script to retry failed entries.')


if __name__ == '__main__':
    main()
