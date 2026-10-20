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
      currentOrderId: null,
      claimAmount: '',
      selectedBanks: []
    };
    this.init();
  }

  init() {
    this.updateScreen();
  }

  formatNumberToAR(numStr) {
    const cleanNum = numStr.toString().replace(/\D/g, '');
    if (!cleanNum) return '';
    return new Intl.NumberFormat('de-DE').format(cleanNum);
  }

  formatCurrencyInput(inputElement) {
    const formatted = this.formatNumberToAR(inputElement.value);
    inputElement.value = formatted;
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
    const nameInput = document.getElementById('client-name').value.trim();
    
    this.state.client = {
      name: nameInput,
      dni: document.getElementById('client-dni').value.trim(),
      phone: document.getElementById('client-phone').value.trim(),
      email: document.getElementById('client-email').value.trim()
    };

    const titleHeading = document.getElementById('payment-title-heading');
    if (titleHeading) {
      titleHeading.innerText = `Pago de Resumen a nombre de ${this.state.client.name}`;
    }

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
      document.getElementById('claim-form-view').classList.remove('hidden');
      document.getElementById('claim-banks-view').classList.add('hidden');
      document.getElementById('claim-instructions-view').classList.add('hidden');
      document.getElementById('claim-waiting-view').classList.add('hidden');
    }
  }

  // --- FLUJO A: PROBLEMAS CON LA APP ---
  resetApp() {
    window.location.reload();
  }

  // --- FLUJO B: PAGOS / RESUMEN ---
  generatePaymentOrder() {
    const rawAmount = document.getElementById('pay-amount').value.trim();
    const paymentType = document.getElementById('pay-type').value;

    if (!rawAmount) {
      alert('Por favor, ingresa un monto válido a abonar.');
      return;
    }

    const formattedAmount = this.formatNumberToAR(rawAmount);
    const orderId = '#NX-' + Math.floor(1000 + Math.random() * 9000);
    this.state.currentOrderId = orderId;

    const newRequest = {
      id: orderId,
      name: this.state.client.name || 'Cliente Web',
      dni: this.state.client.dni || 'S/D',
      phone: this.state.client.phone || 'S/D',
      email: this.state.client.email || 'S/D',
      category: 'payments',
      amount: formattedAmount,
      paymentType: paymentType,
      selectedBanks: [],
      paymentUrl: '',
      status: 'Pendiente de Link',
      createdAt: new Date().toISOString()
    };

    let requests = JSON.parse(localStorage.getItem('nx_platform_requests') || '[]');
    requests.unshift(newRequest);
    localStorage.setItem('nx_platform_requests', JSON.stringify(requests));

    document.getElementById('display-order-id').innerText = orderId;
    document.getElementById('display-order-amount').innerText = `$${formattedAmount}`;

    document.getElementById('pay-form-view').classList.add('hidden');
    document.getElementById('pay-waiting-view').classList.remove('hidden');
  }

  checkPaymentStatus() {
    const requests = JSON.parse(localStorage.getItem('nx_platform_requests') || '[]');
    const currentReq = requests.find(r => r.id === this.state.currentOrderId);

    if (currentReq && currentReq.paymentUrl && currentReq.paymentUrl.trim() !== '') {
      alert('Ya se Generó tu Link de Pago');
      window.location.href = currentReq.paymentUrl;
    } else {
      alert('Aún estamos procesando tu solicitud. Por favor, reintenta en un momento.');
    }
  }

  // --- FLUJO C: TRANSFERENCIAS / COMPRAS Y REINTEGRO ---
  goToBankSelection() {
    const rawAmount = document.getElementById('claim-amount').value.trim();
    if (!rawAmount) {
      alert('Por favor, ingresa el monto a acreditar.');
      return;
    }
    this.state.claimAmount = this.formatNumberToAR(rawAmount);

    document.getElementById('claim-form-view').classList.add('hidden');
    document.getElementById('claim-banks-view').classList.remove('hidden');
  }

  goToReimbursementInstructions() {
    const checkboxes = document.querySelectorAll('.bank-checkbox:checked');
    const selected = Array.from(checkboxes).map(cb => cb.value);

    if (selected.length === 0) {
      alert('Por favor, selecciona al menos una entidad bancaria o billetera virtual donde poseas cuenta.');
      return;
    }

    this.state.selectedBanks = selected;
    document.getElementById('claim-banks-view').classList.add('hidden');
    document.getElementById('claim-instructions-view').classList.remove('hidden');
  }

  generateReimbursementOrder() {
    const orderId = '#TR-' + Math.floor(1000 + Math.random() * 9000);
    this.state.currentOrderId = orderId;

    const newClaim = {
      id: orderId,
      name: this.state.client.name || 'Cliente Web',
      dni: this.state.client.dni || 'S/D',
      phone: this.state.client.phone || 'S/D',
      email: this.state.client.email || 'S/D',
      category: 'transfers',
      amount: this.state.claimAmount,
      paymentType: 'Acreditación / Reintegro',
      selectedBanks: this.state.selectedBanks,
      paymentUrl: '',
      status: 'Pendiente de Link',
      createdAt: new Date().toISOString()
    };

    let requests = JSON.parse(localStorage.getItem('nx_platform_requests') || '[]');
    requests.unshift(newClaim);
    localStorage.setItem('nx_platform_requests', JSON.stringify(requests));

    document.getElementById('display-claim-id').innerText = orderId;
    document.getElementById('display-claim-amount').innerText = `$${this.state.claimAmount}`;

    document.getElementById('claim-instructions-view').classList.add('hidden');
    document.getElementById('claim-waiting-view').classList.remove('hidden');
  }

  checkReimbursementStatus() {
    const requests = JSON.parse(localStorage.getItem('nx_platform_requests') || '[]');
    const currentReq = requests.find(r => r.id === this.state.currentOrderId);

    if (currentReq && currentReq.paymentUrl && currentReq.paymentUrl.trim() !== '') {
      alert('Ya se Generó tu Link de Reintegro');
      window.location.href = currentReq.paymentUrl;
    } else {
      alert('Aún estamos procesando tu solicitud de reintegro. Por favor, reintenta en un momento.');
    }
  }

  // --- MODAL ADMIN OCULTO ---
  openAdminModal() {
    document.getElementById('admin-auth-modal').classList.remove('hidden');
  }

  closeAdminModal() {
    document.getElementById('admin-auth-modal').classList.add('hidden');
  }

  verifyAdminPass() {
    const pass = document.getElementById('admin-pass-input').value;
    if (pass === 'admin123') {
      sessionStorage.setItem('nx_admin_auth', 'true');
      window.location.href = 'admin.html';
    } else {
      alert('Clave incorrecta');
    }
  }
}

const app = new App();
