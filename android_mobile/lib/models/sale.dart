class Sale {
  final String id;
  final String date;
  final String itemsSummary;
  final int totalAmount;
  final String paymentMethod;
  final String customerName;
  final int isSynced; // 0 = en attente de sync, 1 = synchronisé avec PC

  Sale({
    required this.id,
    required this.date,
    required this.itemsSummary,
    required this.totalAmount,
    required this.paymentMethod,
    required this.customerName,
    this.isSynced = 0,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'date': date,
      'itemsSummary': itemsSummary,
      'totalAmount': totalAmount,
      'paymentMethod': paymentMethod,
      'customerName': customerName,
      'isSynced': isSynced,
    };
  }

  factory Sale.fromMap(Map<String, dynamic> map) {
    return Sale(
      id: map['id'] ?? '',
      date: map['date'] ?? '',
      itemsSummary: map['itemsSummary'] ?? '',
      totalAmount: (map['totalAmount'] as num?)?.toInt() ?? 0,
      paymentMethod: map['paymentMethod'] ?? 'Espèces (Cash)',
      customerName: map['customerName'] ?? 'Comptoir Passager',
      isSynced: (map['isSynced'] as num?)?.toInt() ?? 0,
    );
  }
}
