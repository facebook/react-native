/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

/*::
export type SetupArgs = {
  action:
    | 'init'
    | 'update'
    | 'sync'
    | 'clean'
    | 'codegen'
    | 'download'
    | 'scaffold'
    | null,
  version: string | null,
  localXcframework: string | null,
  artifactsDir: string | null,
  flavor: string,
  skipCodegen: boolean,
  skipDownload: boolean,
  forceDownload: boolean,
  skipXcodeproj: boolean,
  forceXcodeproj: boolean,
  bundleIdentifier: string | null,
  productName: string | null,
  entryFile: string | null,
  // `clean` action scoping flags. Default (none set) keeps current behavior:
  // only the generated dirs inside appRoot are removed. Each opt-in extends
  // the deletion list:
  //   cleanProject     → also the committed <App>-SPM.xcodeproj/ (prompts)
  //   cleanDerivedData → also ~/Library/Developer/Xcode/DerivedData/<App>-SPM-*
  //   cleanCache       → also the current cache slot under
  //                      ~/Library/Caches/.../spm-artifacts/<slot>/<flavor>/
  //   cleanAll         → enables all three at once
  //   cleanYes         → skips the confirmation prompt for destructive scopes
  cleanProject: boolean,
  cleanDerivedData: boolean,
  cleanCache: boolean,
  cleanAll: boolean,
  cleanYes: boolean,
};

export type CleanOpts = {
  project?: boolean,
  derivedData?: boolean,
  cache?: boolean,
  // Absolute path to the cache slot to remove. Caller resolves this so the
  // function stays I/O-pure and easily testable.
  cacheSlotDir?: ?string,
  // Override the derived-data root (only used by tests).
  derivedDataRoot?: ?string,
};

// A clean target is either a path to delete, or a rename action (used by
// `--project` to restore the `<App>.xcodeproj.legacy` backup when removing
// the SPM-managed xcodeproj it lives alongside). Discriminate on `kind`.
export type CleanTarget =
  | {
      kind: 'delete',
      path: string,
      label: string,
    }
  | {
      kind: 'rename',
      from: string,
      to: string,
      label: string,
    };

export type DownloadArgs = {
  version: string | null,
  flavor: string,
  output: string | null,
};

export type ResolvedArtifact = {
  url: string,
  version: string,
};

export type ProcessResult = {
  label: string,
  version: string,
  xcframeworkPath: string,
  url: string,
};

export type ArtifactResultEntry =
  | {name: string, error: void, label: string, version: string, xcframeworkPath: string, url: string}
  | {name: string, error: string};

export type AutolinkingArgs = {
  appRoot: string,
  reactNativeRoot: string | null,
  autolinkingJson: string | null,
  output: string | null,
  xcframeworksPath: string | null,
};

export type SpmTarget = {
  name: string,
  path: string,
  exclude: Array<string>,
  publicHeadersPath: string | null,
  resources?: Array<string>,
  // Swift target names this target depends on (already toSwiftName()'d).
  // Emitted into the target's SPM `dependencies:` array so the compiler sees
  // the dependent target's headers / module map.
  spmTargetDependencies?: Array<string>,
  // Explicit allowlist of source files (paths relative to target.path).
  // Mirrors CocoaPods' `s.source_files`. When non-empty, the SPM target
  // declares `sources: [...]` and only these files are compiled — test dirs,
  // .js/.podspec/.md siblings, etc. can never sneak in. Null/empty means
  // fall back to SPM's default scan of target.path.
  sources?: ?Array<string>,
  // Header search paths declared by the dep's podspec
  // (pod_target_xcconfig HEADER_SEARCH_PATHS), already substituted relative
  // to the dep's source dir. Path-style includes like
  // `<react/renderer/components/safeareacontext/X.h>` resolve through these.
  // Emitted as `.headerSearchPath(...)` directives in the target's
  // cSettings / cxxSettings.
  headerSearchPaths?: ?Array<string>,
};

// Routing metadata kept alongside an SpmTarget in main(). Lives in a wrapper
// (not on SpmTarget) so the target type stays describable from the outside.
export type TargetEntry = {
  target: SpmTarget,
  origin: 'npm' | 'spmModule',
  // Filled in for npm-origin entries during the mirror step; consumed by the
  // synth-package emission step further down.
  mirrorReady?: ?{
    synthPkgDir: string,
    mirroredResources: ?Array<string>,
  },
};

// ---------------------------------------------------------------------------
// autolinking.json shape (output of @react-native-community/cli config).
// All fields are optional because the JSON is user-influenced; the consumer
// checks at runtime.
// ---------------------------------------------------------------------------
export type AutolinkingIosPlatform = {
  sourceDir?: ?string,
  ...
};
// As parsed from autolinking.json — all fields optional because the JSON is
// user-influenced. main() validates and narrows to AutolinkedDep before use.
export type AutolinkingDepJson = {
  root?: ?string,
  platforms?: ?{ios?: ?AutolinkingIosPlatform, ...},
  ...
};
export type RawAutolinkingJson = {
  dependencies?: ?{[string]: AutolinkingDepJson},
  ...
};
// Validated/normalized dep — name and ios platform are guaranteed present.
// Produced from AutolinkingDepJson in main() and passed through
// expandSpmDependencies to autolinkingDepToSpmTarget.
export type AutolinkedDep = {
  name: string,
  root: string,
  platforms: {ios: AutolinkingIosPlatform, ...},
  // Resolved Swift target / module / headers-subdir name. Defaults to
  // toSwiftName(name) and is overridden by the dep's react-native.config.js
  // `spm.name`. Populated by expandSpmDependencies — always present after
  // expansion; optional in the type so caller-side construction stays simple.
  swiftName?: string,
  // Populated by expandSpmDependencies from each dep's
  // react-native.config.js `spm.dependencies` array.
  spmDependencies?: Array<string>,
  ...
};

// CLI `config` output minimally typed for the bits we read in
// generate-spm-autolinking-config.js.
export type CliConfigJson = {
  root?: ?string,
  reactNativePath?: ?string,
  project?: ?{ios?: ?{sourceDir?: ?string, ...}, ...},
  ...
};

// Entry shape for an spmModule declared in react-native.config.js.
export type SpmModuleConfig = {
  name: string,
  path: string,
  exclude?: Array<string>,
  publicHeadersPath?: ?string,
  // Optional CocoaPods-style glob allowlist (analog of s.source_files).
  // When set, replaces auto source discovery for the module — only files
  // matching one of these patterns are passed to SPM via `sources:`.
  sources?: Array<string>,
};

// ---------------------------------------------------------------------------
// Inputs to the Swift emitters in generate-spm-autolinking.js.
// ---------------------------------------------------------------------------
export type NpmDepRef = {
  swiftName: string,
  // Path passed to .package(path:). Relative to autolinked/ (the aggregator's
  // dir). For in-place synth this is the dep's real source dir.
  packagePath?: string,
};

export type AggregatorInput = {
  npmDeps?: $ReadOnlyArray<NpmDepRef>,
  inlineTargets?: $ReadOnlyArray<SpmTarget>,
  hasReactDep?: boolean,
  hasXcfwHeaders?: boolean,
  hasDepsHeaders?: boolean,
  // Absolute slot-resolved Headers dirs. When provided, baked into the
  // manifest as string literals so SPM's manifest-hash bumps on every slot
  // change (instead of `.resolvingSymlinksInPath()` being evaluated once and
  // its result cached against the prior slot).
  xcfwHeadersAbsolute?: ?string,
  depsHeadersAbsolute?: ?string,
  codegenHeadersIncluded?: boolean,
  xcframeworksRelPath?: ?string,
};

export type SynthPackageSpec = {
  swiftName: string,
  exclude?: Array<string>,
  publicHeadersPath?: ?string,
  // Explicit allowlist of source paths (relative to `targetPath`). When
  // present and non-empty, the synth Package.swift emits `sources: [...]`
  // — SPM will only compile these files.
  sources?: ?Array<string>,
  spmDependencies?: Array<{swiftName: string}>,
  hasReactDep?: boolean,
  hasXcfwHeaders?: boolean,
  hasDepsHeaders?: boolean,
  // See AggregatorInput.xcfwHeadersAbsolute — same purpose at the synth
  // layer (each per-dep Package.swift).
  xcfwHeadersAbsolute?: ?string,
  depsHeadersAbsolute?: ?string,
  codegenHeadersIncluded?: boolean,
  resources?: ?Array<string>,
  isDynamic?: boolean,
  targetPath?: string,
  // Sub-package emission (legacy): synth Package.swift lives at a fixed depth
  // under autolinked/packages/<Name>/, so appRoot is reachable via "../../.."
  // and siblings via "../<Other>".
  appRootRelativeToPackage?: string,
  siblingPackageBaseRelative?: string,
  // Wrapper-dir emission (current production layout): synth Package.swift
  // lives under <outputDir>/packages/<SwiftName>/ with `root` being a dir
  // symlink to the dep's real source dir. `appRoot` is hardcoded absolute,
  // and cross-package includes resolve via `-I <autogenHeadersAbsolute>`
  // instead of SPM's `publicHeadersPath` (so the dep's source dir stays
  // untouched).
  appRootAbsolute?: string,
  siblingSynthAbsolutePaths?: {[swiftName: string]: string},
  // Absolute path to <outputDir>/headers — added to cSettings/cxxSettings
  // so cross-package `#import <SwiftName/Header.h>` resolves through
  // <autogenHeaders>/<SwiftName>/<Header>.h file symlinks. Drops the need
  // for per-package publicHeadersPath.
  autogenHeadersAbsolute?: string,
  // Header search paths from the dep's podspec `pod_target_xcconfig`
  // HEADER_SEARCH_PATHS, with `$(PODS_TARGET_SRCROOT)` substituted and the
  // synth wrapper's `root/` prefix applied. Emitted as `.headerSearchPath()`
  // directives on cSettings / cxxSettings so path-style includes like
  // `<react/renderer/components/safeareacontext/X.h>` resolve through the
  // dep's own `common/cpp/` subtree.
  headerSearchPaths?: ?Array<string>,
};


export type GeneratePackageArgs = {
  appRoot: string,
  reactNativeRoot: string | null,
  version: string | null,
  localXcframework: string | null,
  artifactsDir: string | null,
  appName: string | null,
  targetName: string | null,
  sourcePath: string | null,
  iosVersion: string,
};

export type GenerateXcodeprojArgs = {
  appRoot: string,
  reactNativeRoot: string | null,
  appName: string | null,
  sourcePath: string | null,
  iosVersion: string,
  bundleIdentifier: string | null,
  entryFile: string | null,
};

export type ProjectFiles = {
  sources: Array<string>,
  headers: Array<string>,
  resources: Array<string>,
  plists: Array<string>,
};

export type PbxprojEntry = {
  uuid: string,
  comment: string,
  fields: {[string]: string},
};

export type PbxprojSections = {[string]: Array<PbxprojEntry>};

// ---------------------------------------------------------------------------
// Scaffold types — for the `npx react-native spm scaffold` command that
// generates a `Package.swift` into `node_modules/<dep>/` for community RN
// libraries that don't ship SPM support. Inputs come from the dep's podspec
// (read via `pod ipc spec --format=json` when CocoaPods is available, or a
// regex fallback). The output Package.swift is treated as "self-managed" by
// the autolinker — see isSelfManagedPackage in generate-spm-autolinking.js.
// ---------------------------------------------------------------------------

// Flattened, subspec-merged view of a podspec — what the translation layer
// consumes. HEADER_SEARCH_PATHS / source globs are kept as raw strings;
// substitution of `$(PODS_TARGET_SRCROOT)` etc. happens during translation
// so the raw model stays portable.
export type PodspecModel = {
  name: string,
  version: string,
  sourceFiles: Array<string>,
  publicHeaderFiles: Array<string>,
  privateHeaderFiles: Array<string>,
  excludeFiles: Array<string>,
  headerMappingsDir: ?string,
  headerDir: ?string,
  frameworks: Array<string>,
  weakFrameworks: Array<string>,
  libraries: Array<string>,
  // Merged dependency name list. With pod-ipc, includes the deps materialized
  // by `install_modules_dependencies(s)` (React-Core, React-Fabric, ...).
  // Version constraints stripped — we only need the name to bucket.
  dependencies: Array<string>,
  compilerFlags: Array<string>,
  // Raw header-search-path entries from `pod_target_xcconfig['HEADER_SEARCH_PATHS']`.
  // May contain Xcode build setting placeholders like `$(PODS_TARGET_SRCROOT)`.
  headerSearchPaths: Array<string>,
  // File paths or glob patterns the dep declares as bundled resources.
  resources: Array<string>,
  requiresArc: boolean,
  // Warnings collected during parsing — surfaced in the scaffold summary so
  // a user can spot fields that didn't translate cleanly (unknown env vars,
  // unrecognized $(...) tokens, etc.). Never throws on parse errors.
  warnings: Array<string>,
  // True when produced by the regex fallback rather than pod-ipc. Used to
  // emit a louder banner in the scaffold summary explaining that dependency
  // wiring may be incomplete.
  partial: boolean,
};

// Intermediate translation result — concrete data the Swift emitter consumes.
// Decouples podspec reading from SPM-specific shaping so each side can be
// tested in isolation.
export type SpmScaffoldSpec = {
  // Swift target / module name. Default: toSwiftName(podspec.name); overridden
  // by `header_dir` when present.
  swiftName: string,
  // Source file paths relative to the dep root, ready for `sources: [...]`
  // emission after the `root/` wrapper-dir prefix is applied at emit time.
  sources: Array<string>,
  // Header search paths resolved to dep-root-relative form. Each entry
  // becomes `.headerSearchPath("<path>")` in cSettings + cxxSettings.
  headerSearchPaths: Array<string>,
  // Bucketed dependency references — pre-computed by the translation layer.
  // `coreReactNative` is true when ANY React-* / RCT* / RCT-Folly / glog
  // dep is present (so we add a single `.product(name: "ReactNative", ...)`).
  // `siblingNames` are npm names that match other autolinked deps — resolved
  // to Swift names by the scaffold orchestrator before emit.
  coreReactNative: boolean,
  siblingNames: Array<string>,
  // Extra frameworks beyond the autolinker's default UIKit/Foundation/CoreGraphics
  // set. Merged with the defaults at emit time.
  extraFrameworks: Array<string>,
  weakFrameworks: Array<string>,
  // Compiler flags lifted from `s.compiler_flags`. Tokenized, ready for
  // `cxxSettings: [.unsafeFlags([...])]`.
  compilerFlags: Array<string>,
  // Public-headers strategy. `mappingsDir` (when set) drives publicHeadersPath
  // so the autolinker's centralized headers tree exposes `#import <SwiftName/...>`.
  publicHeadersPath: ?string,
  // File paths (relative to dep root) the emitter should declare as `.copy(...)`
  // resources on the target.
  resources: Array<string>,
  // Carried through from the PodspecModel; surfaced in the scaffold summary.
  warnings: Array<string>,
};

// Per-dep outcome from one scaffold run. The orchestrator returns an array
// of these so the CLI summary can print a structured table.
export type ScaffoldResult =
  | {
      depName: string,
      status: 'written',
      packageSwiftPath: string,
      warnings: Array<string>,
      // True when the dep's Package.swift already existed (a regen — slot
      // changed, --force, etc.); false on first-time scaffolds. The CLI
      // orchestrator prompts only for first-time scaffolds.
      previouslyExisted: boolean,
    }
  | {
      depName: string,
      status:
        | 'skipped-self-managed'
        | 'skipped-autogen'
        | 'skipped-scaffolder-marker'
        | 'skipped-no-ios'
        | 'skipped-no-podspec'
        | 'skipped-opt-out'
        | 'skipped-is-react-native',
      reason: string,
    }
  | {
      depName: string,
      status: 'error',
      reason: string,
    };
*/

module.exports = {};
