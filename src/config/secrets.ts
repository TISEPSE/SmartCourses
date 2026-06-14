// Token IA par défaut (mot de passe attendu par le VPS).
//
// Écrit en dur pour que l'app fonctionne dès l'installation, sans configuration.
// Reste modifiable dans Paramètres → Assistant IA si besoin.
//
// Note : au build de release, si un secret GitHub `AI_API_KEY` existe, le
// workflow le réécrit ici ; sinon cette valeur est conservée.
export const DEFAULT_AI_API_KEY =
  '0e7bb7443893c5462095038247a1591038c2e502cc067dcb0fcf1a0130c71811';
