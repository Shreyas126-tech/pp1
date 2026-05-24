try:
    from langchain_community.vectorstores import Chroma
    print('Chroma OK')
except Exception as e:
    print('Chroma err:', e)

try:
    from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
    print('langchain_google_genai OK')
except Exception as e:
    print('langchain_google_genai err:', e)

try:
    from langchain_core.documents import Document
    print('langchain_core OK')
except Exception as e:
    print('langchain_core err:', e)

try:
    from langchain.chains import create_retrieval_chain
    print('langchain.chains OK')
except Exception as e:
    print('langchain.chains err:', e)

try:
    import google.generativeai as genai
    print('genai OK')
except Exception as e:
    print('genai err:', e)
