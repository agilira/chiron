# Chiron v2.0 - Modern Documentation Builder

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Markdown](https://img.shields.io/badge/Markdown-GFM-blue.svg)](https://github.github.com/gfm/)

**Chiron** è un builder moderno per siti di documentazione, ottimizzato per GitHub Pages. Scrivi in Markdown, configura in YAML, ottieni un sito professionale.

## 🎯 Caratteristiche Principali

- **📝 Markdown-First**: Scrivi la documentazione in Markdown con frontmatter YAML
- **⚙️ Configurazione YAML**: Un solo file `chiron.config.yaml` per tutto
- **🚀 Build Automatico**: Genera HTML, sitemap.xml e robots.txt automaticamente
- **🎨 Design Moderno**: Interfaccia pulita e responsive
- **♿ Accessibilità**: WCAG 2.2 AA compliant
- **🌙 Dark Mode**: Supporto nativo per tema scuro
- **🔍 SEO Ottimizzato**: Meta tags completi, Open Graph, Schema.org
- **📦 GitHub Pages Ready**: Output ottimizzato per hosting statico
- **🎯 Custom Pages**: Supporto per `index.html` e `404.html` personalizzate
- **📊 Analytics**: Integrazione opzionale con Google Analytics 4 e GTM
- **📈 Mermaid Diagrams**: Supporto nativo per diagrammi e flowchart

## 🚀 Quick Start

### Installazione

```bash
# Clona il repository
git clone https://github.com/agilira/chiron.git
cd chiron

# Installa le dipendenze
npm install
```

### Utilizzo Base

1. **Configura il tuo progetto** in `chiron.config.yaml`:

```yaml
project:
  name: Il Mio Progetto
  title: Documentazione - Il Mio Progetto
  description: Documentazione completa del mio progetto
  base_url: https://username.github.io/my-project

branding:
  company: La Mia Azienda
  company_url: https://mycompany.com
```

2. **Scrivi i contenuti** in Markdown nella cartella `content/`:

```markdown
---
title: La Mia Prima Pagina
description: Questa è la mia prima pagina di documentazione
---

# Benvenuto

Questo è il contenuto della mia pagina scritto in **Markdown**.
```

3. **Genera il sito**:

```bash
npm run build
```

4. **Anteprima locale**:

```bash
npm run preview
```

Il tuo sito è pronto in `docs/` per essere deployato su GitHub Pages!

## 📁 Struttura del Progetto

```
chiron/
├── chiron.config.yaml      # ⚙️ Configurazione principale
├── content/                # 📝 File Markdown delle pagine
│   ├── index.md
│   ├── api-reference.md
│   └── ...
├── assets/                 # 🎨 Immagini, loghi, etc.
│   └── logo.png
├── templates/              # 📄 Template HTML
│   └── page.html
├── builder/                # 🔧 Sistema di build
│   ├── index.js
│   ├── markdown-parser.js
│   ├── template-engine.js
│   └── generators/
├── styles.css              # 💅 Stili CSS
├── script.js               # ⚡ JavaScript
└── docs/                   # 📦 Output (generato automaticamente)
```

## 📝 Scrivere Contenuti

### Frontmatter YAML

Ogni file Markdown può avere metadati in frontmatter:

```markdown
---
title: Titolo della Pagina
description: Descrizione per SEO
author: Nome Autore
date: 2025-01-01
---

# Il contenuto inizia qui
```

### Markdown Supportato

Chiron supporta **GitHub Flavored Markdown** completo:

- Headers con ID automatici
- Code blocks con syntax highlighting
- Tabelle responsive
- Link esterni automatici
- Immagini con lazy loading
- Liste, blockquotes, e altro

### Esempio di Codice

```javascript
// I code blocks hanno il pulsante di copia automatico
function hello() {
  console.log('Hello, Chiron!');
}
```

### Tabelle

| Feature | Status | Note |
|---------|--------|------|
| Markdown | ✅ | Supporto completo GFM |
| YAML | ✅ | Configurazione semplice |
| Build | ✅ | Automatico e veloce |

## ⚙️ Configurazione

### File `chiron.config.yaml`

Il file di configurazione controlla ogni aspetto del sito:

```yaml
# Informazioni Progetto
project:
  name: Chiron
  title: Chiron Documentation
  description: Modern documentation builder
  language: it
  base_url: https://agilira.github.io/chiron

# Branding
branding:
  company: Agilira
  company_url: https://github.com/agilira
  tagline: README on Steroids
  logo:
    light: logo-black.png
    dark: logo-white.png
  colors:
    primary: "#3b82f6"
    accent: "#10b981"

# Navigazione
navigation:
  sidebar:
    - section: Getting Started
      items:
        - label: Overview
          file: index.md
        - label: API Reference
          file: api-reference.md

# Features
features:
  dark_mode: true
  code_copy: true
  cookie_consent: true
  syntax_highlighting: true

# Build
build:
  output_dir: docs
  content_dir: content
  sitemap:
    enabled: true
  robots:
    enabled: true
```

Vedi il file completo per tutte le opzioni disponibili.

## 🛠️ Comandi NPM

```bash
# Build del sito
npm run build

# Watch mode (ricompila automaticamente)
npm run dev

# Anteprima locale
npm run preview

# Pulisci output
npm run clean
```

## 🌐 Deploy su GitHub Pages

### Setup Automatico

1. **Build del sito**:
   ```bash
   npm run build
   ```

2. **Commit e push**:
   ```bash
   git add docs/
   git commit -m "Build documentation"
   git push
   ```

3. **Configura GitHub Pages**:
   - Vai su Settings → Pages
   - Source: `main` branch
   - Folder: `/docs`
   - Salva

Il tuo sito sarà live su `https://username.github.io/repository-name`

### GitHub Actions (Opzionale)

Crea `.github/workflows/build.yml` per build automatico:

```yaml
name: Build Documentation

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

## 🎨 Personalizzazione

### Template Personalizzati

Modifica `templates/page.html` per personalizzare il layout:

```html
<!DOCTYPE html>
<html lang="{{PAGE_LANG}}">
<head>
    <title>{{PAGE_TITLE}}</title>
    {{META_TAGS}}
</head>
<body>
    {{PAGE_CONTENT}}
</body>
</html>
```

### Variabili Disponibili

- `{{PAGE_TITLE}}`, `{{PAGE_CONTENT}}`
- `{{PROJECT_NAME}}`, `{{PROJECT_DESCRIPTION}}`
- `{{GITHUB_URL}}`, `{{COMPANY_URL}}`
- `{{NAVIGATION}}`, `{{BREADCRUMB}}`
- E molte altre...

### Stili CSS

Modifica `styles.css` per personalizzare l'aspetto del sito.

## 🎯 Custom Pages (index.html & 404.html)

Chiron supporta pagine HTML personalizzate per `index.html` e `404.html`.

### Come Funziona

Se crei un file `index.html` o `404.html` nella **root del progetto**, il builder lo userà al posto di generare la pagina dal Markdown:

```
chiron/
├── index.html          ← Custom homepage (opzionale)
├── 404.html            ← Custom 404 page (opzionale)
├── content/
│   ├── index.md        ← Ignorato se esiste index.html custom
│   └── ...
└── chiron.config.yaml
```

### Esempio

```bash
# Crea una homepage custom
echo '<!DOCTYPE html>
<html lang="en">
<head>
    <title>My Custom Homepage</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <h1>Welcome!</h1>
    <a href="api-reference.html">View Docs</a>
    <script src="script.js"></script>
</body>
</html>' > index.html

# Build
npm run build
```

Output:
```
📄 Processing content files...
  ✓ Generated: index.html (using custom HTML)  ← Custom!
  ✓ Generated: api-reference.html
  ✓ Generated: 404.html (default)
```

**Nota**: La 404.html viene generata automaticamente se non esiste. Per maggiori dettagli, vedi [CUSTOM-PAGES.md](CUSTOM-PAGES.md).

## 🎨 Customization (custom.css & custom.js)

Chiron fornisce file dedicati per le tue personalizzazioni senza toccare i file core:

```
chiron/
├── styles.css      ← Chiron core (non modificare)
├── custom.css      ← I tuoi stili personalizzati
├── script.js       ← Chiron core (non modificare)
├── custom.js       ← Il tuo JavaScript personalizzato
└── ...
```

### Esempio

**custom.css**:
```css
/* Cambia i colori del brand */
:root {
  --primary-600: #8b5cf6;
}

/* Stili per pagine custom */
.hero-section {
  background: linear-gradient(135deg, #667eea, #764ba2);
}
```

**custom.js**:
```javascript
// Tracking eventi personalizzati
document.addEventListener('DOMContentLoaded', () => {
  console.log('Custom script loaded!');
});
```

I file custom vengono caricati **dopo** i file core, quindi le tue regole hanno la precedenza.

Per maggiori dettagli, vedi [CUSTOMIZATION.md](CUSTOMIZATION.md).

## 📚 Esempi

### Sito Minimale

```yaml
# chiron.config.yaml
project:
  name: My Docs
  base_url: https://example.github.io/docs

navigation:
  sidebar:
    - section: Docs
      items:
        - label: Home
          file: index.md
```

```markdown
<!-- content/index.md -->
---
title: Home
---

# Welcome to My Docs

This is my documentation site.
```

### Sito Completo

Vedi `chiron.config.yaml` e `content/` per un esempio completo con:
- Navigazione multi-livello
- SEO completo
- Dark mode
- Cookie consent
- Sitemap e robots.txt

## 🔧 API Programmatica

Puoi usare Chiron anche programmaticamente:

```javascript
const ChironBuilder = require('./builder');

const builder = new ChironBuilder('chiron.config.yaml');

// Build singolo
await builder.build();

// Watch mode
builder.watch();
```

## 🐛 Troubleshooting

### Errori di Build

- Verifica la sintassi YAML in `chiron.config.yaml`
- Controlla che tutti i file `.md` esistano in `content/`
- Assicurati che i percorsi siano corretti

### Pagine Mancanti

- Il file deve essere in `content/`
- Deve essere referenziato in `navigation.sidebar`
- Deve avere estensione `.md`

### Problemi di Stile

- Verifica che `styles.css` sia nella root
- Pulisci la cache del browser
- Ricompila con `npm run clean && npm run build`

## 📖 Documentazione Completa

### Guide Principali
- **[Guida Utente](docs/index.html)** - Guida completa all'uso
- **[API Reference](docs/api-reference.html)** - Riferimento API completo
- **[Esempi](examples/)** - Esempi pratici

### Configurazione
- **[Header Navigation](HEADER-NAVIGATION.md)** - Configurare la navigazione nell'header
- **[Table of Contents](TABLE-OF-CONTENTS.md)** - Creare TOC manuali nelle pagine
- **[Analytics Integration](ANALYTICS.md)** - Integrare Google Analytics e GTM
- **[Custom Pages](CUSTOM-PAGES.md)** - Creare pagine HTML personalizzate
- **[Customization](CUSTOMIZATION.md)** - Personalizzare stili e script
- **[Feature Cards](FEATURE-CARDS.md)** - Creare feature cards con SVG

## 🤝 Contribuire

I contributi sono benvenuti! Per favore:

1. Fai fork del progetto
2. Crea un branch per la tua feature
3. Commit delle modifiche
4. Push al branch
5. Apri una Pull Request

## 📄 Licenza

Chiron è rilasciato sotto licenza [MIT](LICENSE).

## 🙏 Ringraziamenti

- [Marked](https://marked.js.org/) - Markdown parser
- [Prism.js](https://prismjs.com/) - Syntax highlighting
- [js-yaml](https://github.com/nodeca/js-yaml) - YAML parser

---

**Chiron v2.0** • Creato con ❤️ da [Agilira](https://github.com/agilira)
