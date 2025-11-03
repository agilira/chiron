# Chiron v3.0 - Roadmap Completa
## The GitOps-Native Hybrid SSG

**Vision**: Zero-friction SSG con Go performance, Node.js DX, e GitOps workflow nativo.

**Stack AGILira**:
- **Orpheus**: CLI framework (ultra-fast, fluent API)
- **Argus**: File watcher (zero-alloc, red team tested)
- **argus-provider-git**: Git remote config provider
- **Go**: Performance-critical tasks (scanner, indexer)
- **Node.js**: Developer experience (templates, ecosystem)

---

## 📋 Phases Overview

1. **Phase 1**: Go Worker Foundation (scanner + indexer + build-log)
2. **Phase 2**: Orpheus CLI (ch init, build, dev, deploy)
3. **Phase 3**: Argus Integration (hot reload con build-log.json)
4. **Phase 4**: GitOps Provider (remote config da Git)
5. **Phase 5**: Distribution (NPM, Docker, GitHub Actions)
6. **Phase 6**: Polish & Launch (docs, marketing, release)

---

## Phase 1: Go Worker Foundation
**Duration**: 1-2 settimane  
**Goal**: Worker Go per scanner + indexer + build-log

### Deliverables
- [ ] `chiron-worker` binary
- [ ] Scanner: parallel directory walking (10× faster)
- [ ] Indexer: concurrent search indexing (20× faster)
- [ ] Build log: audit trail con hash-based change detection
- [ ] Node.js integration: spawn worker + graceful fallback
- [ ] Tests: unit + integration + benchmarks

### Architecture
```
chiron-worker/
├── cmd/main.go              # CLI entry (--mode=build|watch)
├── pkg/
│   ├── scanner/             # Parallel directory scanner
│   ├── indexer/             # Concurrent search indexer
│   ├── buildlog/            # Build log generation
│   └── types/               # Shared types
└── go.mod
```

### Key Files

**1. Scanner** (`pkg/scanner/scanner.go`)
- Parallel directory walking con goroutines
- Hash calculation (SHA256) per file
- Output: `[]FileInfo` con path, hash, size, modified

**2. Indexer** (`pkg/indexer/indexer.go`)
- Concurrent markdown parsing
- Tokenization con stop words
- Output: `SearchIndex` con pages + tokens

**3. Build Log** (`pkg/buildlog/buildlog.go`)
- Change detection: added/modified/deleted (hash-based)
- Atomic write (temp file + rename)
- Output: `build-log.json` per Argus

**4. CLI** (`cmd/main.go`)
- Input: JSON via stdin (content_dir, output_dir)
- Output: JSON via stdout (files, search_index, build_log)
- Mode: build (one-time) o watch (continuous)

### Node.js Integration

**File**: `builder/workers/go-worker.js`
```javascript
async function runGoWorker(contentDir, outputDir) {
  const worker = spawn('chiron-worker', ['--mode=build']);
  
  // Send input via stdin
  worker.stdin.write(JSON.stringify({ content_dir, output_dir }));
  worker.stdin.end();
  
  // Collect output from stdout
  const result = await collectOutput(worker);
  
  // Fallback to JS if worker fails
  if (!result) return jsImplementation();
  
  return result;
}
```

**Update**: `builder/index.js`
```javascript
async build() {
  // Call Go worker
  const { files, search_index, build_log } = await runGoWorker(...);
  
  // Process files (Node.js strength)
  for (const file of files) {
    await this.processMarkdownFile(file);
  }
  
  // Write outputs
  fs.writeFileSync('docs/search-index.json', JSON.stringify(search_index));
  // build-log.json già scritto da Go worker
}
```

### Success Criteria
- ✅ 10× faster directory scanning
- ✅ 20× faster search indexing
- ✅ Graceful fallback se worker manca
- ✅ Build log con change detection
- ✅ All tests passing

---

## Phase 2: Orpheus CLI
**Duration**: 1-2 settimane  
**Goal**: CLI universale con auto-install dependencies

