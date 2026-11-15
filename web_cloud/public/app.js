
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.copyToClipboard = function(text, successMsg) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg || 'Copié dans le presse-papiers !');
    }).catch(() => {
      showToast('Empreinte : ' + text.substring(0, 16) + '...');
    });
  } else {
    showToast('Empreinte : ' + text.substring(0, 16) + '...');
  }
};

function renderQrCode() {
  const qrContainer = document.getElementById('qrCodeContainer');
  if (!qrContainer) return;
  const ip = (state.serverInfo && state.serverInfo.primaryIp) || '192.168.1.100';
  const port = (state.serverInfo && state.serverInfo.port) || 3500;
  const fullUrl = 'http://' + ip + ':' + port;
  if (window.generateQRCodeSVG) {
    qrContainer.innerHTML = window.generateQRCodeSVG(fullUrl, 210);
  }
  const syncIp = document.getElementById('syncIpAddressDisplay');
  if (syncIp) syncIp.textContent = fullUrl;
}

function updateLiveDrawerPill() {
  const todayStr = new Date().toISOString().split('T')[0];
  let cashSales = 0;
  state.sales.forEach(s => {
    const sDate = s.timestamp ? s.timestamp.split('T')[0] : '';
    if (sDate === todayStr && s.paymentMethod === 'cash') {
      cashSales += (s.totalAmount || 0);
    }
  });
  let expenses = 0;
  state.expenses.forEach(e => {
    const eDate = e.timestamp ? e.timestamp.split('T')[0] : '';
    if (eDate === todayStr) {
      expenses += (e.amount || 0);
    }
  });
  const drawerCash = Math.max(0, cashSales - expenses);
  const pill = document.getElementById('topbarCashAmount');
  if (pill) pill.textContent = formatFcfa(drawerCash);

  // Update sidebar credits badge
  const pendingCreditsCount = state.credits.filter(c => c.status === 'en_cours').length;
  const credBadge = document.getElementById('sidebarCreditsCount');
  if (credBadge) {
    credBadge.textContent = pendingCreditsCount > 0 ? `${pendingCreditsCount} impayé(s)` : 'À jour';
  }
}

/**
 * BURKINA SECRÉTARIAT & LIBRAIRIE POS - APPLICATION LOGIC
 * Standard: Professional Retail POS & Management (Ouagadougou)
 */

