class Article {
  final String id;
  final String name;
  final String category;
  final int price;
  final String type; // 'service' ou 'produit'
  final int stock;
  final String unit;

  Article({
    required this.id,
    required this.name,
    required this.category,
    required this.price,
    required this.type,
    required this.stock,
    required this.unit,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'category': category,
      'price': price,
      'type': type,
      'stock': stock,
      'unit': unit,
    };
  }

  factory Article.fromMap(Map<String, dynamic> map) {
    return Article(
      id: map['id'] ?? '',
      name: map['name'] ?? '',
      category: map['category'] ?? '',
      price: (map['price'] as num?)?.toInt() ?? 0,
      type: map['type'] ?? 'produit',
      stock: (map['stock'] as num?)?.toInt() ?? 0,
      unit: map['unit'] ?? '',
    );
  }
}
