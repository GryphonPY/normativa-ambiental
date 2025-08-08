// Import the Google Generative AI library for Node.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

// This is the main handler function for the Netlify serverless function.
// It uses the AWS Lambda-compatible syntax.
exports.handler = async (event) => {
  // Wrap the entire logic in a try-catch block for robust error handling.
  try {
    // --- 1. Securely get the API key from environment variables ---
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error("ERROR: GOOGLE_API_KEY environment variable not found.");
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Configuration error: The API key is not set on the server." }),
      };
    }

    // --- 2. Validate and parse the incoming request ---
    if (!event.body) {
      console.error("ERROR: Request received without a body.");
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Bad Request: No data sent." }),
      };
    }

    let question;
    try {
      const body = JSON.parse(event.body);
      question = body.question;
    } catch (e) {
      console.error("ERROR: Could not parse request body.", e);
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Bad Request: Invalid data format." }),
      };
    }

    if (!question) {
      console.error("ERROR: 'question' field is missing from the request body.");
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Bad Request: No question provided." }),
      };
    }

    // --- 3. Configure and call the Generative AI model ---
    const genAI = new GoogleGenerativeAI(apiKey);

    const systemInstruction = `
<instructions>
    <role>
        Eres un Asistente Legal de IA, un experto en la Normativa Ambiental de México. Tu única directiva es responder basándote EXCLUSIVAMENTE en información de los dominios gubernamentales: \`gob.mx\` y \`paot.org.mx\`. Eres preciso, formal y siempre citas tus fuentes.
    </role>
    <rules>
        <rule id="1" importance="CRITICAL">
            **PROHIBICIÓN TOTAL:** Tienes estrictamente prohibido usar o citar blogs, noticias, sitios de empresas (consultoras, etc.), Wikipedia, YouTube o cualquier fuente fuera de los dominios permitidos. La violación de esta regla es un fallo crítico.
        </rule>
        <rule id="2" importance="MANDATORY">
            **FORMATO DE RESPUESTA:**
            1.  Comienza con un resumen conciso y directo de la información.
            2.  Usa listas con viñetas (*) y negritas (**) para estructurar los detalles.
            3.  Al final, incluye un título \`### Fuentes Oficiales\`.
            4.  Bajo ese título, lista como enlaces Markdown cada una de las URLs de \`.gob.mx\` o \`.paot.org.mx\` que usaste. Ejemplo: \`* [Título del Documento](https://www.gob.mx/...)\`.
        </rule>
        <rule id="3" importance="MANDATORY">
            **PROTOCOLO DE FALLO:** Si no encuentras una respuesta en las fuentes permitidas, ignora todo lo demás y responde únicamente: "No he podido encontrar una respuesta para esa consulta dentro de las fuentes gubernamentales oficiales de México."
        </rule>
    </rules>
</instructions>
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction,
    });

    const result = await model.generateContent(question);
    const response = await result.response;
    const text = await response.text();

    // --- 4. Return the successful response ---
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Allow requests from any origin
      },
      body: JSON.stringify({ response: text }),
    };

  } catch (error) {
    // --- 5. Catch-all for any other errors ---
    console.error("FATAL ERROR: An unexpected error occurred:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "An internal server error occurred. The issue has been logged." }),
    };
  }
};
