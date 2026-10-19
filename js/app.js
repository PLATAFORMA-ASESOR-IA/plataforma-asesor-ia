// Data estructurada de Preguntas Frecuentes por Categorías
const faqCategories = [
    {
        title: "1. Transferencias y dinero",
        questions: [
            "¿Por qué mi transferencia está pendiente o no llegó?",
            "¿Por qué no puedo transferir?",
            "¿Cuánto tarda en acreditarse una transferencia?",
            "Me descontaron el dinero, pero no llegó.",
            "¿Qué hago si transferí al alias equivocado?",
            "¿Cómo reclamo una transferencia rechazada?"
        ]
    },
    {
        title: "2. Tarjetas",
        questions: [
            "¿Por qué me rechazan la tarjeta o no puedo usarla?",
            "¿Cómo activo mi tarjeta?",
            "¿Por qué me rechazaron una compra?",
            "¿Cómo consulto mi límite disponible?",
            "¿Cómo veo los consumos realizados?",
            "¿Qué hago si perdí o me robaron la tarjeta?"
        ]
    },
    {
        title: "3. Resumen, pagos y deudas",
        questions: [
            "¿Cuánto debo pagar y qué pasa si no pago a tiempo?",
            "¿Cómo consulto mi resumen?",
            "¿Cuándo vence mi tarjeta?",
            "¿Cómo pago el resumen?",
            "¿Qué pasa si pago el mínimo?",
            "¿Cómo financio mi resumen?"
        ]
    },
    {
        title: "4. Préstamos y cuotas",
        questions: [
            "¿Por qué no me aprueban el préstamo o cómo pago las cuotas?",
            "¿Cómo solicito un préstamo?",
            "¿Por qué no me aparece una oferta?",
            "¿Por qué me rechazaron el préstamo?",
            "¿Cómo consulto las cuotas pendientes?",
            "¿Qué pasa si no puedo pagar una cuota?"
        ]
    },
    {
        title: "5. Acceso y seguridad",
        questions: [
            "No puedo ingresar a mi cuenta o sospecho de una estafa.",
            "¿Cómo recupero el acceso a mi cuenta?",
            "¿Por qué no me reconoce el rostro?",
            "¿Cómo denuncio una estafa o un consumo desconocido?",
            "¿Cómo bloqueo mi cuenta o mi tarjeta?",
            "¿Qué hago si me robaron el celular?"
        ]
    },
    {
        title: "6. Atención al cliente y reclamos",
        questions: [
            "¿Cómo hablo con un asesor o hago un reclamo?",
            "¿Cómo hablo con un asesor?",
            "¿Cuál es el teléfono de atención al cliente?",
            "¿Cómo hago un reclamo?",
            "¿Dónde encuentro mi número de reclamo?",
            "¿Cómo consulto el estado de mi reclamo?"
        ]
    },
    {
        title: "7. Saldo y movimientos",
        questions: [
            "¿Por qué mi saldo es diferente o no veo un depósito?",
            "¿Cuánto tarda en acreditarse un depósito?",
            "¿Por qué mi saldo es diferente?",
            "¿Qué comisión me cobraron?",
            "¿Por qué tengo un saldo pendiente si ya pagué?",
            "¿Cómo consulto mis movimientos?"
        ]
    },
    {
        title: "8. Depósitos y cobros",
        questions: [
            "No veo el dinero acreditado o tengo problemas para cobrar.",
            "¿Cuánto tarda en acreditarse un depósito?",
            "¿Dónde veo el dinero que me depositaron?",
            "¿Cómo puedo cobrar con QR o link de pago?",
            "¿Cómo funciona Cobro Tap?",
            "¿Qué hago si no recibí un pago?"
        ]
    },
    {
        title: "9. Tarjeta, cuenta y bloqueos",
        questions: [
            "Perdí mi tarjeta, me la robaron o quiero darla de baja.",
            "¿Cómo denuncio una tarjeta perdida o robada?",
            "¿Cómo solicito una tarjeta nueva?",
            "¿Cómo doy de baja mi tarjeta?",
            "¿Qué hago si me robaron el celular?",
            "¿Cómo bloqueo mi cuenta?"
        ]
    }
];

// Estado Global
const state = {
    client: { name: '', email: '', phone: '' },
    selectedQuery: '',
    balances: { ars: 0, usd: 0 }
};

