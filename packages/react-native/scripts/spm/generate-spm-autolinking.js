/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

/*:: import type {
  AggregatorInput,
  AutolinkedDep,
  AutolinkingArgs,
  NpmDepRef,
  RawAutolinkingJson,
  SpmModuleConfig,
  SpmTarget,
  SynthPackageSpec,
  TargetEntry,
} from './spm-types'; */

/**
 * generate-spm-autolinking.js – Generates autolinked/Package.swift, the SPM
 * equivalent of CocoaPods' `use_native_modules!`.
 *
 * Usage:
 *   node generate-spm-autolinking.js [options]
 *
 * Options:
 *   --app-root <path>            Path to the app directory (default: cwd)
 *   --react-native-root <path>   Path to react-native package root
 *   --autolinking-json <path>    Path to autolinking.json (default: build/generated/autolinking/autolinking.json)
 *   --output <path>              Output dir (default: autolinked/)
 *
 * Reads:
 *   - build/generated/autolinking/autolinking.json (produced by react-native codegen)
 *   - react-native.config.js (for spmModules extra modules, optional)
 *
 * Generates:
 *   - autolinked/Package.swift
 *
 * V1 behavior:
 *   - Processes npm-package native modules with platforms.ios != null from autolinking.json
 *   - Also processes any `spmModules` entries from react-native.config.js for local modules
 *   - Each target gets unsafeFlags for header resolution
 *
 * V2 behavior (future):
 *   - npm packages with their own Package.swift use .package(url: ...) instead of inline targets
 */

const {
  defaultReadConfig,
  defaultResolveDep,
  expandSpmDependencies,
} = require('./expand-spm-dependencies');
const {makeLogger, toSwiftName} = require('./spm-utils');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

const {log} = makeLogger('generate-spm-autolinking');

function parseArgs(argv /*: Array<string> */) /*: AutolinkingArgs */ {
  const parsed = yargs(argv)
    .option('app-root', {
      type: 'string',
      default: process.cwd(),
      describe: 'Path to the app directory',
    })
    .option('react-native-root', {
      type: 'string',
      describe: 'Path to react-native package root',
    })
    .option('autolinking-json', {
      type: 'string',
      describe:
        'Path to autolinking.json (default: build/generated/autolinking/autolinking.json)',
    })
    .option('output', {
      type: 'string',
      describe: 'Output dir (default: autolinked/)',
    })
    .option('xcframeworks-path', {
      type: 'string',
      describe:
        'Path to the xcframeworks sub-package (absolute or relative to appRoot)',
    })
    .usage(
      'Usage: $0 [options]\n\nGenerates autolinked/Package.swift for SPM autolinking.',
    )
    .help()
    .parseSync();

  return {
    appRoot: parsed['app-root'],
    reactNativeRoot: parsed['react-native-root'] ?? null,
    autolinkingJson: parsed['autolinking-json'] ?? null,
    output: parsed.output ?? null,
    xcframeworksPath: parsed['xcframeworks-path'] ?? null,
  };
}

/**
 * Reads autolinking.json and returns dependencies with iOS platform support.
 */
