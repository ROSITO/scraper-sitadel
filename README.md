# Sitadel FR Building Permits Actor

**Apify Actor pour extraire les permis de construire et autorisations d'urbanisme français (données ouvertes Sitadel)**

## 🇫🇷 Description (Français)

Cet Actor Apify extrait et filtre les autorisations d'urbanisme françaises depuis les données ouvertes Sitadel (SDES / Ministère de la Transition Écologique). Les données sont publiées mensuellement sous Licence Ouverte.

### Données sources

- **Producteur**: SDES (Service des données et études statistiques)
- **Licence**: Licence Ouverte / Open Licence
- **Mise à jour**: Mensuelle
- **URL**: https://www.data.gouv.fr/datasets/liste-des-permis-de-construire-et-autres-autorisations-durbanisme

### Datasets disponibles

1. **Logements** - Permis de construire et déclarations préalables pour logements
2. **Locaux non résidentiels** - Autorisations pour locaux commerciaux, industriels, etc.
3. **Permis d'aménager** - Lotissements et aménagements
4. **Permis de démolir** - Autorisations de démolition

### 🔒 Conformité RGPD

**IMPORTANT**: Par défaut, l'actor filtre uniquement les permis déposés par des **personnes morales** (entreprises ayant un SIREN valide). Ceci garantit la conformité RGPD pour la génération de leads B2B.

- ✅ **Mode leads (défaut)**: Uniquement personnes morales avec SIREN
- ⚠️ **Mode analytics**: Si désactivé, inclut aussi les particuliers (attention aux données personnelles)

**Ne vendez jamais de leads de particuliers sans consentement explicite.**

### Filtres disponibles

- **Départements**: Filtrer par code département (ex: 75, 13, 69)
- **Communes**: Filtrer par code INSEE commune
- **Type d'autorisation**: PC, DP, PA, PD
- **Dates**: Période d'autorisation (DATE_REELLE_AUTORISATION)
- **Surfaces**: Surface minimale de plancher (m²)
- **Nombre de logements**: Nombre minimal d'unités
- **Nouveaux uniquement**: Extraction incrémentale depuis la dernière exécution

### Cas d'usage

- 🏗️ **Prospection BTP**: Constructeurs, promoteurs, artisans
- 🏊 **Piscinistes**: Filtrer les permis avec piscine (`I_PISCINE`)
- 🪟 **Cuisinistes, menuisiers**: Nouveaux chantiers résidentiels
- 📊 **Études de marché**: Analyse de l'activité immobilière par région
- 🏘️ **Aménageurs**: Suivi des permis d'aménager et lotissements

## 📥 Entrées (Input Schema)

```json
{
  "datasets": ["logements"],
  "departementCodes": ["75", "13"],
  "typeDau": "PC",
  "dateAutorisationFrom": "2023-01-01",
  "dateAutorisationTo": "2024-12-31",
  "minLogements": 5,
  "onlyPersonnesMorales": true,
  "onlyNewSinceLastRun": false,
  "maxItems": 1000,
  "includeFields": "minimal",
  "mode": "extract"
}
```

### Paramètres détaillés

| Paramètre | Type | Description | Défaut |
|-----------|------|-------------|--------|
| `datasets` | array | Datasets à extraire (`logements`, `locaux`, `amenager`, `demolir`) | `["logements"]` |
| `departementCodes` | array | Codes département (ex: `["75", "13"]`) | `[]` (tous) |
| `communeInseeCodes` | array | Codes INSEE commune | `[]` (tous) |
| `typeDau` | string | Type: `PC`, `DP`, `PA`, `PD` ou vide (tous) | `""` |
| `dateAutorisationFrom` | string | Date début (ISO: YYYY-MM-DD) | - |
| `dateAutorisationTo` | string | Date fin (ISO: YYYY-MM-DD) | - |
| `minSurfaceHab` | number | Surface minimale (m²) | - |
| `minLogements` | number | Nombre minimal de logements | - |
| `onlyPersonnesMorales` | boolean | **Uniquement entreprises avec SIREN (RGPD)** | `true` |
| `onlyNewSinceLastRun` | boolean | Extraction incrémentale | `false` |
| `maxItems` | number | Limite de résultats | illimité |
| `includeFields` | string | `minimal` (leads) ou `full` (tous champs) | `minimal` |
| `mode` | string | `extract` (payant/permit) ou `preview` (gratuit/compte) | `extract` |