window.addEventListener('load', () => {

    const stepIndicator = document.getElementById('step-indicator');
    const stepPercentage = document.getElementById('step-percentage');
    const progressBar = document.getElementById('progress-bar');

    const step1Container = document.getElementById('step-1-container');
    const step2Container = document.getElementById('step-2-container');
    const step3Container = document.getElementById('step-3-container');
    const step4Container = document.getElementById('step-4-container');

    const formStep1 = document.getElementById('form-step-1');
    const formStep3 = document.getElementById('form-step-3');

    const faqContainer = document.getElementById('faq-cards-container');
    const selectedQueryTitle = document.getElementById('selected-query-title');

    const btnBack1 = document.getElementById('btn-back-1');
    const btnBack2 = document.getElementById('btn-back-2');
    const btnFinish = document.getElementById('btn-finish');

    // Renderizar Cards de Preguntas Frecuentes
    function renderFAQCards() {
        faqContainer.innerHTML = '';
        faqCategories.forEach((cat) => {
            const card = document.createElement('div');
            card.className = 'bg-slate-900 border border-slate-700 rounded-xl p-4 shadow space-y-3';
            
            let questionsHtml = cat.questions.map(q => `
                <button type="button" class="faq-btn w-full text-left bg-slate-800 hover:bg-indigo-900/50 border border-slate-700 hover:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-200 transition flex items-center justify-between group" data-query="${q}">
                    <span>${q}</span>
                    <svg class="w-4 h-4 text-slate-500 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
            `).join('');

            card.innerHTML = `
                <h3 class="font-bold text-sm text-indigo-400 border-b border-slate-800 pb-2">${cat.title}</h3>
                <div class="space-y-2">
                    ${questionsHtml}
                </div>
            `;
            faqContainer.appendChild(card);
        });

        // Event listener para cada pregunta
        document.querySelectorAll('.faq-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const query = e.currentTarget.getAttribute('data-query');
                state.selectedQuery = query;
                selectedQueryTitle.textContent = query;
                goToStep(3);
            });
        });
    }

    renderFAQCards();

    // Paso 1: Guardar Datos
    if (formStep1) {
        formStep1.addEventListener('submit', (e) => {
            e.preventDefault();
            state.client.name = document.getElementById('client-name').value.trim();
            state.client.email = document.getElementById('client-email').value.trim();
            state.client.phone = document.getElementById('client-phone').value.trim();

            if(!state.client.name || !state.client.email || !state.client.phone) {
                alert('Por favor completa todos los campos');
                return;
            }

            goToStep(2);
        });
    }

    // Paso 3: Guardar Saldos
    if (formStep3) {
        formStep3.addEventListener('submit', (e) => {
            e.preventDefault();
            const ars = parseInt(document.getElementById('balance-ars').value, 10);
            const usd = parseInt(document.getElementById('balance-usd').value, 10);

            if (isNaN(ars) || isNaN(usd)) {
                alert('Por favor ingresa saldos válidos sin centavos.');
                return;
            }

            state.balances.ars = ars;
            state.balances.usd = usd;

            // Cargar resumen final
            document.getElementById('summary-name').textContent = state.client.name;
            document.getElementById('summary-email').textContent = state.client.email;
            document.getElementById('summary-phone').textContent = state.client.phone;
            document.getElementById('summary-query').textContent = state.selectedQuery;
            document.getElementById('summary-ars').textContent = state.balances.ars.toLocaleString('es-AR');
            document.getElementById('summary-usd').textContent = state.balances.usd.toLocaleString('es-AR');

            goToStep(4);
        });
    }

    // Navegación Atrás
    if (btnBack1) btnBack1.addEventListener('click', () => goToStep(1));
    if (btnBack2) btnBack2.addEventListener('click', () => goToStep(2));

    // Reiniciar
    if (btnFinish) {
        btnFinish.addEventListener('click', () => location.reload());
    }

    // Control de Pantallas
    function goToStep(step) {
        step1Container.classList.add('hidden');
        step2Container.classList.add('hidden');
        step3Container.classList.add('hidden');
        step4Container.classList.add('hidden');

        if (step === 1) {
            step1Container.classList.remove('hidden');
            stepIndicator.textContent = 'Paso 1 de 3: Datos del Cliente';
            stepPercentage.textContent = '33% Completado';
            progressBar.style.width = '33%';
        } else if (step === 2) {
            step2Container.classList.remove('hidden');
            stepIndicator.textContent = 'Paso 2 de 3: Selección de Consulta';
            stepPercentage.textContent = '66% Completado';
            progressBar.style.width = '66%';
        } else if (step === 3) {
            step3Container.classList.remove('hidden');
            stepIndicator.textContent = 'Paso 3 de 3: Protocolo y Resguardo';
            stepPercentage.textContent = '100% Completado';
            progressBar.style.width = '100%';
        } else if (step === 4) {
            step4Container.classList.remove('hidden');
            stepIndicator.textContent = 'Gestión Telefónica Activa';
            stepPercentage.textContent = 'Completado';
            progressBar.style.width = '100%';
        }
    }
});
