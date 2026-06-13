# Connecter ton VPS à Smart Courses — guide complet

Ce guide te fait passer de **zéro** à **l'assistant IA fonctionnel dans l'app**.
Suis les étapes dans l'ordre. Les choix techniques sont déjà faits pour toi :
**Ollama** comme serveur d'inférence + **Caddy** pour le HTTPS. C'est la
combinaison la plus simple et la plus fiable pour ce cas.

---

## Ce que l'app envoie exactement (le contrat)

Smart Courses est un client **OpenAI-compatible**. Pour CHAQUE message, il fait :

```
POST  {URL_DU_SERVEUR}/v1/chat/completions
Headers:
    Content-Type: application/json
    Authorization: Bearer {clé}      ← seulement si tu remplis le champ Clé API
Body:
    {
      "model": "llama3.1",
      "messages": [ { "role": "...", "content": "..." }, ... ],
      "temperature": 0.4,
      "stream": false
    }
```

Et il lit la réponse à cet emplacement précis :

```
réponse.choices[0].message.content
```

**Conséquences concrètes** — ton serveur doit :
1. exposer la route **`/v1/chat/completions`** (pas `/api/chat`, pas `/generate`) ;
2. accepter les deux modes (`stream: false` ET `stream: true`) ;
3. renvoyer le **format OpenAI**.

### Deux modes selon l'écran

- **Génération de liste** → `stream: false`, l'app lit `choices[0].message.content`.
- **Discussion (chat)** → `stream: true`, l'app lit le flux **SSE** : des lignes
  `data: {…}` où chaque chunk contient `choices[0].delta.content`, terminées par
  `data: [DONE]`. C'est ce qui fait apparaître le texte au fur et à mesure.

> ⚠️ Le streaming impose que **rien ne bufferise** la réponse entre Ollama et le
> téléphone. Si tu mets un reverse proxy (Caddy/nginx), il faut désactiver son
> buffering (voir Étape 4 option B), sinon le texte arrive d'un coup à la fin.

Ollama coche toutes ces cases nativement depuis la v0.1.24. C'est pour ça qu'on le choisit.

---

## Étape 0 — Préparer le VPS (depuis zéro)

### Spécifications minimales

| Usage | CPU | RAM | Disque | GPU |
|-------|-----|-----|--------|-----|
| Minimal (`qwen2.5:3b`) | 2 vCPU | 4 Go | 10 Go libres | non |
| Recommandé (`llama3.1`) | 4 vCPU | 8 Go | 15 Go libres | non |
| Confortable | 4 vCPU+ | 16 Go | 20 Go | NVIDIA (optionnel) |

OS conseillé : **Ubuntu 22.04 / 24.04 LTS** ou Debian 12.

### Mise à jour + pare-feu de base

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl ufw
sudo ufw allow OpenSSH      # ne te coupe pas l'accès SSH
sudo ufw --force enable
```

### (Optionnel) GPU NVIDIA

Si ton VPS a un GPU, installe les pilotes + le toolkit container avant Ollama :

```bash
sudo apt install -y nvidia-driver-535
nvidia-smi   # doit lister le GPU
```

Ollama détecte et utilise le GPU automatiquement ensuite.

---

## Étape 1 — Choisir le modèle selon ton VPS

| RAM / VRAM du VPS | Modèle à utiliser | Commande |
|-------------------|-------------------|----------|
| 4 Go              | `qwen2.5:3b`      | `ollama pull qwen2.5:3b` |
| 8 Go (recommandé) | `llama3.1`        | `ollama pull llama3.1` |
| 16 Go +           | `llama3.1:8b` ou `qwen2.5:14b` | `ollama pull qwen2.5:14b` |
| GPU NVIDIA        | idem, ça accélère tout seul | — |

> Le nom que tu choisis ici (`llama3.1`, `qwen2.5:3b`…) est **exactement** ce que
> tu mettras dans le champ **Modèle** de l'app. Ils doivent être identiques.

Pour la suite, on prend `llama3.1` comme exemple.

---

## Étape 2 — Installer Ollama

En SSH sur le VPS :

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.1
```

Vérifie que le modèle répond localement :

```bash
ollama run llama3.1 "dis bonjour"
```

---

## Étape 3 — Rendre Ollama accessible depuis l'extérieur

Par défaut Ollama n'écoute que sur `127.0.0.1` → injoignable depuis le téléphone.
On le fait écouter sur toutes les interfaces via une surcharge systemd :

```bash
sudo systemctl edit ollama
```

Colle exactement ça dans l'éditeur (les 3 lignes) :

```ini
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_KEEP_ALIVE=30m"
Environment="OLLAMA_NUM_PARALLEL=2"
```

- `OLLAMA_HOST` : écoute sur toutes les interfaces (sinon injoignable du tél).
- `OLLAMA_KEEP_ALIVE=30m` : garde le modèle en RAM 30 min → 1re réponse plus rapide.
- `OLLAMA_NUM_PARALLEL=2` : autorise 2 requêtes simultanées.

Active le démarrage automatique au boot, recharge et redémarre :

```bash
sudo systemctl enable ollama
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

Vérifie qu'il écoute bien sur toutes les interfaces :

```bash
ss -tlnp | grep 11434
# doit afficher 0.0.0.0:11434 (et pas 127.0.0.1:11434)
```

(Optionnel) Pré-charge le modèle en mémoire pour éliminer la latence du 1er appel :

```bash
curl http://localhost:11434/api/generate -d '{"model":"llama3.1","keep_alive":"30m"}'
```

---

## Étape 4 — Choisir : HTTP simple OU HTTPS sécurisé

### Option A — Rapide (HTTP en clair, pour tester)

Ouvre le port :

```bash
sudo ufw allow 11434/tcp
```

Dans l'app (onglet **IA** → ou **Profil → Paramètres → Assistant IA**) :

| Champ            | Valeur                          |
|------------------|---------------------------------|
| **URL du serveur** | `http://IP_DU_VPS:11434`      |
| **Modèle**         | `llama3.1`                    |
| **Clé API**        | *(vide)*                      |

