import os
from backend.config import GEMINI_API_KEY
import google.generativeai as genai

genai.configure(api_key=GEMINI_API_KEY)
models = [m.name for m in genai.list_models() if "generateContent" in m.supported_generation_methods]
print(models)
