import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/article.dart';
import '../models/cart_item.dart';
import '../models/sale.dart';
import '../services/offline_db.dart';

class CaisseScreen extends StatefulWidget {
  final VoidCallback onSaleCompleted;
  const CaisseScreen({super.key, required this.onSaleCompleted});

  @override
  State<CaisseScreen> createState() => _CaisseScreenState();
}

class _CaisseScreenState extends State<CaisseScreen> {
  final TextEditingController _searchController = TextEditingController();
  final NumberFormat _currencyFormat = NumberFormat('#,###', 'fr_FR');

  List<Article> _articles = [];
  final List<CartItem> _cart = [];
  String _selectedCategory = 'Tous les articles';
  bool _isLoading = true;

  final List<String> _categories = [
    'Tous les articles',
    'Photocopies & Impressions',
    'Stylos & Cahiers',
    'Rames & Papier',
    'Fournitures & Bureau',
    'Finitions & Options',
  ];

  @override
  void initState() {
    super.initState();
    _loadArticles();
  }

  Future<void> _loadArticles() async {
    setState(() => _isLoading = true);
    final items = await OfflineDatabase.instance.getArticles(
      category: _selectedCategory,
      query: _searchController.text,
    );
    setState(() {
      _articles = items;
      _isLoading = false;
    });
  }

