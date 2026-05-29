import os
import speech_recognition as sr
from dotenv import load_dotenv

load_dotenv()


def transcribe_audio(audio_file_path: str) -> dict:
    recognizer = sr.Recognizer()
    try:
        with sr.AudioFile(audio_file_path) as source:
            recognizer.adjust_for_ambient_noise(source)
            audio = recognizer.record(source)

        text = recognizer.recognize_google(audio)
        words = text.split()

        return {
            "success": True,
            "transcription": text,
            "word_count": len(words),
            "estimated_facts": extract_facts_from_speech(text)
        }
    except sr.UnknownValueError:
        return {"success": False, "error": "Could not understand audio"}
    except sr.RequestError as e:
        return {"success": False, "error": f"Speech recognition error: {e}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def extract_facts_from_speech(transcription: str) -> list[str]:
    sentences = transcription.replace(".", ".\n").split("\n")
    facts = [s.strip() for s in sentences if len(s.strip()) > 10]
    return facts