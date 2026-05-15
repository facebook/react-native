# SPM Scripts – React Native iOS via Swift Package Manager

Build React Native iOS apps using **Swift Package Manager** with prebuilt
XCFrameworks, as an alternative to CocoaPods.

## Quick Start

```bash
# First-time setup (generates Package.swift you commit)
react-native spm init

# Open in Xcode — autolinking syncs automatically on build
open MyApp-SPM.xcodeproj

# Delete generated SPM state if things go wrong
react-native spm clean
```

After the initial `init`, you typically don't need to re-run `react-native
spm`. The generated `.xcodeproj` includes an **auto-sync build phase** that
detects dependency changes and re-runs autolinking before compilation (see
[Auto-Sync](#auto-sync-build-phase) below).

You can still run `react-native spm` manually if needed (e.g., after
`--forceDownload` or to regenerate the `.xcodeproj`).

> **Note:** `react-native spm` is a thin wrapper over
> `node node_modules/react-native/scripts/setup-apple-spm.js`. If the CLI
> alias is unavailable in your environment, invoke the script directly with
> the same actions and the kebab-case flag equivalents (e.g.
> `--force-download` instead of `--forceDownload`).

CocoaPods continues to work in parallel.

## Pipeline

`react-native spm init` and `react-native spm update` orchestrate these
steps:

| Step | Script | Output |
|------|--------|--------|
| 1. CLI config | `spm/generate-spm-autolinking-config.js` | `build/generated/autolinking/autolinking.json` |
| 2. Codegen | `generate-codegen-artifacts.js` | `build/generated/ios/` |
| 3. Autolinking | `spm/generate-spm-autolinking.js` | `build/generated/autolinking/Package.swift` |
| 4. Download | `spm/download-spm-artifacts.js` | Cached xcframeworks |
| 5. Package | `spm/generate-spm-package.js` | `build/xcframeworks/Package.swift` + symlinks |
| 6. Xcodeproj | `spm/generate-spm-xcodeproj.js` | `<AppName>-SPM.xcodeproj` |
| Auto-sync | `spm/sync-spm-autolinking.js` | Re-runs codegen/autolinking/package generation at Xcode build time |

## Directory Layout

```
my-app/
  Package.swift                    <-- committed
  MyApp-SPM.xcodeproj/             <-- committed (deterministic output)
  build/
    generated/
      autolinking/                 <-- gitignored (regenerated at build time)
        Package.swift
        autolinking.json
        packages/                  <-- package wrappers for native modules
        headers/                   <-- generated header symlinks
    generated/ios/                 <-- codegen output
    xcframeworks/                   <-- gitignored, symlinks to cached artifacts
      React.xcframework -> ~/Library/Caches/.../React.xcframework
      ReactNativeDependencies.xcframework -> ...
      hermes-engine.xcframework -> ...
```

### What to commit

| Path | Commit? | Why |
|------|---------|-----|
| `Package.swift` | Yes | Developer-owned, customizable |
| `MyApp-SPM.xcodeproj/` | Yes | Deterministic UUIDs; lets teammates clone and build immediately |
| `build/generated/` | No | Codegen/autolinking output; regenerated |
| `build/xcframeworks/` | No | Symlinks to local cache; machine-specific |
| `Package.resolved` | No | SPM resolution file; machine-specific |

The `.xcodeproj` uses deterministic UUIDs (`SHA-256(projectName:section:id)`)
so regenerating it from the same inputs produces identical output. Committing
it means teammates can clone and open Xcode without running any setup commands
— the auto-sync build phase handles the rest on first build.

Re-run `react-native spm` (or just step 5) when you add/remove native source
files, then commit the updated `.xcodeproj`.

## CLI Actions

```bash
react-native spm [action] [options]
```

With no action, the command runs `update`. Use `init` explicitly for
first-time setup (it generates the initial `Package.swift`).

| Action | Description |
|---|---|
| `init` | Generate initial `Package.swift` and all generated SPM/Xcode state |
| `update` | Regenerate generated SPM/Xcode state without overwriting root `Package.swift` |
| `sync` | Lightweight resync invoked by the Xcode auto-sync build phase. Regenerates autolinking + xcframeworks sub-packages and writes `.spm-sync-stamp`. Skips `.xcodeproj` regen. |
| `clean` | Remove generated SPM state only |
| `codegen` | Run codegen and install the SPM codegen template only |
| `download` | Download/check xcframework artifacts only |

## CLI Options

Flags below use the `react-native spm` (camelCase) form. The raw script
accepts kebab-case equivalents (e.g. `--skip-codegen`).

| Option | Description |
|---|---|
| `--version <ver>` | RN version (default: from package.json) |
| `--flavor <debug\|release>` | Artifact flavor (default: debug) |
| `--localXcframework <path>` | Use locally-built xcframework |
| `--artifactsDir <path>` | Override the artifact cache directory |
| `--entryFile <path>` | JS entry file (default: package.json `main` or `index.js`) |
| `--bundleIdentifier <id>` | Override CFBundleIdentifier |
| `--productName <name>` | Override PRODUCT_NAME |
| `--skipCodegen` | Skip codegen step |
| `--skipDownload` | Skip artifact download |
| `--skipXcodeproj` | Skip .xcodeproj generation |
| `--forceDownload` | Clear cache and re-download |

## Local Native Modules

Modules not discovered via autolinking can be declared in `react-native.config.js`:

```js
module.exports = {
  spm: {
    modules: [
      {
        name: 'MyNativeModule',
        path: 'ios/MyNativeModule',       // relative to app root
        exclude: ['*.podspec'],            // optional
        publicHeadersPath: '.',            // optional
      },
    ],
  },
};
```

Each entry becomes a target in `build/generated/autolinking/Package.swift`.
Sources outside `build/generated/autolinking/` are automatically mirrored with
file-level symlinks.

## Header Resolution

React Native uses CocoaPods-style imports (`#import <React/RCTBridge.h>`) that
SPM doesn't natively support. Two mechanisms solve this:

