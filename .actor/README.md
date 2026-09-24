# Sitadel FR Building Permits - Permis de Construire

**Générez des leads BTP/immobilier qualifiés depuis les données ouvertes françaises**

## 🎯 Pour qui ?

- **Constructeurs & promoteurs**: Identifiez de nouveaux projets immobiliers
- **Piscinistes**: Trouvez les permis avec piscine dans votre secteur
- **Cuisinistes, menuisiers, électriciens**: Prospectez les nouveaux chantiers
- **Aménageurs & lotisseurs**: Suivez les permis d'aménager
- **Bureaux d'études & architectes**: Analysez le marché de la construction

## ✨ Fonctionnalités

### 🔒 Conforme RGPD par défaut
Filtre automatiquement pour ne garder que les **personnes morales** (entreprises avec SIREN). Aucun risque de vendre des données personnelles de particuliers.

### 🎯 Filtrage puissant
- **Géographique**: Départements, communes
- **Type**: Permis de construire (PC), déclaration préalable (DP), aménager (PA), démolir (PD)
- **Temporel**: Période d'autorisation, nouveaux depuis dernière exécution
- **Projet**: Surface minimale, nombre de logements, présence piscine

### 📊 4 datasets Sitadel
1. **Logements** - Permis résidentiels
2. **Locaux non résidentiels** - Commerce, industrie, bureaux
3. **Permis d'aménager** - Lotissements
4. **Permis de démolir** - Démolitions

### 💰 Tarification au permis
Mode extraction payant par événement `permit` (~0,01 €/permis suggéré).  
Mode preview gratuit pour compter les résultats sans extraction.

## 🚀 Exemples d'utilisation

### Pisciniste en Provence
```json
{
  "datasets": ["logements"],
  "departementCodes": ["13", "83", "84"],
  "dateAutorisationFrom": "2024-01-01",
  "onlyPersonnesMorales": true,
  "mode": "extract"
}
```
**Résultat**: Tous les permis de logements avec piscine dans les Bouches-du-Rhône, Var et Vaucluse depuis janvier 2024, déposés par des entreprises.

### Promoteur immobilier Île-de-France
```json
{
  "datasets": ["logements"],
  "departementCodes": ["75", "92", "93", "94"],
  "typeDau": "PC",
  "minLogements": 10,
  "onlyPersonnesMorales": true,
  "mode": "extract"
}
```
**Résultat**: Permis de construire pour immeubles de 10+ logements à Paris et petite couronne, maîtres d'ouvrage entreprises uniquement.

### Suivi marché national logements collectifs
```json
{
  "datasets": ["logements"],
  "typeDau": "PC",
  "minLogements": 5,
  "onlyNewSinceLastRun": true,
  "onlyPersonnesMorales": true,
  "mode": "extract"
}
```
**Résultat**: Nouveaux PC de logements collectifs (5+ unités) depuis la dernière exécution, sur toute la France.

## 📋 Données fournies

Chaque permis extrait contient:

### Informations maître d'ouvrage
- Dénomination sociale
- SIREN / SIRET
- Catégorie juridique
- Code APE
- Adresse (CP, ville)

### Informations projet
- Type et numéro d'autorisation
- Date d'autorisation
- État (autorisé, refusé, etc.)
- Localisation (région, département, commune INSEE)
- Surface de plancher (m²)
- Nombre de logements
- Présence piscine
- Nature du projet

## 🔄 Extraction incrémentale

Activez **"Only new since last run"** pour ne récupérer que les nouveaux permis depuis votre dernière exécution. Parfait pour des runs automatiques quotidiens ou hebdomadaires.

## 🛡️ Conformité & Licence

- **Données sources**: SDES (Ministère de la Transition Écologique)
- **Licence**: Licence Ouverte 2.0 (réutilisation libre, même commerciale)
- **RGPD**: Respect garanti avec le filtre "personnes morales" activé
- **Mise à jour**: Données mensuelles depuis 2013

## 💡 Cas d'usage avancés

### Lead scoring automatique
Combinez avec l'API SIRENE (via autre actor) pour enrichir:
- Effectif de l'entreprise
- Chiffre d'affaires
- Ancienneté
- Secteur d'activité détaillé

### Alertes géolocalisées
Programmez des runs réguliers avec notifications (email, Slack, webhook) pour être alerté des nouveaux permis dans votre zone de chalandise.

### Analyse de marché
Mode "preview/count" gratuit pour statistiques:
- Volume de permis par département
- Évolution temporelle
- Analyse des surfaces moyennes

## 📞 Support

Questions sur l'actor ? Consultez le README complet dans le repository GitHub ou la documentation Apify.

---

**🇫🇷 Données 100% françaises, 100% légales, 100% exploitables**