function readAutolinkingJson(
  filePath /*: string */,
) /*: RawAutolinkingJson | null */ {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Attempts to read react-native.config.js to find spmModules entries.
 * These are extra modules not discoverable via autolinking.json.
 *
 * Expected structure in react-native.config.js:
 * module.exports = {
 *   ...
 *   spmModules: [
 *     {
 *       name: "MyNativeModule",
 *       path: "ios/MyNativeModule",            // relative to appRoot
 *       exclude: ["*.js", "*.podspec"],        // optional
 *       publicHeadersPath: ".",               // optional
 *     }
 *   ]
 * }
 */
function readSpmModulesFromConfig(
  appRoot /*: string */,
) /*: Array<SpmModuleConfig> */ {
  const configPath = path.join(appRoot, 'react-native.config.js');
  if (!fs.existsSync(configPath)) {
    return [];
  }
  try {
    // $FlowFixMe[unsupported-syntax] dynamic require by computed path
    const config = require(configPath);
    return config.spmModules ?? [];
  } catch (e) {
    // Config might use Ruby interop or other patterns – skip
    return [];
  }
}

/**
 * Returns "." if the source directory has .h/.hpp files directly at its root
 * AND no subdirectories exist at that root (adjacent subdirectories would cause
 * Clang to reject the umbrella header).
 * Returns null otherwise.
 */
function inferPublicHeadersPath(sourcePath /*: string */) /*: string | null */ {
  if (!fs.existsSync(sourcePath)) return null;
  const entries /*: Array<{name: string, isDirectory(): boolean, isFile(): boolean, isSymbolicLink(): boolean}> */ =
    // $FlowFixMe[incompatible-type] Dirent typing
    fs.readdirSync(sourcePath, {withFileTypes: true});
  const hasHeaders = entries.some(
    e =>
      (e.isFile() || e.isSymbolicLink()) &&
      (e.name.endsWith('.h') || e.name.endsWith('.hpp')),
  );
  const hasSubdirs = entries.some(e => e.isDirectory());
  // Only use "." if headers at root AND no adjacent subdirectories.
  // If both headers and subdirectories exist, Clang rejects the module map
  // (umbrella header + adjacent directories = error).
  return hasHeaders && !hasSubdirs ? '.' : null;
}

/*::
type ExtensionFilter = $ReadOnlySet<string>;
*/

const HEADER_EXTENSIONS /*: ExtensionFilter */ = new Set(['.h', '.hpp']);
const IMPL_EXTENSIONS /*: ExtensionFilter */ = new Set([
  '.m',
  '.mm',
  '.c',
  '.cpp',
  '.swift',
]);
const ALL_SOURCE_EXTENSIONS /*: ExtensionFilter */ = new Set([
  ...HEADER_EXTENSIONS,
  ...IMPL_EXTENSIONS,
]);

// Directory names whose contents should never be included in an SPM target —
// test fixtures, Android sources, vendored modules. Shared between the source
// walker and the header linker so they agree on what to skip.
const SKIP_DIRS_DEFAULT /*: $ReadOnlySet<string> */ = new Set([
  'android',
  'tests',
  '__tests__',
  '__mocks__',
  'test',
  'jest',
  'node_modules',
]);

// Name of the dir-symlink inside each wrapper that points at the dep's real
// source dir. With target.path = "." (the wrapper), SPM resolves source paths
// like "<WRAPPER_ROOT_NAME>/Foo.mm" by following this link.
const WRAPPER_ROOT_NAME = 'root';

/**
 * Mirrors every header file under `srcDir` as a relative symlink at the same
 * relative location under `destDir`. Used for the centralized cross-package
 * headers tree at `<outputDir>/headers/<SwiftName>/` so consumers can resolve
 * `#import <SwiftName/Header.h>` via a single `-I <outputDir>/headers` flag.
 *
 * Idempotent: existing symlinks pointing at the right target are left alone;
 * stale entries are pruned. Header symlinks here are inert to Xcode (it
 * doesn't navigate them as editable source — they're compiler-only).
 */
function linkHeaderTree(
  srcDir /*: string */,
  destDir /*: string */,
  skipDirNames /*: Set<string> */ = new Set(),
) /*: void */ {
  if (!srcDir || !path.isAbsolute(srcDir)) {
    throw new Error(
      `linkHeaderTree: srcDir must be a non-empty absolute path, got: "${srcDir}"`,
    );
  }
  if (!destDir || !path.isAbsolute(destDir)) {
    throw new Error(
      `linkHeaderTree: destDir must be a non-empty absolute path, got: "${destDir}"`,
    );
  }
  if (!fs.existsSync(srcDir)) {
    return;
  }

  /*:: type HeaderEntry = {relSrc: string, absSrc: string}; */
  const headers /*: Array<HeaderEntry> */ = [];
  function collect(dir /*: string */, relBase /*: string */) /*: void */ {
    const entries /*: Array<{name: string, isDirectory(): boolean, isFile(): boolean}> */ =
      // $FlowFixMe[incompatible-type] Dirent typing
      fs.readdirSync(dir, {withFileTypes: true});
    for (const entry of entries) {
      const {name} = entry;
      if (entry.isDirectory()) {
        if (SKIP_DIRS_DEFAULT.has(name) || skipDirNames.has(name)) continue;
        collect(path.join(dir, name), path.join(relBase, name));
      } else if (entry.isFile() && HEADER_EXTENSIONS.has(path.extname(name))) {
        headers.push({
          relSrc: path.join(relBase, name),
          absSrc: path.join(dir, name),
        });
      }
    }
  }
  collect(srcDir, '');

  if (headers.length === 0) {
    try {
      if (fs.lstatSync(destDir).isDirectory()) {
        fs.rmSync(destDir, {recursive: true, force: true});
      }
    } catch {
      // destDir does not exist – fine
    }
    return;
  }

  fs.mkdirSync(destDir, {recursive: true});

  const expected /*: Set<string> */ = new Set();
  for (const {relSrc, absSrc} of headers) {
    const linkPath = path.join(destDir, relSrc);
    expected.add(relSrc);
    fs.mkdirSync(path.dirname(linkPath), {recursive: true});
    const desiredTarget = path.relative(path.dirname(linkPath), absSrc);
    try {
      const existing = fs.lstatSync(linkPath);
      if (
        existing.isSymbolicLink() &&
        fs.readlinkSync(linkPath) === desiredTarget
      ) {
        continue;
      }
      fs.unlinkSync(linkPath);
    } catch {
      // nothing to remove
    }
    fs.symlinkSync(desiredTarget, linkPath);
  }

  // Prune stale entries: walk destDir and delete anything not in `expected`.
  function pruneWalk(dir /*: string */, relBase /*: string */) /*: void */ {
    if (!fs.existsSync(dir)) return;
    const entries /*: Array<{name: string, isDirectory(): boolean, isFile(): boolean, isSymbolicLink(): boolean}> */ =
      // $FlowFixMe[incompatible-type] Dirent typing
      fs.readdirSync(dir, {withFileTypes: true});
    for (const entry of entries) {
      const rel = path.join(relBase, entry.name);
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        pruneWalk(abs, rel);
        if (fs.readdirSync(abs).length === 0) {
          fs.rmdirSync(abs);
        }
      } else {
        if (!expected.has(rel)) {
          fs.unlinkSync(abs);
        }
      }
    }
  }
  pruneWalk(destDir, '');
}

/**
 * Searches sourcePath for a PrivacyInfo.xcprivacy file (at root or one level deep).
 * Returns the relative path from sourcePath if found, null otherwise.
 */
function findPrivacyManifest(sourcePath /*: string */) /*: string | null */ {
  if (!fs.existsSync(sourcePath)) return null;
  // Check root level
  if (fs.existsSync(path.join(sourcePath, 'PrivacyInfo.xcprivacy'))) {
    return 'PrivacyInfo.xcprivacy';
  }
  // Check one level deep (e.g. ios/PrivacyInfo.xcprivacy)
  const entries /*: Array<{name: string, isDirectory(): boolean}> */ =
    // $FlowFixMe[incompatible-type] Dirent typing
    fs.readdirSync(sourcePath, {withFileTypes: true});
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const nested = path.join(sourcePath, entry.name, 'PrivacyInfo.xcprivacy');
      if (fs.existsSync(nested)) {
        return path.join(entry.name, 'PrivacyInfo.xcprivacy');
      }
    }
  }
  return null;
}

/**
 * Recursively yields forward-slash paths (relative to sourcePath) for every
 * regular file under sourcePath, skipping directories whose name is in
 * SKIP_DIRS_DEFAULT. Used as the building block for both the auto-discovery
 * (collectSpmSources) and explicit-glob (expandSpmSourceGlobs) paths so they
 * agree on what's a candidate before extension/glob filtering applies.
 */
function walkSourceFiles(sourcePath /*: string */) /*: Array<string> */ {
  const out /*: Array<string> */ = [];
  if (!fs.existsSync(sourcePath)) {
    return out;
  }
  function walk(dir /*: string */, rel /*: string */) /*: void */ {
    const entries /*: Array<{name: string, isDirectory(): boolean, isFile(): boolean, isSymbolicLink(): boolean}> */ =
      // $FlowFixMe[incompatible-type] Dirent typing
      fs.readdirSync(dir, {withFileTypes: true});
    for (const entry of entries) {
      const {name} = entry;
      const childRel = rel === '' ? name : `${rel}/${name}`;
      if (entry.isDirectory()) {
        if (SKIP_DIRS_DEFAULT.has(name)) continue;
        walk(path.join(dir, name), childRel);
      } else if (entry.isFile() || entry.isSymbolicLink()) {
        out.push(childRel);
      }
    }
  }
  walk(sourcePath, '');
  return out;
}

/**
 * Idempotent symlink: ensure `linkPath` is a symlink to `target`. If it
 * already is, leave it untouched (preserves inode). If it points elsewhere
 * or is a real file/directory, replace it. Returns true when the symlink
 * was created or replaced, false when it was already correct.
 */
