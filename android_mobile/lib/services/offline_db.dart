import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/article.dart';
import '../models/sale.dart';
import '../models/cart_item.dart';

class OfflineDatabase {
  static final OfflineDatabase instance = OfflineDatabase._init();
  static Database? _database;

  OfflineDatabase._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('ouaga_pos_offline.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
    );
  }

  Future<void> _createDB(Database db, int version) async {
    // Table Articles
    await db.execute('''
      CREATE TABLE articles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price INTEGER NOT NULL,
        type TEXT NOT NULL,
        stock INTEGER NOT NULL,
        unit TEXT NOT NULL
      )
    ''');

    // Table Ventes (Caisse Offline)
    await db.execute('''
      CREATE TABLE sales (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        itemsSummary TEXT NOT NULL,
        totalAmount INTEGER NOT NULL,
        paymentMethod TEXT NOT NULL,
        customerName TEXT NOT NULL,
        isSynced INTEGER NOT NULL DEFAULT 0
      )
    ''');

    // Insertion du catalogue de démarrage pour la Librairie Papeterie de Ouaga
    final defaultArticles = [
      Article(id: 'art-001', name: 'Photocopie A4 N&B (Recto)', category: 'Photocopies & Impressions', price: 25, type: 'service', stock: 9999, unit: 'page'),
      Article(id: 'art-002', name: 'Photocopie A4 N&B (Recto-Verso)', category: 'Photocopies & Impressions', price: 50, type: 'service', stock: 9999, unit: 'page'),
      Article(id: 'art-003', name: 'Impression A4 N&B', category: 'Photocopies & Impressions', price: 100, type: 'service', stock: 9999, unit: 'page'),
      Article(id: 'art-004', name: 'Impression A4 Couleur', category: 'Photocopies & Impressions', price: 250, type: 'service', stock: 9999, unit: 'page'),
      Article(id: 'art-005', name: 'Saisie de document standard', category: 'Photocopies & Impressions', price: 500, type: 'service', stock: 9999, unit: 'page'),
      Article(id: 'art-006', name: 'Stylo Bic Cristal (Bleu / Noir / Rouge)', category: 'Stylos & Cahiers', price: 100, type: 'produit', stock: 228, unit: 'stylo'),
      Article(id: 'art-007', name: 'Cahier 100 pages (Format 17x22)', category: 'Stylos & Cahiers', price: 350, type: 'produit', stock: 59, unit: 'cahier'),
      Article(id: 'art-008', name: 'Cahier 200 pages (Format 17x22)', category: 'Stylos & Cahiers', price: 650, type: 'produit', stock: 46, unit: 'cahier'),
      Article(id: 'art-009', name: 'Cahier TP 200 pages', category: 'Stylos & Cahiers', price: 750, type: 'produit', stock: 20, unit: 'cahier'),
      Article(id: 'art-010', name: 'Rame Papier A4 Double A (80g)', category: 'Rames & Papier', price: 4000, type: 'produit', stock: 16, unit: 'rame'),
      Article(id: 'art-011', name: 'Chemise cartonnée rabat', category: 'Fournitures & Bureau', price: 150, type: 'produit', stock: 82, unit: 'chemise'),
      Article(id: 'art-012', name: 'Plastification document A4', category: 'Finitions & Options', price: 300, type: 'service', stock: 9999, unit: 'doc'),
      Article(id: 'art-013', name: 'Reliure spirale dossier classique', category: 'Finitions & Options', price: 500, type: 'service', stock: 9999, unit: 'dossier'),
      Article(id: 'art-014', name: 'Option Agrafage dossier lourd', category: 'Finitions & Options', price: 50, type: 'service', stock: 9999, unit: 'prestation'),
    ];

    for (var art in defaultArticles) {
      await db.insert('articles', art.toMap());
    }
  }

  Future<List<Article>> getArticles({String? category, String? query}) async {
    final db = await instance.database;
    String? whereClause;
    List<dynamic> whereArgs = [];

    if (category != null && category != 'Tous les articles') {
      whereClause = 'category = ?';
      whereArgs.add(category);
    }

    if (query != null && query.trim().isNotEmpty) {
      final q = '%${query.trim().toLowerCase()}%';
      if (whereClause != null) {
        whereClause += ' AND LOWER(name) LIKE ?';
      } else {
        whereClause = 'LOWER(name) LIKE ?';
      }
      whereArgs.add(q);
    }

    final result = await db.query(
      'articles',
      where: whereClause,
      whereArgs: whereArgs.isNotEmpty ? whereArgs : null,
      orderBy: 'name ASC',
    );

    return result.map((e) => Article.fromMap(e)).toList();
  }

  Future<Sale> recordSale({
    required List<CartItem> items,
    required String paymentMethod,
    required String customerName,
  }) async {
    final db = await instance.database;
    final total = items.fold(0, (sum, item) => sum + item.total);
    final now = DateTime.now().toIso8601String().substring(0, 19).replaceAll('T', ' ');
    final saleId = 'VT-${DateTime.now().millisecondsSinceEpoch.toString().substring(5)}';

    final itemsSummary = items
        .map((i) => '${i.quantity}x ${i.article.name} (${i.total} FCFA)')
        .join(', ');

    final sale = Sale(
      id: saleId,
      date: now,
      itemsSummary: itemsSummary,
      totalAmount: total,
      paymentMethod: paymentMethod,
      customerName: customerName.trim().isEmpty ? 'Comptoir Passager' : customerName.trim(),
      isSynced: 0,
    );

    await db.transaction((txn) async {
      await txn.insert('sales', sale.toMap());

      // Décrémenter le stock local pour les produits physiques
      for (var item in items) {
        if (item.article.type == 'produit') {
          await txn.rawUpdate(
            'UPDATE articles SET stock = MAX(0, stock - ?) WHERE id = ?',
            [item.quantity, item.article.id],
          );
        }
      }
    });

    return sale;
  }

  Future<List<Sale>> getSales() async {
    final db = await instance.database;
    final result = await db.query('sales', orderBy: 'date DESC');
    return result.map((e) => Sale.fromMap(e)).toList();
  }

  Future<List<Sale>> getUnsyncedSales() async {
    final db = await instance.database;
    final result = await db.query('sales', where: 'isSynced = 0', orderBy: 'date ASC');
    return result.map((e) => Sale.fromMap(e)).toList();
  }

  Future<void> markSalesSynced(List<String> ids) async {
    final db = await instance.database;
    final batch = db.batch();
    for (var id in ids) {
      batch.update('sales', {'isSynced': 1}, where: 'id = ?', whereArgs: [id]);
    }
    await batch.commit(noResult: true);
  }

  Future<void> replaceArticles(List<Article> articles) async {
    final db = await instance.database;
    await db.transaction((txn) async {
      await txn.delete('articles');
      for (var art in articles) {
        await txn.insert('articles', art.toMap());
      }
    });
  }
}
