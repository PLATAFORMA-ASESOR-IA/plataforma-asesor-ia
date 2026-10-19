class App {
  constructor() {
    this.state = {
      currentScreen: 1,
      client: {
        name: '',
        dni: '',
        phone: '',
        email: ''
      },
      currentCategory: null,
      currentOrderId: null
    };
    this.init();
  }

  init() {
    this.updateScreen();
  }

  goToScreen(screenNumber) {
    this.state.currentScreen = screenNumber;
    this.updateScreen();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateScreen() {
    const screens = [
      'screen-1', 'screen-2', 'screen-3',
      'flow-app-issues', 'flow-payments', 'flow-transfers'
    ];
    
    screens.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });

    const progressContainer = document.getElementById('progress-container');

    if (this.state.currentScreen === 1) {
      document.getElementById('screen-1').classList.remove('hidden');
      progressContainer.classList.add('hidden');
    } else if (this.state.currentScreen === 2) {
      document.getElementById('screen-2').classList.remove('hidden');
      this.updateProgress(1, 3, 'Paso 2 de 3: Datos Personales', '33%');
    } else if (this.state.currentScreen === 3) {
      document.getElementById('screen-3').classList.remove('hidden');
      this.updateProgress(2, 3, 'Paso 3 de 3: Selección de Categoría', '66%');
    }
  }

  updateProgress(current, total, labelText, percentText) {
    const progressContainer = document.getElementById('progress-container');
    progressContainer.classList.remove('hidden');
    
    document.getElementById('step-label').innerText = labelText;
    document.getElementById('step-percent').innerText = percentText;
    
    const percentage = (current / total) * 100;
    document.getElementById('progress-bar').style.width = `${percentage}%`;
  }

  handleClientSubmit(e) {
    e.preventDefault();
    this.state.client = {
      name: document.getElementById('client-name').value,
      dni: document.getElementById('client-dni').value,
      phone: document.getElementById('client-phone').value,
      email: document.getElementById('client-email').value
    };

    this.goToScreen(3);
  }

  selectCategory(category) {
    this.state.currentCategory = category;
    
    document.getElementById('screen-3').classList.add('hidden');
    document.getElementById('progress-container').classList.add('hidden');

    if (category === 'app_issues') {
      document.getElementById('flow-app-issues').classList.remove('hidden');
    } else if (category === 'payments') {
      document.getElementById('flow-payments').classList.remove('hidden');
    } else if (category === 'transfers') {
      document.getElementById('flow-transfers').classList.remove('hidden');
    }
  }

  // --- FLUJO A: PROBLEMAS CON LA APP ---
  nextAppStep(step) {
    if (step === 2) {
      document.getElementById('app-step-1').classList.add('opacity-75');
      
      const step2 = document.getElementById('app-step-2');
      step2.classList.remove('opacity-60', 'pointer-events-none');
      
      const badge2 = document.getElementById('badge-step-2');
      badge2.classList.remove('bg-slate-300', 'text-slate-700');
      badge2.classList.add('bg-nxOrange-500', 'text-white');
      
      const btnBackup = document.getElementById('btn-backup');
      btnBackup.disabled = false;
      btnBackup.classList.remove('bg-slate-300', 'text-slate-500', 'cursor-not-allowed');
      btnBackup.classList.add('bg-nxOrange-500', 'text-white', 'hover:bg-nxOrange-600', 'shadow-sm');
    } else if (step === 3) {
      document.getElementById('app-step-2').classList.add('opacity-75');
      document.getElementById('app-step-1').classList.add('hidden');
      document.getElementById('app-step-2').classList.add('hidden');
      document.getElementById('app-step-3').classList.remove('hidden');
    }
  }

  // --- FLUJO B: PAGOS / RESUMEN ---
  generatePaymentOrder() {
    const amount = document.getElementById('pay-amount').value;
    const paymentType = document.getElementById('pay-type').value;

    if (!amount || amount <= 0) {
      alert('Por favor, ingresa un monto válido a abonar.');
      return;
    }

    const orderId = '#NX-' + Math.floor(1000 + Math.random() * 9000);
    this.state.currentOrderId = orderId;

    const newRequest = {
      id: orderId,
      name: this.state.client.name || 'Cliente Web',
      dni: this.state.client.dni || 'S/D',
      phone: this.state.client.phone || 'S/D',
      email: this.state.client.email || 'S/D',
      category: 'payments',
      amount: amount,
      paymentType: paymentType,
      paymentUrl: '',
      status: 'Pendiente de Link',
      createdAt: new Date().toISOString()
    };

    let requests = JSON.parse(localStorage.getItem('nx_platform_requests') || '[]');
    requests.unshift(newRequest);
    localStorage.setItem('nx_platform_requests', JSON.stringify(requests));

    document.getElementById('display-order-id').innerText = orderId;
    const waMessage = encodeURIComponent(`Hola, solicito el link de pago Naranja X para el pedido ${orderId} por un monto de $${amount} (${paymentType}).`);
    document.getElementById('whatsapp-btn').href = `https://wa.me/5491100000000?text=${waMessage}`;

    document.getElementById('pay-form-view').classList.add('hidden');
    document.getElementById('pay-waiting-view').classList.remove('hidden');
  }

  checkPaymentStatus() {
    const requests = JSON.parse(localStorage.getItem('nx_platform_requests') || '[]');
    const currentReq = requests.find(r => r.id === this.state.currentOrderId);

    if (currentReq && currentReq.paymentUrl && currentReq.paymentUrl.trim() !== '') {
      alert('¡El Tesorero ha asignado tu enlace de pago! Redirigiendo a Naranja X...');
      window.location.href = currentReq.paymentUrl;
    } else {
      alert('El link de pago aún no ha sido cargado en el sistema de Tesorería. Si ya enviaste el mensaje por WhatsApp, reintenta en unos instantes.');
    }
  }

  // --- FLUJO C: TRANSFERENCIAS / COMPRAS ---
  submitClaim() {
    const amount = document.getElementById('claim-amount').value;

    if (!amount || amount <= 0) {
      alert('Por favor, ingresa un monto válido para el reclamo.');
      return;
    }

    const orderId = '#TR-' + Math.floor(1000 + Math.random() * 9000);

    const newClaim = {
      id: orderId,
      name: this.state.client.name || 'Cliente Web',
      dni: this.state.client.dni || 'S/D',
      phone: this.state.client.phone || 'S/D',
      email: this.state.client.email || 'S/D',
      category: 'transfers',
      amount: amount,
      paymentType: 'Reclamo de Saldo',
      paymentUrl: '',
      status: 'En Auditoría Tesorería',
      createdAt: new Date().toISOString()
    };

    let requests = JSON.parse(localStorage.getItem('nx_platform_requests') || '[]');
    requests.unshift(newClaim);
    localStorage.setItem('nx_platform_requests', JSON.stringify(requests));

    document.getElementById('claim-form-view').classList.add('hidden');
    document.getElementById('claim-success-view').classList.remove('hidden');
  }

  resetApp() {
    window.location.reload();
  }
}

const app = new App();