// ==========================================================================
// 1. UTILITAIRE : CONVERSION NOMBRES EN LETTRES (FRANÇAIS)
// ==========================================================================
function numberToFrenchWords(num) {
  num = Math.floor(Math.abs(Number(num) || 0));
  if (num === 0) return "zéro";

  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
  const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingts", "quatre-vingt-dix"];

  function convertTens(n) {
    if (n < 10) return units[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    const tenDigit = Math.floor(n / 10);
    const unitDigit = n % 10;

    if (tenDigit === 7) {
      if (unitDigit === 1) return "soixante-et-onze";
      return "soixante-" + teens[unitDigit];
    }
    if (tenDigit === 8) {
      if (unitDigit === 0) return "quatre-vingts";
      return "quatre-vingt-" + units[unitDigit];
    }
    if (tenDigit === 9) {
      return "quatre-vingt-" + teens[unitDigit];
    }

    if (unitDigit === 1) return tens[tenDigit] + "-et-un";
    if (unitDigit > 1) return tens[tenDigit] + "-" + units[unitDigit];
    return tens[tenDigit];
  }

  function convertHundreds(n) {
    let str = "";
    const h = Math.floor(n / 100);
    const rest = n % 100;

    if (h > 0) {
      if (h === 1) {
        str += "cent";
      } else {
        str += units[h] + " cent";
        if (rest === 0) str += "s";
      }
    }

    if (rest > 0) {
      if (str.length > 0) str += " ";
      str += convertTens(rest);
    }
    return str;
  }

  let result = "";

  const millions = Math.floor(num / 1000000);
  const remainderMillions = num % 1000000;
  if (millions > 0) {
    if (millions === 1) {
      result += "un million";
    } else {
      result += convertHundreds(millions) + " millions";
    }
  }

  const thousands = Math.floor(remainderMillions / 1000);
  const remainderThousands = remainderMillions % 1000;
  if (thousands > 0) {
    if (result.length > 0) result += " ";
    if (thousands === 1) {
      result += "mille";
    } else {
      result += convertHundreds(thousands) + " mille";
    }
  }

  if (remainderThousands > 0) {
    if (result.length > 0) result += " ";
    result += convertHundreds(remainderThousands);
  }

  return result.trim();
}

function formatAmountWordsFcfa(amount) {
  const words = numberToFrenchWords(amount);
  const capitalized = words.charAt(0).toUpperCase() + words.slice(1);
  return `${capitalized} (${formatFcfa(amount)})`;
}

function formatFcfa(amount) {
  return (Number(amount) || 0).toLocaleString('fr-FR') + ' FCFA';
}

// Clean inline SVG vectors for stationery and office items (Zero childish emojis)
const SVG_ICONS = {
  pen: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>`,
  book: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/></svg>`,
  file: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  folder: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`,
  copy: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
  printer: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>`,
  keyboard: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M6 12h.01"/><path d="M10 12h.01"/><path d="M14 12h.01"/><path d="M18 12h.01"/><path d="M7 16h10"/></svg>`,
  shield: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>`,
  layers: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>`,
  paperclip: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`
};

// ==========================================================================
// 2. ÉTAT GLOBAL DE L'APPLICATION
// ==========================================================================
const state = {
  settings: {},
  users: [],
  currentUser: null,
  customers: [],
  suppliers: [],
  supplierDebts: [],
  articles: [],
  cart: [],
  sales: [],
  expenses: [],
  credits: [],
  invoices: [],
  dailyCloses: [],
  auditLogs: [],
  selectedInvoice: null,
  activeCategory: 'all',
  activeExpenseFilter: 'today',
  isDelestageMode: false,
  offlineBuffer: []
};

// ==========================================================================
// 3. INITIALISATION & CHARGEMENT
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  const safeInit = (name, fn) => {
    try {
      fn();
    } catch (err) {
      console.warn(`[Init] Warning initializing ${name}:`, err);
    }
  };

  safeInit('initClock', initClock);
  safeInit('initSoundUi', () => { if (window.initSoundUi) window.initSoundUi(); });
  safeInit('setupNavigation', setupNavigation);
  safeInit('setupModals', setupModals);
  safeInit('setupUserSwitch', setupUserSwitch);
  safeInit('setupDashboard', setupDashboard);
  safeInit('setupPosListeners', setupPosListeners);
  safeInit('setupCustomerAutocomplete', setupCustomerAutocomplete);
  safeInit('setupPartnersListeners', setupPartnersListeners);
  safeInit('setupInvoicePreviewListeners', setupInvoicePreviewListeners);
  safeInit('setupInvoiceTemplates', setupInvoiceTemplates);
  safeInit('setupStockListeners', setupStockListeners);
  safeInit('setupExpensesListeners', setupExpensesListeners);
  safeInit('setupCloseDayListeners', setupCloseDayListeners);
  safeInit('setupAuditListeners', setupAuditListeners);
  safeInit('setupSyncListeners', setupSyncListeners);
  safeInit('setupSettingsListeners', setupSettingsListeners);

  await loadInitialData();
});

function initClock() {
  const clockEl = document.getElementById('currentClock');
  const update = () => {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('fr-FR');
  };
  update();
  setInterval(update, 1000);
}

async function loadInitialData() {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error('Erreur de chargement');
    const data = await res.json();

    state.settings = data.settings || {};
    state.users = data.users || [];
    state.customers = data.customers || [];
    state.suppliers = data.suppliers || [];
    state.supplierDebts = data.supplierDebts || [];
    state.articles = data.articles || [];
    state.sales = data.sales || [];
    state.expenses = data.expenses || [];
    state.credits = data.credits || [];
    state.invoices = data.invoices || [];
    state.dailyCloses = data.dailyCloses || [];
    state.auditLogs = data.auditLogs || [];

    if (!state.currentUser && state.users.length > 0) {
      state.currentUser = state.users[0];
    }

    if (data.serverInfo && data.serverInfo.primaryIp) {
      const ipEl = document.getElementById('localNetworkIp') || document.getElementById('syncIpAddressDisplay'); if (ipEl) ipEl.textContent = `${data.serverInfo.primaryIp}:${data.serverInfo.port || 3500}`;
    }

    renderAll(); renderQrCode(); updateLiveDrawerPill();
  } catch (err) {
    console.warn('Mode fallback local:', err);
    showToast('Fonctionnement sur base locale intégrée');
  }
}

function renderAll() {
  renderShopInfo();
  renderUserSelect();
  renderPosCatalog();
  renderCart();
  renderDashboard();
  renderCreditsTable();
  renderCustomersDirectory();
  renderSupplierDebtsTable();
  renderSuppliersDirectory();
  renderStockTable();
  renderExpensesTable();
  renderCloseDaySummary();
  renderDailyClosesArchive();
  renderAuditLogs();
  renderInvoicesList();
  renderCurrentInvoice();
  renderUsersTable();
}

// ==========================================================================
// 4. NAVIGATION & MULTI-UTILISATEURS
// ==========================================================================
function setupNavigation() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      if (window.playUiSound) window.playUiSound('nav');
      switchTab(tab.dataset.tab);
    });
  });

  document.querySelectorAll('.sub-tab').forEach(stab => {
    stab.addEventListener('click', () => {
      if (window.playUiSound) window.playUiSound('nav');
      document.querySelectorAll('.sub-tab').forEach(st => st.classList.remove('active'));
      document.querySelectorAll('.subtab-pane').forEach(sp => sp.classList.remove('active'));
      stab.classList.add('active');
      const targetPane = document.getElementById(stab.dataset.subtab);
      if (targetPane) targetPane.classList.add('active');
    });
  });
}

const VIEW_METADATA = {
  'tab-pos': { title: 'Caisse Express', breadcrumb: 'Comptoir de vente • Terminal #01' },
  'tab-invoices': { title: 'Factures & Devis A4 Pro', breadcrumb: 'Édition, Mentions légales & Impression' },
  'tab-partners': { title: 'Clients & Fournisseurs', breadcrumb: 'Carnets de crédits, clients réguliers & fiches fournisseurs' },
  'tab-stock': { title: 'Stocks & Approvisionnements', breadcrumb: 'Inventaire, cartons Rood-Woko & marges' },
  'tab-expenses': { title: 'Dépenses de Caisse', breadcrumb: 'Sorties de caisse, recharges Sonabel & entretien' },
  'tab-close': { title: 'Bilan & Clôture du Soir', breadcrumb: 'Pointage physique des espèces & arrêté de caisse' },
  'tab-dashboard': { title: 'Tableau de Bord', breadcrumb: 'Statistiques financières & volume d\'activité' },
  'tab-audit': { title: 'Journal d\'Audit Immuable', breadcrumb: 'Chaîne cryptographique SHA-256 inviolable' },
  'tab-sync': { title: 'Synchro Mobile (Délestage)', breadcrumb: 'Mode secours coupure de courant & Wi-Fi local' },
  'tab-settings': { title: 'Paramètres & Logo', breadcrumb: 'Configuration boutique, fiscalité IFU/RCCM & accès' }
};

window.switchTab = function(targetId) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

  const tabBtn = document.querySelector(`.nav-tab[data-tab="${targetId}"]`);
  if (tabBtn) tabBtn.classList.add('active');

  const targetPane = document.getElementById(targetId);
  if (targetPane) targetPane.classList.add('active');

  const meta = VIEW_METADATA[targetId] || { title: 'Application', breadcrumb: 'Ouagadougou' };
  const titleEl = document.getElementById('currentViewTitle');
  if (titleEl) titleEl.textContent = meta.title;
  const breadEl = document.getElementById('currentViewBreadcrumb');
  if (breadEl) breadEl.textContent = meta.breadcrumb;

  if (targetId === 'tab-dashboard') renderDashboard();
  if (targetId === 'tab-close') renderCloseDaySummary();
  if (targetId === 'tab-stock') renderStockTable();
  if (targetId === 'tab-partners') {
    renderCreditsTable();
    renderCustomersDirectory();
    renderSupplierDebtsTable();
    renderSuppliersDirectory();
  }
  if (targetId === 'tab-invoices') renderCurrentInvoice();
  if (targetId === 'tab-audit') renderAuditLogs();
  if (targetId === 'tab-sync') renderQrCode();

  updateLiveDrawerPill();
};

function setupUserSwitch() {
  const userSelect = document.getElementById('userSelectDropdown');
  userSelect.addEventListener('change', () => {
    const selectedId = userSelect.value;
    const found = state.users.find(u => u.id === selectedId);
    if (found) {
      state.currentUser = found;
      updateUserRoleBadge();
      document.getElementById('cartCashierLabel').textContent = `Caissier(e) : ${found.name}`;
      showToast(`Connecté : ${found.name}`);
    }
  });
}

function renderUserSelect() {
  const userSelect = document.getElementById('userSelectDropdown');
  userSelect.innerHTML = '';

  state.users.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u.id;
    opt.textContent = `${u.name} (${u.role === 'gerant' ? 'Gérant' : 'Vendeur'})`;
    if (state.currentUser && state.currentUser.id === u.id) opt.selected = true;
    userSelect.appendChild(opt);
  });

  updateUserRoleBadge();
  if (state.currentUser) {
    document.getElementById('cartCashierLabel').textContent = `Caissier(e) : ${state.currentUser.name}`;
  }
}

function updateUserRoleBadge() {
  const badge = document.getElementById('currentUserRoleBadge');
  const nameDisplay = document.getElementById('operatorNameDisplay');
  const avatar = document.getElementById('operatorAvatar');
  if (state.currentUser) {
    if (badge) {
      badge.textContent = state.currentUser.role === 'gerant' ? 'GÉRANT' : 'VENDEUR';
      badge.style.color = state.currentUser.role === 'gerant' ? '#fbbf24' : '#34d399';
    }
    if (nameDisplay) {
      nameDisplay.textContent = state.currentUser.name;
    }
    if (avatar) {
      avatar.textContent = state.currentUser.name.charAt(0).toUpperCase();
    }
  }
}

// ==========================================================================
// 5. CAISSE EXPRESS (POS) & AUTOCOMPLÉTION CLIENT
// ==========================================================================
function setupPosListeners() {
  document.querySelectorAll('.category-pills .pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.category-pills .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.activeCategory = pill.dataset.cat;
      renderPosCatalog();
    });
  });

  const searchInput = document.getElementById('posSearchInput');
  searchInput.addEventListener('input', () => { renderPosCatalog(); });

  document.getElementById('btnClearCart').addEventListener('click', () => {
    if (state.cart.length === 0) return;
    if (confirm('Voulez-vous vider le panier en cours ?')) {
      state.cart = [];
      renderCart();
    }
  });

  document.querySelectorAll('input[name="payMethod"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (window.playUiSound) window.playUiSound('nav');
      document.querySelectorAll('.pay-method').forEach(m => m.classList.remove('selected'));
      e.target.closest('.pay-method').classList.add('selected');

      const isCash = e.target.value === 'cash';
      document.getElementById('cashCalculator').style.display = isCash ? 'block' : 'none';

      if (e.target.value === 'credit') {
        document.getElementById('cartCustomerName').focus();
        showToast('Sélectionnez ou renseignez le client pour ce crédit.');
      }
    });
  });

  const tenderedInput = document.getElementById('tenderedAmount');
  tenderedInput.addEventListener('input', calculateChange);

  document.querySelectorAll('.btn-money').forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.playUiSound) window.playUiSound('nav');
      tenderedInput.value = btn.dataset.val;
      calculateChange();
    });
  });

  document.getElementById('btnValidateSale').addEventListener('click', () => {
    processSaleCheckout(false);
  });

  document.getElementById('btnValidateAndInvoice').addEventListener('click', () => {
    processSaleCheckout(true);
  });

  document.getElementById('btnToggleDelestageMode').addEventListener('click', toggleDelestageMode);
}

// Autocomplete customer input in POS cart
function setupCustomerAutocomplete() {
  const input = document.getElementById('cartCustomerName');
  const dropdown = document.getElementById('customerSuggestionsList');

  input.addEventListener('input', () => {
    const query = input.value.toLowerCase().trim();
    if (!query) {
      dropdown.style.display = 'none';
      return;
    }

    const matches = state.customers.filter(c => 
      c.name.toLowerCase().includes(query) || (c.phone && c.phone.includes(query))
    );

    if (matches.length === 0) {
      dropdown.style.display = 'none';
      return;
    }

    dropdown.innerHTML = '';
    matches.slice(0, 5).forEach(c => {
      const div = document.createElement('div');
      div.className = 'autocomplete-item';
      const debtText = c.currentDebt > 0 ? `<span class="text-danger"> (Dette: ${formatFcfa(c.currentDebt)})</span>` : '';
      div.innerHTML = `<strong>${c.name}</strong> - ${c.phone || 'Sans tel'}${debtText}`;

      div.addEventListener('click', () => {
        selectCustomerForCheckout(c);
        dropdown.style.display = 'none';
      });

      dropdown.appendChild(div);
    });

    dropdown.style.display = 'block';
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.autocomplete-wrapper')) {
      dropdown.style.display = 'none';
    }
  });

  document.getElementById('btnQuickNewClientModal').addEventListener('click', () => {
    document.getElementById('formCustomer').reset();
    document.getElementById('modalCustomer').classList.add('active');
  });
}

function selectCustomerForCheckout(cust) {
  document.getElementById('cartCustomerName').value = cust.name;
  document.getElementById('cartCustomerPhone').value = cust.phone || '';
  document.getElementById('cartCustomerCompany').value = cust.company || '';

  const detailsBox = document.getElementById('customerLinkedDetails');
  detailsBox.style.display = 'flex';
  document.getElementById('linkedCustPhone').textContent = `Tél: ${cust.phone || '—'}`;
  document.getElementById('linkedCustDebt').textContent = cust.currentDebt > 0 ? `Dette en cours: ${formatFcfa(cust.currentDebt)}` : `Dette: 0 FCFA (À jour)`;
}

function calculateChange() {
  const total = calculateCartTotal();
  const tendered = Number(document.getElementById('tenderedAmount').value) || 0;
  const changeEl = document.getElementById('changeToReturn');

  if (tendered >= total && total > 0) {
    const change = tendered - total;
    changeEl.textContent = formatFcfa(change);
    changeEl.style.color = '#16a34a';
  } else if (tendered > 0 && tendered < total) {
    const missing = total - tendered;
    changeEl.textContent = `Manque ${formatFcfa(missing)}`;
    changeEl.style.color = '#dc2626';
  } else {
    changeEl.textContent = '0 FCFA';
    changeEl.style.color = '#16a34a';
  }
}

function renderPosCatalog() {
  const grid = document.getElementById('posItemsGrid');
  const searchVal = document.getElementById('posSearchInput').value.toLowerCase().trim();

  let filtered = state.articles.filter(item => {
    const matchesCat = (state.activeCategory === 'all') ||
      (state.activeCategory === 'service' && item.isService) ||
      (state.activeCategory === 'fourniture' && !item.isService && !item.name.toLowerCase().includes('rame')) ||
      (state.activeCategory === 'rame' && item.name.toLowerCase().includes('rame')) ||
      (state.activeCategory === 'option' && (item.name.toLowerCase().includes('option') || item.name.toLowerCase().includes('agrafage') || item.name.toLowerCase().includes('reliure')));

    const matchesSearch = item.name.toLowerCase().includes(searchVal);
    return matchesCat && matchesSearch;
  });

  grid.innerHTML = '';

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 2rem;">Aucun article trouvé.</div>`;
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = `quick-item-card`;
    card.dataset.itemId = item.id;

    const isLow = !item.isService && item.stock <= (item.minAlertStock || 5);
    const stockDisplay = item.isService ? 'Prestation comptoir' : `Stock : ${item.stock}`;
    const iconSvg = SVG_ICONS[item.iconType] || (item.isService ? SVG_ICONS.printer : SVG_ICONS.file);
    const typeLabel = item.isService ? 'Service' : 'Papeterie';

    card.innerHTML = `
      <div class="card-header-row">
        <div class="card-icon-bubble">
          ${iconSvg}
        </div>
        <div class="card-price-pill">
          ${formatFcfa(item.salePrice)}
        </div>
      </div>
      <div class="card-title-row">
        <h3 class="card-item-title" title="${item.name}">${item.name}</h3>
      </div>
      <div class="card-footer-row">
        <span class="card-type-tag">${typeLabel}</span>
        <span class="card-stock-pill ${isLow ? 'stock-critical' : ''}">${stockDisplay}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      addToCart(item);
    });

    grid.appendChild(card);
  });
}

function addToCart(item) {
  if (window.playUiSound) window.playUiSound('cart');
  const existing = state.cart.find(c => c.articleId === item.id);
  if (existing) {
    existing.quantity += 1;
    existing.total = existing.quantity * existing.unitPrice;
  } else {
    state.cart.push({
      articleId: item.id,
      name: item.name,
      unitPrice: item.salePrice,
      quantity: 1,
      total: item.salePrice,
      isService: item.isService
    });
  }
  renderCart();
}

function changeCartQty(articleId, delta) {
  if (window.playUiSound) window.playUiSound('nav');
  const item = state.cart.find(c => c.articleId === articleId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    state.cart = state.cart.filter(c => c.articleId !== articleId);
  } else {
    item.total = item.quantity * item.unitPrice;
  }
  renderCart();
}
window.changeCartQty = changeCartQty;

function calculateCartTotal() {
  return state.cart.reduce((sum, item) => sum + item.total, 0);
}

function renderCart() {
  const list = document.getElementById('cartItemsList');
  const countEl = document.getElementById('cartCount');
  const totalEl = document.getElementById('cartTotal');

  if (state.cart.length === 0) {
    list.innerHTML = `
      <div class="empty-cart">
        <svg class="empty-cart-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
        <p>Aucun article sélectionné.<br>Cliquez sur les articles à gauche pour commencer.</p>
      </div>
    `;
    countEl.textContent = '0';
    totalEl.textContent = '0 FCFA';
    document.getElementById('tenderedAmount').value = '';
    calculateChange();
    return;
  }

  let totalItems = 0;
  list.innerHTML = '';
  list.scrollTop = 0;

  state.cart.forEach(item => {
    totalItems += item.quantity;
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `
      <div class="cart-row-info">
        <div class="cart-row-title">${item.name}</div>
        <div class="cart-row-sub">${formatFcfa(item.unitPrice)} l'unité</div>
      </div>
      <div class="cart-row-qty">
        <button class="qty-btn" onclick="changeCartQty('${item.articleId}', -1)">-</button>
        <span class="qty-num">${item.quantity}</span>
        <button class="qty-btn" onclick="changeCartQty('${item.articleId}', 1)">+</button>
      </div>
      <div class="cart-row-total">${formatFcfa(item.total)}</div>
    `;
    list.appendChild(row);
  });

  const grandTotal = calculateCartTotal();
  countEl.textContent = totalItems;
  totalEl.textContent = formatFcfa(grandTotal);

  calculateChange();
}

async function processSaleCheckout(generateA4Invoice) {
  if (state.cart.length === 0) {
    showToast('Le panier est vide !');
    if (window.playUiSound) window.playUiSound('error');
    return;
  }

  const grandTotal = calculateCartTotal();
  const payMethod = document.querySelector('input[name="payMethod"]:checked').value;
  const tendered = Number(document.getElementById('tenderedAmount').value) || grandTotal;
  const change = Math.max(0, tendered - grandTotal);
  const custName = document.getElementById('cartCustomerName').value.trim();
  const custPhone = document.getElementById('cartCustomerPhone').value.trim();
  const custCompany = document.getElementById('cartCustomerCompany').value.trim();

  if (payMethod === 'credit' && !custName) {
    alert('Pour une vente à crédit, veuillez obligatoirement indiquer le nom du client !');
    document.getElementById('cartCustomerName').focus();
    if (window.playUiSound) window.playUiSound('error');
    return;
  }

  const saleData = {
    id: 'sale-' + Date.now(),
    timestamp: new Date().toISOString(),
    items: [...state.cart],
    totalAmount: grandTotal,
    paymentMethod: payMethod,
    amountTendered: payMethod === 'cash' ? tendered : grandTotal,
    changeGiven: payMethod === 'cash' ? change : 0,
    customerName: custName || 'Client Comptoir',
    customerPhone: custPhone || '',
    customerCompany: custCompany || '',
    sellerName: state.currentUser ? state.currentUser.name : 'Caissier',
    sellerRole: state.currentUser ? state.currentUser.role : 'vendeur',
    deviceSource: state.isDelestageMode ? 'android_backup' : 'desktop',
    isInvoiceGenerated: generateA4Invoice
  };

  if (state.isDelestageMode) {
    state.offlineBuffer.unshift(saleData);
    showToast(`Vente enregistrée hors-ligne sur Smartphone (${formatFcfa(grandTotal)})`);
    if (window.playUiSound) window.playUiSound('checkout');
    saleData.items.forEach(it => {
      const art = state.articles.find(a => a.id === it.articleId);
      if (art && !art.isService) art.stock = Math.max(0, art.stock - it.quantity);
    });
    resetCheckoutForm();
    renderAll();
    return;
  }

  try {
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData)
    });

    if (res.ok) {
      const result = await res.json();
      state.sales.unshift(result.sale);
      if (result.articles) state.articles = result.articles;
      if (result.credits) state.credits = result.credits;
      if (result.customers) state.customers = result.customers;

      if (payMethod === 'credit') {
        showToast(`Crédit de ${formatFcfa(grandTotal)} enregistré pour ${custName} !`);
      } else {
        showToast(`Vente validée : ${formatFcfa(grandTotal)} encaissés !`);
      }
      if (window.playUiSound) window.playUiSound('checkout');

      if (generateA4Invoice) {
        await createInvoiceFromSale(saleData);
      }

      resetCheckoutForm();
      renderAll();
    }
  } catch (err) {
    console.error('Erreur vente:', err);
    showToast('Erreur lors de l\'enregistrement');
    if (window.playUiSound) window.playUiSound('error');
  }
}

function resetCheckoutForm() {
  state.cart = [];
  document.getElementById('cartCustomerName').value = '';
  document.getElementById('cartCustomerPhone').value = '';
  document.getElementById('cartCustomerCompany').value = '';
  document.getElementById('tenderedAmount').value = '';
  document.getElementById('customerLinkedDetails').style.display = 'none';
  renderCart();
}

function toggleDelestageMode() {
  state.isDelestageMode = !state.isDelestageMode;
  const btn = document.getElementById('btnToggleDelestageMode');
  const badge = document.getElementById('connectionBadge') || document.getElementById('connectionText');
  const text = document.getElementById('connectionText');

  if (state.isDelestageMode) {
    btn.textContent = 'Rallumer le Courant';
    btn.className = 'btn btn-danger btn-sm';
    badge.style.background = 'rgba(239, 68, 68, 0.2)';
    badge.style.borderColor = '#ef4444';
    text.textContent = 'DÉLESTAGE ACTIF (Mode Mobile)';
    text.style.color = '#ef4444';
    showToast('Coupure Sonabel simulée ! Les ventes sont prises sur mémoire locale smartphone.');
  } else {
    btn.textContent = 'Délestage Sonabel';
    btn.className = 'btn btn-warning btn-sm';
    badge.style.background = 'rgba(34, 197, 94, 0.12)';
    badge.style.borderColor = 'rgba(34, 197, 94, 0.25)';
    text.textContent = '100% Hors-ligne';
    text.style.color = '#4ade80';

    if (state.offlineBuffer.length > 0) {
      showToast(`Courant rétabli ! ${state.offlineBuffer.length} ventes à synchroniser.`);
      switchTab('tab-sync');
    } else {
      showToast('Courant rétabli.');
    }
  }
}

// ==========================================================================
// 6. CLIENTS & FOURNISSEURS (FICHES & CRÉDITS)
// ==========================================================================
function setupPartnersListeners() {
  const searchCredit = document.getElementById('searchCreditClientInput');
  if (searchCredit) {
    searchCredit.addEventListener('input', () => { renderCreditsTable(); });
  }

  // Open modal new supplier
  document.getElementById('btnOpenNewSupplierModal').addEventListener('click', () => {
    document.getElementById('formSupplier').reset();
    document.getElementById('modalSupplier').classList.add('active');
  });

  // Submit new customer
  document.getElementById('formCustomer').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('newCustName').value.trim(),
      phone: document.getElementById('newCustPhone').value.trim(),
      company: document.getElementById('newCustCompany').value.trim(),
      address: document.getElementById('newCustAddress').value.trim()
    };

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        state.customers = data.customers;
        document.getElementById('modalCustomer').classList.remove('active');
        showToast('Client enregistré dans le répertoire !');
        renderCustomersDirectory();
      }
    } catch (err) {
      console.error(err);
    }
  });

  // Submit new supplier
  document.getElementById('formSupplier').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newSup = {
      id: 'sup-' + Date.now(),
      name: document.getElementById('supNameInput').value.trim(),
      phone: document.getElementById('supPhoneInput').value.trim(),
      address: document.getElementById('supAddressInput').value.trim(),
      articlesSupplied: document.getElementById('supArticlesInput').value.trim(),
      totalPurchases: 0,
      totalPaid: 0,
      currentDebt: 0,
      ordersHistory: []
    };

    state.suppliers.unshift(newSup);
    document.getElementById('modalSupplier').classList.remove('active');
    showToast(`Fournisseur ${newSup.name} enregistré !`);
    renderSuppliersDirectory();
  });

  // Open modal new customer
  document.getElementById('btnOpenNewCustomerModal').addEventListener('click', () => {
    document.getElementById('formCustomer').reset();
    document.getElementById('modalCustomer').classList.add('active');
  });

  // Pay credit submit
  document.getElementById('formPayCredit').addEventListener('submit', async (e) => {
    e.preventDefault();
    const creditId = document.getElementById('payCreditId').value;
    const amount = Number(document.getElementById('payCreditAmount').value) || 0;
    const method = document.getElementById('payCreditMethod').value;
    const note = document.getElementById('payCreditNote').value.trim();

    try {
      const res = await fetch('/api/credits/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditId,
          amount,
          method,
          receivedBy: state.currentUser ? state.currentUser.name : 'Gérant',
          note
        })
      });

      if (res.ok) {
        const data = await res.json();
        const idx = state.credits.findIndex(c => c.id === creditId);
        if (idx !== -1) state.credits[idx] = data.credit;
        if (data.paymentSale) state.sales.unshift(data.paymentSale);
        if (data.customers) state.customers = data.customers;

        document.getElementById('modalPayCredit').classList.remove('active');
        showToast(`Règlement de ${formatFcfa(amount)} encaissé !`);
        renderCreditsTable();
        renderCustomersDirectory();
        renderDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  });
}

function renderCreditsTable() {
  const tbody = document.getElementById('creditsTableBody') || document.getElementById('clientCreditsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const searchVal = (document.getElementById('searchCreditClientInput')?.value || '').toLowerCase().trim();

  const filtered = state.credits.filter(c => {
    return c.customerName.toLowerCase().includes(searchVal) || (c.customerPhone && c.customerPhone.includes(searchVal));
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #64748b; padding: 1.5rem;">Aucun crédit client enregistré.</td></tr>`;
    return;
  }

  filtered.forEach(c => {
    const tr = document.createElement('tr');
    const isEnCours = c.status === 'en_cours';

    tr.innerHTML = `
      <td>${c.date}</td>
      <td><strong>${c.customerName}</strong></td>
      <td>${c.customerPhone || '—'}</td>
      <td>${c.customerStructure || '—'}</td>
      <td style="font-weight: bold;">${formatFcfa(c.totalAmount)}</td>
      <td style="color: var(--success);">${formatFcfa(c.paidAmount)}</td>
      <td style="font-weight: 800; color: var(--danger);">${formatFcfa(c.remainingAmount)}</td>
      <td>
        <span class="badge-status-pill ${isEnCours ? 'en-cours' : 'solde'}">
          ${isEnCours ? 'En cours' : 'Soldé'}
        </span>
      </td>
      <td>
        ${isEnCours ? `<button class="btn btn-success btn-sm" onclick="openPayCreditModal('${c.id}')">Encaisser</button>` : `<span class="text-muted" style="font-size: 0.8rem;">Soldé</span>`}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.openPayCreditModal = function(creditId) {
  const c = state.credits.find(item => item.id === creditId);
  if (!c) return;

  document.getElementById('payCreditId').value = c.id;
  document.getElementById('payCreditBanner').innerHTML = `
    Client : <strong>${c.customerName}</strong> (${c.customerPhone || 'Pas de numéro'})<br>
    Montant total : <strong>${formatFcfa(c.totalAmount)}</strong> | Déjà versé : <strong>${formatFcfa(c.paidAmount)}</strong><br>
    <span style="font-size: 1.05rem; font-weight: bold; color: var(--danger);">Reste à payer : ${formatFcfa(c.remainingAmount)}</span>
  `;
  document.getElementById('payCreditAmount').value = c.remainingAmount;
  document.getElementById('modalPayCredit').classList.add('active');
};

function renderCustomersDirectory() {
  const tbody = document.getElementById('customersTableBody') || document.getElementById('customersDirectoryTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  state.customers.forEach(cust => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${cust.name}</strong></td>
      <td>${cust.phone || '—'}</td>
      <td>${cust.company || '—'}</td>
      <td>${cust.address || 'Ouagadougou'}</td>
      <td><strong>${formatFcfa(cust.totalPurchases || 0)}</strong></td>
      <td><span class="${cust.currentDebt > 0 ? 'text-danger font-bold' : 'text-success'}">${formatFcfa(cust.currentDebt || 0)}</span></td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="selectCustomerForCheckoutFromTable('${cust.id}')">Sélectionner</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.selectCustomerForCheckoutFromTable = function(custId) {
  const c = state.customers.find(item => item.id === custId);
  if (!c) return;
  selectCustomerForCheckout(c);
  switchTab('tab-pos');
  showToast(`Client ${c.name} sélectionné pour la vente !`);
};

function renderSupplierDebtsTable() {
  const tbody = document.getElementById('supplierDebtsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (state.supplierDebts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #64748b; padding: 1.5rem;">Aucune dette fournisseur enregistrée.</td></tr>`;
    return;
  }

  state.supplierDebts.forEach(d => {
    const tr = document.createElement('tr');
    const isEnCours = d.status === 'en_cours';

    tr.innerHTML = `
      <td>${d.date}</td>
      <td><strong>${d.supplierName}</strong></td>
      <td>${d.invoiceRef || '—'}</td>
      <td>${d.description}</td>
      <td style="font-weight: bold;">${formatFcfa(d.totalAmount)}</td>
      <td style="color: var(--success);">${formatFcfa(d.paidAmount)}</td>
      <td style="font-weight: 800; color: var(--danger);">${formatFcfa(d.remainingAmount)}</td>
      <td>
        <span class="badge-status-pill ${isEnCours ? 'en-cours' : 'solde'}">
          ${isEnCours ? 'En cours' : 'Soldé'}
        </span>
      </td>
      <td>
        ${isEnCours ? `<button class="btn btn-danger btn-sm" onclick="openPaySupplierDebtModal('${d.id}')">Régler</button>` : `<span class="text-muted" style="font-size: 0.8rem;">Soldé</span>`}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.openPaySupplierDebtModal = function(debtId) {
  const d = state.supplierDebts.find(item => item.id === debtId);
  if (!d) return;

  const amt = prompt(`Montant à verser au fournisseur ${d.supplierName} (Reste dû : ${formatFcfa(d.remainingAmount)}) :`, d.remainingAmount);
  if (amt && Number(amt) > 0) {
    fetch('/api/suppliers/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        debtId: d.id,
        amount: Number(amt),
        method: 'cash',
        paidBy: state.currentUser ? state.currentUser.name : 'Gérant',
        note: 'Paiement comptant'
      })
    }).then(r => r.json()).then(data => {
      const idx = state.supplierDebts.findIndex(sd => sd.id === d.id);
      if (idx !== -1) state.supplierDebts[idx] = data.debt;
      showToast('Règlement fournisseur enregistré !');
      renderSupplierDebtsTable();
      renderSuppliersDirectory();
      renderExpensesTable();
    });
  }
};

function renderSuppliersDirectory() {
  const grid = document.getElementById('suppliersDetailContainer') || document.getElementById('suppliersCardsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  state.suppliers.forEach(sup => {
    const card = document.createElement('div');
    card.className = 'supplier-ledger-card';

    let ordersHtml = '';
    (sup.ordersHistory || []).forEach(ord => {
      ordersHtml += `
        <div class="sup-order-item">
          <div style="display: flex; justify-content: space-between;">
            <strong>${ord.date} : ${ord.articleName}</strong>
            <span>${formatFcfa(ord.totalCost)}</span>
          </div>
          <div class="text-muted" style="font-size: 0.75rem;">
            Quantité : ${ord.quantityDesc} | Reste dû ajouté : ${formatFcfa(ord.debtAdded)}
          </div>
        </div>
      `;
    });

    if (!ordersHtml) ordersHtml = `<div class="text-muted" style="font-size: 0.8rem;">Aucune commande enregistrée.</div>`;

    card.innerHTML = `
      <div class="sup-card-header">
        <div>
          <div class="sup-card-name">${sup.name}</div>
          <div class="sup-card-phone">Tél : ${sup.phone || 'Non renseigné'} - ${sup.address || 'Ouagadougou'}</div>
        </div>
        <div>
          <span class="text-muted" style="font-size: 0.7rem; display:block;">DETTE EN COURS :</span>
          <span class="sup-card-debt">${formatFcfa(sup.currentDebt || 0)}</span>
        </div>
      </div>
      <div>
        <span style="font-size: 0.8rem; font-weight: bold; color: #475569;">Articles fournis :</span>
        <p style="font-size: 0.82rem; margin-bottom: 0.5rem;">${sup.articlesSupplied || 'Papeterie générale'}</p>
      </div>
      <div>
        <span style="font-size: 0.8rem; font-weight: bold; color: #475569;">Cahier des approvisionnements récents :</span>
        <div class="sup-orders-list">${ordersHtml}</div>
      </div>
    `;

    grid.appendChild(card);
  });
}

// ==========================================================================
// 7. FACTURES A4 & ÉDITEUR WYSIWYG
// ==========================================================================
function setupInvoicePreviewListeners() {
  const btnPrint = document.getElementById('btnPrintA4') || document.getElementById('btnPrintA4Invoice');
  if (btnPrint) btnPrint.addEventListener('click', () => { window.print(); });

  const btnNew = document.getElementById('btnNewInvoiceFromScratch') || document.getElementById('btnNewInvoiceDirectModal');
  if (btnNew) btnNew.addEventListener('click', () => {
    if (window.playUiSound) window.playUiSound('nav');
    const form = document.getElementById('formDirectInvoice');
    if (form) form.reset();
    const cont = document.getElementById('dirInvLinesContainer');
    if (cont) cont.innerHTML = '';
    addDirectInvoiceLine('Photocopies A4 N&B', 10, 25);
    const modal = document.getElementById('modalNewInvoiceDirect');
    if (modal) modal.classList.add('active');
  });

  const btnAddDirLine = document.getElementById('btnAddDirInvLine');
  if (btnAddDirLine) {
    btnAddDirLine.addEventListener('click', () => {
      if (window.playUiSound) window.playUiSound('nav');
      addDirectInvoiceLine();
    });
  }

  const formDirect = document.getElementById('formDirectInvoice');
  if (formDirect) {
    formDirect.addEventListener('submit', async (e) => {
      e.preventDefault();
      const custName = document.getElementById('dirInvCustName').value.trim();
      const custPhone = document.getElementById('dirInvCustPhone').value.trim();
      const custCompany = document.getElementById('dirInvCustCompany').value.trim();
      const payMode = document.getElementById('dirInvPayMode').value;

      const rows = document.querySelectorAll('#dirInvLinesContainer .dir-line-row');
      const items = [];
      let grandTotal = 0;

      rows.forEach(r => {
        const name = r.querySelector('.dir-line-name').value.trim();
        const qty = Number(r.querySelector('.dir-line-qty').value) || 1;
        const price = Number(r.querySelector('.dir-line-price').value) || 0;
        if (name) {
          const tot = qty * price;
          items.push({ name, quantity: qty, unitPrice: price, total: tot });
          grandTotal += tot;
        }
      });

      if (items.length === 0) {
        showToast('Veuillez ajouter au moins une ligne de facture avec un libellé.');
        if (window.playUiSound) window.playUiSound('error');
        return;
      }

      const invNumber = (state.settings.invoicePrefix || 'FAC-2026-') + String((state.invoices || []).length + 1).padStart(4, '0');
      const payload = {
        id: 'inv-' + Date.now(),
        invoiceNumber: invNumber,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('fr-FR'),
        customerName: custName,
        customerPhone: custPhone,
        customerCompany: custCompany || 'Client direct',
        customerAddress: 'Ouagadougou',
        items,
        totalAmount: grandTotal,
        paymentMethod: payMode,
        amountInWords: formatAmountWordsFcfa(grandTotal),
        sellerName: state.currentUser ? state.currentUser.name : 'Gérant',
        footerNotice: state.settings.footerNotice || ''
      };

      try {
        const res = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          const saved = data.invoice || payload;
          if (!state.invoices) state.invoices = [];
          state.invoices.unshift(saved);
          state.selectedInvoice = saved;

          document.getElementById('modalNewInvoiceDirect').classList.remove('active');
          showToast(`Facture A4 ${invNumber} générée avec succès !`);
          if (window.playUiSound) window.playUiSound('checkout');

          renderInvoicesList();
          renderCurrentInvoice();
        }
      } catch (err) {
        console.error('Erreur creation facture:', err);
        showToast('Erreur lors de l\'enregistrement de la facture');
      }
    });
  }

  const btnAddRow = document.getElementById('btnAddA4RowInline');
  if (btnAddRow) btnAddRow.addEventListener('click', () => { addInlineRowToCurrentInvoice(); });

  const btnSave = document.getElementById('btnSaveInvoiceChanges');
  if (btnSave) btnSave.addEventListener('click', async () => { await saveCurrentInvoiceChanges(); });
}

function addDirectInvoiceLine(defaultName = '', defaultQty = 1, defaultPrice = 500) {
  const container = document.getElementById('dirInvLinesContainer');
  if (!container) return;

  const row = document.createElement('div');
  row.className = 'dir-line-row';
  row.innerHTML = `
    <input type="text" class="dir-line-name" placeholder="Désignation (ex: 100 Photocopies A4 Recto)" value="${defaultName}" required>
    <input type="number" class="dir-line-qty" value="${defaultQty}" min="1" style="width: 70px;" title="Quantité">
    <input type="number" class="dir-line-price" value="${defaultPrice}" min="0" step="25" style="width: 100px;" title="Prix unitaire">
    <span class="dir-line-subtotal">${formatFcfa(defaultQty * defaultPrice)}</span>
    <button type="button" class="btn-text text-danger btn-del-dir-line" title="Supprimer la ligne" style="font-size: 1.2rem; line-height: 1; padding: 0.2rem 0.4rem;">&times;</button>
  `;

  const qtyInput = row.querySelector('.dir-line-qty');
  const priceInput = row.querySelector('.dir-line-price');
  const subtotalEl = row.querySelector('.dir-line-subtotal');
  const btnDel = row.querySelector('.btn-del-dir-line');

  const updateSub = () => {
    const q = Number(qtyInput.value) || 0;
    const p = Number(priceInput.value) || 0;
    subtotalEl.textContent = formatFcfa(q * p);
    updateDirectInvoiceTotal();
  };

  qtyInput.addEventListener('input', updateSub);
  priceInput.addEventListener('input', updateSub);

  btnDel.addEventListener('click', () => {
    row.remove();
    updateDirectInvoiceTotal();
  });

  container.appendChild(row);
  updateDirectInvoiceTotal();
}

function updateDirectInvoiceTotal() {
  const container = document.getElementById('dirInvLinesContainer');
  if (!container) return;
  const rows = container.querySelectorAll('.dir-line-row');
  let sum = 0;
  rows.forEach(r => {
    const q = Number(r.querySelector('.dir-line-qty').value) || 0;
    const p = Number(r.querySelector('.dir-line-price').value) || 0;
    sum += q * p;
  });
  const totalEl = document.getElementById('dirInvLiveTotal');
  if (totalEl) totalEl.textContent = formatFcfa(sum);
}

function addInlineRowToCurrentInvoice() {
  if (!state.selectedInvoice) return;
  if (!state.selectedInvoice.items) state.selectedInvoice.items = [];

  state.selectedInvoice.items.push({
    name: "Nouvel article ou prestation",
    quantity: 1,
    unitPrice: 500,
    total: 500
  });

  renderCurrentInvoice();
  showToast('Ligne ajoutée. Cliquez dessus pour modifier.');
}

async function saveCurrentInvoiceChanges() {
  if (!state.selectedInvoice) return;

  const inv = state.selectedInvoice;
  inv.customerName = document.getElementById('a4CustName').textContent.trim();
  inv.customerPhone = document.getElementById('a4CustPhone').textContent.trim();
  inv.customerCompany = document.getElementById('a4CustCompany').textContent.trim();
  inv.customerAddress = document.getElementById('a4CustAddress').textContent.trim();
  inv.invoiceNumber = document.getElementById('a4InvoiceNum').textContent.trim();
  inv.date = document.getElementById('a4InvoiceDate').textContent.trim();

  const rows = document.querySelectorAll('#a4TableBody tr');
  const items = [];
  let grandTotal = 0;

  rows.forEach(tr => {
    const name = tr.querySelector('.cell-name').textContent.trim();
    const qty = Number(tr.querySelector('.cell-qty').textContent.replace(/\D/g, '')) || 1;
    const unitPrice = Number(tr.querySelector('.cell-price').textContent.replace(/\D/g, '')) || 0;
    const total = qty * unitPrice;
    grandTotal += total;

    items.push({ name, quantity: qty, unitPrice, total });
  });

  inv.items = items;
  inv.totalAmount = grandTotal;
  inv.amountInWords = formatAmountWordsFcfa(grandTotal);

  try {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inv)
    });

    if (res.ok) {
      showToast('Modifications de la facture enregistrées !');
      renderInvoicesList();
      renderCurrentInvoice();
    }
  } catch (err) {
    console.error(err);
  }
}

async function createInvoiceFromSale(sale) {
  const invNumber = (state.settings.invoicePrefix || 'FAC-2026-') + String(state.invoices.length + 1).padStart(4, '0');
  const words = formatAmountWordsFcfa(sale.totalAmount);

  const newInvoice = {
    id: 'inv-' + Date.now(),
    invoiceNumber: invNumber,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('fr-FR'),
    customerName: sale.customerName || 'Client Comptoir',
    customerPhone: sale.customerPhone || '',
    customerCompany: sale.customerCompany || 'Vente directe comptoir',
    customerAddress: 'Ouagadougou',
    items: sale.items.map(it => ({
      name: it.name,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      total: it.total
    })),
    totalAmount: sale.totalAmount,
    amountInWords: words,
    paymentStatus: 'payé',
    paymentMethod: sale.paymentMethod
  };

  try {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInvoice)
    });
    if (res.ok) {
      const data = await res.json();
      state.invoices.unshift(data.invoice);
      state.selectedInvoice = data.invoice;
      switchTab('tab-invoices');
      renderInvoicesList();
      renderCurrentInvoice();
    }
  } catch (err) {
    console.error(err);
  }
}

function renderInvoicesList() {
  const list = document.getElementById('invoicesListItems') || document.getElementById('invoicesHistoryList');
  list.innerHTML = '';

  if (state.invoices.length === 0) {
    list.innerHTML = `<div style="text-align: center; color: #64748b; padding: 1.5rem; font-size: 0.85rem;">Aucune facture générée.</div>`;
    return;
  }

  state.invoices.forEach(inv => {
    const card = document.createElement('div');
    card.className = `invoice-item-card ${state.selectedInvoice && state.selectedInvoice.id === inv.id ? 'active' : ''}`;
    card.innerHTML = `
      <div class="inv-card-header" style="display: flex; justify-content: space-between; font-weight: bold; color: var(--brand);">
        <span>${inv.invoiceNumber}</span>
        <span>${formatFcfa(inv.totalAmount)}</span>
      </div>
      <div class="inv-card-cust" style="font-size: 0.82rem; margin-top: 2px;">${inv.customerName || 'Client'}</div>
      <div class="inv-card-meta" style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">
        <span>${inv.date}</span>
        <span class="text-success">${inv.customerPhone || ''}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      state.selectedInvoice = inv;
      renderInvoicesList();
      renderCurrentInvoice();
    });

    list.appendChild(card);
  });
}

