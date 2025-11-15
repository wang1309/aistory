#!/usr/bin/env python3

import json

def update_translations_file(filename, language):
    """Update translation file with missing keys"""

    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Update mode section
    if 'toggle_shortcut' not in data['poemGenerate']['mode']:
        data['poemGenerate']['mode']['toggle_shortcut'] = {
            'zh': '切换',
            'en': 'to toggle',
            'ja': 'で切り替え',
            'ko': '로 전환',
            'de': 'zum Umschalten'
        }[language]

    # Update options sections with none_option
    options_sections = ['theme', 'mood', 'style']
    for section in options_sections:
        if 'none_option' not in data['poemGenerate']['options'][section]:
            data['poemGenerate']['options'][section]['none_option'] = '-'

    # Update audio section with new fields
    audio_updates = {
        'player': {
            'stop': {
                'zh': '停止',
                'en': 'Stop',
                'ja': '停止',
                'ko': '중지',
                'de': 'Stoppen'
            },
            'resume': {
                'zh': '继续',
                'en': 'Resume',
                'ja': '再開',
                'ko': '재개',
                'de': 'Fortsetzen'
            },
            'speed_label': {
                'zh': '朗诵速度',
                'en': 'Recitation Speed',
                'ja': '朗読速度',
                'ko': '낭독 속도',
                'de': 'Vortragsgeschwindigkeit'
            },
            'status_reading': {
                'zh': '朗诵中...',
                'en': 'Reading...',
                'ja': '朗読中...',
                'ko': '낭독 중...',
                'de': 'Lese vor...'
            },
            'status_paused': {
                'zh': '已暂停',
                'en': 'Paused',
                'ja': '一時停止中',
                'ko': '일시정지됨',
                'de': 'Pausiert'
            }
        },
        'browser_not_supported': {
            'zh': '您的浏览器不支持语音朗诵功能',
            'en': 'Your browser does not support speech synthesis',
            'ja': 'お使いのブラウザは音声朗読機能をサポートしていません',
            'ko': '브라우저가 음성 낭독 기능을 지원하지 않습니다',
            'de': 'Ihr Browser unterstützt die Sprachsynthese nicht'
        },
        'tts_failed': {
            'zh': '朗诵失败，请重试',
            'en': 'Recitation failed, please try again',
            'ja': '朗読に失敗しました。もう一度お試しください',
            'ko': '낭독 실패, 다시 시도하세요',
            'de': 'Vortrag fehlgeschlagen, bitte versuchen Sie es erneut'
        }
    }

    # Update audio section
    for key, value in audio_updates.items():
        if key == 'player':
            for subkey, subvalue in value.items():
                if subkey not in data['poemGenerate']['audio']['player']:
                    data['poemGenerate']['audio']['player'][subkey] = subvalue
        else:
            if key not in data['poemGenerate']['audio']:
                data['poemGenerate']['audio'][key] = value

    # Update toasts section
    toast_key = 'error_generate_poem_first'
    if toast_key not in data['poemGenerate']['toasts']:
        data['poemGenerate']['toasts'][toast_key] = {
            'zh': '请先生成诗歌',
            'en': 'Please generate a poem first',
            'ja': 'まず詩を生成してください',
            'ko': '먼저 시를 생성해주세요',
            'de': 'Bitte generieren Sie zuerst ein Gedicht'
        }[language]

    # Write back to file
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ Updated {filename}")

# Update both Chinese and English files
update_translations_file('src/i18n/pages/poem-generate/zh.json', 'zh')
update_translations_file('src/i18n/pages/poem-generate/en.json', 'en')

print("✅ All translation files updated successfully!")