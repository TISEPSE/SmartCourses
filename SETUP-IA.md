# Connecter Smart Courses à ton IA (VPS)

Smart Courses parle à n'importe quel serveur exposant l'**API compatible OpenAI**
(`POST /v1/chat/completions`). C'est le cas d'**Ollama**, llama.cpp, vLLM,
LM Studio, LocalAI… Le plus simple sur un VPS est **Ollama**. Ce guide le couvre.

---

## 1. Installer Ollama sur le VPS

Connecte-toi en SSH à ton VPS, puis :

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Télécharge un modèle (choisis selon la RAM/VRAM dispo) :

```bash
ollama pull llama3.1        # ~4.7 Go, bon équilibre (8 Go RAM mini)
# alternatives :
# ollama pull qwen2.5:3b    # léger, rapide (~2 Go)
# ollama pull mistral       # ~4 Go
```

Teste en local sur le VPS :

```bash
ollama run llama3.1 "Donne-moi 3 idées de repas rapides"
```

---

## 2. Exposer Ollama sur le réseau

Par défaut Ollama n'écoute que sur `127.0.0.1`. Pour que ton téléphone puisse
le joindre, fais-le écouter sur toutes les interfaces.

```bash
sudo systemctl edit ollama
```

Ajoute ceci dans l'éditeur qui s'ouvre :

```ini
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
```

Puis redémarre :

```bash
sudo systemctl restart ollama
```

Ouvre le port dans le pare-feu (UFW par exemple) :

```bash
sudo ufw allow 11434/tcp
```

> ⚠️ **Important** : ouvrir 11434 sur Internet expose ton modèle à tout le monde.
> Lis la section Sécurité plus bas.

---

## 3. Configurer l'app

Dans Smart Courses → onglet **IA** (ou **Profil → Paramètres → Assistant IA**) :

| Champ            | Valeur                                            |
|------------------|---------------------------------------------------|
| **URL du serveur** | `http://IP_DE_TON_VPS:11434`                    |
| **Modèle**         | `llama3.1` (le nom exact du `ollama pull`)      |
| **Clé API**        | vide (sauf si tu as mis un reverse proxy, voir + bas) |

L'app appelle automatiquement `http://IP_DE_TON_VPS:11434/v1/chat/completions`.

> L'app autorise le HTTP en clair pour ce cas auto-hébergé. Pour de la
> production, préfère le HTTPS (section Sécurité).

---

## 4. Utiliser l'assistant

- **Générer une liste** : décris un besoin (« repas équilibrés pour 4, 3 jours »)
  → l'IA renvoie une liste d'articles → bouton **Créer la liste**.
- **Discussion** : questions cuisine/courses libres.

---

## Sécurité (recommandé)

Exposer Ollama nu sur Internet = n'importe qui peut consommer ton GPU. Deux options :

### Option A — Restreindre par IP (rapide)

Si ton téléphone a une IP fixe / tu es sur le même réseau, limite le pare-feu :

```bash
sudo ufw delete allow 11434/tcp
sudo ufw allow from TON_IP to any port 11434 proto tcp
```

### Option B — Reverse proxy HTTPS + clé (propre)

Mets **Caddy** devant Ollama : HTTPS automatique + token d'authentification.

`/etc/caddy/Caddyfile` :

```
ia.mondomaine.fr {
    @auth header Authorization "Bearer MON_TOKEN_SECRET"
    handle @auth {
        reverse_proxy 127.0.0.1:11434
    }
    respond 401
}
```

```bash
sudo systemctl reload caddy
sudo ufw delete allow 11434/tcp   # ne plus exposer le port brut
```

Dans l'app :
- **URL du serveur** : `https://ia.mondomaine.fr`
- **Clé API** : `MON_TOKEN_SECRET`

---

## Dépannage

| Symptôme | Cause probable | Solution |
|----------|----------------|----------|
| « Impossible de joindre le serveur » | port fermé / mauvaise IP / Ollama en 127.0.0.1 | Vérifier étape 2, tester `curl http://IP_VPS:11434/api/tags` depuis un autre poste |
| « répondu 404 » | mauvais chemin / serveur non OpenAI | Vérifier que c'est bien Ollama ≥ 0.1.24 (route `/v1` dispo) |
| « répondu 401 » | reverse proxy attend un token | Renseigner la **Clé API** dans l'app |
| Réponse vide / pas au format | modèle trop petit pour le JSON | Utiliser `llama3.1` ou plus gros |
| Lent | modèle lourd / pas de GPU | Prendre un modèle plus léger (`qwen2.5:3b`) |

Vérifier que l'API OpenAI répond, depuis le VPS :

```bash
curl http://localhost:11434/v1/chat/completions -d '{
  "model": "llama3.1",
  "messages": [{"role":"user","content":"dis bonjour"}]
}'
```