function renderCurrentInvoice() {
  if (!state.selectedInvoice) {
    if (state.invoices.length > 0) {
      state.selectedInvoice = state.invoices[0];
    } else {
      state.selectedInvoice = {
        invoiceNumber: (state.settings.invoicePrefix || 'FAC-2026-') + '0001',
        date: new Date().toISOString().split('T')[0],
        customerName: 'Lycée Provincial de Bogodogo',
        customerPhone: '+226 78 00 00 00',
        customerCompany: 'Direction des Études - Fournitures de Rentrée',
        customerAddress: 'Ouagadougou, Secteur 28',
        paymentMethod: 'cash',
        items: [
          { name: 'Rame Papier A4 Double A (80g)', quantity: 3, unitPrice: 4000, total: 12000 },
          { name: 'Stylo Bic Cristal Bleu Original (Boîte de 50)', quantity: 1, unitPrice: 4500, total: 4500 },
          { name: 'Photocopie Sujets Épreuves A4 N&B', quantity: 200, unitPrice: 25, total: 5000 }
        ],
        totalAmount: 21500,
        amountInWords: formatAmountWordsFcfa(21500)
      };
    }
  }

  const inv = state.selectedInvoice;
  const s = state.settings;

  const logoImg = document.getElementById('a4LogoImg');
  const logoFallback = document.getElementById('a4LogoFallbackSvg');
  if (s.logo) {
    logoImg.src = s.logo;
    logoImg.style.display = 'block';
    logoFallback.style.display = 'none';
  } else {
    logoImg.style.display = 'none';
    logoFallback.style.display = 'inline';
  }

  document.getElementById('a4ShopName').textContent = s.shopName || 'Secrétariat Public';
  document.getElementById('a4Tagline').textContent = s.tagline || '';
  document.getElementById('a4Address').textContent = `${s.address || ''} - ${s.city || 'Ouagadougou'}`;
  document.getElementById('a4Phones').textContent = `${s.phone1 || ''} / ${s.phone2 || ''}`;
  document.getElementById('a4Ifu').textContent = s.ifu || '00123456Z';
  document.getElementById('a4Rccm').textContent = s.rccm || 'BF OUA 2024 A 1234';
  document.getElementById('a4FooterNotice').textContent = s.footerNotice || '';

  document.getElementById('a4InvoiceNum').textContent = inv.invoiceNumber;
  document.getElementById('a4InvoiceDate').textContent = inv.date;
  document.getElementById('a4PaymentMode').textContent = inv.paymentMethod === 'orange_money' ? 'Orange Money' : inv.paymentMethod === 'moov_money' ? 'Moov Money' : 'Espèces';

  document.getElementById('a4CustName').textContent = inv.customerName || 'Client Comptoir';
  document.getElementById('a4CustPhone').textContent = inv.customerPhone || 'Non renseigné';
  document.getElementById('a4CustCompany').textContent = inv.customerCompany || 'Fournitures & Services Bureautiques';
  document.getElementById('a4CustAddress').textContent = inv.customerAddress || 'Ouagadougou';

  const tbody = document.getElementById('a4TableBody');
  tbody.innerHTML = '';

  let recalculatedTotal = 0;

  (inv.items || []).forEach((it, idx) => {
    it.total = (it.quantity || 1) * (it.unitPrice || 0);
    recalculatedTotal += it.total;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="text-align: center;">${idx + 1}</td>
      <td class="cell-name" contenteditable="true">${it.name}</td>
      <td class="cell-qty" contenteditable="true" style="text-align: center;">${it.quantity}</td>
      <td class="cell-price" contenteditable="true" style="text-align: right;">${it.unitPrice}</td>
      <td class="cell-total" style="text-align: right; font-weight: bold;">${formatFcfa(it.total)}</td>
    `;

    const qtyCell = tr.querySelector('.cell-qty');
    const priceCell = tr.querySelector('.cell-price');

    const updateRow = () => {
      const q = Number(qtyCell.textContent.replace(/\D/g, '')) || 1;
      const p = Number(priceCell.textContent.replace(/\D/g, '')) || 0;
      it.quantity = q;
      it.unitPrice = p;
      it.total = q * p;
      tr.querySelector('.cell-total').textContent = formatFcfa(it.total);
      recalculateA4GrandTotal();
    };

    qtyCell.addEventListener('blur', updateRow);
    priceCell.addEventListener('blur', updateRow);

    tbody.appendChild(tr);
  });

  inv.totalAmount = recalculatedTotal;
  document.getElementById('a4TotalAmount').textContent = formatFcfa(recalculatedTotal);
  document.getElementById('a4AmountWords').textContent = formatAmountWordsFcfa(recalculatedTotal);

  // Update stamp elements for certified model
  const stampDate = document.getElementById('stampDateDisplay');
  if (stampDate) {
    stampDate.textContent = inv.date || new Date().toISOString().split('T')[0];
  }
  const stampShop = document.getElementById('stampShopName');
  if (stampShop && s.shopName) {
    stampShop.textContent = s.shopName.toUpperCase();
  }
}

function setupInvoiceTemplates() {
  document.querySelectorAll('.template-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.playUiSound) window.playUiSound('nav');
      const tpl = btn.dataset.tpl;
      setInvoiceTemplate(tpl);
    });
  });

  const savedTpl = localStorage.getItem('ouaga_invoice_tpl') || 'tpl-classic';
  setInvoiceTemplate(savedTpl);
}

function setInvoiceTemplate(tplId) {
  state.invoiceTemplate = tplId;
  localStorage.setItem('ouaga_invoice_tpl', tplId);

  document.querySelectorAll('.template-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.tpl === tplId);
  });

  const sheet = document.getElementById('a4InvoicePrintSheet');
  if (sheet) {
    sheet.className = `a4-sheet ${tplId}`;
  }
}

function recalculateA4GrandTotal() {
  let sum = 0;
  document.querySelectorAll('#a4TableBody tr').forEach(tr => {
    const q = Number(tr.querySelector('.cell-qty').textContent.replace(/\D/g, '')) || 1;
    const p = Number(tr.querySelector('.cell-price').textContent.replace(/\D/g, '')) || 0;
    sum += q * p;
  });

  document.getElementById('a4TotalAmount').textContent = formatFcfa(sum);
  document.getElementById('a4AmountWords').textContent = formatAmountWordsFcfa(sum);
}

let directInvoiceLines = [];
function openDirectInvoiceModal() {
  directInvoiceLines = [{ name: 'Rame Papier A4 Double A (80g)', quantity: 2, unitPrice: 4000, total: 8000 }];
  renderDirectInvoiceLines();
  document.getElementById('modalNewInvoiceDirect').classList.add('active');
}

function renderDirectInvoiceLines() {
  const container = document.getElementById('dirInvLinesContainer');
  container.innerHTML = '';
  let grandTotal = 0;

  directInvoiceLines.forEach((line, idx) => {
    line.total = (line.quantity || 1) * (line.unitPrice || 0);
    grandTotal += line.total;

    const row = document.createElement('div');
    row.className = 'form-row';
    row.style.marginBottom = '0.5rem';
    row.innerHTML = `
      <div style="grid-column: span 1 / -1; display: flex; gap: 8px;">
        <input type="text" placeholder="Désignation" value="${line.name}" style="flex: 3;" onchange="updateDirInvLine(${idx}, 'name', this.value)">
        <input type="number" min="1" value="${line.quantity}" style="width: 70px;" onchange="updateDirInvLine(${idx}, 'quantity', this.value)">
        <input type="number" step="25" value="${line.unitPrice}" style="width: 110px;" onchange="updateDirInvLine(${idx}, 'unitPrice', this.value)">
        <span style="font-weight: bold; width: 90px; text-align: right; align-self: center;">${formatFcfa(line.total)}</span>
        <button type="button" class="btn btn-text text-danger" onclick="removeDirInvLine(${idx})">✕</button>
      </div>
    `;
    container.appendChild(row);
  });

  document.getElementById('dirInvTotalDisplay').textContent = formatFcfa(grandTotal);
}

window.updateDirInvLine = function(idx, field, val) {
  if (field === 'quantity' || field === 'unitPrice') {
    directInvoiceLines[idx][field] = Number(val) || 0;
  } else {
    directInvoiceLines[idx][field] = val;
  }
  renderDirectInvoiceLines();
};

window.removeDirInvLine = function(idx) {
  directInvoiceLines.splice(idx, 1);
  renderDirectInvoiceLines();
};

document.getElementById('btnAddDirInvLine').addEventListener('click', () => {
  directInvoiceLines.push({ name: '', quantity: 1, unitPrice: 500, total: 500 });
  renderDirectInvoiceLines();
});

document.getElementById('formDirectInvoice').addEventListener('submit', async (e) => {
  e.preventDefault();
  const total = directInvoiceLines.reduce((sum, l) => sum + l.total, 0);
  if (total <= 0) {
    showToast('Ajoutez au moins une ligne avec un montant valide.');
    return;
  }

  const invNumber = (state.settings.invoicePrefix || 'FAC-2026-') + String(state.invoices.length + 1).padStart(4, '0');
  const invoice = {
    invoiceNumber: invNumber,
    date: new Date().toISOString().split('T')[0],
    customerName: document.getElementById('dirInvCustName').value.trim(),
    customerPhone: document.getElementById('dirInvCustPhone').value.trim(),
    customerCompany: document.getElementById('dirInvCustCompany').value.trim(),
    customerAddress: document.getElementById('dirInvCustAddress').value.trim(),
    items: [...directInvoiceLines],
    totalAmount: total,
    amountInWords: formatAmountWordsFcfa(total),
    paymentStatus: 'payé',
    paymentMethod: 'cash'
  };

  try {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice)
    });
    if (res.ok) {
      const data = await res.json();
      state.invoices.unshift(data.invoice);
      state.selectedInvoice = data.invoice;
      document.getElementById('modalNewInvoiceDirect').classList.remove('active');
      showToast('Facture A4 générée avec succès !');
      switchTab('tab-invoices');
      renderInvoicesList();
      renderCurrentInvoice();
    }
  } catch (err) {
    console.error(err);
  }
});

// ==========================================================================
// 8. RÉAPPROVISIONNEMENT INTELLIGENT (STOCKS & FOURNISSEURS)
// ==========================================================================
function setupStockListeners() {
  const btnAdd = document.getElementById('btnAddNewArticleModal');
  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      const form = document.getElementById('formArticle');
      if (form) form.reset();
      const artIdEl = document.getElementById('artId');
      if (artIdEl) artIdEl.value = '';
      const titleEl = document.getElementById('modalArticleTitle');
      if (titleEl) titleEl.textContent = 'Nouvel Article / Service';
      const bulkEl = document.getElementById('bulkFieldsSection');
      if (bulkEl) bulkEl.style.display = 'block';
      const modal = document.getElementById('modalArticle');
      if (modal) modal.classList.add('active');
      setTimeout(() => {
        const nameInput = document.getElementById('artName');
        if (nameInput) nameInput.focus();
      }, 50);
    });
  }

  const btnRestock = document.getElementById('btnRestockQuickModal');
  if (btnRestock) {
    btnRestock.addEventListener('click', openRestockModal);
  }

  // Bulk cost automatic calculation on input
  const bulkQtyInput = document.getElementById('artBulkQty');
  const bulkCostInput = document.getElementById('artBulkPurchaseCost');
  const updateUnitCostPreview = () => {
    if (!bulkQtyInput || !bulkCostInput) return;
    const q = Number(bulkQtyInput.value) || 1;
    const c = Number(bulkCostInput.value) || 0;
    const unitCost = Math.round(c / q);
    const disp = document.getElementById('calculatedUnitCostDisplay');
    if (disp) disp.textContent = formatFcfa(unitCost);
  };
  if (bulkQtyInput) bulkQtyInput.addEventListener('input', updateUnitCostPreview);
  if (bulkCostInput) bulkCostInput.addEventListener('input', updateUnitCostPreview);

  const catSelect = document.getElementById('artCategory');
  if (catSelect) {
    catSelect.addEventListener('change', (e) => {
      const isService = e.target.value === 'service';
      const bulkSec = document.getElementById('bulkFieldsSection');
      if (bulkSec) bulkSec.style.display = isService ? 'none' : 'block';
    });
  }

  // Toggle supplier restock payment type (cash vs credit)
  document.querySelectorAll('input[name="restockPayType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      document.querySelectorAll('#formRestock .pay-method').forEach(m => m.classList.remove('selected'));
      e.target.closest('.pay-method').classList.add('selected');
      const isCredit = e.target.value === 'credit';
      document.getElementById('restockCreditDetailsBox').style.display = isCredit ? 'flex' : 'none';
      updateRestockLiveSummary();
    });
  });

  // Supplier selection change in restock modal
  document.getElementById('restockSupplierSelect').addEventListener('change', (e) => {
    const isNew = e.target.value === 'new';
    document.getElementById('newSupplierInlineBox').style.display = isNew ? 'block' : 'none';
    updateRestockLiveSummary();
  });

  document.getElementById('restockBulkQty').addEventListener('input', updateRestockLiveSummary);
  document.getElementById('restockUnitQty').addEventListener('input', updateRestockLiveSummary);
  document.getElementById('restockTotalCost').addEventListener('input', updateRestockLiveSummary);
  document.getElementById('restockPaidUpfront').addEventListener('input', updateRestockLiveSummary);

  // Submit article
  document.getElementById('formArticle').addEventListener('submit', async (e) => {
    e.preventDefault();
    const isService = document.getElementById('artCategory').value === 'service';
    const saleP = Number(document.getElementById('artSalePrice').value) || 0;
    const bulkQ = Number(document.getElementById('artBulkQty').value) || 1;
    const bulkCost = Number(document.getElementById('artBulkPurchaseCost').value) || 0;
    const unitCost = isService ? 0 : Math.round(bulkCost / bulkQ);

    const payload = {
      id: document.getElementById('artId').value || undefined,
      name: document.getElementById('artName').value.trim(),
      category: isService ? 'service' : 'fourniture',
      iconType: document.getElementById('artIconType').value,
      isService: isService,
      salePrice: saleP,
      unitSale: document.getElementById('artUnitSale').value.trim() || 'pièce',
      isBulkManaged: !isService,
      bulkName: document.getElementById('artBulkName').value.trim(),
      bulkQuantity: bulkQ,
      bulkPurchaseCost: bulkCost,
      costPrice: unitCost,
      stock: Number(document.getElementById('artInitialStock').value) || 0,
      minAlertStock: Number(document.getElementById('artMinAlert').value) || 5,
      updatedBy: state.currentUser ? state.currentUser.name : 'Gérant'
    };

    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        state.articles = data.articles;
        document.getElementById('modalArticle').classList.remove('active');
        showToast('Article enregistré avec succès !');
        renderAll();
      }
    } catch (err) {
      console.error(err);
    }
  });

  // Submit intelligent restock
  document.getElementById('formRestock').addEventListener('submit', async (e) => {
    e.preventDefault();
    const articleId = document.getElementById('restockArticleSelect').value;
    const supplierId = document.getElementById('restockSupplierSelect').value;
    const bulkQty = Number(document.getElementById('restockBulkQty').value) || 0;
    const unitQty = Number(document.getElementById('restockUnitQty').value) || 0;
    const costTotal = Number(document.getElementById('restockTotalCost').value) || 0;
    const payType = document.querySelector('input[name="restockPayType"]:checked').value;
    const paidUpfront = Number(document.getElementById('restockPaidUpfront').value) || 0;
    const invoiceRef = document.getElementById('restockInvoiceRef').value.trim();

    const newSupName = document.getElementById('newSupName').value.trim();
    const newSupPhone = document.getElementById('newSupPhone').value.trim();

    try {
      const res = await fetch('/api/articles/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          supplierId,
          newSupplierName: newSupName,
          newSupplierPhone: newSupPhone,
          bulkQuantityAdded: bulkQty,
          unitQuantityAdded: unitQty,
          purchaseCostTotal: costTotal,
          paymentType: payType,
          paidUpfront,
          invoiceRef,
          restockedBy: state.currentUser ? state.currentUser.name : 'Gérant'
        })
      });

      if (res.ok) {
        const data = await res.json();
        const idx = state.articles.findIndex(a => a.id === articleId);
        if (idx !== -1) state.articles[idx] = data.article;
        if (data.suppliers) state.suppliers = data.suppliers;
        if (data.supplierDebts) state.supplierDebts = data.supplierDebts;
        if (data.expenses) state.expenses = data.expenses;

        document.getElementById('modalRestock').classList.remove('active');
        showToast(`Stock réapprovisionné de +${data.addedUnits} unités !`);
        renderAll();
      }
    } catch (err) {
      console.error(err);
    }
  });
}

function openRestockModal() {
  const artSelect = document.getElementById('restockArticleSelect');
  artSelect.innerHTML = '';
  const bulkArticles = state.articles.filter(a => !a.isService);

  bulkArticles.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = `${a.name} (Stock actuel: ${a.stock} ${a.unitSale || 'pcs'})`;
    artSelect.appendChild(opt);
  });

  const supSelect = document.getElementById('restockSupplierSelect');
  supSelect.innerHTML = '';
  state.suppliers.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${s.name} (Dette actuelle: ${formatFcfa(s.currentDebt || 0)})`;
    supSelect.appendChild(opt);
  });

  const optNew = document.createElement('option');
  optNew.value = 'new';
  optNew.textContent = '+ Nouveau Fournisseur (Ajout rapide)';
  supSelect.appendChild(optNew);

  artSelect.onchange = updateRestockLiveSummary;
  updateRestockLiveSummary();

  document.getElementById('modalRestock').classList.add('active');
}

