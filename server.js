const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const PORT = process.env.PORT || 3500;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default initial database with realistic data for Ouagadougou
const DEFAULT_DATA = {
  settings: {
    shopName: "Secrétariat Public & Librairie Le Progrès",
    tagline: "Fournitures scolaires - Bureautique - Photocopies & Saisie de documents",
    phone1: "+226 70 00 11 22",
    phone2: "+226 76 33 44 55 (WhatsApp)",
    city: "Ouagadougou",
    address: "Secteur 28, face au Lycée Bogodogo",
    ifu: "00123456Z",
    rccm: "BF OUA 2024 A 1234",
    invoicePrefix: "FAC-2026-",
    currency: "FCFA",
    footerNotice: "Les marchandises vendues ne sont ni reprises ni échangées après 48h. Merci de votre confiance !",
    logo: "",
    multiUserEnabled: true
  },
  users: [
    { id: "usr-1", name: "M. Ouédraogo", role: "gerant", pin: "1234", active: true },
    { id: "usr-2", name: "Aminata", role: "vendeur", pin: "0000", active: true },
    { id: "usr-3", name: "Karim", role: "vendeur", pin: "1111", active: true }
  ],
  customers: [
    {
      id: "cust-1",
      name: "M. Kaboré",
      phone: "+226 71 22 33 44",
      company: "Collège Privé Sainte-Famille",
      address: "Ouagadougou, Secteur 22",
      totalPurchases: 45000,
      currentDebt: 3000,
      createdAt: "2026-11-01"
    },
    {
      id: "cust-2",
      name: "M. Sawadogo",
      phone: "+226 70 12 34 56",
      company: "Complexe Scolaire Wend-Panga",
      address: "Ouagadougou, Secteur 28",
      totalPurchases: 82000,
      currentDebt: 13500,
      createdAt: "2026-11-02"
    },
    {
      id: "cust-3",
      name: "Me Traoré",
      phone: "+226 76 88 99 00",
      company: "Cabinet Juridique Traoré & Associés",
      address: "Avenue Bassawarga, Ouaga",
      totalPurchases: 25000,
      currentDebt: 0,
      createdAt: "2026-11-05"
    },
    {
      id: "cust-4",
      name: "Issa Ouédraogo",
      phone: "+226 78 55 44 33",
      company: "Étudiant Master Université Ki-Zerbo",
      address: "Zogona, Ouaga",
      totalPurchases: 12500,
      currentDebt: 0,
      createdAt: "2026-11-10"
    }
  ],
  suppliers: [
    {
      id: "sup-1",
      name: "Éts Diallo & Frères (Grossiste Rood-Woko)",
      phone: "+226 76 11 22 33",
      address: "Grand Marché Rood-Woko, Hall C N° 45",
      contactPerson: "El Hadj Diallo",
      articlesSupplied: "Rames papier Double A, Stylos Bic, Matériel d'écriture",
      totalPurchases: 350000,
      totalPaid: 315000,
      currentDebt: 35000,
      ordersHistory: [
        {
          id: "ord-1",
          date: "2026-11-10",
          articleName: "Rame Papier A4 Double A (80g)",
          quantityDesc: "4 cartons (20 rames)",
          totalCost: 70000,
          paidUpfront: 35000,
          debtAdded: 35000,
          paymentType: "credit",
          invoiceRef: "BON-DW-889"
        }
      ]
    },
    {
      id: "sup-2",
      name: "Papeterie Centrale du Burkina",
      phone: "+226 25 30 40 50",
      address: "Avenue Kwamé N'Krumah, Ouaga",
      contactPerson: "M. Zida",
      articlesSupplied: "Cahiers 100p/200p, Chemises, Spirales de reliure",
      totalPurchases: 180000,
      totalPaid: 180000,
      currentDebt: 0,
      ordersHistory: []
    }
  ],
  supplierDebts: [
    {
      id: "sdeb-1",
      supplierId: "sup-1",
      supplierName: "Éts Diallo & Frères (Grossiste Rood-Woko)",
      date: "2026-11-10",
      invoiceRef: "BON-DW-889",
      totalAmount: 70000,
      paidAmount: 35000,
      remainingAmount: 35000,
      status: "en_cours",
      description: "Achat de 4 cartons de Rames Double A (20 rames)",
      payments: [
        {
          id: "spay-1",
          date: "2026-11-10",
          amount: 35000,
          method: "orange_money",
          paidBy: "M. Ouédraogo",
          note: "Acompte Orange Money à la livraison"
        }
      ]
    }
  ],
  articles: [
    {
      id: "art-1",
      name: "Photocopie A4 N&B (Recto)",
      category: "service",
      salePrice: 25,
      isBulkManaged: false,
      stock: 9999,
      unitSale: "page",
      costPrice: 8,
      isService: true,
      iconType: "copy"
    },
    {
      id: "art-2",
      name: "Photocopie A4 N&B (Recto-Verso)",
      category: "service",
      salePrice: 50,
      isBulkManaged: false,
      stock: 9999,
      unitSale: "page",
      costPrice: 15,
      isService: true,
      iconType: "copy"
    },
    {
      id: "art-3",
      name: "Impression A4 N&B (USB / WhatsApp)",
      category: "service",
      salePrice: 100,
      isBulkManaged: false,
      stock: 9999,
      unitSale: "page",
      costPrice: 25,
      isService: true,
      iconType: "printer"
    },
    {
      id: "art-4",
      name: "Impression A4 Couleur",
      category: "service",
      salePrice: 250,
      isBulkManaged: false,
      stock: 9999,
      unitSale: "page",
      costPrice: 80,
      isService: true,
      iconType: "printer"
    },
    {
      id: "art-5",
      name: "Saisie de document (Page standard)",
      category: "service",
      salePrice: 500,
      isBulkManaged: false,
      stock: 9999,
      unitSale: "page",
      costPrice: 0,
      isService: true,
      iconType: "keyboard"
    },
    {
      id: "art-6",
      name: "Stylo Bic Cristal Bleu Original",
      category: "fourniture",
      salePrice: 100,
      isBulkManaged: true,
      bulkName: "Boîte de 50 stylos",
      bulkQuantity: 50,
      bulkPurchaseCost: 3500,
      costPrice: 70,
      stock: 145,
      minAlertStock: 25,
      unitSale: "stylo",
      isService: false,
      iconType: "pen"
    },
    {
      id: "art-7",
      name: "Stylo Bic Cristal Rouge Original",
      category: "fourniture",
      salePrice: 100,
      isBulkManaged: true,
      bulkName: "Boîte de 50 stylos",
      bulkQuantity: 50,
      bulkPurchaseCost: 3500,
      costPrice: 70,
      stock: 45,
      minAlertStock: 15,
      unitSale: "stylo",
      isService: false,
      iconType: "pen"
    },
    {
      id: "art-8",
      name: "Cahier 100 pages (17x22 Petits Carreaux)",
      category: "fourniture",
      salePrice: 350,
      isBulkManaged: true,
      bulkName: "Paquet de 10 cahiers",
      bulkQuantity: 10,
      bulkPurchaseCost: 2800,
      costPrice: 280,
      stock: 65,
      minAlertStock: 15,
      unitSale: "cahier",
      isService: false,
      iconType: "book"
    },
    {
      id: "art-9",
      name: "Cahier 200 pages (17x22 Petits Carreaux)",
      category: "fourniture",
      salePrice: 650,
      isBulkManaged: true,
      bulkName: "Paquet de 10 cahiers",
      bulkQuantity: 10,
      bulkPurchaseCost: 5200,
      costPrice: 520,
      stock: 48,
      minAlertStock: 10,
      unitSale: "cahier",
      isService: false,
      iconType: "book"
    },
    {
      id: "art-10",
      name: "Rame Papier A4 Double A (80g / 500f)",
      category: "fourniture",
      salePrice: 4000,
      isBulkManaged: true,
      bulkName: "Carton de 5 rames",
      bulkQuantity: 5,
      bulkPurchaseCost: 17500,
      costPrice: 3500,
      stock: 18,
      minAlertStock: 5,
      unitSale: "rame",
      isService: false,
      iconType: "file"
    },
    {
      id: "art-11",
      name: "Chemise cartonnée rabat (Dossiers)",
      category: "fourniture",
      salePrice: 150,
      isBulkManaged: true,
      bulkName: "Paquet de 50 chemises",
      bulkQuantity: 50,
      bulkPurchaseCost: 5000,
      costPrice: 100,
      stock: 85,
      minAlertStock: 20,
      unitSale: "chemise",
      isService: false,
      iconType: "folder"
    },
    {
      id: "art-12",
      name: "Plastification de document A4",
      category: "service",
      salePrice: 300,
      isBulkManaged: false,
      stock: 9999,
      unitSale: "pièce",
      costPrice: 75,
      isService: true,
      iconType: "shield"
    },
    {
      id: "art-13",
      name: "Reliure spirale (Dossier d'étudiant)",
      category: "service",
      salePrice: 500,
      isBulkManaged: false,
      stock: 9999,
      unitSale: "dossier",
      costPrice: 120,
      isService: true,
      iconType: "layers"
    },
    {
      id: "art-14",
      name: "Option Finition : Agrafage dossier lourd",
      category: "service",
      salePrice: 50,
      isBulkManaged: false,
      stock: 9999,
      unitSale: "service",
      costPrice: 5,
      isService: true,
      iconType: "paperclip"
    }
  ],
  sales: [],
  expenses: [],
  credits: [
    {
      id: "crd-1",
      saleId: "sale-demo-1",
      date: new Date().toISOString().split('T')[0],
      customerName: "M. Sawadogo",
      customerPhone: "+226 70 12 34 56",
      customerStructure: "Complexe Scolaire Wend-Panga",
      totalAmount: 18500,
      paidAmount: 5000,
      remainingAmount: 13500,
      status: "en_cours",
      note: "Commande de ramettes pour examens",
      payments: [
        {
          id: "pay-1",
          date: new Date().toISOString().split('T')[0],
          amount: 5000,
          method: "cash",
          receivedBy: "Aminata",
          note: "Acompte versé à la commande"
        }
      ]
    }
  ],
  invoices: [],
  dailyCloses: [],
  auditLogs: []
};

