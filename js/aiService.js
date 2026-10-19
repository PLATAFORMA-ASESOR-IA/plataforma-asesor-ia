export async function generateResolutionFlow(clientData, requestData, apiKey) {
    if (!apiKey) {
        throw new Error("API Key no configurada. Por favor, configúrala en el botón superior.");
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const systemPrompt = `Eres un Arquitecto de Soluciones y Asistente Experto para Asesores Telefónicos de atención al cliente. 
Tu objetivo es analizar la información personal del cliente y su reclamo/consulta específica, y devolver un plan de resolución estructurado en pasos secuenciales claros y directos que el asesor pueda leer y ejecutar en tiempo real durante la llamada telefónica.

Datos del Cliente:
- Nombre: ${clientData.name}
- Email: ${clientData.email}
- Teléfono: ${clientData.phone}

Tipo de Solicitud: ${requestData.type}
Descripción del Problema: ${requestData.description}

FORMATO DE RESPUESTA OBLIGATORIO:
Devuelve una lista numerada de 3 a 5 pasos tácticos. Cada paso debe contener:
1. Título claro del paso.
2. Script exacto o guía de lo que el asesor debe decirle al cliente.
3. Acción interna que debe realizar el sistema o el asesor.

Usa etiquetas HTML sencillas como <strong>, <p>, <br> para formatear el resultado de manera limpia.`;

    const requestBody = {
        contents: [
            {
                parts: [
                    { text: systemPrompt }
                ]
            }
        ],
        generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1000
        }
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || `Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
        throw new Error("No se pudo obtener una respuesta válida de la IA.");
    }

    return candidateText;
}
