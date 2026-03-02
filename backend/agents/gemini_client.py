import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from backend.config import GEMINI_API_KEY
if GEMINI_API_KEY:
    os.environ["GOOGLE_API_KEY"] = GEMINI_API_KEY
import google.generativeai as genai
_llm = None
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        models = [m.name for m in genai.list_models() if "generateContent" in m.supported_generation_methods]
        target_model = "gemini-1.5-flash"
        for candidate in ["models/gemini-2.5-flash", "models/gemini-2.0-flash", "models/gemini-1.5-flash", "models/gemini-1.5-flash-latest", "models/gemini-pro"]:
            if candidate in models:
                target_model = candidate.split("/")[-1]
                break
        _llm = ChatGoogleGenerativeAI(model=target_model, temperature=0)
    except Exception as e:
        print(f"Failed to auto-detect model: {e}")
        _llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0)
def ask_gemini(system_prompt, context_text, user_question):
    if not _llm:
        return "GEMINI_API_KEY is not configured in environment variables."
    prompt = PromptTemplate.from_template(
        "{system_prompt}\n\nContext Data:\n{context_text}\n\nQuestion: {user_question}"
    )
    chain = prompt | _llm
    try:
        resp = chain.invoke({
            "system_prompt": system_prompt,
            "context_text": context_text,
            "user_question": user_question
        })
        return resp.content.strip()
    except Exception as e:
        return f"query failed via langchain: {str(e)}"
