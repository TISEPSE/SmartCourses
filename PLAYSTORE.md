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

En CI (GitHub Actions) : stocker la keystore en base64 + les mots de passe dans
les **secrets** du dépôt, puis les exposer en propriétés `-P` au build.

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

## Reste à faire côté Play Console (hors code)

- [ ] Générer la keystore d'upload et renseigner les secrets
- [ ] Héberger `PRIVACY.md` et coller l'URL
- [ ] Construire et uploader l'AAB signé
- [ ] Remplir Data Safety, classification, fiche + captures
