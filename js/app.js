import { generateResolutionFlow } from './aiService.js';

const state = {
    currentStep: 1,
    client: { name: '', email: '', phone: '' },
    request: { type: 'reclamo', description: '' },
    apiKey: localStorage.getItem('gemini_api_key') || ''
};

document.addEventListener('DOMContentLoaded', () => {
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

    if (btnConfig) btnConfig.addEventListener('click', () => modalConfig.classList.remove('hidden'));
    if (btnCloseModal) btnCloseModal.addEventListener('click', () => modalConfig.classList.add('hidden'));
    if (btnSaveKey) {
        btnSaveKey.addEventListener('click', () => {
            state.apiKey = inputApiKey.value.trim();
            localStorage.setItem('gemini_api_key', state.apiKey);
            modalConfig.classList.add('hidden');
            alert('API Key guardada correctamente.');
        });
    }

    if (formStep1) {
        formStep1.addEventListener('submit', (e) => {
            e.preventDefault();
            state.client.name = document.getElementById('client-name').value;
            state.client.email = document.getElementById('client-email').value;
            state.client.phone = document.getElementById('client-phone').value;
            goToStep(2);
        });
    }

    if (formStep2) {
        formStep2.addEventListener('submit', async (e) => {
            e.preventDefault();
            state.request.type = document.getElementById('request-type').value;
            state.request.description = document.getElementById('request-description').value;
            goToStep(3);
            await triggerAIWorkflow();
        });
    }

    if (btnBack1) btnBack1.addEventListener('click', () => goToStep(1));
    if (btnBack2) btnBack2.addEventListener('click', () => goToStep(2));
    if (btnRegenerate) btnRegenerate.addEventListener('click', async () => await triggerAIWorkflow());

    if (btnFinish) {
        btnFinish.addEventListener('click', () => {
            alert('Sesión registrada y guardada con éxito.');
            location.reload();
        });
    }

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
                    <p class="mt-2 text-xs text-red-400">Verifica tu API Key en el menú superior o intenta nuevamente.</p>
                </div>
            `;
        }
    }
});
