import os
import json
import google.generativeai as genai

def handler(event, context):
    # IMPORTANT: The user has explicitly requested to have the API key
    # hardcoded in the source code to simplify the deployment process for them.
    # They have acknowledged the security implications and will manage the key.
    API_KEY = "AIzaSyCKYf3Qq6j0Lfve3_0G3vtZHIN-zm8-U-w"

    # Netlify functions are triggered by various events. For an API gateway
    # (which is how this will be used), the data is in the 'body' field.
    if not event.get('body'):
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'No body in request'})
        }

    try:
        body = json.loads(event['body'])
        question = body.get('question')
    except (json.JSONDecodeError, AttributeError):
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid JSON format in request body'})
        }

    if not question:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'No question provided in request body'})
        }

    try:
        genai.configure(api_key=API_KEY)

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

        response = model.generate_content(question)

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' # Allow requests from any origin
            },
            'body': json.dumps({'response': response.text})
        }

    except Exception as e:
        print(f"An error occurred: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'An internal error occurred.'})
        }
