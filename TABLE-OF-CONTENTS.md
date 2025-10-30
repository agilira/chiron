# Table of Contents (TOC)

Chiron supporta Table of Contents (TOC) **manuale** direttamente nel Markdown. Questo approccio è semplice, flessibile e non richiede configurazione.

## 🎯 Come Funziona

1. **Heading automatici con ID**: Ogni heading (`## Title`) ottiene automaticamente un ID (`id="title"`)
2. **Link interni**: Usa la sintassi Markdown standard `[Text](#id)`
3. **Smooth scroll**: Lo script.js gestisce automaticamente lo scroll fluido

## 📝 Esempio Base

```markdown
---
title: My Page
description: A page with table of contents
---

# My Page

## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Advanced Topics](#advanced-topics)

## Introduction

Content here...

## Getting Started

More content...

## Advanced Topics

Even more content...
```

## 🎨 TOC Stilizzato

Puoi usare HTML per un TOC più ricco:

```markdown
## Table of Contents

<div class="toc">

**On this page:**

- [Quick Start](#quick-start)
- [Configuration](#configuration)
  - [Basic Setup](#basic-setup)
  - [Advanced Options](#advanced-options)
- [Examples](#examples)

</div>

## Quick Start
...
```

Poi in `custom.css`:

```css
.toc {
  background: var(--bg-tertiary);
  border-left: 3px solid var(--primary-600);
  padding: var(--space-4);
  margin: var(--space-6) 0;
  border-radius: var(--border-radius);
}

.toc ul {
  margin: var(--space-2) 0;
}
```

## 🔗 Come Funzionano gli ID

Gli heading vengono convertiti automaticamente in ID:

| Heading | ID Generato |
|---------|-------------|
| `## Getting Started` | `#getting-started` |
| `## API Reference` | `#api-reference` |
| `### User Authentication` | `#user-authentication` |
| `## FAQ & Support` | `#faq-support` |

**Regole di conversione:**
- Tutto lowercase
- Spazi → trattini (`-`)
- Caratteri speciali rimossi
- Solo lettere, numeri e trattini

## 📱 TOC Responsive

Per un TOC che si nasconde su mobile:

```markdown
<div class="toc desktop-only">

## Table of Contents

- [Section 1](#section-1)
- [Section 2](#section-2)

</div>
```

In `custom.css`:

```css
@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }
}
```

## 🎯 Best Practices

### 1. Posiziona il TOC in Alto
Metti il TOC subito dopo il titolo principale:

```markdown
# Page Title

Brief introduction...

## Table of Contents
- [Section 1](#section-1)
...

## Section 1
```

### 2. Usa Indentazione per Sottosezioni
```markdown
## Table of Contents

- [Main Topic](#main-topic)
  - [Subtopic A](#subtopic-a)
  - [Subtopic B](#subtopic-b)
- [Another Topic](#another-topic)
```

### 3. Non Includere il TOC nel TOC
Non linkare "Table of Contents" a se stesso:

✅ **Buono:**
```markdown
## Table of Contents
- [Introduction](#introduction)
```

❌ **Da evitare:**
```markdown
## Table of Contents
- [Table of Contents](#table-of-contents)
- [Introduction](#introduction)
```

### 4. Mantienilo Breve
Un TOC con più di 10 voci diventa difficile da usare. Considera di:
- Mostrare solo heading di livello 2 (`##`)
- Dividere la pagina in più pagine
- Usare sezioni collassabili

## 🚀 Esempi Avanzati

### TOC con Emoji
```markdown
## 📚 Table of Contents

- 🚀 [Quick Start](#quick-start)
- ⚙️ [Configuration](#configuration)
- 📖 [API Reference](#api-reference)
- ❓ [FAQ](#faq)
```

### TOC Collassabile
```markdown
<details>
<summary><strong>📚 Table of Contents</strong></summary>

- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Advanced](#advanced)

</details>
```

### TOC con Descrizioni
```markdown
## Table of Contents

- **[Quick Start](#quick-start)** - Get up and running in 5 minutes
- **[Configuration](#configuration)** - Customize your setup
- **[API Reference](#api-reference)** - Complete API documentation
```

## 🔍 Verifica ID degli Heading

Per verificare quale ID ha un heading:

1. Apri la pagina nel browser
2. Ispeziona l'heading (F12)
3. Guarda l'attributo `id`

Oppure usa questa regola:
```javascript
// In console del browser
document.querySelectorAll('h2, h3, h4').forEach(h => {
  console.log(h.textContent, '→', h.id);
});
```

## 💡 Perché Manuale?

**Vantaggi del TOC manuale:**
- ✅ **Controllo totale**: Decidi cosa includere
- ✅ **Flessibilità**: Puoi personalizzare testo e struttura
- ✅ **Semplicità**: Nessuna configurazione necessaria
- ✅ **Portabilità**: Funziona anche su GitHub
- ✅ **Performance**: Nessun JavaScript extra

**Svantaggi:**
- ❌ Devi aggiornarlo manualmente se cambi gli heading

## 🎨 Stili Predefiniti

Chiron include già stili per liste e link. Il TOC eredita automaticamente:
- Smooth scroll
- Hover effects
- Dark mode support
- Responsive design

## 📚 Vedi Anche

- [Markdown Guide](https://www.markdownguide.org/extended-syntax/#heading-ids)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)
- [Customization Guide](./CUSTOMIZATION.md)

---

**Chiron v2.0** • [GitHub](https://github.com/agilira/chiron) • [Documentation](index.html)
