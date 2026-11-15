import 'package:flutter/material.dart';
import '../services/sync_service.dart';
import '../services/offline_db.dart';

class SyncScreen extends StatefulWidget {
  final VoidCallback onSyncDone;
  const SyncScreen({super.key, required this.onSyncDone});

  @override
  State<SyncScreen> createState() => _SyncScreenState();
}

class _SyncScreenState extends State<SyncScreen> {
  final TextEditingController _ipController = TextEditingController();
  bool _isSyncing = false;
  String? _statusMessage;
  bool? _statusSuccess;
  int _pendingCount = 0;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    final ip = await SyncService.getPcIp();
    _ipController.text = ip;
    final unsynced = await OfflineDatabase.instance.getUnsyncedSales();
    setState(() {
      _pendingCount = unsynced.length;
    });
  }

  Future<void> _testConnection() async {
    setState(() {
      _isSyncing = true;
      _statusMessage = 'Test de liaison avec le PC...';
      _statusSuccess = null;
    });

    final res = await SyncService.testConnection(_ipController.text);
    setState(() {
      _isSyncing = false;
      _statusSuccess = res['success'];
      _statusMessage = res['message'];
    });
  }

  Future<void> _runSync() async {
    setState(() {
      _isSyncing = true;
      _statusMessage = 'Synchronisation des ventes et mise à jour du catalogue...';
      _statusSuccess = null;
    });

    await SyncService.savePcIp(_ipController.text);
    final res = await SyncService.syncWithPc(_ipController.text);
    final unsynced = await OfflineDatabase.instance.getUnsyncedSales();

    setState(() {
      _isSyncing = false;
      _statusSuccess = res['success'];
      _statusMessage = res['message'];
      _pendingCount = unsynced.length;
    });

    widget.onSyncDone();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B132B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        title: const Text('Synchronisation PC / Wi-Fi', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Carte État Déconnexion / Attente
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: Column(
                children: [
                  Icon(
                    _pendingCount > 0 ? Icons.cloud_upload_outlined : Icons.cloud_done_outlined,
                    size: 48,
                    color: _pendingCount > 0 ? const Color(0xFFF59E0B) : const Color(0xFF10B981),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _pendingCount > 0
                        ? '$_pendingCount vente(s) en attente de synchronisation'
                        : 'Toutes les ventes sont synchronisées avec le PC !',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: _pendingCount > 0 ? const Color(0xFFF59E0B) : const Color(0xFF10B981),
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Les ventes faites sur ce smartphone pendant les délestages Sonabel restent sauvegardées dans la mémoire locale sécurisée.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.white60, fontSize: 12),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Configuration IP PC
            const Text(
              'Adresse IP locale du PC de caisse (Wi-Fi) :',
              style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _ipController,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'ex: 192.168.1.100:3500 ou http://...',
                hintStyle: const TextStyle(color: Colors.white38),
                filled: true,
                fillColor: const Color(0xFF1E293B),
                prefixIcon: const Icon(Icons.computer, color: Color(0xFF38BDF8)),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: 14),

            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: const BorderSide(color: Color(0xFF38BDF8)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: _isSyncing ? null : _testConnection,
                    icon: const Icon(Icons.wifi_tethering, size: 18),
                    label: const Text('Tester liaison'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: _isSyncing ? null : _runSync,
                    icon: _isSyncing
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Icon(Icons.sync, size: 18),
                    label: const Text('Synchroniser'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Message de retour
            if (_statusMessage != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _statusSuccess == true
                      ? const Color(0xFF10B981).withOpacity(0.15)
                      : _statusSuccess == false
                          ? const Color(0xFFEF4444).withOpacity(0.15)
                          : const Color(0xFF38BDF8).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: _statusSuccess == true
                        ? const Color(0xFF10B981)
                        : _statusSuccess == false
                            ? const Color(0xFFEF4444)
                            : const Color(0xFF38BDF8),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      _statusSuccess == true
                          ? Icons.check_circle
                          : _statusSuccess == false
                              ? Icons.error_outline
                              : Icons.info_outline,
                      color: _statusSuccess == true
                          ? const Color(0xFF10B981)
                          : _statusSuccess == false
                              ? const Color(0xFFEF4444)
                              : const Color(0xFF38BDF8),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        _statusMessage!,
                        style: TextStyle(
                          color: _statusSuccess == true
                              ? const Color(0xFF10B981)
                              : _statusSuccess == false
                                  ? const Color(0xFFEF4444)
                                  : const Color(0xFF38BDF8),
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],

            // Instructions claires
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text('Mode Opératoire Délestage Sonabel :', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  SizedBox(height: 8),
                  Text('1. Coupure de courant : Continuez à saisir vos ventes sur ce smartphone sans interruption.', style: TextStyle(color: Colors.white70, fontSize: 12)),
                  SizedBox(height: 6),
                  Text('2. Retour du courant : Connectez le smartphone au réseau Wi-Fi ou partage de connexion du PC.', style: TextStyle(color: Colors.white70, fontSize: 12)),
                  SizedBox(height: 6),
                  Text('3. Appuyez sur "Synchroniser" : Toutes les ventes enregistrées sont immédiatement envoyées dans la comptabilité du PC et les stocks sont actualisés.', style: TextStyle(color: Colors.white70, fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