1. **XCFramework Headers/**: prebuild copies headers organized by import path,
   so `-I Headers` resolves `#import <React/...>` directly.

2. **VFS overlay** (`React-VFS.yaml`): maps remaining non-standard paths — headers
   that appear in multiple locations or have platform variants. Generated as a
   template at prebuild time, resolved with local paths at setup time.

## Auto-Sync Build Phase

The generated `.xcodeproj` includes a **Sync SPM Autolinking** shell script
build phase that runs before all other phases. It keeps
`build/generated/autolinking/Package.swift` up to date without requiring manual
re-runs of `react-native spm`.

**How it works:**

1. Compares timestamps of staleness inputs against `build/generated/autolinking/.spm-sync-stamp`:
   - `package.json` — dependency declarations
   - `react-native.config.js` — `spm.modules` config
   - `node_modules/` directory mtime — updated by any package manager (npm, yarn, pnpm, bun); also checks parent `node_modules` for monorepo setups
2. If any input is newer (or stamp is missing): runs `npx react-native spm sync`,
   which re-executes autolinking + package generation + VFS overlay resolution
   and writes the stamp file.
3. If all inputs are fresh: exits immediately (~1ms).

**Build phase ordering:**

| # | Phase |
|---|-------|
| 1 | Sync SPM Autolinking (new) |
| 2 | Prepare VFS Overlay |
| 3 | Sources (compile) |
| 4 | Frameworks (link) |
| 5 | Resources (copy) |
| 6 | Build JS Bundle |

Failures are non-fatal — the phase emits `warning:` and exits 0, so the
existing autolinking may still produce a successful build.

## Cleaning

Xcode's "Clean Build Folder" (Cmd+Shift+K) only removes DerivedData — it does
not touch SPM-generated directories. To fully reset SPM state:

```bash
react-native spm clean
```

This removes `build/xcframeworks/`, `build/generated/`, legacy `autolinked/`,
and `.build/`. It does not re-run setup. Run `react-native spm update` or
open the checked-in `.xcodeproj` and build to regenerate state.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Package.swift not found" | Run `react-native spm init` |
| Missing headers | Re-run `react-native spm` |
| "not contained in target" | Re-run setup (regenerates file-level symlinks) |
| Codegen fails | Use `--skipCodegen` to iterate on other parts |
| Wrong JS entry file | Pass `--entryFile` or set `"main"` in package.json |
| "SPM autolinking sync failed" warning | Check Xcode build log for details; node may not be in PATH — ensure `with-environment.sh` is present |
| Autolinking not updating on build | Touch `package.json` to force a sync, or delete `build/generated/autolinking/.spm-sync-stamp` |
| Build fails after clean with module map errors | Run `react-native spm update`, then reopen Xcode |
| Stale SPM state or corrupted build | Run `react-native spm clean`, then `react-native spm update` |
