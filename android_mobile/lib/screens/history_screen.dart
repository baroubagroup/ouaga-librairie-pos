import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/sale.dart';
import '../services/offline_db.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  final NumberFormat _currencyFormat = NumberFormat('#,###', 'fr_FR');
  List<Sale> _sales = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSales();
  }

  Future<void> _loadSales() async {
    setState(() => _isLoading = true);
    final sales = await OfflineDatabase.instance.getSales();
    setState(() {
      _sales = sales;
      _isLoading = false;
    });
  }

  int get _totalTurnover => _sales.fold(0, (sum, s) => sum + s.totalAmount);
  int get _unsyncedCount => _sales.where((s) => s.isSynced == 0).length;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B132B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        title: const Text('Journal des Ventes Mobiles', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white70),
            onPressed: _loadSales,
          )
        ],
      ),
      body: Column(
        children: [
          // Bandeau résumé
          Container(
            padding: const EdgeInsets.all(16),
            margin: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF334155)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                Column(
                  children: [
                    const Text('Total Ventes Caisse', style: TextStyle(color: Colors.white60, fontSize: 12)),
                    const SizedBox(height: 4),
                    Text(
                      '${_currencyFormat.format(_totalTurnover)} F',
                      style: const TextStyle(color: Color(0xFF38BDF8), fontWeight: FontWeight.w900, fontSize: 18),
                    ),
                  ],
                ),
                Container(height: 35, width: 1, color: Colors.white24),
                Column(
                  children: [
                    const Text('Attente Sync PC', style: TextStyle(color: Colors.white60, fontSize: 12)),
                    const SizedBox(height: 4),
                    Text(
                      '$_unsyncedCount ticket(s)',
                      style: TextStyle(
                        color: _unsyncedCount > 0 ? const Color(0xFFF59E0B) : const Color(0xFF10B981),
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF2563EB)))
                : _sales.isEmpty
                    ? const Center(
                        child: Text(
                          'Aucune vente enregistrée pour le moment.',
                          style: TextStyle(color: Colors.white54),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        itemCount: _sales.length,
                        itemBuilder: (context, idx) {
                          final sale = _sales[idx];
                          final isSynced = sale.isSynced == 1;

                          return Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1E293B),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: const Color(0xFF334155)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      sale.id,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14,
                                      ),
                                    ),
                                    Text(
                                      '${_currencyFormat.format(sale.totalAmount)} FCFA',
                                      style: const TextStyle(
                                        color: Color(0xFF38BDF8),
                                        fontWeight: FontWeight.w900,
                                        fontSize: 15,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  sale.itemsSummary,
                                  style: const TextStyle(color: Colors.white70, fontSize: 12),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      'Client : ${sale.customerName} • ${sale.paymentMethod}',
                                      style: const TextStyle(color: Colors.white54, fontSize: 11),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: isSynced
                                            ? const Color(0xFF10B981).withOpacity(0.15)
                                            : const Color(0xFFF59E0B).withOpacity(0.15),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(
                                          color: isSynced ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                                          width: 0.8,
                                        ),
                                      ),
                                      child: Text(
                                        isSynced ? '✓ Sync PC' : '⏳ Hors-Ligne',
                                        style: TextStyle(
                                          color: isSynced ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