function updateRestockLiveSummary() {
  const artId = document.getElementById('restockArticleSelect').value;
  const art = state.articles.find(a => a.id === artId);
  if (!art) return;

  const info = document.getElementById('restockArticleInfo');
  if (art.isBulkManaged) {
    info.innerHTML = `Conditionnement d'achat : <strong>${art.bulkName || 'Boîte'}</strong> de <strong>${art.bulkQuantity}</strong> ${art.unitSale || 'unités'}.`;
  } else {
    info.innerHTML = `Gestion en unités simples.`;
  }

  const bulkQty = Number(document.getElementById('restockBulkQty').value) || 0;
  const unitQty = Number(document.getElementById('restockUnitQty').value) || 0;
  const addedUnits = (bulkQty * (art.bulkQuantity || 1)) + unitQty;
  const newStock = (art.stock || 0) + addedUnits;

  const costTotal = Number(document.getElementById('restockTotalCost').value) || 0;
  const payType = document.querySelector('input[name="restockPayType"]:checked')?.value || 'cash';
  const paidNow = Number(document.getElementById('restockPaidUpfront').value) || (payType === 'cash' ? costTotal : 0);
  const debt = Math.max(0, costTotal - paidNow);

  const banner = document.getElementById('restockSummaryBanner');
  banner.innerHTML = `
    <strong>Impact de cet approvisionnement :</strong><br>
    • Le stock disponible passera de <strong>${art.stock}</strong> à <strong class="text-success">${newStock} ${art.unitSale || 'unités'}</strong>.<br>
    • Règlement : ${payType === 'cash' ? '<strong class="text-primary">Payé Comptant (Caisse)</strong>' : `<strong class="text-danger">Achat à Crédit (+${formatFcfa(debt)} de dette fournisseur)</strong>`}.
  `;
}

