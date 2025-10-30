# Getting Started with Chiron v2.0

Questa guida ti aiuterà a creare il tuo primo sito di documentazione con Chiron in meno di 5 minuti.

## 📋 Prerequisiti

- Node.js 18 o superiore
- npm o yarn
- Un editor di testo (VS Code consigliato)

## 🚀 Setup Iniziale

### 1. Installa le Dipendenze

```bash
npm install
```

### 2. Verifica l'Installazione

```bash
npm run build
```

Se tutto funziona, vedrai:

```
🏗️  Building Chiron documentation site...

📄 Processing content files...
  ✓ Generated: index.html
  ✓ Generated: api-reference.html

📦 Copying assets...
✓ Assets copied
✓ Static files copied
✓ Scripts and styles copied

🗺️  Generating sitemap...
✓ Sitemap generated

🤖 Generating robots.txt...
✓ Robots.txt generated

✨ Build completed successfully!
```

### 3. Anteprima del Sito

```bash
npm run preview
```

Apri http://localhost:3000 nel browser.

## 📝 Crea la Tua Prima Pagina

### 1. Crea un File Markdown

Crea `content/getting-started.md`:

```markdown
---
title: Getting Started
description: Come iniziare con il mio progetto
---

# Getting Started

Benvenuto nella documentazione!

## Installazione

```bash
npm install my-project
```

## Primo Utilizzo

```javascript
const myProject = require('my-project');

myProject.init();
```

## Prossimi Passi

- Leggi la [API Reference](api-reference.html)
- Esplora gli esempi
```

### 2. Aggiungi alla Navigazione

Modifica `chiron.config.yaml`:

```yaml
navigation:
  sidebar:
    - section: Getting Started
      items:
        - label: Overview
          file: index.md
        - label: Getting Started  # ← NUOVO
          file: getting-started.md  # ← NUOVO
        - label: API Reference
          file: api-reference.md
```

### 3. Ricompila

```bash
npm run build
```

La tua nuova pagina è pronta in `docs/getting-started.html`!

## ⚙️ Personalizza la Configurazione

### Informazioni Base

Modifica `chiron.config.yaml`:

```yaml
project:
  name: Il Mio Progetto  # ← Cambia questo
  title: Documentazione - Il Mio Progetto  # ← E questo
  description: La mia fantastica documentazione  # ← E questo
  base_url: https://username.github.io/my-repo  # ← URL GitHub Pages
```

### Branding

```yaml
branding:
  company: La Mia Azienda  # ← Nome azienda
  company_url: https://mycompany.com  # ← URL azienda
  tagline: Il mio slogan  # ← Slogan
```

### Colori

```yaml
branding:
  colors:
    primary: "#3b82f6"  # ← Colore primario (blu)
    primary_dark: "#2563eb"  # ← Colore primario scuro
    accent: "#10b981"  # ← Colore accent (verde)
```

Usa qualsiasi colore hex che preferisci!

## 🎨 Personalizza i Logo

### 1. Prepara i Tuoi Logo

Crea questi file nella cartella `assets/`:

- `logo-black.png` - Logo per tema chiaro
- `logo-white.png` - Logo per tema scuro
- `logo-footer.png` - Logo footer tema chiaro
- `logo-footer-white.png` - Logo footer tema scuro

Dimensioni consigliate: 32x32px o 64x64px (SVG ancora meglio)

### 2. Aggiorna la Configurazione

```yaml
branding:
  logo:
    light: logo-black.png
    dark: logo-white.png
    alt: Il Mio Logo
    footer_light: logo-footer.png
    footer_dark: logo-footer-white.png
```

## 📄 Struttura delle Pagine

### Frontmatter Completo

```markdown
---
title: Titolo della Pagina
description: Descrizione per SEO e social media
author: Il Tuo Nome
date: 2025-01-30
---

# Contenuto della pagina
```

### Elementi Markdown Supportati

#### Headers

