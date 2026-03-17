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

/*:: import type {AutolinkingArgs, SpmTarget} from './spm-types'; */

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

const {displayPath, makeLogger, toSwiftName} = require('./spm-utils');
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
// $FlowFixMe[unclear-type] autolinking JSON has dynamic shape
function readAutolinkingJson(filePath /*: string */) /*: Object | null */ {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  // $FlowFixMe[incompatible-type] JSON.parse returns any
  // $FlowFixMe[unclear-type] autolinking JSON has dynamic shape
  const data /*: Object */ = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return data;
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
) /*: Array<{name: string, path: string, exclude?: Array<string>, publicHeadersPath?: string | null}> */ {
  const configPath = path.join(appRoot, 'react-native.config.js');
  if (!fs.existsSync(configPath)) {
    return [];
  }
  try {
    // $FlowFixMe[unsupported-syntax]
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

/**
 * Creates a "mirrored" source directory: a REAL directory at destDir whose
 * contents are individual file symlinks pointing to corresponding source files
 * in srcDir. Real subdirectories are created (not symlinked) so SPM's path
 * containment checks see only paths within the package root.
 *
 * Only source files (.m .mm .c .cpp .h .hpp .swift) are included.
 * Directories named in SKIP_DIRS_DEFAULT or skipDirNames are not recursed into.
 *
 * If destDir already exists as a directory symlink (legacy), it is removed first.
 */
function createMirroredSources(
  srcDir /*: string */,
  destDir /*: string */,
  skipDirNames /*: Set<string> */ = new Set(),
) /*: void */ {
  // Guard: destDir must be non-empty and absolute to prevent accidental
  // rmSync on wrong paths (e.g. empty string would resolve to cwd).
  if (!destDir || !path.isAbsolute(destDir)) {
    throw new Error(
      `createMirroredSources: destDir must be a non-empty absolute path, got: "${destDir}"`,
    );
  }
  // Ensure destDir is within an expected autolinked/sources/ tree
  if (!destDir.includes(`${path.sep}sources${path.sep}`)) {
    throw new Error(
      `createMirroredSources: destDir must be within a sources/ directory, got: "${destDir}"`,
    );
  }

  const SKIP_DIRS_DEFAULT = new Set([
    'android',
    'tests',
    '__tests__',
    '__mocks__',
    'test',
    'jest',
  ]);
  const SOURCE_EXTENSIONS = new Set([
    '.m',
    '.mm',
    '.c',
    '.cpp',
    '.h',
    '.hpp',
    '.swift',
  ]);

  // Clean destDir to remove stale symlinks from previous runs (e.g. when the
  // source path changes). Remove both directory symlinks and real directories.
  try {
    const stat = fs.lstatSync(destDir);
    if (stat.isSymbolicLink()) {
      fs.unlinkSync(destDir);
    } else if (stat.isDirectory()) {
      fs.rmSync(destDir, {recursive: true, force: true});
    }
  } catch {
    // destDir does not exist – fine
  }

  function walk(src /*: string */, dest /*: string */) /*: void */ {
    fs.mkdirSync(dest, {recursive: true});
    const entries /*: Array<{name: string, isDirectory(): boolean, isFile(): boolean}> */ =
      // $FlowFixMe[incompatible-type] Dirent typing
      fs.readdirSync(src, {withFileTypes: true});
    for (const entry of entries) {
      const {name} = entry;
      if (entry.isDirectory()) {
        if (SKIP_DIRS_DEFAULT.has(name) || skipDirNames.has(name)) {
          continue;
        }
        walk(path.join(src, name), path.join(dest, name));
      } else if (entry.isFile()) {
        if (!SOURCE_EXTENSIONS.has(path.extname(name))) {
          continue;
        }
        const linkPath = path.join(dest, name);
        try {
          fs.unlinkSync(linkPath);
        } catch {
          // nothing to remove
        }
        fs.symlinkSync(path.join(src, name), linkPath);
      }
    }
  }

  walk(srcDir, destDir);
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
 * Attempts to find an exclude list for a podspec by reading it
 * and looking for known test directories, .js files, etc.
 */
function inferExcludes(sourcePath /*: string */) /*: Array<string> */ {
  const excludes /*: Array<string> */ = [];
  if (!fs.existsSync(sourcePath)) {
    return excludes;
  }

  const entries /*: Array<{name: string, isDirectory(): boolean, isFile(): boolean}> */ =
    // $FlowFixMe[incompatible-type] Dirent typing
    fs.readdirSync(sourcePath, {withFileTypes: true});
  for (const entry of entries) {
    const name = entry.name;
    // Common test directories
    if (
      entry.isDirectory() &&
      (name === 'tests' ||
        name === '__tests__' ||
        name === 'test' ||
        name === 'jest' ||
        name === 'android' ||
        name === 'CMakeLists.txt')
    ) {
      excludes.push(name + '/');
    }
    // Common non-source files to exclude
    if (
      entry.isFile() &&
      (name.endsWith('.js') ||
        name.endsWith('.ts') ||
        name.endsWith('.podspec') ||
        name.endsWith('.md') ||
        name === 'CMakeLists.txt' ||
        name === 'package.json')
    ) {
      excludes.push(name);
    }
  }
  return excludes;
}

/**
 * Converts an autolinking.json dependency to an SPM target spec.
 * Returns null if the dependency doesn't have iOS support.
 */
function autolinkingDepToSpmTarget(
  depName /*: string */,
  // $FlowFixMe[unclear-type] dep has dynamic shape from autolinking JSON
  dep /*: Object */,
  appRoot /*: string */,
) /*: SpmTarget | null */ {
  // $FlowFixMe[prop-missing] dep is Object, platforms is dynamic
  const iosPlatform = dep.platforms?.ios;
  if (iosPlatform == null) {
    return null;
  }

  // $FlowFixMe[prop-missing] dep is Object, root is dynamic
  const sourceDir = iosPlatform.sourceDir ?? dep.root;
  if (sourceDir == null) {
    return null;
  }

  // Make path relative to autolinked/ (i.e., relative to appRoot/autolinked)
  // Since autolinked/Package.swift is in appRoot/autolinked/
  const autolinkedDir = path.join(appRoot, 'autolinked');
  const relSourcePath = path.relative(autolinkedDir, sourceDir);

  // Derive target name from package name (e.g. "@scope/my-pkg" → "MyPkg")
  const targetName = toSwiftName(depName);

  // Infer excludes
  const excludes = inferExcludes(sourceDir);

  // Detect PrivacyInfo.xcprivacy
  const privacyManifest = findPrivacyManifest(sourceDir);
  const resources = privacyManifest != null ? [privacyManifest] : undefined;

  return {
    name: targetName,
    path: relSourcePath,
    exclude: excludes,
    publicHeadersPath: inferPublicHeadersPath(sourceDir),
    resources,
  };
}

/**
 * Generates the Swift declaration for a single SPM target.
 * When hasReactDep is true, each target declares a dependency on the "React"
 * product so Xcode propagates React.xcframework's framework search paths.
 * When hasXcfwHeaders is true, -I xcfwHeaders is added to cSettings/cxxSettings
 * so <ReactCommon/...> and other headers resolve directly from the merged layout.
 * When hasDepsHeaders is true, -I depsHeaders is added to cxxSettings only so
 * C++ code can #include <glog/...>, <folly/...>, <boost/...> etc.
 */
function generateTargetDecl(
  target /*: SpmTarget */,
  hasReactDep /*: boolean */ = false,
  hasXcfwHeaders /*: boolean */ = false,
  hasDepsHeaders /*: boolean */ = false,
  indent /*: string */ = '        ',
) /*: string */ {
  const excludesList =
    target.exclude && target.exclude.length > 0
      ? `\n${indent}    exclude: [${target.exclude.map(e => `"${e}"`).join(', ')}],`
      : '';
  const publicHeadersLine =
    target.publicHeadersPath != null
      ? `\n${indent}    publicHeadersPath: "${target.publicHeadersPath}",`
      : '';
  const depsLine = hasReactDep
    ? `\n${indent}    dependencies: [.product(name: "ReactNative", package: "ReactNative")],`
    : '';

  // C settings (Objective-C .m files): VFS overlay for header identity mapping
  // (e.g. <React/RCTViewManager.h> → React_Core/React/RCTViewManager.h),
  // React xcframework headers (merged layout),
  // + React_RCTAppDelegate subdirectory for bare imports like #import <RCTDefaultReactNativeFactoryDelegate.h>.
  const cFlags = hasXcfwHeaders
    ? `["-ivfsoverlay", vfsOverlay, "-I", xcfwHeaders, "-I", xcfwHeaders + "/React_RCTAppDelegate"]`
    : `[]`;

  // C++ settings (.mm, .cpp): same as C but also -I depsHeaders for glog/folly/boost.
  // -fno-implicit-module-maps prevents clang from matching <react/...> to
  // React.framework (case-insensitive), allowing -I and VFS to resolve C++ headers.
  const cxxFlags =
    hasXcfwHeaders && hasDepsHeaders
      ? `["-fno-implicit-module-maps", "-ivfsoverlay", vfsOverlay, "-I", xcfwHeaders, "-I", xcfwHeaders + "/React_RCTAppDelegate", "-I", depsHeaders]`
      : cFlags;

  // Extra C++ include paths (e.g. for codegen output directories outside package).
  // These are emitted as "-I", appRoot + "/rel/path" entries appended to the cxxSettings
  // unsafeFlags array. Using appRoot-relative Swift expressions avoids hardcoded absolute paths.
  const extraCxxIFlags =
    target.extraCxxAbsHeaderPaths && target.extraCxxAbsHeaderPaths.length > 0
      ? target.extraCxxAbsHeaderPaths
          .map(p => {
            if (target._appRoot != null) {
              const rel = path.relative(target._appRoot, p);
              return `, "-I", appRoot + "/${rel}"`;
            }
            return `, "-I", "${p}"`;
          })
          .join('')
      : '';

  // Merge cxxFlags with extra C++ include paths.
  // cxxFlags is e.g. '["-I", xcfwHeaders]' or '[]'.  extraCxxIFlags starts with ', "-I"...'.
  // When cxxFlags is '[]' (empty), strip the leading comma from extras.
  const cxxBase = cxxFlags.slice(0, -1); // remove trailing ']'
  const trimmedExtras =
    cxxBase === '[' && extraCxxIFlags.startsWith(', ')
      ? extraCxxIFlags.slice(2)
      : extraCxxIFlags;
  const cxxFlagsWithExtras = cxxBase + trimmedExtras + ']';

  const resourcesLine =
    target.resources && target.resources.length > 0
      ? `\n${indent}    resources: [${target.resources.map(r => `.copy("${r}")`).join(', ')}],`
      : '';

  return `${indent}.target(
${indent}    name: "${target.name}",${depsLine}
${indent}    path: "${target.path}",${excludesList}${publicHeadersLine}${resourcesLine}
${indent}    cSettings: [.unsafeFlags(${cFlags})],
${indent}    cxxSettings: [
${indent}    .unsafeFlags(${cxxFlagsWithExtras})],
${indent}    linkerSettings: [.linkedFramework("UIKit"), .linkedFramework("Foundation")]
${indent})`;
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
function generateAutolinkedPackageSwift(
  targets /*: Array<SpmTarget> */,
  xcframeworksRelPath /*: string | null */,
  xcfwHeadersPath /*: string | null */ = null,
  depsXcfwHeadersPath /*: string | null */ = null,
  codegenHeadersPath /*: string | null */ = null,
  codegenReactHeadersPath /*: string | null */ = null,
  appRoot /*: string | null */ = null,
) /*: string */ {
  const hasReactDep = xcframeworksRelPath != null;
  // When xcframeworks are configured, always emit the xcfwHeaders/depsHeaders
  // Swift variables. The generated Swift code resolves symlinks at Xcode build
  // time via URL(fileURLWithPath:).resolvingSymlinksInPath(), so the paths
  // don't need to exist at generation time. Gating on the JS-resolved path
  // caused first-run failures where step 2 (autolinking) ran before step 4
  // (xcframework symlink creation), producing a broken Package.swift.
  const hasXcfwHeaders = xcframeworksRelPath != null;
  const hasDepsHeaders = xcframeworksRelPath != null;

  // SPM Package() argument order: name, platforms, products, dependencies, targets
  const reactPackageDep =
    xcframeworksRelPath != null
      ? `    dependencies: [\n        .package(name: "ReactNative", path: "${xcframeworksRelPath}"),\n    ],\n`
      : '';

  if (targets.length === 0) {
    return `// AUTO-GENERATED by scripts/generate-spm-autolinking.js – do not edit manually.
// No native modules with iOS support were found.
// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "Autolinked",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "Autolinked", targets: ["AutolinkedStub"]),
    ],
${reactPackageDep}    targets: [
        .target(name: "AutolinkedStub", path: "sources/stub", sources: ["Stub.swift"]),
    ]
)
`;
  }

  const targetNames = targets.map(t => `"${t.name}"`).join(', ');
  // Merge codegen paths into every target's extraCxxAbsHeaderPaths.
  const targetDecls = targets
    .map(t => {
      const codegenPaths /*: Array<string> */ = [];
      if (codegenHeadersPath != null) codegenPaths.push(codegenHeadersPath);
      if (codegenReactHeadersPath != null)
        codegenPaths.push(codegenReactHeadersPath);
      const merged /*: SpmTarget */ = {
        ...t,
        extraCxxAbsHeaderPaths: [
          ...(t.extraCxxAbsHeaderPaths ?? []),
          ...codegenPaths,
        ],
        _appRoot: appRoot,
      };
      return generateTargetDecl(
        merged,
        hasReactDep,
        hasXcfwHeaders,
        hasDepsHeaders,
      );
    })
    .join(',\n');

  let xcfwHeadersVar = hasXcfwHeaders
    ? `\nlet vfsOverlay = appRoot + "/build/xcframeworks/React-VFS.yaml"\n\n// React.xcframework/Headers – resolves the build/xcframeworks/ symlink to the real cache path.\nlet xcfwHeaders = URL(fileURLWithPath: appRoot + "/build/xcframeworks/React.xcframework").resolvingSymlinksInPath().path + "/Headers"\n`
    : '';
  const depsHeadersVar = hasDepsHeaders
    ? `\n// ReactNativeDependencies.xcframework/Headers – gives C++ targets\n// access to <glog/...>, <folly/...>, <boost/...>, etc.\nlet depsHeaders = URL(fileURLWithPath: appRoot + "/build/xcframeworks/ReactNativeDependencies.xcframework").resolvingSymlinksInPath().path + "/Headers"\n`
    : '';

  return `// AUTO-GENERATED by scripts/generate-spm-autolinking.js – do not edit manually.
// Re-generate by running: node node_modules/react-native/scripts/setup-ios-spm.js
// swift-tools-version: 6.0

import PackageDescription
import Foundation

// Derive all paths from this file's location – no machine-specific absolute paths.
let packageDir = URL(fileURLWithPath: #filePath).deletingLastPathComponent().path
let appRoot = packageDir + "/.."
${xcfwHeadersVar}${depsHeadersVar}
let package = Package(
    name: "Autolinked",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "Autolinked",
            targets: [${targetNames}]),
    ],
${reactPackageDep}    targets: [
${targetDecls},
    ],
    // React Native headers require C++17 (std::optional, std::is_same_v, etc.)
    cxxLanguageStandard: .cxx20
)
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(argv /*:: ?: Array<string> */) /*: void */ {
  const args = parseArgs(argv ?? process.argv.slice(2));
  // Always resolve appRoot to absolute so path.join() produces absolute paths
  // (e.g. for extraCxxAbsHeaderPaths that go into unsafeFlags).
  const appRoot = path.resolve(args.appRoot);

  // Resolve react-native root
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

  const outputDir =
    args.output != null
      ? path.resolve(appRoot, args.output)
      : path.join(appRoot, 'autolinked');

  // Collect all targets
  const targets /*: Array<SpmTarget> */ = [];

  // 1. From autolinking.json (npm packages with iOS native modules)
  const autolinkingData = readAutolinkingJson(autolinkingJsonPath);
  // $FlowFixMe[prop-missing] autolinkingData is Object|null, dependencies is dynamic
  if (autolinkingData?.dependencies) {
    // $FlowFixMe[incompatible-use] Object.entries values typed as mixed
    // $FlowFixMe[prop-missing] autolinkingData is Object|null, dependencies is dynamic
    for (const [depName, dep] of Object.entries(autolinkingData.dependencies)) {
      const target = autolinkingDepToSpmTarget(
        depName,
        // $FlowFixMe[incompatible-call] Object.entries values typed as mixed
        dep,
        appRoot,
      );
      if (target != null) {
        targets.push(target);
        log(`Found npm native module: ${target.name} → ${target.path}`);
      }
    }
  } else {
    log(
      `No autolinking.json found at ${path.relative(appRoot, autolinkingJsonPath)} or no dependencies. Using only built-in modules.`,
    );
  }

  // 2. From react-native.config.js spmModules (user-defined extra modules)
  const configModules = readSpmModulesFromConfig(appRoot);
  const autolinkedDir = path.join(appRoot, 'autolinked');
  for (const mod of configModules) {
    const absPath = path.resolve(appRoot, mod.path);
    const relPath = path.relative(autolinkedDir, absPath);
    targets.push({
      name: mod.name,
      path: relPath,
      exclude: mod.exclude ?? [],
      publicHeadersPath: mod.publicHeadersPath ?? null,
    });
    log(`Config module: ${mod.name} → ${relPath}`);
  }

  // SPM source target path: must stay within the package root (outputDir).
  // For targets whose real source is outside outputDir we create a REAL
  // directory at outputDir/sources/<name>/ containing individual file symlinks.
  // This avoids SPM's path-containment check (which resolves directory symlinks)
  // while still keeping source file references up-to-date.
  const sourcesDir = path.join(outputDir, 'sources');
  const resolvedTargets /*: Array<SpmTarget> */ = targets.map(target => {
    // Compute the absolute source path (target.path is relative to outputDir)
    const absSource = path.resolve(outputDir, target.path);
    const relFromOutput = path.relative(outputDir, absSource);

    if (relFromOutput.startsWith('..')) {
      // Source is outside the package root – mirror with individual file symlinks
      fs.mkdirSync(sourcesDir, {recursive: true});
      const mirrorDir = path.join(sourcesDir, target.name);

      // Build the set of directory names to skip (from the target's exclude list)
      const skipDirNames = new Set(
        (target.exclude || [])
          .filter(e => e.endsWith('/'))
          .map(e => e.slice(0, -1)),
      );
      createMirroredSources(absSource, mirrorDir, skipDirNames);
      log(`Mirrored: sources/${target.name} → ${path.relative(appRoot, absSource)}`);

      // Symlink PrivacyInfo.xcprivacy into the mirrored directory if present.
      // createMirroredSources only handles source extensions, so we copy it separately.
      let mirroredResources /*: Array<string> | void */ = target.resources;
      if (target.resources && target.resources.length > 0) {
        mirroredResources = [];
        for (const res of target.resources) {
          const srcRes = path.join(absSource, res);
          if (fs.existsSync(srcRes)) {
            const destRes = path.join(mirrorDir, path.basename(res));
            try {
              fs.unlinkSync(destRes);
            } catch {
              // nothing to remove
            }
            fs.symlinkSync(srcRes, destRes);
            // Resource path is now at root of mirrored dir
            mirroredResources.push(path.basename(res));
          }
        }
        if (mirroredResources.length === 0) {
          mirroredResources = undefined;
        }
      }

      // Use explicit publicHeadersPath if the target declares one; otherwise
      // infer from the mirrored directory (which only contains the filtered
      // source files – no test directories etc.)
      const publicHeadersPath =
        target.publicHeadersPath != null
          ? target.publicHeadersPath
          : inferPublicHeadersPath(mirrorDir);

      // exclude: is handled by createMirroredSources; no further exclusions needed
      return {
        ...target,
        path: `sources/${target.name}`,
        exclude: [],
        publicHeadersPath,
        resources: mirroredResources,
      };
    }

    return target;
  });

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
    // Default: build/xcframeworks/ relative to appRoot.
    // Use this path even if the directory doesn't exist yet.
    const defaultXcfw = path.join(appRoot, 'build', 'xcframeworks');
    xcframeworksRelPath = path.relative(outputDir, defaultXcfw);
  }

  if (xcframeworksRelPath != null) {
    log(
      `React xcframeworks → ${xcframeworksRelPath} (relative to autolinked/)`,
    );
  }

  // Resolve React.xcframework/Headers path so we can add -I xcfwHeaders to
  // each target's cSettings/cxxSettings.  This lets <ReactCommon/...> and other
  // non-framework headers resolve via the merged layout at xcframeworkPath/Headers.
  let xcfwHeadersPath /*: string | null */ = null;
  let depsXcfwHeadersPath /*: string | null */ = null;
  if (xcframeworksRelPath != null) {
    const absXcfwDir = path.resolve(outputDir, xcframeworksRelPath);
    for (const [name, varName] of [
      ['React.xcframework', 'xcfwHeadersPath'],
      ['ReactNativeDependencies.xcframework', 'depsXcfwHeadersPath'],
    ]) {
      const link = path.join(absXcfwDir, name);
      try {
        const resolved = fs.realpathSync(link);
        const hp = path.join(resolved, 'Headers');
        if (fs.existsSync(hp)) {
          if (varName === 'xcfwHeadersPath') {
            xcfwHeadersPath = hp;
            log(`xcfwHeaders: ${displayPath(hp)}`);
          } else {
            depsXcfwHeadersPath = hp;
            log(`depsHeaders: ${displayPath(hp)}`);
          }
        }
      } catch {
        // xcframework symlink not present yet (first run before artifacts are set up)
      }
    }
  }

  // Codegen output header paths – needed by all autolinked targets that include
  // codegen-generated headers (<ReactCodegen/...> or <react/renderer/...>).
  const codegenHeadersPath = path.join(appRoot, 'build', 'generated', 'ios');
  const codegenReactHeadersPath = path.join(codegenHeadersPath, 'ReactCodegen');
  const hasCodgenHeaders =
    fs.existsSync(codegenHeadersPath) && fs.existsSync(codegenReactHeadersPath);
  if (hasCodgenHeaders) {
    log(`codegenHeaders: ${path.relative(appRoot, codegenHeadersPath)}`);
    log(`codegenReactHeaders: ${path.relative(appRoot, codegenReactHeadersPath)}`);
  }

  // Generate Package.swift
  const content = generateAutolinkedPackageSwift(
    resolvedTargets,
    xcframeworksRelPath,
    xcfwHeadersPath,
    depsXcfwHeadersPath,
    hasCodgenHeaders ? codegenHeadersPath : null,
    hasCodgenHeaders ? codegenReactHeadersPath : null,
    appRoot,
  );

  fs.mkdirSync(outputDir, {recursive: true});
  const outputPath = path.join(outputDir, 'Package.swift');
  fs.writeFileSync(outputPath, content, 'utf8');
  log(`Generated: ${path.relative(appRoot, outputPath)}`);

  // When there are no autolinked targets, create a stub source file so the
  // placeholder target in Package.swift resolves without errors.
  if (targets.length === 0) {
    const stubDir = path.join(outputDir, 'sources', 'stub');
    fs.mkdirSync(stubDir, {recursive: true});
    const stubPath = path.join(stubDir, 'Stub.swift');
    if (!fs.existsSync(stubPath)) {
      fs.writeFileSync(stubPath, '// Placeholder — no autolinked native modules.\n', 'utf8');
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  main,
  generateAutolinkedPackageSwift,
  toSpmTargetName: toSwiftName,
};