function renderStockTable() {
  const tbody = document.getElementById('stockTableBody');
  tbody.innerHTML = '';

  let totalCostVal = 0;
  let totalSaleVal = 0;
  let lowStockCount = 0;

  state.articles.forEach(art => {
    if (!art.isService) {
      const costTotal = (art.costPrice || 0) * (art.stock || 0);
      const saleTotal = (art.salePrice || 0) * (art.stock || 0);
      totalCostVal += costTotal;
      totalSaleVal += saleTotal;

      if (art.stock <= (art.minAlertStock || 5)) lowStockCount++;
    }

    const tr = document.createElement('tr');
    const isLow = !art.isService && art.stock <= (art.minAlertStock || 5);
    const iconSvg = SVG_ICONS[art.iconType] || (art.isService ? SVG_ICONS.printer : SVG_ICONS.file);

    let bulkDesc = '—';
    if (art.isBulkManaged) {
      bulkDesc = `${art.bulkName || 'Boîte'} (${art.bulkQuantity} ${art.unitSale || 'unités'})`;
    }

    const stockDesc = art.isService ? 'Prestation continue' : `<strong>${art.stock}</strong> ${art.unitSale || 'pcs'}`;
    const marketVal = art.isService ? '—' : formatFcfa((art.salePrice || 0) * (art.stock || 0));

    tr.innerHTML = `
      <td style="text-align: center;"><div class="item-visual-avatar" style="margin: 0 auto;">${iconSvg}</div></td>
      <td><strong>${art.name}</strong></td>
      <td><span class="pill" style="font-size:0.75rem;">${art.isService ? 'Service' : 'Fourniture'}</span></td>
      <td>${bulkDesc}</td>
      <td>${art.isService ? '—' : formatFcfa(art.costPrice)}</td>
      <td style="font-weight: bold; color: var(--brand);">${formatFcfa(art.salePrice)}</td>
      <td><span class="${isLow ? 'text-danger font-bold' : ''}">${stockDesc} ${isLow ? '⚠️ Alerte' : ''}</span></td>
      <td><strong>${marketVal}</strong></td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="editArticle('${art.id}')">Modifier</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('metricCostValue').textContent = formatFcfa(totalCostVal);
  document.getElementById('metricSaleValue').textContent = formatFcfa(totalSaleVal);
  document.getElementById('metricProfitValue').textContent = formatFcfa(Math.max(0, totalSaleVal - totalCostVal));
  document.getElementById('metricLowStockCount').textContent = lowStockCount;
}

window.editArticle = function(id) {
  const art = state.articles.find(a => a.id === id);
  if (!art) return;

  document.getElementById('artId').value = art.id;
  document.getElementById('artName').value = art.name;
  document.getElementById('artCategory').value = art.isService ? 'service' : 'fourniture';
  document.getElementById('artIconType').value = art.iconType || 'pen';
  document.getElementById('artSalePrice').value = art.salePrice;
  document.getElementById('artUnitSale').value = art.unitSale || '';
  document.getElementById('artBulkName').value = art.bulkName || '';
  document.getElementById('artBulkQty').value = art.bulkQuantity || 1;
  document.getElementById('artBulkPurchaseCost').value = art.bulkPurchaseCost || 0;
  document.getElementById('artInitialStock').value = art.stock || 0;
  document.getElementById('artMinAlert').value = art.minAlertStock || 5;

  document.getElementById('bulkFieldsSection').style.display = art.isService ? 'none' : 'block';
  document.getElementById('modalArticleTitle').textContent = 'Modifier : ' + art.name;
  document.getElementById('modalArticle').classList.add('active');
};

// ==========================================================================
// 9. DÉPENSES AVEC FILTRES TEMPORELS
// ==========================================================================
function setupExpensesListeners() {
  document.getElementById('formNewExpense').addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = Number(document.getElementById('expAmount').value) || 0;
    const category = document.getElementById('expCategory').value;
    const desc = document.getElementById('expDescription').value.trim();
    const ben = document.getElementById('expBeneficiary').value.trim();

    if (amount <= 0) {
      showToast('Montant invalide');
      return;
    }

    const payload = {
      amount,
      category,
      description: desc,
      beneficiary: ben,
      recordedBy: state.currentUser ? state.currentUser.name : 'Gérant'
    };

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        state.expenses.unshift(data.expense);
        document.getElementById('formNewExpense').reset();
        showToast(`Dépense de ${formatFcfa(amount)} enregistrée !`);
        renderExpensesTable();
        renderCloseDaySummary();
        renderDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  });

  document.querySelectorAll('[data-exp-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-exp-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeExpenseFilter = btn.dataset.expFilter;
      renderExpensesTable();
    });
  });
}

window.openExpenseModalFromDash = function() {
  switchTab('tab-expenses');
  document.getElementById('expAmount').focus();
};

function renderExpensesTable() {
  const tbody = document.getElementById('expensesTableBody');
  tbody.innerHTML = '';

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(now.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let filteredTotal = 0;

  const filtered = state.expenses.filter(exp => {
    const expDate = new Date(exp.timestamp);
    const expStr = exp.timestamp ? exp.timestamp.split('T')[0] : '';

    if (state.activeExpenseFilter === 'today') return expStr === todayStr;
    if (state.activeExpenseFilter === 'week') return expDate >= sevenDaysAgo;
    if (state.activeExpenseFilter === 'month') return expDate >= monthStart;
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 1.5rem;">Aucune dépense sur cette période.</td></tr>`;
    document.getElementById('filteredExpensesSum').textContent = `Total : 0 FCFA`;
    return;
  }

  filtered.forEach(exp => {
    filteredTotal += exp.amount;
    const tr = document.createElement('tr');
    const dateFormatted = exp.timestamp ? new Date(exp.timestamp).toLocaleDateString('fr-FR') + ' ' + new Date(exp.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—';

    let catBadge = exp.category;
    if (exp.category === 'sonabel') catBadge = 'Électricité Sonabel';
    if (exp.category === 'encre_consommables') catBadge = 'Encre / Agrafes / Stock';
    if (exp.category === 'credit_appel') catBadge = 'Crédit Appel';
    if (exp.category === 'transport') catBadge = 'Transport Rood-Woko';
    if (exp.category === 'pause') catBadge = 'Pause / Eau';

    tr.innerHTML = `
      <td>${dateFormatted}</td>
      <td><strong>${catBadge}</strong></td>
      <td>${exp.description || '—'}</td>
      <td>${exp.beneficiary || 'Boutique'}</td>
      <td style="text-align: right; font-weight: bold; color: var(--danger);">${formatFcfa(exp.amount)}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('filteredExpensesSum').textContent = `Total (${state.activeExpenseFilter === 'today' ? "Aujourd'hui" : state.activeExpenseFilter === 'week' ? 'Cette semaine' : state.activeExpenseFilter === 'month' ? 'Ce mois' : 'Global'}) : ${formatFcfa(filteredTotal)}`;
}

// ==========================================================================
// 10. CLÔTURE DU SOIR & ARCHIVAGE
// ==========================================================================
function setupCloseDayListeners() {
  const countedInput = document.getElementById('actualCashCounted');
  countedInput.addEventListener('input', checkBalancesDifferences);

  document.getElementById('btnCountExact').addEventListener('click', () => {
    countedInput.value = getExpectedCash();
    checkBalancesDifferences();
  });

  document.getElementById('btnCountExactOrange').addEventListener('click', () => {
    document.getElementById('actualOrangeCounted').value = getExpectedOrange();
  });

  document.getElementById('btnCountExactMoov').addEventListener('click', () => {
    document.getElementById('actualMoovCounted').value = getExpectedMoov();
  });

  document.getElementById('btnFinalizeDailyClose').addEventListener('click', async () => {
    const cashCounted = Number(countedInput.value) || 0;
    const cashExpected = getExpectedCash();
    const cashDiff = cashCounted - cashExpected;

    const orangeExpected = getExpectedOrange();
    const orangeChecked = Number(document.getElementById('actualOrangeCounted').value) || orangeExpected;
    const orangeDiff = orangeChecked - orangeExpected;

    const moovExpected = getExpectedMoov();
    const moovChecked = Number(document.getElementById('actualMoovCounted').value) || moovExpected;
    const moovDiff = moovChecked - moovExpected;

    const notes = document.getElementById('closeNotes').value.trim();

    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = state.sales.filter(s => s.timestamp && s.timestamp.startsWith(todayStr));
    const todayExpenses = state.expenses.filter(e => e.timestamp && e.timestamp.startsWith(todayStr));
    const totalSales = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalExp = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

    const payload = {
      date: todayStr,
      closedBy: state.currentUser ? state.currentUser.name : 'Gérant',
      cashExpected,
      cashCounted,
      cashDiff,
      orangeExpected,
      orangeChecked,
      orangeDiff,
      moovExpected,
      moovChecked,
      moovDiff,
      totalSales,
      totalExpenses: totalExp,
      notes
    };

    try {
      const res = await fetch('/api/daily-close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        state.dailyCloses.unshift(data.closeRecord);
        showToast('Clôture validée et archivée !');
        renderDailyClosesArchive();
        renderAuditLogs();
      }
    } catch (err) {
      console.error(err);
    }
  });
}

function getExpectedCash() {
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = state.sales.filter(s => s.timestamp && s.timestamp.startsWith(todayStr));
  const todayExpenses = state.expenses.filter(e => e.timestamp && e.timestamp.startsWith(todayStr));

  const cashSales = todaySales
    .filter(s => s.paymentMethod === 'cash')
    .reduce((sum, s) => sum + s.totalAmount, 0);

  const totalExp = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  return Math.max(0, cashSales - totalExp);
}

function getExpectedOrange() {
  const todayStr = new Date().toISOString().split('T')[0];
  return state.sales
    .filter(s => s.timestamp && s.timestamp.startsWith(todayStr) && s.paymentMethod === 'orange_money')
    .reduce((sum, s) => sum + s.totalAmount, 0);
}

function getExpectedMoov() {
  const todayStr = new Date().toISOString().split('T')[0];
  return state.sales
    .filter(s => s.timestamp && s.timestamp.startsWith(todayStr) && s.paymentMethod === 'moov_money')
    .reduce((sum, s) => sum + s.totalAmount, 0);
}

function renderCloseDaySummary() {
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = state.sales.filter(s => s.timestamp && s.timestamp.startsWith(todayStr));
  const todayExpenses = state.expenses.filter(e => e.timestamp && e.timestamp.startsWith(todayStr));

  let fournitures = 0;
  let services = 0;
  let cashSales = 0;
  let orangeSales = 0;
  let moovSales = 0;
  let creditSales = 0;

  todaySales.forEach(s => {
    (s.items || []).forEach(it => {
      if (it.isService) services += it.total;
      else fournitures += it.total;
    });

    if (s.paymentMethod === 'cash') cashSales += s.totalAmount;
    else if (s.paymentMethod === 'orange_money') orangeSales += s.totalAmount;
    else if (s.paymentMethod === 'moov_money') moovSales += s.totalAmount;
    else if (s.paymentMethod === 'credit') creditSales += s.totalAmount;
  });

  const totalSales = cashSales + orangeSales + moovSales + creditSales;
  const totalExp = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const expectedCash = Math.max(0, cashSales - totalExp);

  document.getElementById('closeSalesFournitures').textContent = formatFcfa(fournitures);
  document.getElementById('closeSalesServices').textContent = formatFcfa(services);
  document.getElementById('closeTotalSales').textContent = formatFcfa(totalSales);
  document.getElementById('closeCashSales').textContent = formatFcfa(cashSales);
  document.getElementById('closeOrangeMoneySales').textContent = formatFcfa(orangeSales);
  document.getElementById('closeMoovMoneySales').textContent = formatFcfa(moovSales);
  document.getElementById('closeCreditSales').textContent = formatFcfa(creditSales);
  document.getElementById('closeTotalExpenses').textContent = `- ${formatFcfa(totalExp)}`;
  document.getElementById('closeExpectedCash').textContent = formatFcfa(expectedCash);

  checkBalancesDifferences();
}

function checkBalancesDifferences() {
  const counted = Number(document.getElementById('actualCashCounted').value);
  const expected = getExpectedCash();
  const diffBox = document.getElementById('cashDiffResult');

  if (isNaN(counted) || document.getElementById('actualCashCounted').value === '') {
    diffBox.className = 'difference-result';
    diffBox.textContent = 'Entrez le comptage espèces pour vérifier les écarts.';
    return;
  }

  const diff = counted - expected;
  if (diff === 0) {
    diffBox.className = 'difference-result perfect';
    diffBox.innerHTML = `CAISSE ESPÈCES PARFAITE : 0 FCFA d'écart !`;
  } else if (diff < 0) {
    diffBox.className = 'difference-result shortage';
    diffBox.innerHTML = `MANQUANT DANS LE TIROIR : <strong>-${formatFcfa(Math.abs(diff))}</strong>`;
  } else {
    diffBox.className = 'difference-result surplus';
    diffBox.innerHTML = `EXCÉDENT DANS LE TIROIR : <strong>+${formatFcfa(diff)}</strong>`;
  }
}

function renderDailyClosesArchive() {
  const tbody = document.getElementById('dailyClosesArchiveTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (state.dailyCloses.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #64748b; padding: 1.5rem;">Aucune clôture archivée.</td></tr>`;
    return;
  }

  state.dailyCloses.forEach(cl => {
    const tr = document.createElement('tr');
    const timeFormatted = cl.closedAt ? new Date(cl.closedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—';
    const isExact = cl.cashDiff === 0;

    tr.innerHTML = `
      <td><strong>${cl.date}</strong></td>
      <td>${timeFormatted}</td>
      <td>${cl.closedBy}</td>
      <td style="font-weight: bold;">${formatFcfa(cl.totalSales)}</td>
      <td>${formatFcfa(cl.cashExpected)}</td>
      <td style="font-weight: bold;">${formatFcfa(cl.cashCounted)}</td>
      <td>
        <span class="badge-status-pill ${isExact ? 'solde' : 'en-cours'}">
          ${isExact ? '0 F (Parfait)' : (cl.cashDiff > 0 ? '+' + formatFcfa(cl.cashDiff) : formatFcfa(cl.cashDiff))}
        </span>
      </td>
      <td>${formatFcfa(cl.orangeChecked)}</td>
      <td>${formatFcfa(cl.moovChecked)}</td>
      <td><span style="font-size: 0.8rem; color: #64748b;">${cl.notes || '—'}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// ==========================================================================
// 11. AUDIT IMMUABLE & SHA-256
// ==========================================================================
function setupAuditListeners() {
  document.getElementById('btnVerifyAuditIntegrity').addEventListener('click', async () => {
    try {
      const res = await fetch('/api/audit/verify');
      const data = await res.json();
      const statusBadge = document.getElementById('auditIntegrityStatus');

      if (data.valid) {
        statusBadge.style.background = 'rgba(34, 197, 94, 0.2)';
        statusBadge.style.borderColor = '#22c55e';
        statusBadge.style.color = '#4ade80';
        statusBadge.innerHTML = `Chaîne Validée : ${data.message} (${data.totalLogs || 0} blocs vérifiés)`;
        showToast('Intégrité SHA-256 inviolée : aucun enregistrement altéré !');
      } else {
        statusBadge.style.background = 'rgba(239, 68, 68, 0.2)';
        statusBadge.style.borderColor = '#ef4444';
        statusBadge.style.color = '#ef4444';
        statusBadge.innerHTML = `ALERTE INTÉGRITÉ : ${data.message}`;
        alert(`ALERTE DE SÉCURITÉ :\n${data.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  });
}

function renderAuditLogs() {
  const tbody = document.getElementById('auditLogsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (state.auditLogs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 2rem;">Aucun événement scellé dans le registre d'audit.</td></tr>`;
    return;
  }

  state.auditLogs.slice(0, 50).forEach(log => {
    const tr = document.createElement('tr');
    const timeFormatted = log.timestamp 
      ? new Date(log.timestamp).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' }) + ' ' + 
        new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit', second:'2-digit' }) 
      : '—';
    const shortHash = log.hash ? log.hash.substring(0, 16) + '...' : '—';
    const fullHash = log.hash || '';

    const d = log.details || {};
    let detailHtml = '';
    let actionBadgeClass = 'badge-secondary';
    let actionLabel = log.action;

    if (log.action === 'VENTE_ENCAISSEE') {
      actionLabel = 'Vente Comptoir';
      actionBadgeClass = 'badge-success';
      const modeLabel = d.mode === 'orange_money' ? 'Orange Money' : d.mode === 'moov_money' ? 'Moov Money' : 'Espèces';
      detailHtml = `
        <div class="audit-detail-row">
          <span class="audit-amount-pill success">+${formatFcfa(d.montant || 0)}</span>
          <span>Client : <strong>${escapeHtml(d.client || 'Client Comptoir')}</strong> • Règlement : <strong>${modeLabel}</strong></span>
        </div>
      `;
    } else if (log.action === 'VENTE_CREDIT') {
      actionLabel = 'Vente à Crédit';
      actionBadgeClass = 'badge-warning';
      detailHtml = `
        <div class="audit-detail-row">
          <span class="audit-amount-pill warning">${formatFcfa(d.montant || 0)}</span>
          <span>Client : <strong>${escapeHtml(d.client || 'Client')}</strong> ${d.phone ? '(' + escapeHtml(d.phone) + ')' : ''} • Créance accordée</span>
        </div>
      `;
    } else if (log.action === 'REGLEMENT_CREDIT_CLIENT') {
      actionLabel = 'Règlement Crédit';
      actionBadgeClass = 'badge-primary';
      detailHtml = `
        <div class="audit-detail-row">
          <span class="audit-amount-pill primary">+${formatFcfa(d.montantPaye || 0)}</span>
          <span>Client : <strong>${escapeHtml(d.client || 'Client')}</strong> • Reste dû après versement : ${formatFcfa(d.resteDu || 0)}</span>
        </div>
      `;
    } else if (log.action === 'REAPPROVISIONNEMENT_FOURNISSEUR') {
      actionLabel = 'Approvisionnement';
      actionBadgeClass = 'badge-purple';
      detailHtml = `
        <div class="audit-detail-row">
          <span class="audit-amount-pill info">+${d.quantiteAjoutee || 0} pcs</span>
          <span><strong>${escapeHtml(d.article || 'Article')}</strong> • Fournisseur : <em>${escapeHtml(d.fournisseur || 'Fournisseur')}</em> • Coût : ${formatFcfa(d.coutTotal || 0)} ${d.detteCreee > 0 ? '<strong class="text-danger">(Dette : ' + formatFcfa(d.detteCreee) + ')</strong>' : '<strong class="text-success">(Comptant)</strong>'}</span>
        </div>
      `;
    } else if (log.action === 'DEPENSE_CAISSE') {
      actionLabel = 'Dépense Caisse';
      actionBadgeClass = 'badge-danger';
      detailHtml = `
        <div class="audit-detail-row">
          <span class="audit-amount-pill danger">-${formatFcfa(d.montant || 0)}</span>
          <span>Motif : <strong>${escapeHtml(d.description || d.motif || 'Sortie')}</strong> • Bénéficiaire : ${escapeHtml(d.beneficiaire || 'Caisse')}</span>
        </div>
      `;
    } else if (log.action === 'CLOTURE_JOURNEE') {
      actionLabel = 'Clôture Caisse';
      actionBadgeClass = 'badge-primary';
      detailHtml = `
        <div class="audit-detail-row">
          <span class="audit-amount-pill neutral">Arrêté du soir</span>
          <span>Total CA : <strong>${formatFcfa(d.totalCA || 0)}</strong> • Espèces comptées : ${formatFcfa(d.especes || 0)}</span>
        </div>
      `;
    } else {
      const keys = Object.keys(d);
      if (keys.length === 0) {
        detailHtml = `<span>Action enregistrée dans le journal.</span>`;
      } else {
        const readable = keys.map(k => `<strong>${escapeHtml(k)}:</strong> ${escapeHtml(String(d[k]))}`).join(' • ');
        detailHtml = `<span>${readable}</span>`;
      }
    }

    tr.innerHTML = `
      <td style="white-space: nowrap; font-size: 0.82rem; color: var(--text-muted);">${timeFormatted}</td>
      <td><span class="badge ${actionBadgeClass}">${actionLabel}</span></td>
      <td><strong>${escapeHtml(log.actorName || 'Système')}</strong> <span class="role-chip">${escapeHtml(log.actorRole || 'auto')}</span></td>
      <td>${detailHtml}</td>
      <td>
        <div class="hash-cell" title="Cliquer pour copier l'empreinte SHA-256 complète" onclick="copyToClipboard('${fullHash}', 'Empreinte SHA-256 copiée !')">
          <code>${shortHash}</code>
          <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ==========================================================================
// 12. DASHBOARD
// ==========================================================================
function setupDashboard() {}

window.switchSubTabToCredits = function() {
  if (typeof playUiSound === 'function') playUiSound('nav');
  const partnersTab = document.querySelector('.nav-tab[data-tab="tab-partners"]');
  if (partnersTab) partnersTab.click();
  const creditSub = document.querySelector('.sub-tab[data-subtab="sub-customer-credits"]');
  if (creditSub) creditSub.click();
};

function renderDashboard() {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(now.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let todaySalesTotal = 0;       // CA facturé du jour (ventes réelles d'articles/services)
  let todaySalesCount = 0;       // Nombre de transactions de vente
  let todayCreditIssued = 0;     // Sommes livrées à terme (ventes à crédit non encaissées)
  let todayCashCollected = 0;    // Espèces encaissées (ventes + règlements crédit)
  let todayOrangeCollected = 0;  // Orange Money encaissé (ventes + règlements crédit)
  let todayMoovCollected = 0;    // Moov Money encaissé (ventes + règlements crédit)
  let todayCreditRepayments = 0; // Recouvrements de créances perçus aujourd'hui

  let weekSalesTotal = 0;
  let monthSalesTotal = 0;

  const articleSalesCount = {};
  const articleSalesRevenue = {};
  const articleCategoryMap = {};

  // Mappage catégories depuis le catalogue
  (state.articles || []).forEach(art => {
    articleCategoryMap[art.name] = art.isService ? 'Prestation' : 'Fourniture';
  });

  state.sales.forEach(sale => {
    const sDate = new Date(sale.timestamp);
    const sDateStr = sale.timestamp ? sale.timestamp.split('T')[0] : '';
    const isToday = (sDateStr === todayStr);

    const isCreditPayment = Boolean(
      sale.isCreditSettlement ||
      (sale.id && sale.id.startsWith('sale-credrec-')) ||
      (sale.items && sale.items.some(it => it.articleId === 'rec-credit' || (it.name && it.name.startsWith('Règlement Crédit'))))
    );

    if (isCreditPayment) {
      // Recouvrement d'une dette client antérieure
      if (isToday) {
        todayCreditRepayments += sale.totalAmount;
        if (sale.paymentMethod === 'cash') todayCashCollected += sale.totalAmount;
        else if (sale.paymentMethod === 'orange_money') todayOrangeCollected += sale.totalAmount;
        else if (sale.paymentMethod === 'moov_money') todayMoovCollected += sale.totalAmount;
      }
      // Ne JAMAIS compter un recouvrement de créance comme un article de papeterie vendu !
      return;
    }

    // Vente authentique d'articles ou de prestations de service
    if (isToday) {
      todaySalesTotal += sale.totalAmount;
      todaySalesCount++;

      if (sale.paymentMethod === 'cash') todayCashCollected += sale.totalAmount;
      else if (sale.paymentMethod === 'orange_money') todayOrangeCollected += sale.totalAmount;
      else if (sale.paymentMethod === 'moov_money') todayMoovCollected += sale.totalAmount;
      else if (sale.paymentMethod === 'credit') todayCreditIssued += sale.totalAmount;
    }

    if (sDate >= sevenDaysAgo) weekSalesTotal += sale.totalAmount;
    if (sDate >= monthStart) {
      monthSalesTotal += sale.totalAmount;
      (sale.items || []).forEach(it => {
        if (!it.name || it.articleId === 'rec-credit' || it.name.startsWith('Règlement Crédit')) return;
        articleSalesCount[it.name] = (articleSalesCount[it.name] || 0) + (it.quantity || 1);
        articleSalesRevenue[it.name] = (articleSalesRevenue[it.name] || 0) + (it.total || 0);
        if (it.isService !== undefined) {
          articleCategoryMap[it.name] = it.isService ? 'Prestation' : 'Fourniture';
        }
      });
    }
  });

  const pendingCredits = state.credits
    .filter(c => c.status === 'en_cours')
    .reduce((sum, c) => sum + (c.remainingAmount || 0), 0);
  const pendingCount = state.credits.filter(c => c.status === 'en_cours').length;

  let stockMarketVal = 0;
  let lowStockCount = 0;
  (state.articles || []).forEach(art => {
    if (!art.isService) {
      stockMarketVal += (art.salePrice || 0) * (art.stock || 0);
      if (art.stock <= (art.minAlertStock || 5)) lowStockCount++;
    }
  });

  // Calcul des liquidités totales réellement perçues aujourd'hui
  const totalLiquidites = todayCashCollected + todayOrangeCollected + todayMoovCollected;

  // Mise à jour des cartes KPI
  document.getElementById('kpiTodaySales').textContent = formatFcfa(todaySalesTotal);
  document.getElementById('kpiTodayTransactions').textContent = `${todaySalesCount} vente(s) • ${formatFcfa(totalLiquidites)} encaissés`;
  document.getElementById('kpiWeekSales').textContent = formatFcfa(weekSalesTotal);
  const kpiM = document.getElementById('kpiMonthSales'); if (kpiM) kpiM.textContent = formatFcfa(monthSalesTotal);
  document.getElementById('kpiPendingCredits').textContent = formatFcfa(pendingCredits);
  document.getElementById('kpiPendingCreditsCount').textContent = `${pendingCount} client(s) débiteur(s)`;
  const elStock = document.getElementById('kpiStockValue'); if (elStock) elStock.textContent = formatFcfa(stockMarketVal);
  const elLow = document.getElementById('kpiLowStockAlerts'); if (elLow) elLow.textContent = `${lowStockCount} article(s) sous le seuil`;

  // Top 5 des Ventes du Mois (Articles & Services uniquement)
  const topListEl = document.getElementById('dashTopProductsList');
  topListEl.innerHTML = '';

  const sortedArticles = Object.keys(articleSalesCount)
    .sort((a, b) => articleSalesRevenue[b] - articleSalesRevenue[a])
    .slice(0, 5);

  if (sortedArticles.length === 0) {
    topListEl.innerHTML = `
      <div class="top-product-row">
        <div class="top-prod-rank rank-gold">1</div>
        <div class="top-prod-info">
          <div class="top-prod-title">Photocopie A4 N&B (Recto)</div>
          <div class="top-prod-meta">
            <span class="top-prod-tag tag-service">Prestation</span>
            <span class="top-prod-qty">Volume de référence : 450 pages</span>
          </div>
        </div>
        <div class="top-prod-amount">11 250 FCFA</div>
      </div>
      <div class="top-product-row">
        <div class="top-prod-rank rank-silver">2</div>
        <div class="top-prod-info">
          <div class="top-prod-title">Stylo Bic Cristal Bleu Original</div>
          <div class="top-prod-meta">
            <span class="top-prod-tag tag-fourniture">Fourniture</span>
            <span class="top-prod-qty">Volume de référence : 85 stylos</span>
          </div>
        </div>
        <div class="top-prod-amount">8 500 FCFA</div>
      </div>
    `;
  } else {
    sortedArticles.forEach((name, idx) => {
      const row = document.createElement('div');
      row.className = 'top-product-row';

      let rankClass = 'rank-normal';
      if (idx === 0) rankClass = 'rank-gold';
      else if (idx === 1) rankClass = 'rank-silver';
      else if (idx === 2) rankClass = 'rank-bronze';

      const catLabel = articleCategoryMap[name] || 'Article';
      const catTagClass = catLabel === 'Prestation' ? 'tag-service' : 'tag-fourniture';

      row.innerHTML = `
        <div class="top-prod-rank ${rankClass}">#${idx + 1}</div>
        <div class="top-prod-info">
          <div class="top-prod-title">${escapeHtml(name)}</div>
          <div class="top-prod-meta">
            <span class="top-prod-tag ${catTagClass}">${catLabel}</span>
            <span class="top-prod-qty">${articleSalesCount[name]} unité(s) vendue(s)</span>
          </div>
        </div>
        <div class="top-prod-amount">${formatFcfa(articleSalesRevenue[name])}</div>
      `;
      topListEl.appendChild(row);
    });
  }

  // Encaissements Réels & Trésorerie vs Créances
  const payBox = document.getElementById('dashPayBreakdown');
  const sumIn = totalLiquidites || 1;
  const cashPct = totalLiquidites > 0 ? Math.round((todayCashCollected / sumIn) * 100) : 0;
  const orangePct = totalLiquidites > 0 ? Math.round((todayOrangeCollected / sumIn) * 100) : 0;
  const moovPct = totalLiquidites > 0 ? Math.round((todayMoovCollected / sumIn) * 100) : 0;

  payBox.innerHTML = `
    <!-- Barre 1: Espèces -->
    <div class="pay-bar-item">
      <div class="pay-bar-header">
        <div class="pay-bar-label">
          <span class="pay-bar-badge badge-cash">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Espèces (Cash)
          </span>
          <span class="text-muted" style="font-size: 0.74rem;">(Tiroir Caisse)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="pay-bar-val">${formatFcfa(todayCashCollected)}</span>
          <span class="text-muted" style="font-size: 0.75rem; font-weight: 700;">${cashPct}%</span>
        </div>
      </div>
      <div class="pay-bar-track">
        <div class="pay-bar-fill fill-cash" style="width: ${cashPct}%;"></div>
      </div>
    </div>

    <!-- Barre 2: Orange Money -->
    <div class="pay-bar-item">
      <div class="pay-bar-header">
        <div class="pay-bar-label">
          <span class="pay-bar-badge badge-orange">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
            Orange Money
          </span>
          <span class="text-muted" style="font-size: 0.74rem;">(Compte Marchand)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="pay-bar-val">${formatFcfa(todayOrangeCollected)}</span>
          <span class="text-muted" style="font-size: 0.75rem; font-weight: 700;">${orangePct}%</span>
        </div>
      </div>
      <div class="pay-bar-track">
        <div class="pay-bar-fill fill-orange" style="width: ${orangePct}%;"></div>
      </div>
    </div>

    <!-- Barre 3: Moov Money -->
    <div class="pay-bar-item">
      <div class="pay-bar-header">
        <div class="pay-bar-label">
          <span class="pay-bar-badge badge-moov">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
            Moov Money
          </span>
          <span class="text-muted" style="font-size: 0.74rem;">(Compte Flooz)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="pay-bar-val">${formatFcfa(todayMoovCollected)}</span>
          <span class="text-muted" style="font-size: 0.75rem; font-weight: 700;">${moovPct}%</span>
        </div>
      </div>
      <div class="pay-bar-track">
        <div class="pay-bar-fill fill-moov" style="width: ${moovPct}%;"></div>
      </div>
    </div>

    <!-- Banner Total Trésorerie Encaissée -->
    <div class="pay-total-banner">
      <div class="pay-total-banner-label">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <span>Total Trésorerie Réellement Encaissée</span>
      </div>
      <div class="pay-total-banner-val">${formatFcfa(totalLiquidites)}</div>
    </div>

    <!-- Box Créances Clients & Ventes à Crédit du Jour -->
    <div class="credit-alert-box">
      <div class="credit-alert-header">
        <div class="credit-alert-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>Ventes à Crédit du Jour (Non Encaissées)</span>
        </div>
        <div class="credit-alert-amount">${formatFcfa(todayCreditIssued)}</div>
      </div>
      <div class="credit-alert-desc">
        Ces marchandises ont été remises sans paiement immédiat. Le montant est inscrit au carnet des créances clients et sera perçu lors du recouvrement.
      </div>
      <button type="button" class="btn-goto-credits" onclick="switchSubTabToCredits()">
        <span>Consulter le Carnet des Crédits & Impayés</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </button>
    </div>
  `;
}

// ==========================================================================
// 13. SYNCHRONISATION & DÉLESTAGE
// ==========================================================================
function setupSyncListeners() {
  document.getElementById('btnSimulateMobileSync').addEventListener('click', async () => {
    if (state.offlineBuffer.length === 0) {
      state.offlineBuffer.push({
        id: 'sale-offline-' + Date.now(),
        timestamp: new Date().toISOString(),
        items: [
          { name: 'Stylo Bic Cristal Bleu Original', quantity: 2, unitPrice: 100, total: 200, isService: false },
          { name: 'Photocopie A4 N&B (Recto)', quantity: 10, unitPrice: 25, total: 250, isService: true }
        ],
        totalAmount: 450,
        paymentMethod: 'cash',
        customerName: 'Client Délestage Sonabel',
        sellerName: 'Vendeur Mobile',
        deviceSource: 'android_backup'
      });
    }

    try {
      const res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sales: state.offlineBuffer })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`Synchronisation réussie : ${data.addedCount} ventes rapatriées sur le PC !`);
        state.offlineBuffer = [];
        await loadInitialData();
      }
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de la synchronisation');
    }
  });

  document.getElementById('btnDownloadCurrentBackup').addEventListener('click', () => {
    window.location.href = '/api/sync/export-file';
  });

  const fileInput = document.getElementById('usbFileInput');
  document.getElementById('btnTriggerUsbImport').addEventListener('click', () => { fileInput.click(); });

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const res = await fetch('/api/sync/import-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json)
        });
        if (res.ok) {
          const result = await res.json();
          showToast(`Importation réussie : ${result.addedCount} nouvelles ventes intégrées !`);
          await loadInitialData();
        }
      } catch (err) {
        alert('Erreur lors de la lecture du fichier : format non reconnu.');
      }
    };
    reader.readAsText(file);
  });
}

