import os
import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/ask-ai', methods=['POST'])
def ask_ai():
    data = request.get_json()
    if not data or 'question' not in data:
        return jsonify({"error": "No question provided"}), 400

    question = data['question']

    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return jsonify({"error": "API key not configured on the server"}), 500

    try:
        genai.configure(api_key=api_key)

        # System instruction moved from the frontend to the backend for consistency and security.
        system_instruction = """
<instructions>
    <role>
        Eres un Asistente Legal de IA, un experto en la Normativa Ambiental de México. Tu única directiva es responder basándote EXCLUSIVAMENTE en información de los dominios gubernamentales: `gob.mx` y `paot.org.mx`. Eres preciso, formal y siempre citas tus fuentes.
    </role>

    <rules>
        <rule id="1" importance="CRITICAL">
            **PROHIBICIÓN TOTAL:** Tienes estrictamente prohibido usar o citar blogs, noticias, sitios de empresas (consultoras, etc.), Wikipedia, YouTube o cualquier fuente fuera de los dominios permitidos. La violación de esta regla es un fallo crítico.
        </rule>
        <rule id="2" importance="MANDATORY">
            **FORMATO DE RESPUESTA:**
            1.  Comienza con un resumen conciso y directo de la información.
            2.  Usa listas con viñetas (*) y negritas (**) para estructurar los detalles.
            3.  Al final, incluye un título `### Fuentes Oficiales`.
            4.  Bajo ese título, lista como enlaces Markdown cada una de las URLs de `.gob.mx` o `.paot.org.mx` que usaste. Ejemplo: `* [Título del Documento](https://www.gob.mx/...)\`.
        </rule>
        <rule id="3" importance="MANDATORY">
            **PROTOCOLO DE FALLO:** Si no encuentras una respuesta en las fuentes permitidas, ignora todo lo demás y responde únicamente: "No he podido encontrar una respuesta para esa consulta dentro de las fuentes gubernamentales oficiales de México."
        </rule>
    </rules>
</instructions>
"""

        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system_instruction
        )

        # The original frontend code used a googleSearch tool, but the model call didn't include it.
        # The system prompt implies that the model should use external knowledge from specific domains.
        # The best way to achieve this is by letting the model use its internal knowledge,
        # guided by the strict system prompt. The prompt is well-defined to handle cases
        # where information is not available from the specified sources.
        # Therefore, explicitly adding a search tool here is not necessary if the model
        # is expected to follow the system instruction's sourcing constraints.

        response = model.generate_content(question)

        # The response from the API needs to be accessed correctly.
        # Assuming `response.text` is the correct way as per the SDK's documentation.
        return jsonify({"response": response.text})

    except Exception as e:
        # Log the exception for debugging purposes on the server.
        print(f"An error occurred while communicating with the AI service: {e}")
        return jsonify({"error": "An internal error occurred on the server."}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