### Deliverables
- [ ] `ch` binary (Orpheus-powered)
- [ ] `ch init`: smart environment setup
- [ ] `ch build`: fast build con Go worker
- [ ] `ch dev`: dev server con hot reload
- [ ] `ch deploy`: multi-platform deploy
- [ ] Auto-installer: Node.js, Go, Docker

### Architecture
```
ch/
├── cmd/
│   ├── main.go              # Orpheus app
│   ├── init.go              # ch init
│   ├── build.go             # ch build
│   ├── dev.go               # ch dev
│   └── deploy.go            # ch deploy
├── pkg/
│   ├── installer/           # Dependency installer
│   │   ├── nodejs.go
│   │   ├── golang.go
│   │   └── docker.go
│   └── config/              # Config loader
└── go.mod
    - github.com/agilira/orpheus
```

### Commands

**1. ch init** (`cmd/init.go`)
```go
func cmdInit(ctx *orpheus.Context) error {
    projectName := ctx.Args[0]
    useDocker := ctx.GetFlagBool("docker")
    setupEnv := ctx.GetFlagBool("environment")
    
    // Check environment
    env := installer.CheckEnvironment()
    
    if useDocker {
        return initWithDocker(projectName)
    }
    
    if setupEnv || !env.IsComplete() {
        installer.SetupEnvironment(env)
    }
    
    // Create project
    createProject(projectName)
    
    // Auto-start dev server
    if ctx.GetFlagBool("start") {
        return cmdDev(ctx)
    }
    
    return nil
}
```

