# SPM Scripts – React Native iOS via Swift Package Manager

Build React Native iOS apps using **Swift Package Manager** with prebuilt
XCFrameworks, as an alternative to CocoaPods.

## Quick Start

```bash
cd ios

# First-time setup: prompts to rename any existing CocoaPods MyApp.xcodeproj
# to MyApp.xcodeproj.legacy, then generates the SPM-managed MyApp.xcodeproj
# in its place. `npx react-native spm` with no action auto-detects first-run
# and routes to `init`.
npx react-native spm

# Open in Xcode (or `npm run ios`). Autolinking syncs automatically on build.
open MyApp.xcodeproj
```

After the initial run, the generated `.xcodeproj` includes an **auto-sync
build phase** that detects dependency changes and re-runs autolinking before
compilation (see [Auto-Sync](#auto-sync-build-phase) below) — you typically
don't need to re-invoke `react-native spm` manually.

You can run it manually when needed (e.g., after `--forceDownload`, or
`--force-xcodeproj` to regenerate the committed xcodeproj).

> **Note:** `react-native spm` is a thin wrapper over
> `node node_modules/react-native/scripts/setup-apple-spm.js`. If the CLI
> alias is unavailable in your environment, invoke the script directly with
> the same actions and the kebab-case flag equivalents (e.g.
> `--force-download` instead of `--forceDownload`).

## Legacy CocoaPods xcodeproj

On `init`, if a CocoaPods-driven `<App>.xcodeproj` exists, the script
prompts to rename it to `<App>.xcodeproj.legacy`. The `.legacy` extension
hides it from the community CLI's `findXcodeProject` heuristic so
`npm run ios` resolves to the SPM xcodeproj unambiguously. The directory
stays on disk for rollback — `git mv` tracks the rename cleanly.

To roll back to CocoaPods:

```bash
npx react-native spm clean --project   # deletes SPM xcodeproj, restores .legacy
# or manually:
mv ios/MyApp.xcodeproj.legacy ios/MyApp.xcodeproj
rm -rf ios/MyApp.xcodeproj ios/build/  # delete SPM artifacts
```

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
| 6. Xcodeproj | `spm/generate-spm-xcodeproj.js` | `<AppName>.xcodeproj` + `.spm-managed` marker (`init` only; create-if-missing) |
| Auto-sync | `spm/sync-spm-autolinking.js` | Re-runs codegen/autolinking/package generation at Xcode build time |

## Directory Layout

```
my-app/ios/
  MyApp.xcodeproj/                 <-- committed (SPM-managed; carries .spm-managed marker)
  MyApp.xcodeproj.legacy/          <-- committed (preserved CocoaPods xcodeproj, if migrated)
  Podfile                          <-- still present; CocoaPods coexistence is best-effort
  build/
    generated/
      autolinking/                 <-- gitignored (regenerated at build time)
        Package.swift
        autolinking.json
        packages/                  <-- synth wrappers for autolinker-managed deps
        libs/                      <-- symlinks to self-managed deps' Package.swift
                                       dirs, named by Swift module so SPM
                                       package identity stays unique
        headers/                   <-- generated header symlinks
      ios/                         <-- gitignored, codegen output
    xcframeworks/                  <-- gitignored, symlinks to cached artifacts
      React.xcframework -> ~/Library/Caches/.../React.xcframework
      ReactNativeDependencies.xcframework -> ...
      hermes-engine.xcframework -> ...
```

### What to commit

| Path | Commit? | Why |
|------|---------|-----|
| `MyApp.xcodeproj/` | Yes | SPM-managed; holds signing, capabilities, Build Phases. Deterministic UUIDs let teammates clone and build immediately. |
| `MyApp.xcodeproj/.spm-managed` | Yes | Marker file; distinguishes the SPM xcodeproj from a CocoaPods one with the same filename. |
| `MyApp.xcodeproj.legacy/` | Yes (if present) | Preserved CocoaPods project for rollback. |
| `build/generated/` | No | Codegen/autolinking output; regenerated |
| `build/xcframeworks/` | No | Symlinks to local cache; machine-specific |
| `Package.resolved` | No | SPM resolution file; machine-specific |

The `.xcodeproj` uses deterministic UUIDs (`SHA-256(projectName:section:id)`)
so regenerating from the same inputs produces identical output. Subsequent
`spm update` runs are **create-if-missing** — they don't touch the committed
xcodeproj (so signing / capabilities / Build Phases survive). The xcodeproj
references three stable sub-package paths under `build/`; adding or removing
community deps changes the sub-package contents (gitignored) and never
requires regenerating the xcodeproj. Pass `--force-xcodeproj` to opt back
into overwrite when you genuinely need it.

## CLI Actions

```bash
react-native spm [action] [options]
```

With no action, the command **auto-detects first-run**: if no SPM-managed
`<App>.xcodeproj` is present, it routes to `init`; otherwise `update`.

When invoked from the JS root of a standard RN app (sibling `ios/` subdir),
non-destructive actions (`init`, `update`, `sync`, `codegen`, `download`,
`scaffold`) auto-redirect into `ios/` with a banner. `clean` refuses to
redirect — `cd ios/` first.

| Action | Description |
|---|---|
| `init` | First-time setup: gitignore entries, legacy-xcodeproj rename prompt, full pipeline incl. `.xcodeproj` generation. |
| `update` | Regenerate sub-packages / artifacts. Does NOT touch the committed `.xcodeproj` unless `--force-xcodeproj`. |
| `sync` | Lightweight resync invoked by the Xcode auto-sync build phase. Regenerates autolinking + xcframeworks sub-packages and writes `.spm-sync-stamp`. Skips `.xcodeproj` regen. |
| `clean` | Remove generated SPM state. Scoped by `--project` / `--derived-data` / `--cache` / `--all`. |
| `codegen` | Run codegen and install the SPM codegen template only |
| `download` | Download/check xcframework artifacts only |
| `scaffold` | Generate `Package.swift` into `node_modules/<dep>/` for community RN libraries that ship only a podspec. |

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
| `--skipXcodeproj` | Skip `.xcodeproj` generation |
| `--forceXcodeproj` | Regenerate `.xcodeproj` even when one exists (clobbers Xcode-side edits) |
| `--forceDownload` | Clear cache and re-download |
| `--project` | [clean] Also remove the committed `<App>.xcodeproj/`; restores `<App>.xcodeproj.legacy/` if present. |
| `--derivedData` | [clean] Also remove this app's Xcode DerivedData entries |
| `--cache` | [clean] Also remove the cached xcframework slot for the current version |
| `--all` | [clean] Shorthand for `--project --derived-data --cache` |
| `--yes` | [clean] Skip confirmation prompts for destructive scopes |

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

## Self-managed community packages

A community library that ships its own `Package.swift` is referenced
directly by the autolinker instead of being wrapped. To keep SPM's
package identity (which it derives from the path basename) unique across
deps — even when several libs put their manifest inside an `ios/` subdir
— each self-managed dep is exposed through a uniquely-named symlink at
`build/generated/autolinking/libs/<SwiftName>/`. The aggregator
`Package.swift` references that path, so two libs both shipping
`<dep>/ios/Package.swift` never collide on identity `"ios"`.

The `libs/` directory is wiped and recreated on every autolinker run,
so deleting a dep via `npm uninstall` cleans up the alias automatically
on the next build.

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
not touch SPM-generated directories. To reset SPM state:

```bash
# Default: remove generated dirs (build/xcframeworks/, build/generated/, .build/)
react-native spm clean

# Also delete the committed xcodeproj and restore .legacy backup (if present)
react-native spm clean --project

# Also blow away this app's DerivedData + cached xcframework slot
react-native spm clean --all
```

The `--project` / `--derived-data` / `--cache` / `--all` scopes prompt for
confirmation (bypass with `--yes`). After a plain `clean`, run
`react-native spm update` or open the checked-in `.xcodeproj` and build to
regenerate state.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `npm run ios` builds the wrong project after init | The community CLI's `findXcodeProject` picks alphabetically; if both `<App>.xcodeproj` and `<App>-SPM.xcodeproj` (legacy generator output) coexist, manually rename one. Fresh installs use the rename-migration so only one is active. |
| "could not load the shared scheme for `<App>`" from `npm run ios` | Stale scheme from older generator. Run `npx react-native spm update --force-xcodeproj` to regenerate. |
| "Refusing to generate .xcodeproj: ... legacy CocoaPods project" | Accept the rename prompt during `init`, or manually rename `<App>.xcodeproj` → `<App>.xcodeproj.legacy` before the SPM xcodeproj can take its slot. |
| Missing headers | Re-run `react-native spm` |
| "not contained in target" | Re-run setup (regenerates file-level symlinks) |
| Codegen fails | Use `--skipCodegen` to iterate on other parts |
| Wrong JS entry file | Pass `--entryFile` or set `"main"` in package.json |
| "SPM autolinking sync failed" warning | Check Xcode build log for details; node may not be in PATH — ensure `with-environment.sh` is present |
| Autolinking not updating on build | Touch `package.json` to force a sync, or delete `build/generated/autolinking/.spm-sync-stamp` |
| Build fails after clean with module map errors | Run `react-native spm update`, then reopen Xcode |
| Stale SPM state or corrupted build | Run `react-native spm clean`, then `react-native spm update` |
| Want to revert to CocoaPods | `react-native spm clean --project` (restores `.legacy` backup if present) |
