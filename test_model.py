import os
from backend.config import GEMINI_API_KEY
import google.generativeai as genai

genai.configure(api_key=GEMINI_API_KEY)
models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]

model_name = "gemini-1.5-flash" # fallback
for target in ["models/gemini-2.5-flash", "models/gemini-2.0-flash", "models/gemini-1.5-flash", "models/gemini-1.5-flash-latest", "models/gemini-pro"]:
    if target in models:
        model_name = target.split("/")[-1]
        break

print(f"SELECTED_MODEL: {model_name}")
