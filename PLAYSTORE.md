# Publication Google Play — Smart Courses

Checklist et procédure pour publier l'app de façon conforme et sécurisée.

## 1. Signature de l'app (BLOQUANT)

Une app signée avec la clé **debug** est refusée par Play. Il faut une clé de
publication (upload key). La keystore ne doit **jamais** être commitée.

### Générer la clé d'upload (une seule fois)

```bash
keytool -genkeypair -v -keystore smartcourses-upload.keystore \
  -alias smartcourses -keyalg RSA -keysize 2048 -validity 10000
```

Garde le fichier `.keystore` et les mots de passe **en lieu sûr** (sa perte
empêche toute mise à jour de l'app).

### Configurer les identifiants

En local, dans `~/.gradle/gradle.properties` (hors dépôt) :

```properties
SC_UPLOAD_STORE_FILE=/chemin/absolu/smartcourses-upload.keystore
SC_UPLOAD_STORE_PASSWORD=********
SC_UPLOAD_KEY_ALIAS=smartcourses
SC_UPLOAD_KEY_PASSWORD=********
```

En CI (GitHub Actions), le workflow `release.yml` génère **automatiquement** un
AAB signé si ces **secrets** sont définis dans le dépôt
(Settings → Secrets and variables → Actions) :

| Secret | Contenu |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | la keystore encodée en base64 (`base64 -w0 smartcourses-upload.keystore`) |
| `ANDROID_KEYSTORE_PASSWORD` | mot de passe du store |
| `ANDROID_KEY_ALIAS` | `smartcourses` (l'alias choisi) |
| `ANDROID_KEY_PASSWORD` | mot de passe de la clé |

Tant que ces secrets ne sont pas définis, la pipeline produit seulement l'APK
(debug) + l'IPA ; dès qu'ils le sont, l'**AAB signé** apparaît dans la release.

`android/app/build.gradle` est déjà prêt : si `SC_UPLOAD_STORE_FILE` est défini,
le build release signe avec cette clé ; sinon il retombe sur debug (builds de test).

### Activer Play App Signing

Recommandé : laisser Google gérer la clé d'app finale ; tu ne fournis que la clé
d'upload. Activé par défaut pour les nouvelles apps sur la Play Console.

## 2. Construire un AAB (et non un APK)

Play attend un **Android App Bundle** :

```bash
cd android && ./gradlew bundleRelease
# Sortie : android/app/build/outputs/bundle/release/app-release.aab
```

(L'APK reste utile pour l'installation directe / les tests hors Play.)

## 3. Versionnage

- `versionCode` doit **augmenter à chaque upload** (actuellement `2`).
- `versionName` est l'étiquette affichée (actuellement `1.4.0`).

## 4. Politique de confidentialité

- Texte fourni dans `PRIVACY.md` + écran in-app (Paramètres → Confidentialité).
- **À héberger** sur une URL publique (ex. GitHub Pages du dépôt) et coller le
  lien dans la Play Console (champ obligatoire).

## 5. Formulaire « Sécurité des données » (Data Safety)

Réponses conformes au fonctionnement réel :

- **Collecte de données par l'app/le développeur** : Non. Aucune donnée n'est
  envoyée au développeur (pas de serveur, pas d'analytics, pas de pub).
- **Partage de données** : Non par l'app elle-même. À déclarer : si l'utilisateur
  active l'IA, ses messages + sa clé sont envoyés **au fournisseur tiers qu'il
  choisit** (Anthropic/OpenAI/…), à des fins de fonctionnement de l'app, sur
  action de l'utilisateur.
- **Données stockées localement chiffrées en transit ?** Les appels IA se font en
  HTTPS.
- **Suppression des données** : possible dans l'app (Paramètres → Tout
  réinitialiser) + désinstallation.

## 6. Permissions

Déclarées et justifiées (rien de superflu) :

- `INTERNET` : appels au fournisseur d'IA configuré par l'utilisateur.
- `VIBRATE` : retour haptique (désactivable).

Aucune permission sensible (localisation, caméra, contacts, stockage, micro).

## 7. Fiche Play Store (honnête)

- **Nom** : Smart Courses
- **Description** : listes de courses + recettes + assistant IA optionnel.
  Doit refléter exactement les fonctions réelles (pas de promesse trompeuse).
- **Captures** : vraies captures de l'app (accueil, courses, recettes, IA, profil).
- **Icône** : 512×512 + bannière 1024×500.
- **Catégorie** : Maison / Style de vie (pas de catégorie sensible).

## 8. Classification du contenu (IARC)

Remplir le questionnaire : pas de violence, sexe, drogue, jeux d'argent →
classification « Tout public » attendue.

## 9. Contenu utilisateur / modération

Non applicable : pas de contenu publié publiquement ni de réseau social. Les
listes/recettes restent locales à l'appareil. (Aucun système de signalement
requis.)

## 10. Conformité technique cible

- `targetSdkVersion` doit respecter le minimum Play en vigueur (vérifier la
  valeur dans `android/build.gradle` au moment de la soumission).
- Tester sur appareil réel : pas de crash au démarrage, fonctions principales OK.

## Récapitulatif des points déjà traités dans le code

- [x] Permissions minimales et justifiées
- [x] `allowBackup=false`
- [x] Config de signature release prête (clés via variables, non commitées)
- [x] `versionCode`/`versionName` à jour
- [x] Politique de confidentialité (doc + écran in-app + lien Paramètres)
- [x] Bug « Tout réinitialiser » corrigé : effaçait listes/recettes mais pas le
      profil, le thème, la clé IA ni les préférences (`SettingsContext.tsx` /
      `SettingsScreen.tsx`) — l'action correspond maintenant à ce que dit
      `PRIVACY.md`.
- [x] Icône d'app personnalisée (adaptive icon vectorielle, remplace l'icône
      par défaut React Native) — voir `res/drawable/ic_launcher_*.xml` et
      `res/mipmap-anydpi-v26/`. Les appareils API < 26 (négligeables en 2026)
      afficheront encore l'ancienne icône PNG tant que les mipmaps legacy ne
      sont pas régénérées (nécessite un outil de rasterisation, non disponible
      dans cet environnement).
