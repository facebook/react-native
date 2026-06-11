# SPM header search paths — single source of truth

React Native's C++/Obj-C headers are consumed via `-I` header search paths into
materialized header trees (the `<react/...>`, `<jsi/...>`, `<folly/...>`,
`ReactCodegen` includes cannot be served by Clang framework modules — see the
`-fno-implicit-module-maps` note below). This document describes how those `-I`
locations are produced once and consumed by every generated and hand-authored
`Package.swift`.

## Two header trees (split)

The headers split into app-independent and per-app halves:

| Tree | Location | Contents | Scope |
|------|----------|----------|-------|
| **RN-core/deps** | `<projectRoot>/.react-native/headers/<slot>/ReactCoreHeaders` | React VFS-template headers, `React_RCTAppDelegate`, `ReactNativeDependencies` (folly/boost/fmt/glog) | App-independent — sourced from the globally-cached xcframeworks; shared by every app on a given cache slot (one materialization per monorepo). |
| **Per-app** | `<appRoot>/build/xcframeworks/ReactAppHeaders` | autolinking dep headers, codegen output (`build/generated/ios`, `ReactCodegen`) | Per-app — depends on which libraries the app links and its generated specs. |

Each app also gets a relocatable symlink `<appRoot>/build/xcframeworks/ReactCoreHeaders`
→ the shared tree, so consumers under the app can reference the shared tree with
an app-relative path.

Both are built by `buildSharedReactCoreHeaderTree` / `buildPerAppHeaderTree` in
`spm-utils.js`, called from the orchestrators (`sync-spm-autolinking.js`,
`setup-apple-spm.js`). Each consumer emits **two** `-I`s (shared first, then
per-app), plus `-fno-implicit-module-maps` on C++ to keep nested `<react/...>`
includes textual rather than routed through `React.framework`'s module map.

## Single source of truth files

Written by the orchestrators after the trees are materialized. Both hold
machine-absolute paths and are gitignored.

- **Per-app** `<appRoot>/build/generated/autolinking/spm-paths.json`
  `{ formatVersion, appRoot, rnCoreHeaders, appHeaders, reactNativePackage, cxxStd }`
  — read by the RN-generated build-dir manifests at SPM-eval time.
  `reactNativePackage` is the generated ReactNative binary-target package dir, so
  consumer manifests can `.package(path:)` it without hardcoding the layout.
- **App-independent** `<projectRoot>/.react-native/paths.json`
  `{ formatVersion, rnCoreHeaders, reactNativeVersion, cacheSlot }` — the contract
  hand-authored community libraries read.

`autolinking.json` (the `@react-native-community/cli config` output) is an INPUT
used to generate these; it is never read by a manifest (it lacks the build-output
header paths, is per-app + app-build-dir-scoped, and is a volatile CLI schema).

## How each manifest gets the paths

| Manifest | Location | How it resolves the two `-I`s |
|----------|----------|-------------------------------|
| Autolinked aggregator | `build/generated/autolinking/Package.swift` | reads `./spm-paths.json` (loader) |
| Per-dep synth wrapper | `build/generated/autolinking/packages/<Name>/` | reads `../../spm-paths.json` (loader) |
| Codegen template | `build/generated/ios/Package.swift` | reads `../autolinking/spm-paths.json` (loader) |
| App target (pbxproj) | `<App>.xcodeproj` | `$(SRCROOT)/build/xcframeworks/{ReactCoreHeaders,ReactAppHeaders}` (relocatable) |
| Scaffolded community lib | `node_modules/<dep>/Package.swift` | walks up to the consuming app's `build/xcframeworks/Package.swift`, then `appRoot + "/build/xcframeworks/{ReactCoreHeaders,ReactAppHeaders}"` |

The build-dir manifests read absolute paths from `spm-paths.json`, so their text
holds no machine-absolute paths — the SPM manifest hash stays stable across
machines and cache slots. The loader is rendered once by
`renderRNPathsLoader(relPath)` in `spm-utils.js`.

## Hand-authored community library contract

A library that ships its own `Package.swift` (no scaffolder/autolinker marker)
walks up from the manifest to find the consuming app's `spm-paths.json`, then
reads the resolved absolute paths from it — so the committed file carries no RN
layout details and survives RN moving them. This is the recommended pattern (it
supplies the per-app codegen `-I` too, which a Fabric component needs):

```swift
import PackageDescription
import Foundation

struct RNPaths: Decodable {
    let rnCoreHeaders: String       // app-independent React + ReactNativeDependencies
    let appHeaders: String          // this app's codegen + autolinking headers
    let reactNativePackage: String  // generated ReactNative binary-target package dir
}
let rn: RNPaths = {
    let fm = FileManager.default
    var dir = URL(fileURLWithPath: #filePath).deletingLastPathComponent().path
    while true {
        for rel in ["/build/generated/autolinking/spm-paths.json",
                    "/ios/build/generated/autolinking/spm-paths.json"] {
            if let d = fm.contents(atPath: dir + rel),
               let p = try? JSONDecoder().decode(RNPaths.self, from: d) { return p }
        }
        let parent = URL(fileURLWithPath: dir).deletingLastPathComponent().path
        if parent == dir { fatalError("spm-paths.json not found; run 'npx react-native spm' in the app.") }
        dir = parent
    }
}()
// dependencies: [.package(name: "ReactNative", path: rn.reactNativePackage)]
// cxxSettings:  [.unsafeFlags(["-fno-implicit-module-maps", "-I", rn.rnCoreHeaders, "-I", rn.appHeaders])]
```

(Proven in `@chrfalch/react-native-calculator`, a hand-authored Fabric component.)
For a library that does NOT need per-app codegen and wants to resolve in the
multi-app / standalone cases below, walk to the repo-root `.react-native/paths.json`
instead — it always resolves (guaranteed ancestor) but supplies only the
app-independent `rnCoreHeaders`.

## Residual limitation

A **hand-authored, self-managed** library that is **shared across multiple apps**
in a hoisted monorepo and **needs per-app codegen headers** (`ReactCodegen` /
`ReactAppDependencyProvider`) cannot obtain a correct per-app `-I` from its
committed manifest: when the library is hoisted to a sibling of the apps, no
single app's `spm-paths.json` is an ancestor of the manifest, and the per-app
value differs per consuming app anyway. The repo-root `.react-native/paths.json`
still resolves there but supplies only the app-independent RN-core `-I`. (A
single app consuming the library — the common case, e.g. the calculator in
MathCalc — resolves fully, since that app's `spm-paths.json` IS an ancestor.)

The same applies to a **scaffolded** library in that layout (its walk-up cannot
find any app's build dir when the library is hoisted to a sibling of the apps).
Resolutions: build the library inside a single app, or avoid depending on
per-app generated codegen headers from a shared self-managed manifest. A future
change can route scaffolded deps through the per-app synth wrapper (which is
per-app by construction) once the wrapper emitter reaches parity with the
scaffolder's podspec-derived target settings.
