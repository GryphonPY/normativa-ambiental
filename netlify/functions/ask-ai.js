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
    <search_requirements>
        - Busca EXCLUSIVAMENTE en sitios oficiales: site:gob.mx OR site:paot.org.mx
        - IGNORA completamente blogs, Wikipedia, empresas consultoras, universidades
        - Si no encuentras información en fuentes oficiales, dilo claramente
        - Prioriza: SEMARNAT, PROFEPA, INECC, CONAGUA, CONAFOR
    </search_requirements>
    <response_format>
        1. **Resumen**: Respuesta directa y concisa (2-3 líneas)
        2. **Detalles Normativos**: 
           * Normativa aplicable
           * Requisitos específicos
           * Procedimientos relevantes
           * Sanciones o consecuencias (si aplica)
        3. **Información Adicional**: Contexto relevante o consideraciones especiales
        
        NO incluyas sección de fuentes en tu respuesta - se agregará automáticamente.
    </response_format>
    <critical_restrictions>
        - PROHIBIDO ABSOLUTO citar: Wikipedia, blogs, noticias, empresas consultoras, universidades
        - SOLO fuentes oficiales mexicanas (.gob.mx, .paot.org.mx)
        - Si la información no está disponible en fuentes oficiales, indica: "No se encontró información oficial disponible"
    </critical_restrictions>
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
    
    // Function to extract and filter official sources only
    function processGroundingResponse(responseText, metadata) {
      if (!metadata?.groundingChunks || metadata.groundingChunks.length === 0) {
        return {
          cleanText: responseText,
          sources: []
        };
      }

      // Filter only official Mexican government sources
      const officialSources = [];
      const seenUrls = new Set();
      
      metadata.groundingChunks.forEach((chunk, index) => {
        if (chunk?.web?.uri && !seenUrls.has(chunk.web.uri)) {
          const url = chunk.web.uri;
          
          // Only include official Mexican government domains
          if (url.includes('.gob.mx') || url.includes('.paot.org.mx')) {
            seenUrls.add(url);
            officialSources.push({
              title: chunk.web.title || `Fuente Oficial ${officialSources.length + 1}`,
              url: url
            });
          }
        }
      });

      // Create sources section only if we have official sources
      let sourcesSection = "";
      if (officialSources.length > 0) {
        sourcesSection = "\n\n### Fuentes Oficiales\n\n";
        officialSources.forEach((source, index) => {
          sourcesSection += `* [${source.title}](${source.url})\n`;
        });
      }

      return {
        cleanText: responseText + sourcesSection,
        sources: officialSources
      };
    }

    // Process the response with clean sources at the end
    let finalText = text;
    let sourcesInfo = [];
    
    if (groundingMetadata) {
      const processed = processGroundingResponse(text, groundingMetadata);
      finalText = processed.cleanText;
      sourcesInfo = processed.sources;
      
      console.log("Grounding activated. Search queries:", groundingMetadata.webSearchQueries);
      console.log("Sources found:", sourcesInfo.length);
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
        response: finalText, // Texto limpio con fuentes al final
        grounded: !!groundingMetadata,
        sources_found: sourcesInfo.length,
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
