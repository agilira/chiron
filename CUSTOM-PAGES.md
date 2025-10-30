# Custom Pages - index.html & 404.html

Chiron v2.0 supporta pagine HTML personalizzate per `index.html` e `404.html`.

## 🎯 Come Funziona

Se crei un file `index.html` o `404.html` nella **root del progetto**, il builder lo userà al posto di generare la pagina dal Markdown.

```
chiron/
├── index.html          ← Custom homepage (opzionale)
├── 404.html            ← Custom 404 page (opzionale)
├── content/
│   ├── index.md        ← Ignorato se esiste index.html custom
│   └── ...
└── chiron.config.yaml
```

## 📄 index.html Custom

### Quando Usarlo

- Vuoi una homepage completamente personalizzata
- Hai bisogno di layout speciali o animazioni
- Vuoi integrare librerie esterne

### Esempio

Crea `index.html` nella root:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Custom Homepage</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div style="text-align: center; padding: 4rem 2rem;">
        <h1>Welcome to My Documentation</h1>
        <p>This is a custom homepage!</p>
        <a href="api-reference.html">View API Reference</a>
    </div>
    <script src="script.js"></script>
</body>
</html>
```

### Build

```bash
npm run build
```

Output:
```
📄 Processing content files...
  ✓ Generated: index.html (using custom HTML)  ← Custom!
  ✓ Generated: api-reference.html
```

## 🚫 404.html Custom

### Default Behavior

Se **non** crei un `404.html` custom, Chiron genera automaticamente una pagina 404 con:

- Design coerente con il resto del sito
- Link alla homepage
- Supporto dark mode
- Responsive

### Custom 404

Crea `404.html` nella root per personalizzarla:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Oops!</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div style="text-align: center; padding: 4rem 2rem;">
        <h1 style="font-size: 8rem;">🤔</h1>
        <h2>Hmm, this page doesn't exist</h2>
        <p>Maybe you were looking for:</p>
        <ul style="list-style: none; padding: 0;">
            <li><a href="index.html">Homepage</a></li>
            <li><a href="api-reference.html">API Reference</a></li>
        </ul>
    </div>
</body>
</html>
```

## 🔄 Workflow

### Opzione 1: Usa Markdown (Default)

```bash
# Crea content/index.md
# Build genera index.html automaticamente
npm run build
```

### Opzione 2: Usa Custom HTML

```bash
# Crea index.html nella root
# Build usa il tuo HTML custom
npm run build
```

### Opzione 3: Mix

```bash
# index.html custom nella root
# Altre pagine in content/*.md
npm run build
```

## ⚙️ Configurazione GitHub Pages

Per la 404 page su GitHub Pages, assicurati che `404.html` sia nella cartella `docs/`:

```yaml
# chiron.config.yaml
build:
  output_dir: docs  # ← GitHub Pages legge da qui
```

GitHub Pages userà automaticamente `docs/404.html` per pagine non trovate.

## 💡 Tips & Best Practices

### 1. Mantieni Coerenza

Se usi custom HTML, includi gli stessi asset:

```html
<link rel="stylesheet" href="styles.css">
<script src="script.js"></script>
```

### 2. Dark Mode

Per supportare il dark mode nel custom HTML:

```html
<html lang="en" data-theme="light">
<head>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <!-- Il tuo contenuto -->
    <script src="script.js"></script>
</body>
</html>
```

Lo `script.js` gestisce automaticamente il toggle del tema.

### 3. Navigation

Includi link alle altre pagine:

```html
<nav>
    <a href="index.html">Home</a>
    <a href="api-reference.html">API</a>
    <a href="privacy-policy.html">Privacy</a>
</nav>
```

### 4. SEO

Aggiungi meta tags per SEO:

```html
<head>
    <title>My Custom Page</title>
    <meta name="description" content="Description here">
    <meta property="og:title" content="My Custom Page">
    <meta property="og:description" content="Description here">
</head>
```

## 🔍 Debugging

### Verifica Quale File Viene Usato

Controlla l'output del build:

```bash
npm run build
```

Output:
```
📄 Processing content files...
  ✓ Generated: index.html (using custom HTML)  ← Custom
  ✓ Generated: api-reference.html              ← Da Markdown
  ✓ Generated: 404.html (default)              ← Default generato
```

### Forza Rebuild da Markdown

Se vuoi tornare al Markdown, rimuovi il file custom:

```bash
# Windows
del index.html

# Linux/Mac
rm index.html

# Rebuild
npm run build
```

Output:
```
📄 Processing content files...
  ✓ Generated: index.html  ← Ora da content/index.md
```

## 🎨 Esempi Avanzati

### Landing Page Custom

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Project - Documentation</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        .hero {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 2rem;
        }
        .hero h1 {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        .cta-buttons {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
        }
        .btn {
            padding: 1rem 2rem;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.2s;
        }
        .btn-primary {
            background: var(--primary-600);
            color: white;
        }
        .btn-secondary {
            border: 2px solid var(--primary-600);
            color: var(--primary-600);
        }
    </style>
</head>
<body>
    <div class="hero">
        <h1>🚀 My Awesome Project</h1>
        <p style="font-size: 1.5rem; color: var(--text-secondary);">
            The best documentation you'll ever read
        </p>
        <div class="cta-buttons">
            <a href="api-reference.html" class="btn btn-primary">Get Started</a>
            <a href="https://github.com/user/repo" class="btn btn-secondary">View on GitHub</a>
        </div>
    </div>
    <script src="script.js"></script>
</body>
</html>
```

### 404 Divertente

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <title>404 - Lost in Space</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div style="text-align: center; padding: 4rem 2rem;">
        <div style="font-size: 10rem; animation: float 3s ease-in-out infinite;">
            🛸
        </div>
        <h1 style="font-size: 4rem; margin: 1rem 0;">404</h1>
        <h2>Houston, we have a problem</h2>
        <p>This page has drifted into deep space.</p>
        <a href="index.html" style="display: inline-block; margin-top: 2rem; padding: 1rem 2rem; background: var(--primary-600); color: white; text-decoration: none; border-radius: 8px;">
            Return to Earth 🌍
        </a>
    </div>
    <style>
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }
    </style>
    <script src="script.js"></script>
</body>
</html>
```

## 📚 Risorse

- [Markdown Guide](GETTING-STARTED.md) - Per pagine normali
- [Configuration](README.new.md) - Setup generale
- [Templates](templates/page.html) - Template di riferimento

## ❓ FAQ

**Q: Posso personalizzare altre pagine oltre a index e 404?**  
A: No, solo `index.html` e `404.html` possono essere custom. Altre pagine devono usare Markdown per mantenere coerenza.

**Q: Il custom HTML supporta il dark mode?**  
A: Sì, se includi `script.js` e usi le variabili CSS (`var(--text-primary)`, etc.).

**Q: Posso usare template engine nel custom HTML?**  
A: No, il custom HTML viene copiato così com'è. Se hai bisogno di templating, usa Markdown.

**Q: Il sitemap include le pagine custom?**  
A: Sì, il builder estrae il `<title>` dal custom HTML per il sitemap.

---

**Nota**: Questa feature è pensata per dare flessibilità senza compromettere la semplicità del builder. Usa custom HTML solo quando necessario! 🎯
