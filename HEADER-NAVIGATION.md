# Header Navigation Configuration

La navigazione nell'header di Chiron è completamente configurabile tramite il file `chiron.config.yaml`.

## 📋 Configurazione Base

```yaml
navigation:
  header:
    - label: Documentation
      url: index.html
```

## 🔧 Opzioni Disponibili

### Link Interni

Per link alle pagine del tuo sito:

```yaml
navigation:
  header:
    - label: Documentation
      url: index.html
    - label: API Reference
      url: api-reference.html
    - label: Guide
      url: getting-started.html
```

### Link Esterni

Per link esterni (si aprono in una nuova tab):

```yaml
navigation:
  header:
    - label: GitHub
      url: https://github.com/username/repo
      external: true
    - label: Website
      url: https://example.com
      external: true
```

## 📝 Esempi Completi

### Esempio Minimale

```yaml
navigation:
  header:
    - label: Docs
      url: index.html
```

### Esempio con Link Multipli

```yaml
navigation:
  header:
    - label: Documentation
      url: index.html
    - label: API
      url: api-reference.html
    - label: Showcase
      url: showcase.html
    - label: GitHub
      url: https://github.com/agilira/chiron
      external: true
```

### Esempio Completo

```yaml
navigation:
  # Header navigation (top bar)
  header:
    - label: Documentation
      url: index.html
    - label: API Reference
      url: api-reference.html
    - label: Examples
      url: examples.html
    - label: GitHub Repository
      url: https://github.com/username/repo
      external: true
    - label: Support
      url: https://support.example.com
      external: true
```

## 🎨 Comportamento

### Link Interni
- Navigazione standard (stessa tab)
- Nessun attributo `target` o `rel`
- Ideale per pagine della documentazione

### Link Esterni
- Si aprono in una nuova tab (`target="_blank"`)
- Includono `rel="noopener"` per sicurezza
- Ideale per GitHub, siti esterni, etc.

## 💡 Best Practices

### 1. Mantieni l'Header Semplice
L'header dovrebbe contenere solo i link più importanti (3-5 massimo):

```yaml
navigation:
  header:
    - label: Docs
      url: index.html
    - label: API
      url: api-reference.html
    - label: GitHub
      url: https://github.com/username/repo
      external: true
```

### 2. Usa Label Brevi
Le label dovrebbero essere concise e chiare:

✅ **Buono:**
```yaml
- label: Docs
- label: API
- label: GitHub
```

❌ **Da evitare:**
```yaml
- label: Complete Documentation Guide
- label: Full API Reference Documentation
```

### 3. Ordina per Importanza
Metti i link più importanti per primi:

```yaml
navigation:
  header:
    - label: Documentation  # Più importante
      url: index.html
    - label: API           # Importante
      url: api-reference.html
    - label: GitHub        # Meno critico
      url: https://github.com/username/repo
      external: true
```

## 🔍 Accessibilità

L'header navigation include automaticamente:

- `aria-label="Main navigation"` per screen readers
- Link semantici con `<a>` tags
- Attributi `rel="noopener"` per link esterni (sicurezza)
- Hover states per feedback visivo

## 📱 Responsive

Su mobile (< 768px):
- L'header navigation viene **nascosta automaticamente**
- Appare il menu hamburger per la sidebar
- Gli utenti accedono alla navigazione tramite la sidebar mobile

## 🎯 Integrazione con Breadcrumb

L'header navigation è indipendente dal breadcrumb:

```yaml
navigation:
  # Header (top bar)
  header:
    - label: Documentation
      url: index.html
  
  # Breadcrumb (sotto l'header)
  breadcrumb:
    enabled: true
    items:
      - label: Company
        url: https://company.com
        external: true
      - label: Project
        url: https://github.com/company/project
        external: true
```

## 🚀 Template Personalizzato

Se vuoi personalizzare ulteriormente l'header, puoi modificare `templates/page.html`:

```html
<nav class="header-nav" aria-label="Main navigation">
    {{HEADER_NAV}}
</nav>
```

Il placeholder `{{HEADER_NAV}}` viene sostituito automaticamente con i link configurati.

## 🎨 Stili CSS

Gli stili dell'header navigation sono in `styles.css`:

```css
.header-nav {
    display: flex;
    gap: var(--space-6);
    margin-left: var(--space-6);
}

.header-nav a {
    color: var(--text-primary);
    text-decoration: none;
    font-weight: 500;
    padding: var(--space-2) 0;
    transition: opacity var(--transition-fast);
}

.header-nav a:hover {
    opacity: 0.7;
}
```

Puoi personalizzare questi stili in `custom.css` se necessario.

## 📚 Vedi Anche

- [Breadcrumb Configuration](./BREADCRUMB.md) - Configurazione breadcrumb
- [Sidebar Navigation](./SIDEBAR-NAVIGATION.md) - Navigazione sidebar
- [Footer Links](./FOOTER-LINKS.md) - Link nel footer
- [Customization Guide](./CUSTOMIZATION.md) - Personalizzazione avanzata

---

**Chiron v2.0** • [GitHub](https://github.com/agilira/chiron) • [Documentation](index.html)