function ensureSymlink(
  linkPath /*: string */,
  target /*: string */,
) /*: boolean */ {
  try {
    const stat = fs.lstatSync(linkPath);
    if (stat.isSymbolicLink() && fs.readlinkSync(linkPath) === target) {
      return false;
    }
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      fs.unlinkSync(linkPath);
    } else {
      fs.rmSync(linkPath, {recursive: true, force: true});
    }
  } catch {
    // linkPath does not exist – fine
  }
  fs.symlinkSync(target, linkPath);
  return true;
}

// Default sources allowlist when no explicit glob is provided — analog of
// CocoaPods' `s.source_files` auto-discovery.
function collectSpmSources(sourcePath /*: string */) /*: Array<string> */ {
  return walkSourceFiles(sourcePath)
    .filter(p => ALL_SOURCE_EXTENSIONS.has(path.extname(p)))
    .sort();
}

// Filters walkSourceFiles output through CocoaPods-style globs via micromatch.
// Skip-dir filtering applies before matching, so `**/*.{h,mm}` never returns
// paths under `tests/`, `android/`, etc. — even if the pattern would match.
function expandSpmSourceGlobs(
  sourcePath /*: string */,
  patterns /*: Array<string> */,
) /*: Array<string> */ {
  if (patterns.length === 0) {
    return [];
  }
  // $FlowFixMe[untyped-import] micromatch ships no types
  const micromatch = require('micromatch');
  return micromatch(walkSourceFiles(sourcePath), patterns).sort();
}

/**
 * Converts an autolinking.json dependency to an SPM target spec.
 * Returns null if the dependency doesn't have iOS support.
 */
function autolinkingDepToSpmTarget(
  depName /*: string */,
  dep /*: AutolinkedDep */,
  outputDir /*: string */,
) /*: SpmTarget | null */ {
  const iosPlatform = dep.platforms.ios;
  const sourceDir = iosPlatform.sourceDir ?? dep.root;
  if (sourceDir == null) {
    return null;
  }

  // target.path is stored relative to the autolinker's outputDir so main()'s
  // `path.resolve(outputDir, target.path)` recovers the absolute source dir —
  // same convention the spmModule branch in main() follows.
  const relSourcePath = path.relative(outputDir, sourceDir);

  // Derive target name from package name (e.g. "@scope/my-pkg" → "MyPkg")
  const targetName = toSwiftName(depName);

  // No exclude inference — main()'s emission loop emits `sources:` (an
  // explicit allowlist). User-supplied excludes still work.

  // Detect PrivacyInfo.xcprivacy
  const privacyManifest = findPrivacyManifest(sourceDir);
  const resources = privacyManifest != null ? [privacyManifest] : undefined;

  // Map declared spm.dependencies (npm names) to Swift target names so the
  // synth's .product(...) deps list reaches the consuming target.
  const spmDeps /*: Array<string> */ = dep.spmDependencies ?? [];
  const spmTargetDependencies =
    spmDeps.length > 0 ? spmDeps.map(n => toSwiftName(n)) : undefined;

  return {
    name: targetName,
    path: relSourcePath,
    exclude: [],
    publicHeadersPath: inferPublicHeadersPath(sourceDir),
    resources,
    spmTargetDependencies,
  };
}

/**
 * Generates the full autolinked/Package.swift content.
 *
 * xcframeworksRelPath – path to the xcframeworks sub-package relative to the
 *   autolinked/ directory (e.g. "../build/xcframeworks").  When non-null a
 *   React dependency is declared so Xcode propagates the xcframework's header
 *   search paths to every autolinked target (<React/...> imports resolve).
 * xcfwHeadersPath – absolute path to React.xcframework/Headers.  When non-null,
 *   each target gets -I xcfwHeaders so <ReactCommon/...> etc. resolve directly.
 * depsXcfwHeadersPath – absolute path to ReactNativeDependencies.xcframework/Headers.
 *   When non-null, C++ targets get -I depsHeaders for glog/folly/boost.
 * codegenHeadersPath – absolute path to build/generated/ios.
 *   When non-null, all C++ targets get -I <path> so <ReactCodegen/...> resolves.
 * codegenReactHeadersPath – absolute path to build/generated/ios/ReactCodegen.
 *   When non-null, all C++ targets get -I <path> so <react/renderer/...> resolves.
 */
/**
 * Top-level autolinked/Package.swift — a thin aggregator that references each
 * autolinked dep as its own sub-package (under packages/<SwiftName>) and
 * re-exports them through a single AutolinkedAggregate target. Per-dep
 * settings (header paths, cFlags, link order) live in each synth sub-package;
 * see generateSynthPackageSwift below.
 *
 * input: { deps: Array<{swiftName: string}> }
 */
