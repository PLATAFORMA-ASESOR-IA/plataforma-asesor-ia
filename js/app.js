// --- Estado Global del Sistema ---
const state = {
    currentStep: 1,
    client: { name: '', email: '', phone: '' },
    request: { type: 'reclamo', description: '' },
    apiKey: localStorage.getItem('gemini_api_key') || ''
};

// --- Función del Servicio de IA (Gemini REST API) ---
async function generateResolutionFlow(clientData, requestData, apiKey) {
    if (!apiKey) {
        throw new Error("API Key no configurada. Por favor, configúrala en el botón superior ('Config API').");
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

// --- Control de Interfaz y Navegación ---
window.addEventListener('load', () => {

    const stepIndicator = document.getElementById('step-indicator');
    const stepPercentage = document.getElementById('step-percentage');
    const progressBar = document.getElementById('progress-bar');

    const step1Container = document.getElementById('step-1-container');
    const step2Container = document.getElementById('step-2-container');
    const step3Container = document.getElementById('step-3-container');

    const formStep1 = document.getElementById('form-step-1');
    const formStep2 = document.getElementById('form-step-2');

    const modalConfig = document.getElementById('modal-config');
    const btnConfig = document.getElementById('btn-config');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnSaveKey = document.getElementById('btn-save-key');
    const inputApiKey = document.getElementById('input-api-key');

    const aiLoading = document.getElementById('ai-loading');
    const aiOutputContent = document.getElementById('ai-output-content');
    const btnRegenerate = document.getElementById('btn-regenerate');
    const btnBack1 = document.getElementById('btn-back-1');
    const btnBack2 = document.getElementById('btn-back-2');
    const btnFinish = document.getElementById('btn-finish');

    if (inputApiKey) inputApiKey.value = state.apiKey;

    // Config API Key
    if (btnConfig) {
        btnConfig.addEventListener('click', () => modalConfig.classList.remove('hidden'));
    }
    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', () => modalConfig.classList.add('hidden'));
    }
    if (btnSaveKey) {
        btnSaveKey.addEventListener('click', () => {
            state.apiKey = inputApiKey.value.trim();
            localStorage.setItem('gemini_api_key', state.apiKey);
            modalConfig.classList.add('hidden');
            alert('API Key guardada correctamente.');
        });
    }

    // Navegación Paso 1 -> Paso 2
    if (formStep1) {
        formStep1.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const nameVal = document.getElementById('client-name').value.trim();
            const emailVal = document.getElementById('client-email').value.trim();
            const phoneVal = document.getElementById('client-phone').value.trim();

            if (!nameVal || !emailVal || !phoneVal) {
                alert('Por favor completa todos los campos.');
                return false;
            }

            state.client.name = nameVal;
            state.client.email = emailVal;
            state.client.phone = phoneVal;

            goToStep(2);
            return false;
        });
    }

    // Navegación Paso 2 -> Paso 3
    if (formStep2) {
        formStep2.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const descVal = document.getElementById('request-description').value.trim();
            if (!descVal) {
                alert('Por favor ingresa la descripción del problema.');
                return false;
            }

            state.request.type = document.getElementById('request-type').value;
            state.request.description = descVal;

            goToStep(3);
            await triggerAIWorkflow();
            return false;
        });
    }

    // Botones Atrás
    if (btnBack1) {
        btnBack1.addEventListener('click', () => goToStep(1));
    }
    if (btnBack2) {
        btnBack2.addEventListener('click', () => goToStep(2));
    }

    // Regenerar IA
    if (btnRegenerate) {
        btnRegenerate.addEventListener('click', async () => await triggerAIWorkflow());
    }

    // Finalizar
    if (btnFinish) {
        btnFinish.addEventListener('click', () => {
            alert('Sesión registrada y guardada con éxito.');
            location.reload();
        });
    }

    // Cambio de pantalla
    function goToStep(step) {
        state.currentStep = step;

        step1Container.classList.add('hidden');
        step2Container.classList.add('hidden');
        step3Container.classList.add('hidden');

        if (step === 1) {
            step1Container.classList.remove('hidden');
            stepIndicator.textContent = 'Paso 1 de 3: Datos Personales';
            stepPercentage.textContent = '33% Completado';
            progressBar.style.width = '33%';
        } else if (step === 2) {
            step2Container.classList.remove('hidden');
            stepIndicator.textContent = 'Paso 2 de 3: Detalle del Reclamo';
            stepPercentage.textContent = '66% Completado';
            progressBar.style.width = '66%';
        } else if (step === 3) {
            step3Container.classList.remove('hidden');
            stepIndicator.textContent = 'Paso 3 de 3: Flujo de Resolución IA';
            stepPercentage.textContent = '100% Completado';
            progressBar.style.width = '100%';
        }
    }

    // Ejecutar IA
    async function triggerAIWorkflow() {
        aiLoading.classList.remove('hidden');
        aiOutputContent.innerHTML = '';

        try {
            const resultHTML = await generateResolutionFlow(state.client, state.request, state.apiKey);
            aiLoading.classList.add('hidden');
            
            aiOutputContent.innerHTML = `
                <div class="bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 leading-relaxed space-y-2">
                    <div class="flex items-center space-x-2 text-indigo-400 font-semibold pb-2 border-b border-slate-800">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span>Plan Recomendado para el Asesor</span>
                    </div>
                    <div>${resultHTML.replace(/\n/g, '<br>')}</div>
                </div>
            `;
        } catch (error) {
            aiLoading.classList.add('hidden');
            aiOutputContent.innerHTML = `
                <div class="bg-red-950/50 border border-red-800 rounded-xl p-4 text-sm text-red-300">
                    <strong>Error al procesar la IA:</strong> ${error.message}
                    <p class="mt-2 text-xs text-red-400">Verifica tu API Key en el menú superior ('Config API') o intenta nuevamente.</p>
                </div>
            `;
        }
    }
});
