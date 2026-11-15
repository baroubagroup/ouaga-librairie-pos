# Secrétariat Public & Librairie POS (Édition Pro 2026)

Application complète de gestion de caisse, facturation A4, gestion des stocks en gros & détail, créances clients, dettes fournisseurs, journal d'audit immuable SHA-256 et résilience aux délestages (Burkina Faso).

---

## 🌟 Fonctionnalités Clés

1. **Caisse Express Tactile (POS)**
   * Grille d'articles à haute visibilité et touches rapides adaptées au secrétariat public & papeterie : photocopies recto/verso, impressions couleur, saisie, reliure, plastification, stylos Bic, cahiers, rames Double A.
   * Règlements multi-canaux : Espèces avec calculatrice de rendu de monnaie, Orange Money, Moov Money, et Ventes à Crédit (créances).

2. **5 Modèles de Facture A4 Pro Sélectionnables**
   * **Modèle 1 : Classique Officiel** (style administratif & ministériel)
   * **Modèle 2 : Moderne Minimaliste** (design suisse épuré)
   * **Modèle 3 : Commercial Express** (papeterie & détaillant)
   * **Modèle 4 : Corporate Prestige** (bandeau latéral & liseré or)
   * **Modèle 5 : Reçu Certifié Tamponné** (tampon Payé & sceau de sécurité)
   * Conversion automatique du total arrêté en toutes lettres en français (*ex: « Vingt-cinq mille Francs CFA »*).

3. **Gestion Intelligente des Stocks & Approvisionnements**
   * Réapprovisionnement avec sélection de fournisseur (ou création directe de nouveau fournisseur).
   * Prise de marchandise au comptant ou à crédit (tenue automatique du carnet de dettes fournisseurs).
   * Conversion automatique des cartons/boîtes en unités vendues au comptoir.

4. **Suivi des Créances Clients & Dettes Fournisseurs**
   * Fiches clients avec historique des achats, impayés et enregistrement des versements d'acomptes.
   * Fiches fournisseurs détaillées avec dates d'arrivage et soldes dus.

5. **Journal d'Audit Immuable SHA-256**
   * Chaîne cryptographique inviolable scellant chaque vente, réapprovisionnement, modification de prix et clôture journalière.
   * Détecteur d'intégrité en temps réel.

6. **Base de Données Hybride (Offline-First + Supabase Cloud)**
   * Fonctionne à 100% hors-ligne en local avec fichier sécurisé.
   * Synchronisation automatique sur PostgreSQL Supabase (`BAROUBA GROUP`).

7. **Mode Délestage Sonabel & Synchronisation Mobile**
   * Encaissement continu sur smartphone Android pendant les pannes de courant.
   * Rapatriement instantané par Code QR ou câble USB.

---

## 🚀 Démarrage Local

```powershell
# Accéder au dossier sur le bureau
cd "C:\Users\DELL\Desktop\application de gestion de librairie papeterie"

# Lancer le serveur
node server.js
```

Ouvrez ensuite :
👉 **http://localhost:3500**

---

## ☁️ Déploiement Vercel & Supabase

* **Base de données Cloud** : PostgreSQL hébergé sur Supabase (`https://ylrnxuphtaoazlhlmnsd.supabase.co`)
* **Déploiement Cloud** : Prêt pour Vercel via `@vercel/node` et `vercel.json`.