```markdown
# H1 - Titolo Principale
## H2 - Sezione
### H3 - Sottosezione
```

#### Code Blocks

````markdown
```javascript
function hello() {
  console.log('Hello!');
}
```
````

#### Tabelle

```markdown
| Colonna 1 | Colonna 2 |
|-----------|-----------|
| Dato 1    | Dato 2    |
```

#### Liste

```markdown
- Item 1
- Item 2
  - Sub-item 2.1
  - Sub-item 2.2

1. Primo
2. Secondo
3. Terzo
```

#### Link e Immagini

```markdown
[Link](https://example.com)
![Alt text](assets/image.png)
```

## 🌐 Deploy su GitHub Pages

### Setup Repository

1. **Crea un repository su GitHub**

2. **Inizializza Git** (se non l'hai già fatto):

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/my-repo.git
git push -u origin main
```

3. **Configura GitHub Pages**:
   - Vai su Settings → Pages
   - Source: `main` branch
   - Folder: `/docs`
   - Save

4. **Aggiorna base_url** in `chiron.config.yaml`:

```yaml
project:
  base_url: https://username.github.io/my-repo
```

5. **Rebuild e push**:

```bash
npm run build
git add docs/
git commit -m "Build documentation"
git push
```

Il tuo sito sarà live in pochi minuti!

### Workflow Automatico

Ogni volta che modifichi la documentazione:

```bash
# 1. Modifica i file in content/
# 2. Build
npm run build

# 3. Commit e push
git add .
git commit -m "Update documentation"
git push
```

## 🔧 Comandi Utili

### Development

```bash
# Watch mode - ricompila automaticamente
npm run dev
```

Lascia questo comando in esecuzione mentre modifichi i file. Il sito verrà ricompilato automaticamente ad ogni salvataggio.

### Build

```bash
# Build singolo
npm run build

# Build pulito (rimuove output precedente)
npm run clean && npm run build
```

### Preview

```bash
# Anteprima locale
npm run preview
```

## 📚 Prossimi Passi

1. **Leggi la documentazione completa**: `docs/index.html`
2. **Esplora l'API Reference**: `docs/api-reference.html`
3. **Personalizza il template**: `templates/page.html`
4. **Modifica gli stili**: `styles.css`

## 🆘 Problemi Comuni

### "Cannot find module"

```bash
# Reinstalla le dipendenze
rm -rf node_modules
npm install
```

### "File not found"

- Verifica che il file sia in `content/`
- Controlla il nome del file in `chiron.config.yaml`
- Assicurati che l'estensione sia `.md`

### "Build failed"

- Controlla la sintassi YAML in `chiron.config.yaml`
- Verifica che tutti i file referenziati esistano
- Controlla i log per errori specifici

### Stili non applicati

```bash
# Pulisci e ricompila
npm run clean
npm run build

# Pulisci cache browser (Ctrl+Shift+R)
```

## 💡 Tips & Tricks

### Organizza i Contenuti

```
content/
├── index.md
├── getting-started/
│   ├── installation.md
│   └── quickstart.md
├── guides/
│   ├── basic.md
│   └── advanced.md
└── api/
    └── reference.md
```

### Usa il Watch Mode

Durante lo sviluppo, usa sempre:

```bash
npm run dev
```

Così vedrai le modifiche immediatamente.

### Testa Localmente

Prima di fare push, testa sempre:

```bash
npm run build
npm run preview
```

### Commit Frequenti

Fai commit piccoli e frequenti:

```bash
git add content/my-page.md
git commit -m "Add my-page documentation"
```

## 🎓 Risorse

- **Markdown Guide**: https://www.markdownguide.org/
- **YAML Syntax**: https://yaml.org/
- **GitHub Pages**: https://pages.github.com/
- **Chiron Issues**: https://github.com/agilira/chiron/issues

## 🎉 Congratulazioni!

Ora sai come usare Chiron! Inizia a creare la tua documentazione e condividila con il mondo.

Buona documentazione! 📚✨