function generateAutolinkedPackageSwift(
  input /*: AggregatorInput */,
) /*: string */ {
  const npmDeps /*: $ReadOnlyArray<NpmDepRef> */ = input.npmDeps ?? [];
  const inlineTargets /*: $ReadOnlyArray<SpmTarget> */ =
    input.inlineTargets ?? [];
  const hasReactDep /*: boolean */ = input.hasReactDep !== false;
  const hasXcfwHeaders /*: boolean */ = input.hasXcfwHeaders === true;
  const hasDepsHeaders /*: boolean */ = input.hasDepsHeaders === true;
  const codegenHeadersIncluded /*: boolean */ =
    input.codegenHeadersIncluded === true;
  // Relative path from autolinked/ to build/xcframeworks/, e.g. "../build/xcframeworks".
  const xcframeworksRelPath /*: ?string */ = input.xcframeworksRelPath;

  // Package-level dependencies: one .package(path:) per autolinked dep,
  // plus ReactNative if any inline target needs to import React headers.
  const packageDeps /*: Array<string> */ = npmDeps.map(d => {
    const pkgPath = d.packagePath ?? `packages/${d.swiftName}`;
    return `.package(name: "${d.swiftName}", path: "${pkgPath}")`;
  });
  if (
    inlineTargets.length > 0 &&
    hasReactDep &&
    typeof xcframeworksRelPath === 'string'
  ) {
    packageDeps.push(
      `.package(name: "ReactNative", path: "${xcframeworksRelPath}")`,
    );
  }

  // AutolinkedAggregate's target dependencies: .product(...) for npm sub-package
  // products and .target(...) for inline spmModule targets in the same package.
  const aggregateDeps /*: Array<string> */ = [
    ...npmDeps.map(
      d => `.product(name: "${d.swiftName}", package: "${d.swiftName}")`,
    ),
    ...inlineTargets.map(t => `.target(name: "${t.name}")`),
  ];

  // Per-target c/cxx flag stacks (shared across inline targets).
  const cFlagsCore /*: Array<string> */ = hasXcfwHeaders
    ? [
        '"-ivfsoverlay", vfsOverlay',
        '"-I", xcfwHeaders',
        '"-I", xcfwHeaders + "/React_RCTAppDelegate"',
      ]
    : [];
  const cxxFlagsCore /*: Array<string> */ = hasXcfwHeaders
    ? ['"-fno-implicit-module-maps"', ...cFlagsCore]
    : [];
  if (hasDepsHeaders) {
    cxxFlagsCore.push('"-I", depsHeaders');
  }
  if (codegenHeadersIncluded) {
    cxxFlagsCore.push(
      '"-I", appRoot + "/build/generated/ios"',
      '"-I", appRoot + "/build/generated/ios/ReactCodegen"',
    );
  }

  const inlineDecls = inlineTargets.map(t => {
    const excludeLine =
      t.exclude && t.exclude.length > 0
        ? `\n            exclude: [${t.exclude.map(e => `"${e}"`).join(', ')}],`
        : '';
    const publicHeadersLine =
      t.publicHeadersPath != null
        ? `\n            publicHeadersPath: "${t.publicHeadersPath}",`
        : '';
    const resourcesLine =
      t.resources && t.resources.length > 0
        ? `\n            resources: [${t.resources.map(r => `.copy("${r}")`).join(', ')}],`
        : '';
    const cSettingsLine =
      cFlagsCore.length > 0
        ? `\n            cSettings: [.unsafeFlags([${cFlagsCore.join(', ')}])],`
        : '';
    const cxxSettingsLine =
      cxxFlagsCore.length > 0
        ? `\n            cxxSettings: [.unsafeFlags([${cxxFlagsCore.join(', ')}])],`
        : '';
    return `        .target(
            name: "${t.name}",
            dependencies: [.product(name: "ReactNative", package: "ReactNative")],
            path: "${t.path}",${excludeLine}${publicHeadersLine}${resourcesLine}${cSettingsLine}${cxxSettingsLine}
            linkerSettings: [.linkedFramework("UIKit"), .linkedFramework("Foundation"), .linkedFramework("CoreGraphics")]
        )`;
  });

  const packageDepsBlock =
    packageDeps.length > 0
      ? `    dependencies: [\n        ${packageDeps.join(',\n        ')},\n    ],\n`
      : '';
  const aggregateDepsLine =
    aggregateDeps.length > 0
      ? `\n            dependencies: [${aggregateDeps.join(', ')}],`
      : '';

  const xcfwHeadersVar = hasXcfwHeaders
    ? `\nlet vfsOverlay = appRoot + "/build/xcframeworks/React-VFS.yaml"\nlet xcfwHeaders = URL(fileURLWithPath: appRoot + "/build/xcframeworks/React.xcframework").resolvingSymlinksInPath().path + "/Headers"\n`
    : '';
  const depsHeadersVar = hasDepsHeaders
    ? `let depsHeaders = URL(fileURLWithPath: appRoot + "/build/xcframeworks/ReactNativeDependencies.xcframework").resolvingSymlinksInPath().path + "/Headers"\n`
    : '';

  const inlineDeclsBlock =
    inlineDecls.length > 0 ? `,\n${inlineDecls.join(',\n')}` : '';

  return `// AUTO-GENERATED by scripts/generate-spm-autolinking.js – do not edit manually.
// Top-level Autolinked package. Every autolinked dep (npm or spmModule) is
// referenced as .package(path: <dep-source-dir>) — each has its own synth
// Package.swift written in-place. AutolinkedAggregate depends on every dep's
// product so the app build pulls them all in.
// swift-tools-version: 6.0

import PackageDescription
import Foundation

let packageDir = URL(fileURLWithPath: #filePath).deletingLastPathComponent().path
let appRoot = packageDir + "/.."
${xcfwHeadersVar}${depsHeadersVar}
let package = Package(
    name: "Autolinked",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "Autolinked", targets: ["AutolinkedAggregate"]),
    ],
${packageDepsBlock}    targets: [
        .target(
            name: "AutolinkedAggregate",${aggregateDepsLine}
            path: "AutolinkedAggregate"
        )${inlineDeclsBlock}
    ],
    cxxLanguageStandard: .cxx20
)
`;
}

/**
 * Per-dep synthesized Package.swift.
 *
 * Two emission modes, selected by which spec fields are set:
 *   - Wrapper-dir (production): set `appRootAbsolute`,
 *     `siblingSynthAbsolutePaths`, and `autogenHeadersAbsolute`. The synth
 *     file lives at <outputDir>/packages/<SwiftName>/Package.swift with
 *     `targetPath: "root"` — `root` is a directory symlink to the real
 *     source dir, so source files stay real (Xcode atomic-save works).
 *     Cross-package angle includes resolve via `-I <autogenHeadersAbsolute>`
 *     instead of SPM's `publicHeadersPath` (keeps source dirs untouched).
 *   - Sub-package (legacy): set `appRootRelativeToPackage` +
 *     `siblingPackageBaseRelative`. Kept only for backwards-compat tests.
 */
