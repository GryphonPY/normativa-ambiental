import os
import json
import google.generativeai as genai

def handler(event, context):
    """
    Netlify serverless function to handle AI queries using Google Generative AI.
    """
    # Wrap the entire function in a try-except block for comprehensive error logging.
    try:
        print("Function handler started.")

        # --- 1. Securely get the API key ---
        API_KEY = os.getenv("GOOGLE_API_KEY")
        if not API_KEY:
            print("ERROR: GOOGLE_API_KEY environment variable not found.")
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Configuration error: The API key is not set on the server.'})
            }

        print("Successfully retrieved GOOGLE_API_KEY.")

        # --- 2. Validate and parse the incoming request ---
        if not event.get('body'):
            print("ERROR: Request received without a body.")
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Bad Request: No data sent.'})
            }

        try:
            body = json.loads(event['body'])
            question = body.get('question')
            print(f"Received question: {question}")
        except (json.JSONDecodeError, AttributeError) as e:
            print(f"ERROR: Could not parse request body. Error: {e}")
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Bad Request: Invalid data format.'})
            }

        if not question:
            print("ERROR: 'question' field is missing from the request body.")
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Bad Request: No question provided.'})
            }

        # --- 3. Configure and call the Generative AI model ---
        print("Configuring Generative AI model...")
        genai.configure(api_key=API_KEY)

        system_instruction = r"""
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

        print("Generating content from model...")
        response = model.generate_content(question)
        print("Successfully received response from model.")

        # --- 4. Return the successful response ---
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'  # Allow requests from any origin
            },
            'body': json.dumps({'response': response.text})
        }

    except Exception as e:
        # --- 5. Catch-all for any other errors ---
        # This will log the error to Netlify Functions logs for debugging.
        print(f"FATAL ERROR: An unexpected error occurred: {e}")
        # Return a generic error message to the user for security.
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'An internal server error occurred. The issue has been logged.'})
        }
