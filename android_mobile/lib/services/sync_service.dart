import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/article.dart';
import 'offline_db.dart';

class SyncService {
  static const String _prefKeyPcIp = 'pc_ip_address';

  static Future<String> getPcIp() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_prefKeyPcIp) ?? '192.168.1.100:3500';
  }

  static Future<void> savePcIp(String ip) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefKeyPcIp, ip.trim());
  }

  static Future<Map<String, dynamic>> testConnection(String ip) async {
    try {
      final cleanIp = ip.startsWith('http') ? ip : 'http://$ip';
      final res = await http.get(Uri.parse('$cleanIp/api/articles')).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        return {'success': true, 'message': 'Connexion établie avec la caisse PC !'};
      }
      return {'success': false, 'message': 'Code HTTP ${res.statusCode} reçu.'};
    } catch (e) {
      return {'success': false, 'message': 'Impossible de joindre le PC ($e)'};
    }
  }

  static Future<Map<String, dynamic>> syncWithPc(String ip) async {
    try {
      final cleanIp = ip.startsWith('http') ? ip : 'http://$ip';
      final unsynced = await OfflineDatabase.instance.getUnsyncedSales();
      int pushedCount = 0;

      // 1. Envoyer les ventes enregistrées en mode hors-ligne
      for (var sale in unsynced) {
        try {
          final payload = jsonEncode({
            'id': sale.id,
            'date': sale.date,
            'itemsSummary': sale.itemsSummary,
            'totalAmount': sale.totalAmount,
            'paymentMethod': sale.paymentMethod,
            'customerName': sale.customerName,
            'device': 'Mobile Android (Mode Hors-Ligne)'
          });

          final response = await http.post(
            Uri.parse('$cleanIp/api/sales'),
            headers: {'Content-Type': 'application/json'},
            body: payload,
          ).timeout(const Duration(seconds: 4));

          if (response.statusCode == 200 || response.statusCode == 201) {
            await OfflineDatabase.instance.markSalesSynced([sale.id]);
            pushedCount++;
          }
        } catch (_) {}
      }

      // 2. Mettre à jour le catalogue articles depuis le PC
      try {
        final res = await http.get(Uri.parse('$cleanIp/api/articles')).timeout(const Duration(seconds: 4));
        if (res.statusCode == 200) {
          final List<dynamic> data = jsonDecode(res.body);
          final articles = data.map((item) {
            return Article(
              id: item['id']?.toString() ?? '',
              name: item['name'] ?? '',
              category: item['category'] ?? '',
              price: (item['price'] as num?)?.toInt() ?? 0,
              type: item['type'] ?? 'produit',
              stock: (item['stock'] as num?)?.toInt() ?? 0,
              unit: item['unit'] ?? '',
            );
          }).toList();

          if (articles.isNotEmpty) {
            await OfflineDatabase.instance.replaceArticles(articles);
          }
        }
      } catch (_) {}

      return {
        'success': true,
        'pushedCount': pushedCount,
        'message': '$pushedCount vente(s) envoyée(s) au PC avec succès.'
      };
    } catch (e) {
      return {
        'success': false,
        'pushedCount': 0,
        'message': 'Échec de la synchronisation : $e'
      };
    }
  }
}