function generateSynthPackageSwift(spec /*: SynthPackageSpec */) /*: string */ {
  const swiftName /*: string */ = spec.swiftName;
  const exclude /*: Array<string> */ = spec.exclude ?? [];
  const sources /*: ?Array<string> */ = spec.sources;
  const publicHeadersPath /*: ?string */ = spec.publicHeadersPath ?? null;
  const spmDependencies /*: Array<{swiftName: string}> */ =
    spec.spmDependencies ?? [];
  const hasReactDep /*: boolean */ = spec.hasReactDep !== false;
  const hasXcfwHeaders /*: boolean */ = spec.hasXcfwHeaders === true;
  const hasDepsHeaders /*: boolean */ = spec.hasDepsHeaders === true;
  const codegenHeadersIncluded /*: boolean */ =
    spec.codegenHeadersIncluded === true;
  const resources /*: ?Array<string> */ = spec.resources;
  const isDynamic /*: boolean */ = spec.isDynamic !== false;
  const targetPath /*: string */ = spec.targetPath ?? `Sources/${swiftName}`;
  const appRootAbsolute /*: ?string */ = spec.appRootAbsolute;
  const autogenHeadersAbsolute /*: ?string */ = spec.autogenHeadersAbsolute;
  const siblingSynthAbsolutePaths /*: {[string]: string} */ =
    spec.siblingSynthAbsolutePaths ?? {};

  // Package dependencies — ReactNative + each spm sibling synth package.
  // In-place mode uses absolute paths (or appRoot + "/build/xcframeworks"
  // for the React dep); sub-package mode walks up via relative paths.
  const packageDeps /*: Array<string> */ = [];
  if (appRootAbsolute != null) {
    if (hasReactDep) {
      packageDeps.push(
        `.package(name: "ReactNative", path: appRoot + "/build/xcframeworks")`,
      );
    }
    for (const dep of spmDependencies) {
      const absPath = siblingSynthAbsolutePaths[dep.swiftName];
      if (absPath == null) {
        throw new Error(
          `generateSynthPackageSwift: in-place mode requires siblingSynthAbsolutePaths["${dep.swiftName}"] for dep "${swiftName}"`,
        );
      }
      packageDeps.push(
        `.package(name: "${dep.swiftName}", path: "${absPath}")`,
      );
    }
  } else {
    const appRootRelativeToPackage /*: string */ =
      spec.appRootRelativeToPackage ?? '/../../..';
    const reactNativeRel =
      `${appRootRelativeToPackage}/build/xcframeworks`.replace(/^\/+/, '');
    const siblingRel /*: string */ = spec.siblingPackageBaseRelative ?? '..';
    if (hasReactDep) {
      packageDeps.push(
        `.package(name: "ReactNative", path: "${reactNativeRel}")`,
      );
    }
    for (const dep of spmDependencies) {
      packageDeps.push(
        `.package(name: "${dep.swiftName}", path: "${siblingRel}/${dep.swiftName}")`,
      );
    }
  }

  // Target dependencies — products from each declared package dep.
  const targetDeps /*: Array<string> */ = [];
  if (hasReactDep) {
    targetDeps.push('.product(name: "ReactNative", package: "ReactNative")');
  }
  for (const dep of spmDependencies) {
    targetDeps.push(
      `.product(name: "${dep.swiftName}", package: "${dep.swiftName}")`,
    );
  }

  // C / C++ settings — same shape as the old inline emitter.
  const cFlags /*: Array<string> */ = hasXcfwHeaders
    ? [
        '"-ivfsoverlay", vfsOverlay',
        '"-I", xcfwHeaders',
        '"-I", xcfwHeaders + "/React_RCTAppDelegate"',
      ]
    : [];
  const cxxFlags /*: Array<string> */ = hasXcfwHeaders
    ? ['"-fno-implicit-module-maps"', ...cFlags]
    : [];
  if (hasDepsHeaders) {
    cxxFlags.push('"-I", depsHeaders');
  }
  if (codegenHeadersIncluded) {
    cxxFlags.push(
      '"-I", appRoot + "/build/generated/ios"',
      '"-I", appRoot + "/build/generated/ios/ReactCodegen"',
    );
  }
  // Centralized cross-package headers: each consumer gets -I <autogenHeaders>
  // so `#import <Foo/Header.h>` resolves via <autogenHeaders>/Foo/Header.h
  // (file symlink to the real header in Foo's source dir). Replaces the
  // legacy per-package `publicHeadersPath` mechanism — keeps user source
  // dirs free of generated `include/<Name>/` subdirs.
  if (autogenHeadersAbsolute != null) {
    cFlags.push(`"-I", "${autogenHeadersAbsolute}"`);
    cxxFlags.push(`"-I", "${autogenHeadersAbsolute}"`);
  }

  // Helper Swift vars (only emitted when needed)
  const xcfwHeadersVar = hasXcfwHeaders
    ? `\nlet vfsOverlay = appRoot + "/build/xcframeworks/React-VFS.yaml"\nlet xcfwHeaders = URL(fileURLWithPath: appRoot + "/build/xcframeworks/React.xcframework").resolvingSymlinksInPath().path + "/Headers"\n`
    : '';
  const depsHeadersVar = hasDepsHeaders
    ? `let depsHeaders = URL(fileURLWithPath: appRoot + "/build/xcframeworks/ReactNativeDependencies.xcframework").resolvingSymlinksInPath().path + "/Headers"\n`
    : '';

  const excludeLine =
    exclude.length > 0
      ? `\n            exclude: [${exclude.map(e => `"${e}"`).join(', ')}],`
      : '';
  // sources: explicit allowlist. One file per line because lists can run to
  // dozens of entries and an unbroken array becomes unreadable in diffs.
  const sourcesLine =
    sources != null && sources.length > 0
      ? `\n            sources: [\n${sources.map(s => `                "${s}",`).join('\n')}\n            ],`
      : '';
  const publicHeadersLine =
    publicHeadersPath != null
      ? `\n            publicHeadersPath: "${publicHeadersPath}",`
      : '';
  const resourcesLine =
    resources != null && resources.length > 0
      ? `\n            resources: [${resources.map(r => `.copy("${r}")`).join(', ')}],`
      : '';

  const packageDepsBlock =
    packageDeps.length > 0
      ? `    dependencies: [\n        ${packageDeps.join(',\n        ')},\n    ],\n`
      : '';
  const cSettingsLine =
    cFlags.length > 0
      ? `\n            cSettings: [.unsafeFlags([${cFlags.join(', ')}])],`
      : '';
  const cxxSettingsLine =
    cxxFlags.length > 0
      ? `\n            cxxSettings: [.unsafeFlags([${cxxFlags.join(', ')}])],`
      : '';

  // appRoot — either a hardcoded absolute path (in-place mode) or a
  // relative-to-packageDir expression (sub-package mode).
  const appRootDecl =
    appRootAbsolute != null
      ? `let appRoot = "${appRootAbsolute}"`
      : `let packageDir = URL(fileURLWithPath: #filePath).deletingLastPathComponent().path
let appRoot = packageDir + "${spec.appRootRelativeToPackage ?? '/../../..'}"`;

  return `// AUTO-GENERATED by scripts/generate-spm-autolinking.js – do not edit manually.
// Synth Package.swift for autolinked dep "${swiftName}".
// swift-tools-version: 6.0

import PackageDescription
import Foundation

${appRootDecl}
${xcfwHeadersVar}${depsHeadersVar}
let package = Package(
    name: "${swiftName}",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "${swiftName}"${isDynamic ? ', type: .dynamic' : ''}, targets: ["${swiftName}"]),
    ],
${packageDepsBlock}    targets: [
        .target(
            name: "${swiftName}",
            dependencies: [${targetDeps.join(', ')}],
            path: "${targetPath}",${excludeLine}${sourcesLine}${publicHeadersLine}${resourcesLine}${cSettingsLine}${cxxSettingsLine}
            linkerSettings: [.linkedFramework("UIKit"), .linkedFramework("Foundation"), .linkedFramework("CoreGraphics")]
        ),
    ],
    cxxLanguageStandard: .cxx20
)
`;
}