- [x] Pipeline CI `.github/workflows/release.yml` vérifiée (build APK toujours,
      AAB signé + IPA conditionnels). Non exécutée/testée depuis cet
      environnement (pas d'accès à GitHub Actions ici) : à valider au premier
      tag réel.
- [x] Audit sécurité/confidentialité : email personnel retiré du contact
      in-app (`PrivacyScreen.tsx`) et de `PRIVACY.md` ; domaine personnel
      (`example.com`) retiré de `SettingsContext.tsx` ; chemins locaux
      retirés de `docs/superpowers/`. La clé API IA est désormais stockée
      chiffrée dans le trousseau du système (Keychain iOS / Keystore Android,
      via `react-native-keychain`) au lieu d'être en clair dans le JSON de
      réglages — voir `SettingsContext.tsx`.
      **Avant de builder** : `npm install` (ajoute `react-native-keychain` au
      `node_modules`) puis, pour iOS, `cd ios && pod install`. Non
      installé/testé depuis cet environnement (pas de terminal fonctionnel
      ici) : à vérifier sur ta machine au premier build.
      **Reste à faire par toi (hors de portée de cet environnement)** :
      réécrire l'historique Git avant de rendre le dépôt public — chaque
      commit existant porte ton nom et ton email, et un ancien commit a
      contenu un token IA en dur (voir détails donnés dans la conversation).

## Reste à faire côté Play Console (hors code)

- [ ] Générer la keystore d'upload et renseigner les 4 secrets GitHub (cf. §1) →
      la pipeline produit alors l'**AAB signé** dans la release au prochain tag
- [ ] Héberger `PRIVACY.md` et coller l'URL dans la Console
- [ ] Télécharger l'AAB de la release et l'**uploader** sur la Play Console
- [ ] Remplir Data Safety, classification, fiche + captures