// ==========================================================================
// 14. PARAMÈTRES & UTILISATEURS
// ==========================================================================
function setupSettingsListeners() {
  const logoInput = document.getElementById('logoFileInput');
  document.getElementById('btnTriggerLogoUpload').addEventListener('click', () => { logoInput.click(); });

  logoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1048576) {
      alert('Veuillez sélectionner une image de moins de 1 Mo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      state.settings.logo = event.target.result;
      updateLogoPreviews();
      showToast('Logo importé ! Cliquez sur "Enregistrer les Paramètres".');
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('btnRemoveLogo').addEventListener('click', () => {
    state.settings.logo = "";
    updateLogoPreviews();
    showToast('Logo retiré.');
  });

  document.getElementById('formSettings').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      shopName: document.getElementById('setShopName').value.trim(),
      tagline: document.getElementById('setTagline').value.trim(),
      phone1: document.getElementById('setPhone1').value.trim(),
      phone2: document.getElementById('setPhone2').value.trim(),
      address: document.getElementById('setAddress').value.trim(),
      ifu: document.getElementById('setIfu').value.trim(),
      rccm: document.getElementById('setRccm').value.trim(),
      invoicePrefix: document.getElementById('setInvoicePrefix').value.trim(),
      footerNotice: document.getElementById('setFooterNotice').value.trim(),
      logo: state.settings.logo || ""
    };

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        state.settings = payload;
        showToast('Paramètres de la boutique enregistrés !');
        renderShopInfo();
        renderCurrentInvoice();
      }
    } catch (err) {
      console.error(err);
    }
  });

  document.getElementById('btnOpenNewUserModal').addEventListener('click', () => {
    document.getElementById('formNewUser').reset();
    document.getElementById('modalNewUser').classList.add('active');
  });

  document.getElementById('formNewUser').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('newUserName').value.trim();
    const role = document.getElementById('newUserRole').value;
    const pin = document.getElementById('newUserPin').value.trim();

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role, pin, active: true })
      });
      if (res.ok) {
        const data = await res.json();
        state.users = data.users;
        document.getElementById('modalNewUser').classList.remove('active');
        showToast(`Utilisateur ${name} ajouté !`);
        renderUserSelect();
        renderUsersTable();
      }
    } catch (err) {
      console.error(err);
    }
  });
}