## 📤 Sortie (Output)

Chaque item du dataset représente une autorisation:

```json
{
  "id": "PC-075-056-23-00001-75056",
  "typeDau": "PC",
  "numDau": "075-056-23-00001",
  "etatDau": "Autorisé",
  "dateAutorisation": "2023-01-15",
  "commune": "75056",
  "depCode": "75",
  "regCode": "11",
  "denomDemandeur": "SOCIETE IMMOBILIERE PARIS",
  "sirenDemandeur": "123456789",
  "siretDemandeur": "12345678900012",
  "cjDemandeur": "5710",
  "apeDemandeur": "4110A",
  "codePostalDemandeur": "75001",
  "localiteDemandeur": "PARIS",
  "surfacePlancher": 2500.0,
  "nombreLogements": 12,
  "piscine": false,
  "natureProjet": "Construction logements collectifs"
}
```

## 💰 Tarification (Pay-Per-Event)

- **Événement `permit`**: ~0,01 € par permis extrait (prix indicatif)
- **Mode preview/count**: Gratuit (ne pousse pas de données)
- **Coût de base run**: ~0,05 € (prix indicatif)

*Les prix sont définis par l'utilisateur dans la Console Apify. Les montants ci-dessus sont des suggestions.*

## 🚀 Utilisation locale

### Prérequis

- Node.js 20+
- npm ou yarn

### Installation

```bash
npm install
```

### Exécution

```bash
# Build
npm run build

# Run avec input par défaut
npm start

# Mode développement avec watch
npm run dev

# Tests (fixture locale)
npm test
```

### Créer un fichier input local

Créez `apify_storage/key_value_stores/default/INPUT.json`:

```json
{
  "datasets": ["logements"],
  "departementCodes": ["75"],
  "onlyPersonnesMorales": true,
  "maxItems": 10,
  "mode": "extract"
}
```

**Exemples fournis**:
- `.actor/INPUT_EXAMPLE_1.json` - Paris & Marseille, PC logements 5+
- `.actor/INPUT_EXAMPLE_2_PISCINISTES.json` - Région PACA, tous permis
- `.actor/INPUT_EXAMPLE_3_PREVIEW.json` - Mode preview (gratuit, compte uniquement)

**Note**: Les exemples utilisent les vraies URLs DiDo. Pour tester sans télécharger 90MB, utilisez `npm test` qui fonctionne avec le fixture local.

## 🧪 Tests

Un test smoke est inclus avec un fixture CSV de 20 lignes:

```bash
npm test
```

Le fixture `test/fixtures/logements-sample.csv` contient:
- 14 permis de personnes morales (avec SIREN)
- 6 permis de particuliers (sans SIREN)
- 4 permis avec piscine
- Plusieurs départements (75, 13, 69, 35, 44, 33, 64)

## 📁 Structure du projet

```
.
├── .actor/
│   ├── actor.json              # Configuration Actor
│   ├── input_schema.json       # Schéma des entrées
│   └── README.md               # Description store
├── src/
│   ├── main.ts                 # Code principal
│   └── test.ts                 # Tests smoke
├── test/
│   └── fixtures/
│       └── logements-sample.csv # Fixture de test
├── Dockerfile                  # Image Docker
├── package.json
├── tsconfig.json
└── README.md                   # Ce fichier
```

## 🛠️ Extraction incrémentale

Activer `onlyNewSinceLastRun: true` pour extraire uniquement les nouveaux permis depuis la dernière exécution:

1. L'actor sauvegarde la date d'autorisation la plus récente dans le Key-Value Store
2. Aux exécutions suivantes, seuls les permis plus récents sont extraits
3. La watermark est mise à jour automatiquement