**Flags**:
- `--docker`: Use Docker (no local install)
- `--environment`: Auto-install Node.js + Go
- `--template=name`: Project template
- `--config=url`: Remote config (git://...)
- `--start`: Start dev server after init

**2. ch build** (`cmd/build.go`)
```go
func cmdBuild(ctx *orpheus.Context) error {
    config := loadConfig(ctx.GetFlagString("config"))
    
    // Call Go worker
    result := callGoWorker(config)
    
    // Call Node.js builder for HTML
    callNodeBuilder(result.Files, config)
    
    return nil
}
```

**3. ch dev** (`cmd/dev.go`)
```go
func cmdDev(ctx *orpheus.Context) error {
    // Initial build
    cmdBuild(ctx)
    
    // Start watcher (Phase 3)
    startWatcher()
    
    // Start dev server
    startDevServer(ctx.GetFlagInt("port"))
    
    return nil
}
```

**4. ch deploy** (`cmd/deploy.go`)
```go
func cmdDeployGitHub(ctx *orpheus.Context) error {
    // Build first
    cmdBuild(ctx)
    
    // Git operations
    exec.Command("git", "add", "docs").Run()
    exec.Command("git", "commit", "-m", "Deploy").Run()
    exec.Command("git", "push").Run()
    
    return nil
}
```

### Auto-Installer

**Environment Check** (`pkg/installer/installer.go`)
```go
type Environment struct {
    HasNode   bool
    HasGo     bool
    HasDocker bool
}

func CheckEnvironment() Environment {
    // Check node --version
    // Check go version
    // Check docker --version
}
```

**Node.js Installer** (`pkg/installer/nodejs.go`)
```go
func InstallNodeJS() error {
    // Detect OS + arch
    // Download Node.js binary
    // Extract to ~/.chiron/node
    // Add to PATH
}
```

**Go Installer** (`pkg/installer/golang.go`)
```go
func InstallGo() error {
    // Detect OS + arch
    // Download Go binary
    // Extract to ~/.chiron/go
    // Add to PATH
}
```

### Success Criteria
- ✅ `ch init` crea progetto + installa deps
- ✅ `ch build` usa Go worker
- ✅ `ch dev` avvia server
- ✅ `ch deploy` supporta GitHub/Netlify/Vercel
- ✅ Auto-installer funziona su macOS/Linux/Windows

---

## Phase 3: Argus Integration
**Duration**: 1 settimana  
**Goal**: Hot reload con Argus watching build-log.json

### Deliverables
- [ ] Argus watcher per build-log.json
- [ ] Incremental rebuild (solo file modificati)
- [ ] Hot reload <200ms
- [ ] Audit trail in Argus DB

### Architecture
```
ch dev
  ↓
Initial build → build-log.json
  ↓
Argus watches build-log.json
  ↓
File change detected
  ↓
New build → new build-log.json
  ↓
Argus detects change (new build_id)
  ↓
Load changes from build-log.json
  ↓
Incremental rebuild (only modified files)
  ↓
Browser hot reload
```

### Implementation

**1. Watcher** (`chiron-worker/cmd/main.go`)
```go
func watchMode() error {
    // Argus watches build-log.json
    watcher := argus.New(argus.Config{
        PollInterval: 100 * time.Millisecond,
        CacheTTL:     50 * time.Millisecond,
    })
    
    var lastBuildID string
    
    watcher.Watch("docs/build-log.json", func(event argus.ChangeEvent) {
        // Load new build log
        buildLog := loadBuildLog()
        
        // Check if new build (not just file touch)
        if buildLog.BuildID == lastBuildID {
            return
        }
        
        lastBuildID = buildLog.BuildID
        
        // Send event to Node.js
        json.NewEncoder(os.Stdout).Encode(WatchEvent{
            Type:     "build_complete",
            BuildID:  buildLog.BuildID,
            Changes:  buildLog.Changes,
        })
    })
    
    watcher.Start()
    select {} // Keep alive
}
```

**2. Dev Server** (`ch/cmd/dev.go`)
```go
func cmdDev(ctx *orpheus.Context) error {
    // Initial build
    cmdBuild(ctx)
    
    // Start Go worker in watch mode
    watcher := spawn("chiron-worker", "--mode=watch")
    
    // Listen for events
    watcher.stdout.on("data", func(data) {
        event := parseEvent(data)
        
        if event.Type == "build_complete" {
            // Incremental rebuild
            incrementalBuild(event.Changes)
            
            // Notify browser
            notifyBrowser("reload")
        }
    })
    
    // Start HTTP server
    startServer(ctx.GetFlagInt("port"))
    
    return nil
}

func incrementalBuild(changes Changes) {
    // Rebuild only modified files
    for _, file := range changes.Modified {
        rebuildFile(file)
    }
    
    // Add new files
    for _, file := range changes.Added {
        buildFile(file)
    }
    
    // Remove deleted files
    for _, file := range changes.Deleted {
        removeFile(file)
    }
}
```

### Success Criteria
- ✅ Argus rileva cambio build-log.json
- ✅ Incremental rebuild (solo file modificati)
- ✅ Hot reload <200ms
- ✅ Audit trail salvato in Argus DB

---

## Phase 4: GitOps Provider
**Duration**: 1 settimana  
**Goal**: Remote config da Git con argus-provider-git

### Deliverables
- [ ] Config loading da Git
- [ ] Multi-platform: GitHub, GitLab, Bitbucket
- [ ] Branch/tag/commit support
- [ ] Auto-reload on Git push
- [ ] Config inheritance

### Architecture
```
ch init --config=git://github.com/company/configs.git#chiron.yaml
  ↓
argus-provider-git clona repo
  ↓
Carica chiron.yaml
  ↓
Crea progetto con config
  ↓
Argus watcha Git repo
  ↓
Push to Git
  ↓
Argus rileva cambio
  ↓
Reload config
  ↓
Rebuild automatico
```

### Implementation

**1. Config Loader** (`ch/pkg/config/config.go`)
```go
func LoadConfig(url string) (Config, error) {
    if strings.HasPrefix(url, "git://") {
        return loadFromGit(url)
    }
    
    // Local file
    return loadFromFile(url)
}

func loadFromGit(url string) (Config, error) {
    provider := git.NewProvider(git.Config{
        PollInterval: 30 * time.Second,
        ShallowClone: true,
    })
    
    data, err := provider.Load(url)
    if err != nil {
        return Config{}, err
    }
    
    var config Config
    yaml.Unmarshal(data, &config)
    
    return config, nil
}
```

**2. Config Watcher** (`ch/cmd/dev.go`)
```go
func watchGitConfig(url string) {
    provider := git.NewProvider(git.Config{
        PollInterval: 30 * time.Second,
    })
    
    provider.Watch(url, func(newData []byte) {
        log.Info("🔄 Config updated from Git")
        
        // Reload config
        var newConfig Config
        yaml.Unmarshal(newData, &newConfig)
        
        // Rebuild with new config
        rebuild(newConfig)
        
        log.Success("✓ Rebuild complete")
    })
}
```

**3. Config Inheritance** (`ch/pkg/config/inheritance.go`)
```go
func LoadWithInheritance(url string) (Config, error) {
    config := LoadConfig(url)
    
    if config.Extends != "" {
        baseConfig := LoadConfig(config.Extends)
        config = mergeConfigs(baseConfig, config)
    }
    
    return config, nil
}
```

### URL Format
```bash
# GitHub
git://github.com/user/configs.git#chiron.yaml

# With branch
git://github.com/user/configs.git#chiron.yaml?ref=main

# With tag (version pinning)
git://github.com/user/configs.git#chiron.yaml?ref=v1.2.3

# With token
git://github.com/user/configs.git#chiron.yaml?token=ghp_xxx

# GitLab
git://gitlab.com/user/configs.git#chiron.yaml

# Self-hosted
git://git.company.com/configs.git#chiron.yaml
```

### Success Criteria
- ✅ Load config da Git (GitHub, GitLab, Bitbucket)
- ✅ Support branch/tag/commit
- ✅ Auto-reload on Git push
- ✅ Config inheritance funziona

---

## Phase 5: Distribution
**Duration**: 1 settimana  
**Goal**: 3 modalità distribuzione (NPM, Docker, GitHub Actions)

### Deliverables
- [ ] NPM package con post-install
- [ ] Docker container completo
- [ ] GitHub Action pre-configurata
- [ ] Installer script (get.chiron.dev)

### 1. NPM Distribution

**package.json**
```json
{
  "name": "chiron-ssg",
  "version": "3.0.0",
  "bin": {
    "ch": "./bin/ch"
  },
  "scripts": {
    "postinstall": "node scripts/download-binaries.js"
  },
  "optionalDependencies": {
    "chiron-darwin-x64": "^3.0.0",
    "chiron-darwin-arm64": "^3.0.0",
    "chiron-linux-x64": "^3.0.0",
    "chiron-win32-x64": "^3.0.0"
  }
}
```

**scripts/download-binaries.js**
```javascript
// Detect OS + arch
// Download ch binary from GitHub releases
// Download chiron-worker binary
// Make executable
```

### 2. Docker Distribution

**Dockerfile**
```dockerfile
FROM node:20-alpine

# Copy ch binary
COPY bin/ch /usr/local/bin/ch
COPY bin/chiron-worker /usr/local/bin/chiron-worker
RUN chmod +x /usr/local/bin/ch /usr/local/bin/chiron-worker

# Copy Node.js builder
COPY builder/ /app/builder/
COPY templates/ /app/templates/
COPY styles/ /app/styles/

WORKDIR /workspace

ENTRYPOINT ["ch"]
CMD ["build"]
```

**docker-compose.yml**
```yaml
version: '3.8'

services:
  chiron:
    image: agilira/chiron:latest
    volumes:
      - ./docs-src:/workspace
    ports:
      - "3000:3000"
    command: dev
```

### 3. GitHub Actions

**.github/actions/chiron/action.yml**
```yaml
name: 'Chiron Build'
description: 'Build documentation with Chiron'

inputs:
  config:
    description: 'Config file path'
    default: 'chiron.config.yaml'
  output:
    description: 'Output directory'
    default: 'docs'

runs:
  using: 'composite'
  steps:
    - name: Download Chiron
      run: |
        curl -sSL https://github.com/agilira/chiron/releases/latest/download/ch-linux-x64 -o /usr/local/bin/ch
        chmod +x /usr/local/bin/ch
    
    - name: Build
      run: ch build --config=${{ inputs.config }} --output=${{ inputs.output }}
```

**Usage**:
```yaml
# .github/workflows/docs.yml
name: Build Docs

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: agilira/chiron-action@v3
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

### 4. Installer Script

**get.chiron.dev**
```bash
#!/bin/bash
set -e

echo "🚀 Installing Chiron..."

# Detect OS + arch
OS="$(uname -s)"
ARCH="$(uname -m)"

# Download ch binary
URL="https://github.com/agilira/chiron/releases/latest/download/ch-${OS}-${ARCH}"
curl -sSL "$URL" -o /usr/local/bin/ch
chmod +x /usr/local/bin/ch

echo "✓ Chiron installed!"
echo ""
echo "Get started:"
echo "  ch init my-docs"
```

### Success Criteria
- ✅ NPM install funziona (auto-download binaries)
- ✅ Docker container funziona
- ✅ GitHub Action funziona
- ✅ Installer script funziona

---

## Phase 6: Polish & Launch
**Duration**: 1 settimana  
**Goal**: Documentation, marketing, release

### Deliverables
- [ ] Documentation completa
- [ ] Examples repository
- [ ] Marketing materials
- [ ] Blog posts
- [ ] Release v3.0.0

### 1. Documentation

**docs.chiron.dev**
- Quick Start (5 minuti)
- Installation (NPM, Docker, installer)
- CLI Reference (ch init, build, dev, deploy)
- Configuration (YAML schema)
- GitOps Guide (remote config)
- Templates Guide
- Deployment Guide
- API Reference

### 2. Examples

**github.com/agilira/chiron-examples**
- basic: Simple docs site
- blog: Blog with posts
- api-docs: API documentation
- multi-site: Multi-site setup
- gitops: GitOps workflow
- docker: Docker deployment
- github-actions: CI/CD setup

### 3. Marketing

**Homepage** (chiron.dev)
```
Hero:
  "Documentation in 60 Seconds"
  curl -sSL https://get.chiron.dev | sh
  ch init my-docs

Features:
  - Zero-friction setup
  - GitOps native
  - Go performance
  - Node.js DX

Comparison:
  vs Hugo, Jekyll, Eleventy
```

**Blog Posts**:
1. "Introducing Chiron v3.0"
2. "GitOps for Documentation"
3. "Building a Hybrid SSG"
4. "Zero-Friction Developer Experience"

**Social Media**:
- Reddit: r/golang, r/webdev, r/programming
- Twitter: Launch thread
- Hacker News: Show HN post
- Dev.to: Technical deep-dive

### 4. Release

**GitHub Release v3.0.0**
- Binaries: ch-{os}-{arch}
- Docker image: agilira/chiron:3.0.0
- NPM package: chiron-ssg@3.0.0
- Changelog
- Migration guide (v2 → v3)

### Success Criteria
- ✅ Documentation completa
- ✅ 5+ examples funzionanti
- ✅ Release v3.0.0 pubblicata
- ✅ Marketing materials pronti
- ✅ Blog posts pubblicati

---

## Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1 | 1-2 weeks | Go worker (scanner + indexer + build-log) |
| Phase 2 | 1-2 weeks | Orpheus CLI (ch init, build, dev, deploy) |
| Phase 3 | 1 week | Argus integration (hot reload) |
| Phase 4 | 1 week | GitOps provider (remote config) |
| Phase 5 | 1 week | Distribution (NPM, Docker, Actions) |
| Phase 6 | 1 week | Polish & launch |
| **Total** | **6-8 weeks** | **Chiron v3.0.0** |

---

## Success Metrics

### Performance
- ✅ 10× faster directory scanning
- ✅ 20× faster search indexing
- ✅ <200ms hot reload
- ✅ <60s from zero to docs

### Developer Experience
- ✅ 4 commands to learn (init, build, dev, deploy)
- ✅ Zero prerequisites (auto-install)
- ✅ Works on macOS, Linux, Windows
- ✅ Docker + NPM + installer support

### GitOps
- ✅ Remote config from Git
- ✅ Auto-reload on push
- ✅ Config inheritance
- ✅ Audit trail (Argus DB)

### Adoption
- ✅ 1000+ stars on GitHub
- ✅ 100+ NPM downloads/week
- ✅ 10+ blog posts/tutorials
- ✅ awesome-go listing

---

## Next Steps

1. **Complete v2.4**: Release i18n + Grid (questa settimana)
2. **Start Phase 1**: Go worker (prossima settimana)
3. **Weekly sync**: Review progress, adjust timeline
4. **Launch v3.0**: 6-8 settimane da ora

**Let's build the future of documentation! 🚀**