function updateLogoPreviews() {
  const preview = document.getElementById('settingsLogoPreview');
  const sideLogo = document.getElementById('sidebarLogoContainer') || document.getElementById('topbarLogoContainer');
  const a4Logo = document.getElementById('a4LogoBox');

  if (state.settings.logo) {
    if (preview) preview.innerHTML = `<img src="${state.settings.logo}" alt="Logo">`;
    if (sideLogo) sideLogo.innerHTML = `<img src="${state.settings.logo}" alt="Logo">`;
    if (a4Logo) a4Logo.innerHTML = `<img src="${state.settings.logo}" alt="Logo">`;
  } else {
    if (preview) preview.innerHTML = `<svg class="svg-icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/></svg>`;
    if (sideLogo) sideLogo.innerHTML = `<svg class="brand-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>`;
    if (a4Logo) a4Logo.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/></svg>`;
  }
}

function renderShopInfo() {
  const s = state.settings;
  if (!s) return;

  const shopNameEl = document.getElementById('sidebarShopName') || document.getElementById('topbarShopName');
  if (shopNameEl) shopNameEl.textContent = s.shopName || 'Secrétariat Public';
  const taglineEl = document.getElementById('sidebarTagline') || document.getElementById('topbarTagline');
  if (taglineEl) taglineEl.textContent = s.tagline || '';

  const setShopName = document.getElementById('setShopName');
  if (setShopName) setShopName.value = s.shopName || '';
  const setTagline = document.getElementById('setTagline');
  if (setTagline) setTagline.value = s.tagline || '';
  const setPhone1 = document.getElementById('setPhone1');
  if (setPhone1) setPhone1.value = s.phone1 || '';
  const setPhone2 = document.getElementById('setPhone2');
  if (setPhone2) setPhone2.value = s.phone2 || '';
  const setAddress = document.getElementById('setAddress');
  if (setAddress) setAddress.value = s.address || '';
  const setIfu = document.getElementById('setIfu');
  if (setIfu) setIfu.value = s.ifu || '';
  const setRccm = document.getElementById('setRccm');
  if (setRccm) setRccm.value = s.rccm || '';
  const setInvoicePrefix = document.getElementById('setInvoicePrefix');
  if (setInvoicePrefix) setInvoicePrefix.value = s.invoicePrefix || 'FAC-2026-';
  const setFooterNotice = document.getElementById('setFooterNotice');
  if (setFooterNotice) setFooterNotice.value = s.footerNotice || '';

  updateLogoPreviews();
}

function renderUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  state.users.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${u.name}</strong></td>
      <td><span class="user-role-badge" style="background-color: ${u.role === 'gerant' ? '#0f172a' : '#0d9488'};">${u.role === 'gerant' ? 'Gérant' : 'Vendeur'}</span></td>
      <td><code>••••</code> (${u.pin ? u.pin.replace(/./g, '•') : 'Aucun'})</td>
      <td><span class="badge-status-pill solde">Actif</span></td>
      <td><button class="btn btn-text text-muted btn-sm" onclick="alert('PIN de ${u.name} : ${u.pin}')">Voir PIN</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function setupModals() {
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal, .modal-overlay').forEach(m => m.classList.remove('active'));
    });
  });

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal') || e.target.classList.contains('modal-overlay')) {
      e.target.classList.remove('active');
    }
  });

  // Keyboard shortcut: Escape closes modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal, .modal-overlay').forEach(m => m.classList.remove('active'));
    }
    if (e.key === 'F1') {
      e.preventDefault();
      switchTab('tab-pos');
    }
    if (e.key === 'F3') {
      e.preventDefault();
      switchTab('tab-invoices');
    }
  });
}

function showToast(message) {
  const toast = document.getElementById('toastNotification');
  toast.textContent = message;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3500);
}