function main(argv /*:: ?: Array<string> */) /*: void */ {
  const args = parseArgs(argv ?? process.argv.slice(2));
  // Resolve to absolute so path.join() produces absolute paths everywhere —
  // entryAbsDirs, autogenHeadersAbsolute, etc. all assume absolute appRoot.
  const appRoot = path.resolve(args.appRoot);

  let rnRoot = args.reactNativeRoot;
  if (rnRoot == null) {
    rnRoot = path.join(appRoot, 'node_modules', 'react-native');
    if (!fs.existsSync(rnRoot)) {
      // Monorepo: try walking up
      let dir = appRoot;
      for (let i = 0; i < 5; i++) {
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
        const c = path.join(dir, 'node_modules', 'react-native');
        if (fs.existsSync(c)) {
          rnRoot = c;
          break;
        }
      }
    }
    if (rnRoot == null || !fs.existsSync(rnRoot)) {
      console.error(
        '[generate-spm-autolinking] Could not find react-native. Pass --react-native-root.',
      );
      process.exitCode = 1;
      return;
    }
  }

  const autolinkingJsonPath =
    args.autolinkingJson ??
    path.join(appRoot, 'build', 'generated', 'autolinking', 'autolinking.json');

  // Output lands under <appRoot>/build/generated/autolinking/ — co-located
  // with autolinking.json (written by generate-spm-autolinking-config.js) and
  // alongside the iOS-conventional build/ tree (Pods/, build/xcframeworks/…).
  const outputDir =
    args.output != null
      ? path.resolve(appRoot, args.output)
      : path.join(appRoot, 'build', 'generated', 'autolinking');

  // Collect all targets along with their routing metadata.
  const entries /*: Array<TargetEntry> */ = [];

  // 1. From autolinking.json (npm packages with iOS native modules), expanded
  //    with transitive deps declared via `spm.dependencies` in each package's
  //    react-native.config.js (analog of podspec `s.dependency`).
  const autolinkingData = readAutolinkingJson(autolinkingJsonPath);
  const depsMap = autolinkingData?.dependencies;
  if (depsMap != null) {
    // Narrow each on-disk AutolinkingDepJson into the validated AutolinkedDep
    // shape expected by expandSpmDependencies and autolinkingDepToSpmTarget.
    const directDeps /*: Array<AutolinkedDep> */ = [];
    for (const name of Object.keys(depsMap)) {
      const dep = depsMap[name];
      if (dep == null) continue;
      const iosPlatform = dep.platforms?.ios;
      const root = dep.root;
      if (iosPlatform == null || root == null) continue;
      directDeps.push({
        name,
        root,
        platforms: {ios: iosPlatform},
      });
    }
    const allDeps = expandSpmDependencies(directDeps, {
      readConfig: defaultReadConfig,
      resolveDep: defaultResolveDep,
    });

    for (const dep of allDeps) {
      const target = autolinkingDepToSpmTarget(dep.name, dep, outputDir);
      if (target != null) {
        entries.push({target, origin: 'npm'});
        log(`Found npm native module: ${target.name} → ${target.path}`);
      }
    }
  } else {
    log(
      `No autolinking.json found at ${path.relative(appRoot, autolinkingJsonPath)} or no dependencies. Using only built-in modules.`,
    );
  }

  // 2. From react-native.config.js spmModules (user-defined extra modules).
  // If the module declares `sources: [glob, ...]` (CocoaPods-style), expand
  // the globs now relative to its dir and attach the file list to the target
  // so the emission loop below renders `sources: [...]` literally.
  const configModules = readSpmModulesFromConfig(appRoot);
  for (const mod of configModules) {
    const absPath = path.resolve(appRoot, mod.path);
    const relPath = path.relative(outputDir, absPath);
    const userSources =
      Array.isArray(mod.sources) && mod.sources.length > 0
        ? expandSpmSourceGlobs(absPath, mod.sources)
        : null;
    entries.push({
      target: {
        name: mod.name,
        path: relPath,
        exclude: mod.exclude ?? [],
        publicHeadersPath: mod.publicHeadersPath ?? null,
        sources: userSources,
      },
      origin: 'spmModule',
    });
    log(`Config module: ${mod.name} → ${relPath}`);
  }

  // Resolve xcframeworks package path relative to outputDir (autolinked/).
  // When provided this causes each target to declare a React dependency so
  // Xcode adds the xcframework's header search paths (needed for <React/...>).
  // Always set xcframeworksRelPath to the default even if the directory doesn't
  // exist yet — on first run, step 2 (autolinking) runs before step 4
  // (xcframework symlinks), but the generated Swift code resolves paths at
  // Xcode build time, not generation time.
  let xcframeworksRelPath /*: string | null */ = null;
  if (args.xcframeworksPath != null) {
    const absXcfw = path.resolve(appRoot, args.xcframeworksPath);
    xcframeworksRelPath = path.relative(outputDir, absXcfw);
  } else {
    const defaultXcfw = path.join(appRoot, 'build', 'xcframeworks');
    xcframeworksRelPath = path.relative(outputDir, defaultXcfw);
  }

  if (xcframeworksRelPath != null) {
    log(
      `React xcframeworks → ${xcframeworksRelPath} (relative to autolinked/)`,
    );
  }

  // Codegen output header paths – needed by C++ autolinked targets that
  // include codegen-generated headers (<ReactCodegen/...> or <react/renderer/...>).
  const codegenHeadersPath = path.join(appRoot, 'build', 'generated', 'ios');
  const codegenReactHeadersPath = path.join(codegenHeadersPath, 'ReactCodegen');
  const hasCodgenHeaders =
    fs.existsSync(codegenHeadersPath) && fs.existsSync(codegenReactHeadersPath);
  if (hasCodgenHeaders) {
    log(`codegenHeaders: ${path.relative(appRoot, codegenHeadersPath)}`);
    log(
      `codegenReactHeaders: ${path.relative(appRoot, codegenReactHeadersPath)}`,
    );
  }

  const hasReactDep = xcframeworksRelPath != null;
  const hasXcfwHeaders = xcframeworksRelPath != null;
  const hasDepsHeaders = xcframeworksRelPath != null;

  const AUTOGEN_MARKER =
    '// AUTO-GENERATED by scripts/generate-spm-autolinking.js';

  // A dep is "self-managed" when its source dir ships a hand-written
  // Package.swift (i.e. one that lacks our AUTOGEN_MARKER). The autolinker
  // skips wrapping it and references the dep's source dir directly — useful
  // for libraries that want to ship a real SPM manifest and have full
  // control over their target settings.
  const isSelfManagedPackage = (absSource /*: string */) /*: boolean */ => {
    const pkgSwift = path.join(absSource, 'Package.swift');
    try {
      const content = fs.readFileSync(pkgSwift, 'utf8');
      return !content.includes(AUTOGEN_MARKER);
    } catch {
      return false;
    }
  };

  // Each entry gets a wrapper dir at <outputDir>/packages/<SwiftName>/ that
  // contains the synth Package.swift and a `root` directory symlink pointing
  // at the dep's real source dir. SPM derives package identity from the path
  // basename, so the wrapper's unique name (SwiftName) sidesteps the basename
  // collision that in-place at the source dir would have. Files inside the
  // source dir stay real, so Xcode's atomic-save works through the dir
  // symlink (intermediate path components — even symlinks — resolve cleanly;
  // the issue was only file-symlinks as the final path component).
  const entryAbsDirs /*: Map<string, string> */ = new Map();
  for (const entry of entries) {
    entryAbsDirs.set(
      entry.target.name,
      path.resolve(outputDir, entry.target.path),
    );
  }

  const packagesDir = path.join(outputDir, 'packages');
  const headersDir = path.join(outputDir, 'headers');
  fs.mkdirSync(packagesDir, {recursive: true});
  fs.mkdirSync(headersDir, {recursive: true});

  const wrapperDirs /*: Map<string, string> */ = new Map();
  const selfManagedDirs /*: Map<string, string> */ = new Map();
  const aggregatorPackageDeps /*: Array<NpmDepRef> */ = [];

  for (const entry of entries) {
    const {target} = entry;
    const absSource /*: string */ = entryAbsDirs.get(target.name) ?? '';
    if (!fs.existsSync(absSource)) {
      log(`Skipping ${target.name}: source dir missing (${absSource})`);
      continue;
    }
    if (isSelfManagedPackage(absSource)) {
      selfManagedDirs.set(target.name, absSource);
      log(
        `Self-managed: ${target.name} → ${path.relative(appRoot, absSource)} (using its own Package.swift)`,
      );
      continue;
    }
    const wrapperDir = path.join(packagesDir, target.name);
    wrapperDirs.set(target.name, wrapperDir);
    fs.mkdirSync(wrapperDir, {recursive: true});
    ensureSymlink(path.join(wrapperDir, WRAPPER_ROOT_NAME), absSource);
  }

  // Sibling refs: each synth Package.swift declares its sibling deps via the
  // dep's actual package root — wrapper dir for autolinker-managed deps,
  // source dir for self-managed ones. SPM identity stays unique either way
  // (wrapper basename = SwiftName; self-managed manifests declare the same
  // package name).
  const siblingPackagePaths /*: {[string]: string} */ = {};
  for (const [name, wrapper] of wrapperDirs.entries()) {
    siblingPackagePaths[name] = wrapper;
  }
  for (const [name, sourceDir] of selfManagedDirs.entries()) {
    siblingPackagePaths[name] = sourceDir;
  }

  for (const entry of entries) {
    const {target} = entry;
    const absSource /*: string */ = entryAbsDirs.get(target.name) ?? '';

    // Self-managed deps: skip the synth step entirely. The dep's own
    // Package.swift handles its targets, headers, and React framework
    // wiring. We just register it with the aggregator so the app pulls it
    // in alongside autolinker-managed deps. The central headers/<SwiftName>/
    // tree still gets populated so consumers (host app + sibling synths
    // that hit -I autolinking/headers) can resolve `<SwiftName/Header.h>`
    // by file path — synth packages use `-fno-implicit-module-maps`, so
    // we can't rely on SPM's auto-generated module map alone.
    if (selfManagedDirs.has(target.name)) {
      linkHeaderTree(absSource, path.join(headersDir, target.name));
      aggregatorPackageDeps.push({
        swiftName: target.name,
        packagePath: absSource,
      });
      continue;
    }

    const wrapperDir = wrapperDirs.get(target.name);
    if (wrapperDir == null) continue;
    const skipDirNames = new Set(
      (target.exclude || [])
        .filter(e => e.endsWith('/'))
        .map(e => e.slice(0, -1)),
    );

    const siblingSynthAbsolutePaths /*: {[string]: string} */ = {};
    for (const sibling of target.spmTargetDependencies ?? []) {
      const sibPath = siblingPackagePaths[sibling];
      if (sibPath != null) {
        siblingSynthAbsolutePaths[sibling] = sibPath;
      }
    }

    // target.path = "." (the wrapper dir) so SPM sees an empty `include/`
    // sibling of `root/` for its required `publicHeadersPath`. Without that,
    // SPM defaults publicHeadersPath to "include" and errors out when no
    // such dir exists inside the dep's source tree. Sources come from
    // `root/<...>` via the dir symlink — paths from auto-discovery or
    // user globs are relative to the dep's source dir, so we prefix with
    // `root/` to keep them inside target.path.
    const withRoot = (p /*: string */) => `${WRAPPER_ROOT_NAME}/${p}`;
    const prefixedExclude /*: Array<string> */ = (target.exclude ?? []).map(
      withRoot,
    );
    const prefixedResources /*: ?Array<string> */ =
      target.resources != null ? target.resources.map(withRoot) : undefined;

    // sources: explicit allowlist. Pre-resolved on the target (spmModule
    // glob expansion) or auto-collected here. We always emit `sources:` so
    // SPM never falls back to scanning the source dir verbatim (which would
    // pick up tests/, *.js, *.podspec, etc.).
    const rawSources /*: Array<string> */ =
      target.sources != null && target.sources.length > 0
        ? target.sources
        : collectSpmSources(absSource);
    const prefixedSources /*: ?Array<string> */ =
      rawSources.length > 0 ? rawSources.map(withRoot) : null;

    const synthContent = generateSynthPackageSwift({
      swiftName: target.name,
      exclude: prefixedExclude,
      sources: prefixedSources,
      // Stub include/ subdir lives in the wrapper dir; satisfies SPM's
      // publicHeadersPath requirement without exposing anything. Cross-pkg
      // angle includes resolve via -I <outputDir>/headers
      // (autogenHeadersAbsolute below) instead.
      publicHeadersPath: 'include',
      resources: prefixedResources,
      spmDependencies: (target.spmTargetDependencies ?? []).map(swiftName => ({
        swiftName,
      })),
      hasReactDep,
      hasXcfwHeaders,
      hasDepsHeaders,
      codegenHeadersIncluded: hasCodgenHeaders,
      isDynamic: false,
      targetPath: '.',
      appRootAbsolute: appRoot,
      autogenHeadersAbsolute: headersDir,
      siblingSynthAbsolutePaths,
    });

    fs.writeFileSync(
      path.join(wrapperDir, 'Package.swift'),
      synthContent,
      'utf8',
    );
    // Centralized headers tree at <outputDir>/headers/<SwiftName>/<relpath>.h.
    // Used two ways:
    //   * SPM-internal: cFlags add `-I <outputDir>/headers`, so cross-package
    //     angle includes like <SwiftName/Header.h> resolve.
    //   * Host app + sibling consumers: each wrapper's `include/` is a dir
    //     symlink to its slice of this tree, so `#import <RelPath/Header.h>`
    //     (e.g. <ReactCommon/RCTSampleTurboModule.h>) resolves through SPM's
    //     publicHeadersPath propagation (-I .../packages/<SwiftName>/include).
    const pkgHeadersDir = path.join(headersDir, target.name);
    linkHeaderTree(absSource, pkgHeadersDir, skipDirNames);

    const includePath = path.join(wrapperDir, 'include');
    if (fs.existsSync(pkgHeadersDir)) {
      ensureSymlink(includePath, pkgHeadersDir);
    } else {
      // Header-less package (rare): keep an empty dir so SPM's
      // publicHeadersPath: "include" requirement is still satisfied.
      fs.mkdirSync(includePath, {recursive: true});
    }

    log(
      `Synth: packages/${target.name}/ → ${path.relative(appRoot, absSource)}`,
    );

    aggregatorPackageDeps.push({
      swiftName: target.name,
      packagePath: `packages/${target.name}`,
    });
  }

  // Prune stale wrappers + header dirs for entries no longer autolinked.
  // Preserve both wrapper-managed and self-managed names; only entries that
  // are no longer autolinked at all get removed. Note: `packages/` only has
  // wrapper-managed names (self-managed deps live in their own source dirs),
  // but `headers/` has both since we populate the central tree for everyone.
  const activeNames /*: Set<string> */ = new Set([
    ...wrapperDirs.keys(),
    ...selfManagedDirs.keys(),
  ]);
  for (const subdir of ['packages', 'headers']) {
    const dir = path.join(outputDir, subdir);
    try {
      const existing /*: Array<{name: string, isSymbolicLink(): boolean, isDirectory(): boolean}> */ =
        // $FlowFixMe[incompatible-type] Dirent typing
        fs.readdirSync(dir, {withFileTypes: true});
      for (const entry of existing) {
        if (activeNames.has(entry.name)) continue;
        const stale = path.join(dir, entry.name);
        if (entry.isSymbolicLink() || !entry.isDirectory()) {
          fs.unlinkSync(stale);
        } else {
          fs.rmSync(stale, {recursive: true, force: true});
        }
        log(`Removed stale ${subdir}/${entry.name}`);
      }
    } catch {
      // dir doesn't exist – fine
    }
  }

  // Top-level aggregator: references every entry as .package(path:) and
  // depends on each via .product(...). No more inline targets — every
  // autolinked dep is a real SPM package in its own source dir.
  const aggregatorContent = generateAutolinkedPackageSwift({
    npmDeps: aggregatorPackageDeps,
    hasReactDep,
    hasXcfwHeaders,
    hasDepsHeaders,
    codegenHeadersIncluded: hasCodgenHeaders,
    xcframeworksRelPath,
  });
  fs.mkdirSync(outputDir, {recursive: true});
  const outputPath = path.join(outputDir, 'Package.swift');
  fs.writeFileSync(outputPath, aggregatorContent, 'utf8');
  log(`Generated: ${path.relative(appRoot, outputPath)}`);

  // AutolinkedAggregate is glue; needs at least one source file (Swift, so we
  // sidestep the Obj-C public-headers-dir requirement).
  const aggregateDir = path.join(outputDir, 'AutolinkedAggregate');
  fs.mkdirSync(aggregateDir, {recursive: true});
  const stubPath = path.join(aggregateDir, 'AutolinkedAggregate.swift');
  if (!fs.existsSync(stubPath)) {
    fs.writeFileSync(
      stubPath,
      '// Placeholder. Real native modules live in transitively-referenced sub-packages.\n',
      'utf8',
    );
  }
  const legacyStub = path.join(aggregateDir, 'AutolinkedAggregate.m');
  if (fs.existsSync(legacyStub)) {
    fs.unlinkSync(legacyStub);
  }

  // One-time migration cleanup: remove the legacy <appRoot>/autolinked/ tree
  // and any stale in-source `Package.swift` / `include/<Name>/` from the
  // prior in-place layout (those files lived in user source dirs and have
  // been replaced by the wrapper layout under outputDir).
  const legacyAutolinkedDir = path.join(appRoot, 'autolinked');
  if (
    fs.existsSync(legacyAutolinkedDir) &&
    path.resolve(legacyAutolinkedDir) !== path.resolve(outputDir)
  ) {
    fs.rmSync(legacyAutolinkedDir, {recursive: true, force: true});
    log(`Removed legacy autolinked/ tree`);
  }
  for (const absSource of entryAbsDirs.values()) {
    const legacyPkg = path.join(absSource, 'Package.swift');
    try {
      const content = fs.readFileSync(legacyPkg, 'utf8');
      if (content.includes(AUTOGEN_MARKER)) {
        fs.unlinkSync(legacyPkg);
        log(
          `Removed legacy in-place synth: ${path.relative(appRoot, legacyPkg)}`,
        );
      }
    } catch {
      // not present – fine
    }
    const legacyInclude = path.join(absSource, 'include');
    try {
      if (fs.lstatSync(legacyInclude).isDirectory()) {
        fs.rmSync(legacyInclude, {recursive: true, force: true});
        log(
          `Removed legacy in-place include/: ${path.relative(appRoot, legacyInclude)}`,
        );
      }
    } catch {
      // not present – fine
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  main,
  generateAutolinkedPackageSwift,
  generateSynthPackageSwift,
  linkHeaderTree,
  collectSpmSources,
  expandSpmSourceGlobs,
};
