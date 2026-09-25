# UMONS Web Calendar

Application Next.js permettant de consulter l'horaire UMONS depuis un flux iCalendar, avec rafraîchissement quotidien et détection locale des changements sur les semaines déjà consultées.

## Fonctionnalités

- vue hebdomadaire desktop ;
- vue verticale adaptée au mobile ;
- détails d'un cours au clic ;
- récupération du calendrier côté serveur ;
- parsing et normalisation du flux ICS ;
- prise en charge des récurrences courantes via `node-ical` ;
- cache serveur Next/Vercel avec revalidation quotidienne ;
- Vercel Cron quotidien à 04:00 UTC ;
- cache navigateur versionné ;
- mémorisation uniquement des semaines consultées ;
- détection des cours ajoutés, supprimés, déplacés ou modifiés ;
- possibilité de marquer les changements comme vus.

## Installation locale

```bash
npm install
npm run dev
```

## Variables d'environnement

```env
ICS_URL=https://ical.umons.ac.be/E8CDD7DC-30FF-4A2A-B78A-BF4EDBD0EE45.ics
CRON_SECRET=une-valeur-secrete
```

`ICS_URL` est optionnelle : l'URL UMONS fournie est utilisée par défaut.

Sur Vercel, définir `CRON_SECRET`. Vercel l'utilise dans l'en-tête Authorization des appels Cron.

## Architecture

- `app/api/calendar/route.ts` : API consommée par le navigateur ;
- `app/api/cron/calendar/route.ts` : rafraîchissement quotidien ;
- `lib/calendar-source.ts` : accès au flux ICS et Data Cache Next.js ;
- `lib/ics.ts` : parsing et normalisation ;
- `lib/diff.ts` : comparaison de snapshots ;
- `lib/browser-cache.ts` : stockage local des semaines consultées ;
- `components/CalendarApp.tsx` : navigation, affichage et notifications.

## Cache et synchronisation

Le flux ICS n'est pas téléchargé à chaque consultation. `unstable_cache` conserve la source côté serveur pendant 24 h. Le Cron Vercel appelle `/api/cron/calendar` chaque jour à 04:00 UTC, invalide le cache puis le réchauffe.

Le navigateur conserve dans `localStorage` uniquement les snapshots des semaines effectivement consultées et les changements déjà vus. Une première consultation établit la référence sans notification. Les visites suivantes comparent uniquement la semaine ouverte.

## Tests

```bash
npm test
```

Les tests couvrent le parsing ICS, les ajouts/suppressions, déplacements, changements de local, absence de faux positifs et l'isolation des semaines consultées.

## Déploiement Vercel

1. importer ce repository dans Vercel ;
2. utiliser le preset Next.js ;
3. définir `CRON_SECRET` ;
4. éventuellement définir `ICS_URL` ;
5. déployer.

`vercel.json` configure automatiquement le Cron quotidien.

## Limites actuelles

Le mode hors-ligne complet n'est pas activé : le manifeste web est présent, mais aucun service worker spécifique n'est installé.

Le parsing des récurrences s'appuie sur `node-ical`. Les cas usuels RRULE, EXDATE et overrides sont traités ; des constructions iCalendar inhabituelles pourront nécessiter un ajustement après observation du flux réel.

## Administration des noms de cours

L'interface `/admin` permet de remplacer les noms bruts du flux UMONS par des noms plus lisibles pour les visiteurs. Les alias sont stockés dans Vercel Blob et appliqués côté serveur avant l'envoi du calendrier au navigateur.

Variables d'environnement nécessaires :

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=un-mot-de-passe-long-et-unique
ADMIN_SESSION_SECRET=une-valeur-aleatoire-longue
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

Créer un Blob Store dans Vercel et le connecter au projet. Les nouveaux stores utilisent l’authentification OIDC automatiquement ; un ancien store peut utiliser `BLOB_READ_WRITE_TOKEN`. Ne jamais préfixer les variables admin avec `NEXT_PUBLIC_` : elles doivent rester uniquement côté serveur.