// Cryptographic hash chain for immutable audit log
function addAuditLog(db, action, actorName, actorRole, details) {
  const timestamp = new Date().toISOString();
  const lastLog = db.auditLogs && db.auditLogs.length > 0 ? db.auditLogs[0] : null;
  const prevHash = lastLog ? lastLog.hash : "GENESIS_HASH_BURKINA_POS_2026";

  const dataToHash = `${prevHash}|${timestamp}|${action}|${actorName}|${actorRole}|${JSON.stringify(details)}`;
  const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');

  const logEntry = {
    id: "log-" + Date.now() + "-" + crypto.randomBytes(2).toString('hex'),
    timestamp,
    action,
    actorName: actorName || "Système",
    actorRole: actorRole || "admin",
    details,
    prevHash,
    hash
  };

  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift(logEntry);
  return logEntry;
}

function verifyAuditChain(db) {
  if (!db.auditLogs || db.auditLogs.length === 0) {
    return { valid: true, message: "Aucun log enregistré pour le moment." };
  }

  const logs = [...db.auditLogs].reverse();
  for (let i = 0; i < logs.length; i++) {
    const cur = logs[i];
    const expectedPrevHash = i === 0 ? "GENESIS_HASH_BURKINA_POS_2026" : logs[i - 1].hash;

    if (cur.prevHash !== expectedPrevHash) {
      return {
        valid: false,
        brokenIndex: i,
        logId: cur.id,
        message: `Rupture de chaîne au log #${cur.id}`
      };
    }

    const dataToHash = `${cur.prevHash}|${cur.timestamp}|${cur.action}|${cur.actorName}|${cur.actorRole}|${JSON.stringify(cur.details)}`;
    const computedHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

    if (computedHash !== cur.hash) {
      return {
        valid: false,
        brokenIndex: i,
        logId: cur.id,
        message: `Altération détectée au log #${cur.id} (hash invalide)`
      };
    }
  }

  return { valid: true, totalLogs: logs.length, message: "Intégrité cryptographique SHA-256 vérifiée : 100% inviolé." };
}

