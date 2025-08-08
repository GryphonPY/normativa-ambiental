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

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      console.error("ERROR: 'question' field is missing or invalid from the request body.");
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Bad Request: No valid question provided." }),
      };
    }

    // Sanitize question to prevent prompt injection
    const sanitizedQuestion = question.trim().substring(0, 2000);

    // --- 3. Configure and call the Generative AI model with grounding ---
    const genAI = new GoogleGenerativeAI(apiKey);

    const systemInstruction = `
<instructions>
    <role>
        Eres un Asistente Legal de IA especializado en Normativa Ambiental de México. Responde ÚNICAMENTE basándote en información oficial de dominios gubernamentales mexicanos: gob.mx y paot.org.mx. Mantén un tono profesional, preciso y formal.
    </role>
    <search_strategy>
        Para cada consulta, busca información específica usando términos como:
        - "site:gob.mx [tema de consulta]"
        - "site:paot.org.mx [tema de consulta]"
        - Incluye sinónimos y términos técnicos relevantes
        - Prioriza documentos oficiales, leyes, reglamentos y normas
    </search_strategy>
    <response_format>
        1. **Resumen Ejecutivo**: Respuesta directa y concisa (2-3 líneas)
        2. **Detalles Normativos**: 
           * Normativa aplicable
           * Requisitos específicos
           * Procedimientos relevantes
           * Sanciones o consecuencias (si aplica)
        3. **Información Adicional**: Contexto relevante o consideraciones especiales
        4. **Fuentes Oficiales**: Lista de enlaces gubernamentales consultados
    </response_format>
    <restrictions>
        - PROHIBIDO citar blogs, noticias, Wikipedia, empresas consultoras
        - SOLO fuentes de dominios gob.mx y paot.org.mx
        - Si no encuentras información oficial suficiente, indícalo claramente
        - Siempre incluye fechas de las normativas cuando sea posible
    </restrictions>
</instructions>
`;

    // Create model with grounding tool
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction,
      tools: [{
        googleSearch: {}
      }],
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 10,
        maxOutputTokens: 2048,
      },
    });

    console.log("Calling Gemini with grounding for question:", sanitizedQuestion);
    
    // Make the request with grounding
    const result = await model.generateContent(sanitizedQuestion);
    const response = await result.response;
    const text = await response.text();

    // Get grounding metadata if available
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    
    // Function to add citations to the text
    function addCitations(responseText, metadata) {
      if (!metadata?.groundingSupports || !metadata?.groundingChunks) {
        return responseText;
      }

      let text = responseText;
      const supports = metadata.groundingSupports;
      const chunks = metadata.groundingChunks;

      // Sort supports by endIndex in descending order to avoid shifting issues
      const sortedSupports = [...supports].sort(
        (a, b) => (b.segment?.endIndex ?? 0) - (a.segment?.endIndex ?? 0),
      );

      for (const support of sortedSupports) {
        const endIndex = support.segment?.endIndex;
        if (endIndex === undefined || !support.groundingChunkIndices?.length) {
          continue;
        }

        const citationLinks = support.groundingChunkIndices
          .map(i => {
            const chunk = chunks[i];
            const uri = chunk?.web?.uri;
            const title = chunk?.web?.title || `Fuente ${i + 1}`;
            if (uri) {
              return `[${title}](${uri})`;
            }
            return null;
          })
          .filter(Boolean);

        if (citationLinks.length > 0) {
          const citationString = ` (${citationLinks.join(", ")})`;
          text = text.slice(0, endIndex) + citationString + text.slice(endIndex);
        }
      }

      return text;
    }

    // Add citations if grounding metadata is available
    let finalText = text;
    if (groundingMetadata) {
      finalText = addCitations(text, groundingMetadata);
      console.log("Grounding activated. Search queries:", groundingMetadata.webSearchQueries);
      console.log("Sources found:", groundingMetadata.groundingChunks?.length || 0);
    } else {
      console.log("Response generated from model's knowledge base");
    }

    // Basic validation of response
    if (!finalText || finalText.trim().length === 0) {
      throw new Error("Empty response from AI model");
    }

    // --- 4. Return the successful response ---
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ 
        response: finalText, // Usar el texto con citas
        grounded: !!groundingMetadata,
        sources_found: groundingMetadata?.groundingChunks?.length || 0,
        timestamp: new Date().toISOString()
      }),
    };

  } catch (error) {
    // Enhanced error logging for debugging
    console.error("FATAL ERROR:", error.message);
    console.error("Stack:", error.stack);

    // Different error responses based on error type
    if (error.message && error.message.includes('API_KEY')) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Authentication error with AI service." }),
      };
    }

    if (error.message && error.message.includes('quota')) {
      return {
        statusCode: 429,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Service temporarily unavailable due to usage limits." }),
      };
    }

    // Generic server error
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        error: "An internal server error occurred. Please try again later.",
        debug: error.message // Temporal para debug
      }),
    };
  }
};
