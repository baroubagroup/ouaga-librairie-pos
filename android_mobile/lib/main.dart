import 'package:flutter/material.dart';
import 'screens/caisse_screen.dart';
import 'screens/history_screen.dart';
import 'screens/sync_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const OuagaPosApp());
}

class OuagaPosApp extends StatelessWidget {
  const OuagaPosApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ouaga Librairie POS Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF2563EB),
          secondary: Color(0xFF10B981),
          surface: Color(0xFF0F172A),
          background: Color(0xFF0B132B),
        ),
        scaffoldBackgroundColor: const Color(0xFF0B132B),
        fontFamily: 'Roboto',
      ),
      home: const MainHomeScreen(),
    );
  }
}

class MainHomeScreen extends StatefulWidget {
  const MainHomeScreen({super.key});

  @override
  State<MainHomeScreen> createState() => _MainHomeScreenState();
}

class _MainHomeScreenState extends State<MainHomeScreen> {
  int _currentIndex = 0;
  final GlobalKey<State> _caisseKey = GlobalKey<State>();

  @override
  Widget build(BuildContext context) {
    final List<Widget> screens = [
      CaisseScreen(
        key: _caisseKey,
        onSaleCompleted: () {
          // Si besoin de réagir globalement
        },
      ),
      const HistoryScreen(),
      SyncScreen(
        onSyncDone: () {
          setState(() {});
        },
      ),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: Color(0xFF1E293B), width: 1)),
        ),
        child: NavigationBar(
          selectedIndex: _currentIndex,
          backgroundColor: const Color(0xFF0F172A),
          indicatorColor: const Color(0xFF2563EB).withOpacity(0.3),
          onDestinationSelected: (idx) {
            setState(() => _currentIndex = idx);
          },
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.point_of_sale_outlined, color: Colors.white70),
              selectedIcon: Icon(Icons.point_of_sale, color: Color(0xFF38BDF8)),
              label: 'Caisse Vente',
            ),
            NavigationDestination(
              icon: Icon(Icons.receipt_long_outlined, color: Colors.white70),
              selectedIcon: Icon(Icons.receipt_long, color: Color(0xFF38BDF8)),
              label: 'Journal Ventes',
            ),
            NavigationDestination(
              icon: Icon(Icons.sync_alt_outlined, color: Colors.white70),
              selectedIcon: Icon(Icons.sync_alt, color: Color(0xFF38BDF8)),
              label: 'Synchronisation',
            ),
          ],
        ),
      ),
    );
  }
}