**Clé KVS**: `last-run-watermark` (format: `YYYY-MM-DD`)

## 🔍 Champs disponibles

### Champs demandeur (entreprise/particulier)

- `denomDemandeur` - Raison sociale / nom
- `sirenDemandeur` - SIREN (9 chiffres, personnes morales uniquement)
- `siretDemandeur` - SIRET (14 chiffres)
- `cjDemandeur` - Catégorie juridique
- `apeDemandeur` - Code APE/NAF
- `codePostalDemandeur` - Code postal
- `localiteDemandeur` - Ville

### Champs projet

- `typeDau` - Type autorisation (PC, DP, PA, PD)
- `numDau` - Numéro d'autorisation
- `etatDau` - État (Autorisé, Refusé, etc.)
- `dateAutorisation` - Date réelle d'autorisation
- `commune` - Code INSEE commune
- `depCode` - Code département
- `regCode` - Code région
- `surfacePlancher` - Surface habitable créée en m² (source: `SURF_HAB_CREEE`)
- `nombreLogements` - Nombre total de logements créés (source: `NB_LGT_TOT_CREES`)
- `piscine` - Présence piscine (boolean, source: `I_PISCINE`)
- `natureProjet` - Description du projet (source: `NATURE_PROJET_COMPLETEE` ou `NATURE_PROJET_DECLAREE`)

## 📚 Ressources

- [Documentation Sitadel](https://www.statistiques.developpement-durable.gouv.fr/serie-statistique/1418)
- [Données ouvertes data.gouv](https://www.data.gouv.fr/datasets/liste-des-permis-de-construire-et-autres-autorisations-durbanisme)
- [Licence Ouverte 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/)
- [Documentation Apify SDK](https://docs.apify.com/sdk/js)

## 🔐 Notes RGPD

- **Default safe**: `onlyPersonnesMorales: true` filtre les particuliers
- Les données sources sont publiques (Licence Ouverte)
- Pour usage B2B leads: conserver uniquement les personnes morales
- Ne pas revendre de données personnelles de particuliers
- Documenter clairement l'usage dans votre politique de confidentialité

## ⚖️ Licence

Ce code est fourni sous licence Apache 2.0.  
Les données Sitadel sont sous Licence Ouverte / Open Licence (Etalab).

---

## 🇬🇧 English Summary

**Apify Actor for French Sitadel building permits (open data)**

### What it does

Extracts and filters French urban planning permits from Sitadel open data (SDES / Ministry of Ecological Transition):
- Building permits (PC)
- Prior declarations (DP)
- Development permits (PA)
- Demolition permits (PD)

### Key features

- ✅ **RGPD compliant by default**: Only exports legal entities (companies with valid SIREN)
- 🎯 **Filters**: Department, commune, authorization type, dates, surfaces, dwelling count
- 💰 **Pay-per-event**: Charged per extracted permit (`permit` event)
- 🔄 **Incremental extraction**: Watermark-based to get only new permits
- 🧪 **Tested**: Includes fixture CSV and smoke tests

### Use cases

- 🏗️ Construction leads (builders, developers, contractors)
- 🏊 Pool installers (filter by `piscine` flag)
- 🪟 Kitchen/window suppliers (residential projects)
- 📊 Real estate market analysis
- 🏘️ Urban planning monitoring

### Data source

- **Producer**: SDES (French government statistical service)
- **License**: Open License (Licence Ouverte)
- **Update**: Monthly
- **URL**: https://www.data.gouv.fr/datasets/liste-des-permis-de-construire-et-autres-autorisations-durbanisme

### Run locally

```bash
npm install
npm run build
npm start    # Run actor
npm test     # Smoke tests with fixture
```

### GDPR warning

**Never sell personal data of individuals without explicit consent.**  
Use `onlyPersonnesMorales: true` (default) to filter only companies with SIREN.

---

**Built with ❤️ for French construction & real estate professionals**
