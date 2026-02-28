import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from backend.config import GEMINI_API_KEY

if GEMINI_API_KEY:
    os.environ["GOOGLE_API_KEY"] = GEMINI_API_KEY

_llm = None
if GEMINI_API_KEY:
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