function loadDatabase() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = JSON.parse(JSON.stringify(DEFAULT_DATA));
      addAuditLog(initial, "INITIALISATION_SYSTEME", "Système", "admin", { note: "Création de la base locale" });
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);

    if (!parsed.customers) parsed.customers = DEFAULT_DATA.customers;
    if (!parsed.suppliers) parsed.suppliers = DEFAULT_DATA.suppliers;
    if (!parsed.supplierDebts) parsed.supplierDebts = DEFAULT_DATA.supplierDebts;
    if (!parsed.credits) parsed.credits = DEFAULT_DATA.credits;
    if (!parsed.users) parsed.users = DEFAULT_DATA.users;
    if (!parsed.auditLogs) parsed.auditLogs = [];
    if (!parsed.dailyCloses) parsed.dailyCloses = [];
    if (!parsed.settings.logo) parsed.settings.logo = "";

    return parsed;
  } catch (err) {
    console.error('Error loading DB:', err);
    return DEFAULT_DATA;
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ylrnxuphtaoazlhlmnsd.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlscm54dXBodGFvYXpsaGxtbnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzMDc3NDgsImV4cCI6MjEwMTg4Mzc0OH0._F9Kr-vgD_nahWhVfYJDhP8xRhDw_HyukIHWw5yOC8g';

async function syncToSupabase(db) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  try {
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    };

    if (db.settings) {
      await fetch(`${SUPABASE_URL}/rest/v1/ouaga_pos_settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify([{ id: 'default', data: db.settings }])
      }).catch(() => {});
    }
  } catch (err) {
    // Non-blocking in offline mode
  }
}

function saveDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    // Read-only serverless disk handling
  }
  syncToSupabase(data).catch(() => {});
}

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  if (pathname.startsWith('/api/')) {
    handleApi(req, res, pathname, parsedUrl);
    return;
  }

  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Accès interdit');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        res.end('Erreur serveur lors de la lecture du fichier');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        resolve(parsed);
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

async function handleApi(req, res, pathname, parsedUrl) {
  const sendJson = (status, payload) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(payload));
  };

  const db = loadDatabase();

  try {
    // GET /api/data -> Full database state
    if (req.method === 'GET' && pathname === '/api/data') {
      const localIps = getLocalIpAddresses();
      sendJson(200, {
        ...db,
        serverInfo: {
          port: PORT,
          localIps: localIps,
          primaryIp: localIps[0] || '127.0.0.1',
          serverTime: new Date().toISOString()
        }
      });
      return;
    }

    // POST /api/sales -> Record a new sale (POS)
    if (req.method === 'POST' && pathname === '/api/sales') {
      const payload = await readJsonBody(req);
      const saleId = payload.id || 'sale-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex');
      const actorName = payload.sellerName || 'Caissier';
      const actorRole = payload.sellerRole || 'vendeur';

      const sale = {
        id: saleId,
        timestamp: payload.timestamp || new Date().toISOString(),
        items: payload.items || [],
        totalAmount: payload.totalAmount || 0,
        paymentMethod: payload.paymentMethod || 'cash',
        amountTendered: payload.amountTendered || payload.totalAmount || 0,
        changeGiven: payload.changeGiven || 0,
        customerName: payload.customerName || 'Client Comptoir',
        customerPhone: payload.customerPhone || '',
        customerCompany: payload.customerCompany || '',
        sellerName: actorName,
        sellerRole: actorRole,
        deviceSource: payload.deviceSource || 'desktop',
        isInvoiceGenerated: payload.isInvoiceGenerated || false,
        note: payload.note || ''
      };

      // Deduct stock for physical goods
      for (const item of sale.items) {
        const art = db.articles.find(a => a.id === item.articleId);
        if (art && !art.isService) {
          art.stock = Math.max(0, (art.stock || 0) - (item.quantity || 0));
        }
      }

      // Upsert customer in customer directory
      if (sale.customerName && sale.customerName !== 'Client Comptoir') {
        let existingCust = db.customers.find(c => 
          (sale.customerPhone && c.phone === sale.customerPhone) || 
          (c.name.toLowerCase() === sale.customerName.toLowerCase())
        );

        if (existingCust) {
          existingCust.totalPurchases = (existingCust.totalPurchases || 0) + sale.totalAmount;
          if (sale.paymentMethod === 'credit') {
            existingCust.currentDebt = (existingCust.currentDebt || 0) + sale.totalAmount;
          }
          if (sale.customerPhone && !existingCust.phone) existingCust.phone = sale.customerPhone;
          if (sale.customerCompany && !existingCust.company) existingCust.company = sale.customerCompany;
        } else {
          db.customers.unshift({
            id: 'cust-' + Date.now(),
            name: sale.customerName,
            phone: sale.customerPhone || '',
            company: sale.customerCompany || '',
            address: 'Ouagadougou',
            totalPurchases: sale.totalAmount,
            currentDebt: sale.paymentMethod === 'credit' ? sale.totalAmount : 0,
            createdAt: new Date().toISOString().split('T')[0]
          });
        }
      }

      // If paymentMethod is CREDIT: create a customer credit entry
      if (sale.paymentMethod === 'credit') {
        const creditRecord = {
          id: 'crd-' + Date.now(),
          saleId: sale.id,
          date: sale.timestamp.split('T')[0],
          customerName: sale.customerName,
          customerPhone: sale.customerPhone,
          customerStructure: sale.customerCompany,
          totalAmount: sale.totalAmount,
          paidAmount: 0,
          remainingAmount: sale.totalAmount,
          status: 'en_cours',
          note: sale.note || 'Vente à crédit enregistrée au comptoir',
          payments: []
        };
        db.credits.unshift(creditRecord);

        addAuditLog(db, "VENTE_CREDIT", actorName, actorRole, {
          saleId: sale.id,
          client: sale.customerName,
          phone: sale.customerPhone,
          montant: sale.totalAmount
        });
      } else {
        addAuditLog(db, "VENTE_ENCAISSEE", actorName, actorRole, {
          saleId: sale.id,
          montant: sale.totalAmount,
          mode: sale.paymentMethod,
          client: sale.customerName
        });
      }

      db.sales.unshift(sale);
      saveDatabase(db);
      sendJson(201, { success: true, sale, articles: db.articles, credits: db.credits, customers: db.customers });
      return;
    }

    // POST /api/articles/restock -> Intelligent Restock with Supplier Linkage (Cash or Credit!)
    if (req.method === 'POST' && pathname === '/api/articles/restock') {
      const payload = await readJsonBody(req);
      const {
        articleId,
        supplierId,
        newSupplierName,
        newSupplierPhone,
        bulkQuantityAdded,
        unitQuantityAdded,
        purchaseCostTotal,
        paymentType, // 'cash' or 'credit'
        paidUpfront,
        invoiceRef,
        restockedBy
      } = payload;

      const art = db.articles.find(a => a.id === articleId);
      if (!art) {
        sendJson(404, { error: 'Article introuvable' });
        return;
      }

      let addedUnits = 0;
      if (bulkQuantityAdded && art.isBulkManaged) {
        addedUnits += bulkQuantityAdded * (art.bulkQuantity || 1);
      }
      if (unitQuantityAdded) {
        addedUnits += unitQuantityAdded;
      }

      art.stock = (art.stock || 0) + addedUnits;

      const costTotal = Number(purchaseCostTotal) || 0;
      if (costTotal > 0 && addedUnits > 0) {
        art.costPrice = Math.round(costTotal / addedUnits);
      }

      // Handle Supplier Linkage
      let targetSupplier = null;
      if (supplierId && supplierId !== 'new') {
        targetSupplier = db.suppliers.find(s => s.id === supplierId);
      } else if (newSupplierName && newSupplierName.trim()) {
        targetSupplier = {
          id: 'sup-' + Date.now(),
          name: newSupplierName.trim(),
          phone: newSupplierPhone ? newSupplierPhone.trim() : '',
          address: 'Ouagadougou',
          contactPerson: '',
          articlesSupplied: art.name,
          totalPurchases: 0,
          totalPaid: 0,
          currentDebt: 0,
          ordersHistory: []
        };
        db.suppliers.unshift(targetSupplier);
      }

      const paidNow = Number(paidUpfront) || (paymentType === 'cash' ? costTotal : 0);
      const debtAmount = Math.max(0, costTotal - paidNow);

      if (targetSupplier) {
        targetSupplier.totalPurchases = (targetSupplier.totalPurchases || 0) + costTotal;
        targetSupplier.totalPaid = (targetSupplier.totalPaid || 0) + paidNow;
        targetSupplier.currentDebt = (targetSupplier.currentDebt || 0) + debtAmount;

        const orderRecord = {
          id: 'ord-' + Date.now(),
          date: new Date().toISOString().split('T')[0],
          articleName: art.name,
          quantityDesc: `${bulkQuantityAdded || 0} carton(s) / ${addedUnits} ${art.unitSale || 'unités'}`,
          totalCost: costTotal,
          paidUpfront: paidNow,
          debtAdded: debtAmount,
          paymentType: paymentType || 'cash',
          invoiceRef: invoiceRef || ''
        };
        if (!targetSupplier.ordersHistory) targetSupplier.ordersHistory = [];
        targetSupplier.ordersHistory.unshift(orderRecord);

        // If bought on credit or partial credit, register a supplier debt
        if (debtAmount > 0) {
          const debtRecord = {
            id: 'sdeb-' + Date.now(),
            supplierId: targetSupplier.id,
            supplierName: targetSupplier.name,
            date: new Date().toISOString().split('T')[0],
            invoiceRef: invoiceRef || 'BON-' + Date.now().toString().slice(-4),
            totalAmount: costTotal,
            paidAmount: paidNow,
            remainingAmount: debtAmount,
            status: 'en_cours',
            description: `Approvisionnement ${art.name} (${addedUnits} unités)`,
            payments: paidNow > 0 ? [{
              id: 'spay-' + Date.now(),
              date: new Date().toISOString().split('T')[0],
              amount: paidNow,
              method: 'cash',
              paidBy: restockedBy || 'Gérant',
              note: 'Acompte versé à la livraison'
            }] : []
          };
          db.supplierDebts.unshift(debtRecord);
        }
      }

      // If paid cash from register, record as expense
      if (paidNow > 0 && paymentType === 'cash') {
        db.expenses.unshift({
          id: 'exp-app-' + Date.now(),
          timestamp: new Date().toISOString(),
          amount: paidNow,
          category: 'encre_consommables',
          description: `Approvisionnement stock : ${art.name} (${targetSupplier ? targetSupplier.name : 'Marché'})`,
          beneficiary: targetSupplier ? targetSupplier.name : 'Fournisseur',
          recordedBy: restockedBy || 'Gérant'
        });
      }

      addAuditLog(db, "REAPPROVISIONNEMENT_FOURNISSEUR", restockedBy || "Gérant", "gerant", {
        article: art.name,
        quantiteAjoutee: addedUnits,
        fournisseur: targetSupplier ? targetSupplier.name : "Non spécifié",
        coutTotal: costTotal,
        mode: paymentType,
        detteCreee: debtAmount
      });

      saveDatabase(db);
      sendJson(200, {
        success: true,
        article: art,
        addedUnits,
        suppliers: db.suppliers,
        supplierDebts: db.supplierDebts,
        expenses: db.expenses
      });
      return;
    }

    // POST /api/credits/payment -> Receive payment on customer debt
    if (req.method === 'POST' && pathname === '/api/credits/payment') {
      const payload = await readJsonBody(req);
      const { creditId, amount, method, receivedBy, note } = payload;
      const credit = db.credits.find(c => c.id === creditId);

      if (!credit) {
        sendJson(404, { error: 'Crédit client introuvable' });
        return;
      }

      const paymentAmount = Number(amount) || 0;
      if (paymentAmount <= 0) {
        sendJson(400, { error: 'Montant de paiement invalide' });
        return;
      }

      const payment = {
        id: 'pay-' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('fr-FR'),
        amount: paymentAmount,
        method: method || 'cash',
        receivedBy: receivedBy || 'Gérant',
        note: note || ''
      };

      if (!credit.payments) credit.payments = [];
      credit.payments.push(payment);
      credit.paidAmount = (credit.paidAmount || 0) + paymentAmount;
      credit.remainingAmount = Math.max(0, credit.totalAmount - credit.paidAmount);
      if (credit.remainingAmount <= 0) credit.status = 'solde';

      // Update customer balance in customer directory
      const cust = db.customers.find(c => c.name.toLowerCase() === credit.customerName.toLowerCase() || (credit.customerPhone && c.phone === credit.customerPhone));
      if (cust) {
        cust.currentDebt = Math.max(0, (cust.currentDebt || 0) - paymentAmount);
      }

      // Add a virtual cash-in transaction
      const paymentSale = {
        id: 'sale-credrec-' + Date.now(),
        type: 'credit_payment',
        isCreditSettlement: true,
        timestamp: new Date().toISOString(),
        items: [{
          articleId: 'rec-credit',
          name: `Règlement Crédit : ${credit.customerName}`,
          quantity: 1,
          unitPrice: paymentAmount,
          total: paymentAmount,
          isService: true,
          isCreditSettlement: true
        }],
        totalAmount: paymentAmount,
        paymentMethod: method || 'cash',
        amountTendered: paymentAmount,
        changeGiven: 0,
        customerName: credit.customerName,
        customerPhone: credit.customerPhone,
        sellerName: receivedBy || 'Gérant',
        deviceSource: 'desktop',
        note: `Paiement sur crédit ${credit.id}`
      };
      db.sales.unshift(paymentSale);

      addAuditLog(db, "REGLEMENT_CREDIT_CLIENT", receivedBy || "Gérant", "caisse", {
        creditId: credit.id,
        client: credit.customerName,
        montantPaye: paymentAmount,
        resteDu: credit.remainingAmount,
        mode: method
      });

      saveDatabase(db);
      sendJson(200, { success: true, credit, paymentSale, customers: db.customers });
      return;
    }

    // POST /api/suppliers/payment -> Pay off supplier debt
    if (req.method === 'POST' && pathname === '/api/suppliers/payment') {
      const payload = await readJsonBody(req);
      const { debtId, amount, method, paidBy, note } = payload;
      const debt = db.supplierDebts.find(d => d.id === debtId);

      if (!debt) {
        sendJson(404, { error: 'Dette fournisseur introuvable' });
        return;
      }

      const payAmt = Number(amount) || 0;
      const spay = {
        id: 'spay-' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        amount: payAmt,
        method: method || 'cash',
        paidBy: paidBy || 'Gérant',
        note: note || ''
      };

      if (!debt.payments) debt.payments = [];
      debt.payments.push(spay);
      debt.paidAmount = (debt.paidAmount || 0) + payAmt;
      debt.remainingAmount = Math.max(0, debt.totalAmount - debt.paidAmount);
      if (debt.remainingAmount <= 0) debt.status = 'solde';

      // Update supplier's debt in supplier directory
      const sup = db.suppliers.find(s => s.id === debt.supplierId || s.name === debt.supplierName);
      if (sup) {
        sup.totalPaid = (sup.totalPaid || 0) + payAmt;
        sup.currentDebt = Math.max(0, (sup.currentDebt || 0) - payAmt);
      }

      if (method === 'cash') {
        db.expenses.unshift({
          id: 'exp-fourn-' + Date.now(),
          timestamp: new Date().toISOString(),
          amount: payAmt,
          category: 'encre_consommables',
          description: `Règlement dette fournisseur : ${debt.supplierName} (${debt.invoiceRef})`,
          beneficiary: debt.supplierName,
          recordedBy: paidBy || 'Gérant'
        });
      }

      addAuditLog(db, "REGLEMENT_FOURNISSEUR", paidBy || "Gérant", "gerant", {
        fournisseur: debt.supplierName,
        montant: payAmt,
        resteDu: debt.remainingAmount,
        mode: method
      });

      saveDatabase(db);
      sendJson(200, { success: true, debt, suppliers: db.suppliers });
      return;
    }

    // POST /api/customers -> Create/Update Customer
    if (req.method === 'POST' && pathname === '/api/customers') {
      const payload = await readJsonBody(req);
      if (payload.id) {
        const idx = db.customers.findIndex(c => c.id === payload.id);
        if (idx !== -1) db.customers[idx] = { ...db.customers[idx], ...payload };
      } else {
        payload.id = 'cust-' + Date.now();
        payload.totalPurchases = payload.totalPurchases || 0;
        payload.currentDebt = payload.currentDebt || 0;
        payload.createdAt = new Date().toISOString().split('T')[0];
        db.customers.unshift(payload);
      }
      saveDatabase(db);
      sendJson(200, { success: true, customers: db.customers });
      return;
    }

    // POST /api/expenses -> Record cash expense
    if (req.method === 'POST' && pathname === '/api/expenses') {
      const payload = await readJsonBody(req);
      const expense = {
        id: 'exp-' + Date.now(),
        timestamp: new Date().toISOString(),
        amount: Number(payload.amount) || 0,
        category: payload.category || 'autre',
        description: payload.description || '',
        beneficiary: payload.beneficiary || '',
        recordedBy: payload.recordedBy || 'Gérant'
      };

      db.expenses.unshift(expense);

      addAuditLog(db, "DEPENSE_CAISSE", expense.recordedBy, "caisse", {
        montant: expense.amount,
        motif: expense.category,
        description: expense.description,
        beneficiaire: expense.beneficiary
      });

      saveDatabase(db);
      sendJson(201, { success: true, expense });
      return;
    }

    // POST /api/invoices -> Save or update A4 invoice
    if (req.method === 'POST' && pathname === '/api/invoices') {
      const payload = await readJsonBody(req);
      const invoiceNumber = payload.invoiceNumber || (db.settings.invoicePrefix + String(db.invoices.length + 1).padStart(4, '0'));

      const invoice = {
        id: payload.id || 'inv-' + Date.now(),
        invoiceNumber,
        date: payload.date || new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('fr-FR'),
        customerName: payload.customerName || 'Client Comptoir',
        customerPhone: payload.customerPhone || '',
        customerCompany: payload.customerCompany || '',
        customerAddress: payload.customerAddress || '',
        customerIfu: payload.customerIfu || '',
        items: payload.items || [],
        totalAmount: payload.totalAmount || 0,
        amountInWords: payload.amountInWords || '',
        paymentStatus: payload.paymentStatus || 'payé',
        paymentMethod: payload.paymentMethod || 'cash',
        note: payload.note || ''
      };

      const existingIdx = db.invoices.findIndex(i => i.id === invoice.id || i.invoiceNumber === invoice.invoiceNumber);
      if (existingIdx !== -1) {
        db.invoices[existingIdx] = invoice;
        addAuditLog(db, "MODIFICATION_FACTURE_A4", payload.recordedBy || "Gérant", "gerant", {
          facture: invoice.invoiceNumber,
          client: invoice.customerName,
          total: invoice.totalAmount
        });
      } else {
        db.invoices.unshift(invoice);
        addAuditLog(db, "CREATION_FACTURE_A4", payload.recordedBy || "Gérant", "gerant", {
          facture: invoice.invoiceNumber,
          client: invoice.customerName,
          total: invoice.totalAmount
        });
      }

      saveDatabase(db);
      sendJson(201, { success: true, invoice });
      return;
    }

    // POST /api/daily-close -> Save day close pointage
    if (req.method === 'POST' && pathname === '/api/daily-close') {
      const payload = await readJsonBody(req);
      const closeRecord = {
        id: 'close-' + Date.now(),
        date: payload.date || new Date().toISOString().split('T')[0],
        closedAt: new Date().toISOString(),
        closedBy: payload.closedBy || 'Gérant',
        cashExpected: Number(payload.cashExpected) || 0,
        cashCounted: Number(payload.cashCounted) || 0,
        cashDiff: Number(payload.cashDiff) || 0,
        orangeExpected: Number(payload.orangeExpected) || 0,
        orangeChecked: Number(payload.orangeChecked) || 0,
        orangeDiff: Number(payload.orangeDiff) || 0,
        moovExpected: Number(payload.moovExpected) || 0,
        moovChecked: Number(payload.moovChecked) || 0,
        moovDiff: Number(payload.moovDiff) || 0,
        totalSales: Number(payload.totalSales) || 0,
        totalExpenses: Number(payload.totalExpenses) || 0,
        notes: payload.notes || '',
        status: 'valide'
      };

      if (!db.dailyCloses) db.dailyCloses = [];
      db.dailyCloses.unshift(closeRecord);

      addAuditLog(db, "CLOTURE_JOURNALIERE", closeRecord.closedBy, "gerant", {
        date: closeRecord.date,
        totalVentes: closeRecord.totalSales,
        especesComptees: closeRecord.cashCounted,
        ecartEspeces: closeRecord.cashDiff
      });

      saveDatabase(db);
      sendJson(201, { success: true, closeRecord });
      return;
    }

    // GET /api/audit/verify -> Verify cryptographic chain integrity
    if (req.method === 'GET' && pathname === '/api/audit/verify') {
      const result = verifyAuditChain(db);
      sendJson(200, result);
      return;
    }

    // POST /api/users -> Manage users
    if (req.method === 'POST' && pathname === '/api/users') {
      const payload = await readJsonBody(req);
      if (payload.id) {
        const idx = db.users.findIndex(u => u.id === payload.id);
        if (idx !== -1) db.users[idx] = { ...db.users[idx], ...payload };
      } else {
        payload.id = 'usr-' + Date.now();
        db.users.push(payload);
      }
      addAuditLog(db, "MODIF_UTILISATEUR", "Propriétaire", "admin", { user: payload.name, role: payload.role });
      saveDatabase(db);
      sendJson(200, { success: true, users: db.users });
      return;
    }

    // POST /api/articles -> Add or Update article
    if (req.method === 'POST' && pathname === '/api/articles') {
      const payload = await readJsonBody(req);
      if (payload.id) {
        const idx = db.articles.findIndex(a => a.id === payload.id);
        if (idx !== -1) {
          const prev = db.articles[idx];
          db.articles[idx] = { ...prev, ...payload };
          addAuditLog(db, "MODIF_ARTICLE", payload.updatedBy || "Gérant", "gerant", {
            nom: payload.name,
            prix: payload.salePrice,
            stock: payload.stock
          });
        }
      } else {
        payload.id = 'art-' + Date.now();
        db.articles.push(payload);
        addAuditLog(db, "CREATION_ARTICLE", payload.updatedBy || "Gérant", "gerant", {
          nom: payload.name,
          prix: payload.salePrice
        });
      }
      saveDatabase(db);
      sendJson(200, { success: true, articles: db.articles });
      return;
    }

    // POST /api/settings -> Update settings
    if (req.method === 'POST' && pathname === '/api/settings') {
      const payload = await readJsonBody(req);
      db.settings = { ...db.settings, ...payload };
      addAuditLog(db, "MODIF_PARAMETRES_BOUTIQUE", "Gérant", "gerant", { shopName: db.settings.shopName });
      saveDatabase(db);
      sendJson(200, { success: true, settings: db.settings });
      return;
    }

    // Fallback 404
    sendJson(404, { error: 'Route API introuvable' });
  } catch (err) {
    console.error('API Error:', err);
    sendJson(500, { error: err.message || 'Erreur interne du serveur' });
  }
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`[Ouaga POS] Port ${PORT} déjà occupé par une instance active. Connexion directe.`);
  } else {
    console.error('[Ouaga POS Server Error]', err);
  }
});

if (!process.env.VERCEL) {
  server.listen(PORT, '0.0.0.0', () => {
    const localIps = getLocalIpAddresses();
    console.log('========================================================');
    console.log(`🚀 LOGICIEL OUAGA LIBRAIRIE-PAPETERIE & SECRÉTARIAT POS v2.5`);
    console.log(`📍 Accès local sur ce PC : http://localhost:${PORT}`);
    if (localIps.length > 0) {
      console.log(`📱 Accès depuis smartphone sur le Wi-Fi local :`);
      localIps.forEach(ip => console.log(`   👉 http://${ip}:${PORT}`));
    }
    console.log('========================================================');
  });
}

module.exports = server;
