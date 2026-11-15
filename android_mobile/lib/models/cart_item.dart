import 'article.dart';

class CartItem {
  final Article article;
  int quantity;

  CartItem({
    required this.article,
    this.quantity = 1,
  });

  int get total => article.price * quantity;

  Map<String, dynamic> toMap() {
    return {
      'articleId': article.id,
      'articleName': article.name,
      'unitPrice': article.price,
      'quantity': quantity,
      'total': total,
    };
  }
}