  void _addToCart(Article article) {
    setState(() {
      final existingIndex = _cart.indexWhere((i) => i.article.id == article.id);
      if (existingIndex >= 0) {
        _cart[existingIndex].quantity++;
      } else {
        _cart.add(CartItem(article: article, quantity: 1));
      }
    });
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('+1 ${article.name} ajouté au panier'),
        duration: const Duration(milliseconds: 700),
        behavior: SnackBarBehavior.floating,
        backgroundColor: const Color(0xFF1E293B),
      ),
    );
  }

  void _removeFromCart(CartItem item) {
    setState(() {
      if (item.quantity > 1) {
        item.quantity--;
      } else {
        _cart.remove(item);
      }
    });
  }

  int get _cartTotal => _cart.fold(0, (sum, item) => sum + item.total);
  int get _cartCount => _cart.fold(0, (sum, item) => sum + item.quantity);

  void _showCheckoutSheet() {
    if (_cart.isEmpty) return;

    final clientController = TextEditingController(text: 'Comptoir Passager');
    final receivedController = TextEditingController();
    String selectedPayment = 'Espèces (Cash)';
    int changeToReturn = 0;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF0F172A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            void updateChange() {
              final rec = int.tryParse(receivedController.text) ?? 0;
              setSheetState(() {
                changeToReturn = rec > _cartTotal ? rec - _cartTotal : 0;
              });
            }

            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Center(
                      child: Container(
                        width: 48,
                        height: 5,
                        decoration: BoxDecoration(
                          color: Colors.white24,
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Encaissement Caisse',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        TextButton(
                          onPressed: () {
                            setState(() => _cart.clear());
                            Navigator.pop(ctx);
                          },
                          child: const Text('Vider le panier', style: TextStyle(color: Colors.redAccent)),
                        )
                      ],
                    ),
                    const SizedBox(height: 8),

                    // Récapitulatif rapide
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E293B),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF334155)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Articles (${_cartCount})', style: const TextStyle(color: Colors.white70)),
                              Text(
                                '${_currencyFormat.format(_cartTotal)} FCFA',
                                style: const TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFF38BDF8),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Mode de règlement
                    const Text('Mode de Paiement :', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        'Espèces (Cash)',
                        'Orange Money',
                        'Moov Money',
                        'À Crédit (Dette)',
                      ].map((mode) {
                        final isSel = selectedPayment == mode;
                        return ChoiceChip(
                          label: Text(mode),
                          selected: isSel,
                          selectedColor: const Color(0xFF2563EB),
                          backgroundColor: const Color(0xFF1E293B),
                          labelStyle: TextStyle(
                            color: isSel ? Colors.white : Colors.white70,
                            fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
                          ),
                          onSelected: (val) {
                            if (val) setSheetState(() => selectedPayment = mode);
                          },
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 14),

                    // Client
                    TextField(
                      controller: clientController,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        labelText: 'Nom du client / Structure',
                        labelStyle: const TextStyle(color: Colors.white60),
                        filled: true,
                        fillColor: const Color(0xFF1E293B),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Montant reçu & Monnaie si espèces
                    if (selectedPayment == 'Espèces (Cash)') ...[
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: receivedController,
                              keyboardType: TextInputType.number,
                              style: const TextStyle(color: Colors.white),
                              decoration: InputDecoration(
                                labelText: 'Montant Reçu (FCFA)',
                                labelStyle: const TextStyle(color: Colors.white60),
                                filled: true,
                                fillColor: const Color(0xFF1E293B),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              onChanged: (_) => updateChange(),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                              decoration: BoxDecoration(
                                color: const Color(0xFF1E293B),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: const Color(0xFF334155)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Monnaie à rendre', style: TextStyle(color: Colors.white60, fontSize: 11)),
                                  Text(
                                    '${_currencyFormat.format(changeToReturn)} F',
                                    style: const TextStyle(
                                      color: Color(0xFF4ADE80),
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      // Raccourcis billets
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [500, 1000, 2000, 5000, 10000].map((amount) {
                            return Padding(
                              padding: const EdgeInsets.only(right: 6),
                              child: ActionChip(
                                label: Text('${_currencyFormat.format(amount)} F'),
                                backgroundColor: const Color(0xFF1E293B),
                                labelStyle: const TextStyle(color: Colors.white70, fontSize: 12),
                                onPressed: () {
                                  receivedController.text = amount.toString();
                                  updateChange();
                                },
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ],
                    const SizedBox(height: 20),

                    // Bouton Encaisser
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      icon: const Icon(Icons.check_circle_outline),
                      label: Text(
                        'Valider l\'Encaissement (${_currencyFormat.format(_cartTotal)} FCFA)',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      onPressed: () async {
                        final sale = await OfflineDatabase.instance.recordSale(
                          items: _cart,
                          paymentMethod: selectedPayment,
                          customerName: clientController.text,
                        );

                        setState(() {
                          _cart.clear();
                        });
                        Navigator.pop(ctx);
                        _loadArticles();
                        widget.onSaleCompleted();

                        // Dialogue de confirmation de vente avec ticket
                        _showSaleSuccessDialog(sale);
                      },
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showSaleSuccessDialog(Sale sale) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF0F172A),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: const [
            Icon(Icons.check_circle, color: Color(0xFF10B981), size: 28),
            SizedBox(width: 10),
            Text('Ticket Enregistré !', style: TextStyle(color: Colors.white, fontSize: 18)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Réf : ${sale.id}', style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.bold)),
                  Text('Client : ${sale.customerName}', style: const TextStyle(color: Colors.white70)),
                  Text('Paiement : ${sale.paymentMethod}', style: const TextStyle(color: Colors.white70)),
                  const Divider(color: Colors.white24),
                  Text(
                    'TOTAL : ${_currencyFormat.format(sale.totalAmount)} FCFA',
                    style: const TextStyle(color: Color(0xFF38BDF8), fontWeight: FontWeight.w900, fontSize: 18),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: const [
                Icon(Icons.offline_pin, color: Color(0xFF10B981), size: 16),
                SizedBox(width: 6),
                Expanded(
                  child: Text(
                    'Enregistré en SQLite local (100% hors-ligne). En attente de sync PC.',
                    style: TextStyle(color: Colors.white60, fontSize: 12),
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF2563EB)),
            onPressed: () => Navigator.pop(ctx),
            child: const Text('OK / Nouvelle Vente', style: TextStyle(color: Colors.white)),
          )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B132B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text(
              'Caisse Express Ouaga',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            Text(
              'Papeterie & Secrétariat Public • Burkina Faso',
              style: TextStyle(fontSize: 12, color: Colors.white60),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withOpacity(0.15),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF10B981)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: const [
                Icon(Icons.bolt, color: Color(0xFFF59E0B), size: 16),
                SizedBox(width: 4),
                Text(
                  'Anti-Délestage Hors-Ligne',
                  style: TextStyle(color: Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          )
        ],
      ),
      body: Column(
        children: [
          // Barre de recherche
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _searchController,
              onChanged: (_) => _loadArticles(),
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Rechercher un article, photocopie, rame, bic...',
                hintStyle: const TextStyle(color: Colors.white54, fontSize: 13),
                prefixIcon: const Icon(Icons.search, color: Colors.white54),
                filled: true,
                fillColor: const Color(0xFF1E293B),
                contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),

          // Filtres Catégories
          SizedBox(
            height: 44,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: _categories.length,
              itemBuilder: (context, idx) {
                final cat = _categories[idx];
                final isSelected = _selectedCategory == cat;
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: FilterChip(
                    label: Text(cat),
                    selected: isSelected,
                    selectedColor: const Color(0xFF2563EB),
                    backgroundColor: const Color(0xFF1E293B),
                    labelStyle: TextStyle(
                      fontSize: 12,
                      color: isSelected ? Colors.white : Colors.white70,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    onSelected: (val) {
                      setState(() => _selectedCategory = cat);
                      _loadArticles();
                    },
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 6),

          // Grille des articles
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF2563EB)))
                : _articles.isEmpty
                    ? const Center(
                        child: Text(
                          'Aucun article trouvé dans cette sélection.',
                          style: TextStyle(color: Colors.white54),
                        ),
                      )
                    : GridView.builder(
                        padding: const EdgeInsets.fromLTRB(12, 4, 12, 100),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.95,
                          crossAxisSpacing: 10,
                          mainAxisSpacing: 10,
                        ),
                        itemCount: _articles.length,
                        itemBuilder: (context, idx) {
                          final article = _articles[idx];
                          final isService = article.type == 'service';

                          return Material(
                            color: const Color(0xFF1E293B),
                            borderRadius: BorderRadius.circular(16),
                            child: InkWell(
                              borderRadius: BorderRadius.circular(16),
                              onTap: () => _addToCart(article),
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: const Color(0xFF334155), width: 1),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(8),
                                          decoration: BoxDecoration(
                                            color: isService
                                                ? const Color(0xFF3B82F6).withOpacity(0.15)
                                                : const Color(0xFF10B981).withOpacity(0.15),
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                          child: Icon(
                                            isService ? Icons.print_outlined : Icons.menu_book_outlined,
                                            size: 20,
                                            color: isService ? const Color(0xFF60A5FA) : const Color(0xFF34D399),
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: Colors.white10,
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            isService ? 'Prestation' : 'Stock: ${article.stock}',
                                            style: const TextStyle(color: Colors.white70, fontSize: 10),
                                          ),
                                        )
                                      ],
                                    ),
                                    const Spacer(),
                                    Text(
                                      article.name,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 13,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          '${_currencyFormat.format(article.price)} F',
                                          style: const TextStyle(
                                            color: Color(0xFF38BDF8),
                                            fontWeight: FontWeight.w900,
                                            fontSize: 15,
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.all(4),
                                          decoration: const BoxDecoration(
                                            color: Color(0xFF2563EB),
                                            shape: BoxShape.circle,
                                          ),
                                          child: const Icon(Icons.add, color: Colors.white, size: 16),
                                        )
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
      bottomSheet: _cart.isEmpty
          ? null
          : Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: const BoxDecoration(
                color: Color(0xFF0F172A),
                boxShadow: [
                  BoxShadow(color: Colors.black45, blurRadius: 10, offset: Offset(0, -3)),
                ],
              ),
              child: SafeArea(
                child: Row(
                  children: [
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '$_cartCount article(s) sélectionné(s)',
                          style: const TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                        Text(
                          '${_currencyFormat.format(_cartTotal)} FCFA',
                          style: const TextStyle(
                            color: Color(0xFF38BDF8),
                            fontWeight: FontWeight.w900,
                            fontSize: 20,
                          ),
                        ),
                      ],
                    ),
                    const Spacer(),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: _showCheckoutSheet,
                      icon: const Icon(Icons.shopping_bag_outlined, color: Colors.white),
                      label: const Text(
                        'Encaisser',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