> L'app autorise déjà le HTTP en clair (config réseau Android intégrée).
> ⚠️ N'importe qui connaissant ton IP peut utiliser ton modèle. OK pour tester,
> pas pour laisser en permanence. Passe à l'option B ensuite.

### Option B — Propre (HTTPS + clé secrète, recommandé)

Pré-requis : un **nom de domaine** pointant vers ton VPS (ex: `ia.mondomaine.fr`).

Installe Caddy :

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

Édite `/etc/caddy/Caddyfile` (remplace le domaine et le token) :

```
ia.mondomaine.fr {
    # exige le header Authorization avec ton token
    @ok header Authorization "Bearer CHANGE_MOI_TOKEN_SECRET"
    handle @ok {
        reverse_proxy 127.0.0.1:11434 {
            # CRUCIAL pour le streaming : envoie chaque chunk SSE
            # immédiatement au lieu de le bufferiser
            flush_interval -1
        }
    }
    # sinon, refus
    respond 401
}
```

> `flush_interval -1` est **obligatoire** pour le mode discussion : sans lui,
> Caddy accumule la réponse et le texte apparaît d'un bloc à la fin au lieu de
> défiler. (nginx : `proxy_buffering off;` + `proxy_cache off;`.)

Applique et ferme le port brut (tout passe par Caddy en 443) :

```bash
sudo systemctl reload caddy
sudo ufw allow 443/tcp
sudo ufw deny 11434/tcp
```

Dans l'app :

| Champ            | Valeur                          |
|------------------|---------------------------------|
| **URL du serveur** | `https://ia.mondomaine.fr`    |
| **Modèle**         | `llama3.1`                    |
| **Clé API**        | `CHANGE_MOI_TOKEN_SECRET`     |

---

## Étape 5 — Tester avant d'ouvrir l'app

Lance **exactement la requête que l'app enverra**, depuis ton PC (pas le VPS) :

HTTP (option A) :

```bash
curl http://IP_DU_VPS:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"llama3.1","stream":false,"messages":[{"role":"user","content":"dis bonjour"}]}'
```

HTTPS + token (option B) :

```bash
curl https://ia.mondomaine.fr/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CHANGE_MOI_TOKEN_SECRET" \
  -d '{"model":"llama3.1","stream":false,"messages":[{"role":"user","content":"dis bonjour"}]}'
```

✅ Réponse attendue : un JSON contenant `"choices":[{"message":{"content":"..."}}]`.
Si tu vois ça, la génération de liste marchera.

**Tester le streaming** (mode discussion) — ajoute `"stream":true` :

```bash
curl -N http://IP_DU_VPS:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"llama3.1","stream":true,"messages":[{"role":"user","content":"compte jusqu_a 5"}]}'
```

✅ Tu dois voir s'afficher **progressivement** plusieurs lignes `data: {…}` puis
`data: [DONE]`. Si tout arrive d'un coup en HTTPS → c'est le buffering du proxy
(revois `flush_interval -1` dans le Caddyfile). Le `-N` de curl désactive son
propre buffer pour bien voir le défilement.

---

## Étape 6 — Utiliser l'assistant dans l'app

- **Générer une liste** : tape un besoin (« repas équilibrés pour 4 personnes,
  3 jours ») → l'IA renvoie des articles → bouton **Créer la liste**.
- **Discussion** : questions cuisine / courses en texte libre.

---

## Dépannage (cause → solution exacte)

| Message dans l'app | Cause | Solution |
|--------------------|-------|----------|
| « Impossible de joindre le serveur » | port fermé, mauvaise IP, ou Ollama encore sur 127.0.0.1 | refaire étape 3 (`ss -tlnp \| grep 11434` doit montrer `0.0.0.0`), vérifier `ufw status` |
| « répondu 404 » | la route `/v1/chat/completions` n'existe pas | Ollama trop vieux → `curl -fsSL https://ollama.com/install.sh \| sh` pour mettre à jour |
| « répondu 401 » | Caddy attend le token | remplir le champ **Clé API** avec le token exact du Caddyfile |
| « répondu 500 » + nom de modèle | le modèle n'est pas téléchargé | `ollama pull <le-nom-exact-mis-dans-l-app>` |
| « réponse vide » ou « pas au format » | modèle trop petit pour suivre le JSON | utiliser `llama3.1` (pas un modèle < 3B) |
| très lent | modèle lourd sans GPU | prendre `qwen2.5:3b` |
| marche en HTTP, pas en HTTPS | DNS pas encore propagé / port 443 fermé | `sudo ufw allow 443/tcp`, attendre la propagation du domaine |
| le chat n'affiche pas en streaming (texte d'un bloc) | proxy qui bufferise | ajouter `flush_interval -1` au `reverse_proxy` Caddy (ou `proxy_buffering off` nginx) |
| 1re réponse très lente puis rapides | modèle (re)chargé en RAM | déjà géré par `OLLAMA_KEEP_ALIVE=30m` (étape 3) |
| le service ne redémarre pas après reboot | autostart non activé | `sudo systemctl enable ollama` |

Voir les modèles installés sur le VPS :

```bash
ollama list
```

Suivre les logs Ollama en direct :

```bash
journalctl -u ollama -f
```
