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
  action: 'init' | 'update' | 'clean' | 'codegen' | 'download' | null,
  version: string | null,
  localXcframework: string | null,
  artifactsDir: string | null,
  flavor: string,
  skipCodegen: boolean,
  skipDownload: boolean,
  forceDownload: boolean,
  skipXcodeproj: boolean,
  bundleIdentifier: string | null,
  productName: string | null,
  entryFile: string | null,
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
  output: string | null,
  init: boolean,
};

export type ScanResult = {
  swiftFiles: Array<string>,
  hasObjC: boolean,
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

export type GeneratePackageOpts = {
  appName: string,
  targetName: string,
  sourcePath: string,
  iosVersion: string,
  version: string,
  localXcframework: string | null,
  localArtifacts: {[string]: {xcframeworkPath: string, url: string}} | null,
  xcframeworksPackagePath: string | null,
  xcframeworkHeadersPath: string | null,
  depsXcfwHeadersPath: string | null,
  extraCxxAbsHeaderPaths: Array<string>,
  appRoot: string,
  codegenPackagePath: string,
  autolinkedPackagePath: string,
  swiftFiles: Array<string>,
  hasObjC: boolean,
};
*/

module.exports = {};
