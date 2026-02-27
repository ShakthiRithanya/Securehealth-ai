import google.generativeai as genai
from backend.config import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)

_model = genai.GenerativeModel("gemini-1.5-flash")


def ask_gemini(system_prompt, context_text, user_question):
    full_prompt = f"{system_prompt}\n\nContext Data:\n{context_text}\n\nQuestion: {user_question}"
    try:
        resp = _model.generate_content(full_prompt)
        return resp.text.strip()
    except Exception:
        try:
            resp = _model.generate_content(full_prompt)
            return resp.text.strip()
        except Exception as err:
            return f"query failed: {str(err)}"
