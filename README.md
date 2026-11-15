# Suite Multi-Plateforme - Gestion de Librairie & Papeterie Ouaga (Édition Pro 2026)

Architecture complète multi-plateforme conçue pour les librairies, papeteries et secrétariats publics de Ouagadougou (Burkina Faso).
Garantie **100% hors-ligne**, résiliente aux délestages de la Sonabel, synchronisable en réseau local (Wi-Fi) et dans le Cloud.

---

## 📁 Organisation de l'Espace de Travail

```text
application de gestion de librairie papeterie/
│
├── 🪟 windows_desktop/       Application Windows Native (100% Hors-Ligne)
│   ├── Lancer_Caisse_Windows.bat      -> Démarrage immédiat en 1 double-clic (zéro configuration)
│   ├── Installer_Et_Compiler_EXE.bat  -> Compilation de l'exécutable portable (.exe)
│   ├── main.js                        -> Moteur Electron natif (Gestion d'impression A4/Ticket, raccourcis F1/F3)
│   ├── preload.js                     -> Pont IPC sécurisé
│   ├── package.json                   -> Scripts de build Electron
│   ├── server.js                      -> Serveur local hors-ligne autonome (Port 3500)
│   ├── public/                        -> Interface complète (Caisse, 5 Modèles Factures A4, Stocks, etc.)
│   └── data/                          -> Fichiers de données locaux sécurisés
│
├── 📱 android_mobile/        Application Mobile Android Native (Flutter 100% Hors-Ligne)
│   ├── Generer_APK_Android.bat        -> Compilation du fichier APK Android en 1 clic
│   ├── lib/
│   │   ├── main.dart                  -> Point d'entrée, thème Material 3 sombre & navigation
│   │   ├── models/                    -> Modèles de données (Article, CartItem, Sale)
│   │   ├── services/                  -> OfflineDatabase (SQLite local) & SyncService (Wi-Fi/PC)
│   │   └── screens/                   -> CaisseScreen (Tactile), HistoryScreen, SyncScreen
│   ├── android/                       -> Manifest Android & permissions Wi-Fi/Réseau local
│   └── pubspec.yaml                   -> Dépendances Flutter (sqflite, http, intl, etc.)
│
├── 🌐 web_cloud/             Application Web Cloud (Vercel & Supabase)
│   ├── server.js                      -> API Node.js prête pour Serverless
│   ├── vercel.json                    -> Configuration de déploiement Vercel
│   ├── package.json                   -> Dépendances cloud
│   └── public/                        -> Frontend web universel
│
└── 🗄️ database/              Base de Données & Schémas
    ├── supabase_schema.sql            -> Schéma relationnel 11 tables avec RLS & Triggers
    └── local_database.json            -> Données de secours locales
```

---

## 🪟 1. Application Windows Desktop (`windows_desktop/`)

### Démarrage Rapide :
1. Ouvrez le dossier `windows_desktop`.
2. Double-cliquez sur **`Lancer_Caisse_Windows.bat`**.
3. L'application démarre immédiatement en mode bureau plein écran connecté au moteur de caisse local sur le port 3500.

### Génération de l'exécutable `.exe` :
* Double-cliquez sur **`Installer_Et_Compiler_EXE.bat`**.
* Un fichier `.exe` portable et autonome sera créé dans le dossier `windows_desktop/dist/`.

---

## 📱 2. Application Mobile Android (`android_mobile/`)

### Fonctionnalités Mobiles :
* **Autonomie Totale Anti-Délestage** : Fonctionne 100% hors-ligne grâce à la base de données SQLite locale (`sqflite`). Le vendeur ou la caissière peut continuer les ventes au comptoir même si le PC ou le secteur est coupé.
* **Modes de règlement** : Espèces avec raccourcis billets (500 F, 1 000 F, 2 000 F, 5 000 F, 10 000 F), Orange Money, Moov Money et Ventes à Crédit.
* **Synchronisation Wi-Fi / PC** : Dès que l'électricité revient, un simple clic sur le bouton **« Synchroniser »** envoie les ventes enregistrées vers le PC central et met à jour le stock.

### Générer le fichier `.apk` :
* Double-cliquez sur **`android_mobile/Generer_APK_Android.bat`** (ou lancez `flutter build apk --release`).
* Le fichier généré se trouvera dans `android_mobile/build/app/outputs/flutter-apk/app-release.apk`.

---

## 🌐 3. Web & Cloud (`web_cloud/` + `database/`)

* **Cloud Database** : Supabase PostgreSQL (`https://ylrnxuphtaoazlhlmnsd.supabase.co`)
* **Déploiement Cloud** : Vercel
* **Dépôt GitHub** : `https://github.com/baroubagroup/ouaga-librairie-pos.git`

---

## 🔒 Sécurité & Audit SHA-256
Chaque transaction, vente, réapprovisionnement de stock et clôture de caisse est horodatée et scellée dans une chaîne immuable SHA-256 garantissant zéro fraude et une traçabilité totale.
