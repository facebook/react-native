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

/*:: import type {GeneratePackageArgs, ScanResult, GeneratePackageOpts} from './spm-types'; */

/**
 * generate-spm-package.js – Generates the xcframeworks sub-package and
 * (optionally) an initial main Package.swift for a React Native app using
 * prebuilt XCFrameworks via Swift Package Manager.
 *
 * Usage:
 *   node generate-spm-package.js [options]
 *
 * Options:
 *   --app-root <path>            Path to the app directory (default: cwd)
 *   --react-native-root <path>   Path to react-native package root
 *   --version <ver>              RN version for Maven artifact URLs
 *   --local-xcframework <path>   Use local xcframework (skips binary targets)
 *   --artifacts-dir <path>       Path to downloaded artifacts directory
 *   --app-name <name>            App/package name (default: from package.json)
 *   --target-name <name>         Main app target name (default: derived from app-name)
 *   --source-path <path>         Path to app source relative to app-root (default: auto-detected)
 *   --ios-version <ver>          Minimum iOS version (default: 15)
 *   --output <path>              Output path for Package.swift (default: app-root/Package.swift)
 *   --init                       Generate initial main Package.swift (for first-time setup)
 *
 * Without --init: only generates build/xcframeworks/Package.swift + symlinks.
 * With --init:    also generates a starter main Package.swift for the developer to commit.
 */

const {displayPath, findProjectRoot, makeLogger, readPackageJson, toSwiftName} = require('./spm-utils');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

const {log} = makeLogger('generate-spm-package');

function parseArgs(argv /*: Array<string> */) /*: GeneratePackageArgs */ {
  const parsed = yargs(argv)
    .version(false)
    .option('app-root', {
      type: 'string',
      default: process.cwd(),
      describe: 'Path to the app directory',
    })
    .option('react-native-root', {
      type: 'string',
      describe: 'Path to react-native package root',
    })
    .option('version', {
      type: 'string',
      describe: 'RN version for Maven artifact URLs',
    })
    .option('local-xcframework', {
      type: 'string',
      describe: 'Use local xcframework (skips binary targets)',
    })
    .option('artifacts-dir', {
      type: 'string',
      describe: 'Path to downloaded artifacts directory',
    })
    .option('app-name', {
      type: 'string',
      describe: 'App/package name (default: from package.json)',
    })
    .option('target-name', {
      type: 'string',
      describe: 'Main app target name (default: derived from app-name)',
    })
    .option('source-path', {
      type: 'string',
      describe:
        'Path to app source relative to app-root (default: auto-detected)',
    })
    .option('ios-version', {
      type: 'string',
      default: '15',
      describe: 'Minimum iOS version',
    })
    .option('output', {
      type: 'string',
      describe: 'Output path for Package.swift (default: app-root/Package.swift)',
    })
    .option('init', {
      type: 'boolean',
      default: false,
      describe: 'Generate initial main Package.swift (for first-time setup)',
    })
    .usage(
      'Usage: $0 [options]\n\nGenerates the xcframeworks sub-package (and optionally initial Package.swift) for a React Native app using SPM.',
    )
    .help()
    .parseSync();

  return {
    appRoot: parsed['app-root'],
    reactNativeRoot: parsed['react-native-root'] ?? null,
    version: parsed.version ?? null,
    localXcframework: parsed['local-xcframework'] ?? null,
    artifactsDir: parsed['artifacts-dir'] ?? null,
    appName: parsed['app-name'] ?? null,
    targetName: parsed['target-name'] ?? null,
    sourcePath: parsed['source-path'] ?? null,
    iosVersion: parsed['ios-version'],
    output: parsed.output ?? null,
    init: parsed.init,
  };
}

/**
 * Find the app's main Swift/ObjC source directory.
 * Looks for directories that contain native iOS source files.
 */
function findSourcePath(appRoot /*: string */, packageName /*: string */) /*: string */ {
  // Derive from package name (e.g. "@react-native/tester" -> "Tester")
  const derived = toSwiftName(packageName.replace(/^@[^/]+\//, ''));

  // Also check "RN" + derived (e.g. "Tester" -> "RNTester") and "RN" + whole name
  const rnPrefixed = 'RN' + derived;
  const candidates = [derived, rnPrefixed, 'ios', 'App', 'Sources', 'src'];
  for (const c of candidates) {
    if (fs.existsSync(path.join(appRoot, c))) {
      return c;
    }
  }

  // Scan for a directory that looks like an iOS source root
  // (contains .m, .mm, .swift, or .h files)
  try {
    // $FlowFixMe[incompatible-type] Dirent.name is string|Buffer in Flow but always string here
    const entries /*: Array<{name: string, isDirectory(): boolean}> */ = fs.readdirSync(appRoot, {withFileTypes: true});
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const dirPath = path.join(appRoot, entry.name);
      const subEntries = fs.readdirSync(dirPath);
      const hasNativeSources = subEntries.some((f /*: string | Buffer */) =>
        /\.(m|mm|swift|cpp|h|hpp)$/.test(String(f)),
      );
      if (hasNativeSources) {
        return entry.name;
      }
    }
  } catch (_) {
    // ignore
  }

  return derived;
}

// ---------------------------------------------------------------------------
// Source file scanner
// ---------------------------------------------------------------------------

/**
 * Scans a source directory for Swift vs ObjC/C++ files.
 * Returns { swiftFiles: string[], hasObjC: boolean } where swiftFiles are
 * paths relative to sourceDir.
 *
 * SPM cannot compile a single target that contains both Swift and ObjC/ObjC++
 * files. When both are present the generator splits them into two targets:
 *   - <targetName>     - ObjC/C++ files, publicHeadersPath: "."
 *   - <targetName>Swift - Swift files only, depends on <targetName>
 */
function scanSourceFiles(sourceDir /*: string */) /*: ScanResult */ {
  const swiftFiles /*: Array<string> */ = [];
  let hasObjC = false;

  function walk(dir /*: string */, relBase /*: string */) /*: void */ {
    if (!fs.existsSync(dir)) return;
    // $FlowFixMe[incompatible-type] Dirent.name is string|Buffer in Flow but always string here
    // $FlowFixMe[unclear-type] cast through any to coerce Dirent to simpler type
    const dirEntries /*: Array<{name: string, isDirectory(): boolean}> */ = (fs.readdirSync(dir, {withFileTypes: true}) /*: any */);
    for (const entry of dirEntries) {
      if (entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      const rel = relBase ? `${relBase}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(full, rel);
      } else if (entry.name.endsWith('.swift')) {
        swiftFiles.push(rel);
      } else if (/\.(m|mm|c|cpp)$/.test(entry.name)) {
        hasObjC = true;
      }
    }
  }

  walk(sourceDir, '');
  return {swiftFiles, hasObjC};
}

// ---------------------------------------------------------------------------
// XCFrameworks sub-package generator
// ---------------------------------------------------------------------------

/**
 * Generates the Package.swift for the xcframeworks sub-package.
 *
 * When using local xcframeworks (from the cache), we put the binary targets in a
 * dedicated Package.swift at build/xcframeworks/. This keeps them relative to
 * their own package root and lets both the main Package.swift AND the codegen
 * Package.swift reference them as a named package dependency.
 */
function generateXCFrameworksPackageSwift(
  names /*: Array<string> */,
) /*: string */ {
  // Rename the "React" product to "ReactNative" so consumers use
  // .product(name: "ReactNative", package: "ReactNative") -- a clearer API.
  // The binary target stays "React" (must match React.xcframework filename).
  const productName = (n /*: string */) => (n === 'React' ? 'ReactNative' : n);

  const products = names
    .map(n => {
      const pName = productName(n);
      return `        .library(name: "${pName}", targets: ["${n}"]),`;
    })
    .join('\n');

  const binaryTargets = names
    .map(n => `        .binaryTarget(name: "${n}", path: "${n}.xcframework"),`)
    .join('\n');

  return `// AUTO-GENERATED by scripts/generate-spm-package.js – do not edit manually.
// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "ReactNative",
    products: [
${products}
    ],
    targets: [
${binaryTargets}
    ]
)
`;
}

// ---------------------------------------------------------------------------
// Initial Package.swift generator (--init mode)
// ---------------------------------------------------------------------------

/**
 * Generates an initial main Package.swift for the developer to commit.
 * This is a one-time generation; subsequent runs of setup-ios-spm.js
 * will NOT overwrite this file.
 */
function generateInitialPackageSwift(opts /*: {
  appName: string,
  targetName: string,
  sourcePath: string,
  iosVersion: string,
  swiftFiles: Array<string>,
  hasObjC: boolean,
  appRoot: string,
} */) /*: string */ {
  const {
    appName,
    targetName,
    sourcePath,
    iosVersion,
    swiftFiles,
    hasObjC,
    appRoot,
  } = opts;

  const isMixed = hasObjC && swiftFiles.length > 0;

  // Resources and app entry point are handled by the .xcodeproj, not by SPM.
  // Exclude them so SPM doesn't try to process them.
  // main.m must be excluded because SPM treats it as an executable entry point,
  // which is incompatible with .library products.
  const resourceExcludes = [];
  const sourceDir = path.join(appRoot, sourcePath);
  if (fs.existsSync(path.join(sourceDir, 'main.m'))) {
    resourceExcludes.push('main.m');
  }
  if (fs.existsSync(path.join(sourceDir, 'main.swift'))) {
    resourceExcludes.push('main.swift');
  }
  if (fs.existsSync(path.join(sourceDir, 'Info.plist'))) {
    resourceExcludes.push('Info.plist');
  }
  if (fs.existsSync(path.join(sourceDir, 'Images.xcassets'))) {
    resourceExcludes.push('Images.xcassets');
  }
  if (fs.existsSync(path.join(sourceDir, 'LaunchScreen.storyboard'))) {
    resourceExcludes.push('LaunchScreen.storyboard');
  }

  let targetsSection;
  if (isMixed) {
    const excludeFiles = [...swiftFiles, ...resourceExcludes];
    const swiftExclude = `\n            exclude: [${excludeFiles.map(f => `"${f}"`).join(', ')}],`;
    const swiftSources = swiftFiles.map(f => `"${f}"`).join(', ');

    targetsSection = `        .target(
            name: "${targetName}",
            dependencies: [
                .product(name: "ReactNative", package: "ReactNative"),
                .product(name: "ReactNativeDependencies", package: "ReactNative"),
                .product(name: "hermes-engine", package: "ReactNative"),
                .product(name: "Autolinked", package: "Autolinked"),
                .product(name: "ReactCodegen", package: "React-GeneratedCode"),
                .product(name: "ReactAppDependencyProvider", package: "React-GeneratedCode"),
            ],
            path: "${sourcePath}",${swiftExclude}
            publicHeadersPath: ".",
            cSettings: [.unsafeFlags(cFlags)],
            cxxSettings: [.unsafeFlags(cxxFlags)]
        ),
        // Swift sources in a separate target (SPM does not allow mixed-language targets)
        .target(
            name: "${targetName}Swift",
            dependencies: ["${targetName}"],
            path: "${sourcePath}",
            sources: [${swiftSources}],
            swiftSettings: [.unsafeFlags(swiftFlags)]
        ),`;
  } else {
    const excludeEntries = resourceExcludes.length > 0
      ? `\n            exclude: [${resourceExcludes.map(f => `"${f}"`).join(', ')}],`
      : '';

    targetsSection = `        .target(
            name: "${targetName}",
            dependencies: [
                .product(name: "ReactNative", package: "ReactNative"),
                .product(name: "ReactNativeDependencies", package: "ReactNative"),
                .product(name: "hermes-engine", package: "ReactNative"),
                .product(name: "Autolinked", package: "Autolinked"),
                .product(name: "ReactCodegen", package: "React-GeneratedCode"),
                .product(name: "ReactAppDependencyProvider", package: "React-GeneratedCode"),
            ],
            path: "${sourcePath}",${excludeEntries}
            cSettings: [.unsafeFlags(cFlags)],
            cxxSettings: [.unsafeFlags(cxxFlags)],
            swiftSettings: [.unsafeFlags(swiftFlags)]
        ),`;
  }

  // Build products list: expose all targets as libraries so the .xcodeproj can link them
  const targetNames = isMixed
    ? [targetName, `${targetName}Swift`]
    : [targetName];
  const productsSection = targetNames
    .map(t => `        .library(name: "${t}", targets: ["${t}"]),`)
    .join('\n');

  return `// swift-tools-version: 6.0
import PackageDescription
import Foundation

let packageDir = URL(fileURLWithPath: #filePath).deletingLastPathComponent().path

// Ensure stub sub-packages exist so SPM can resolve on fresh clones.
// Overwritten by the auto-sync build phase on first build.
do {
    let fm = FileManager.default
    let stubs: [(String, String)] = [
        ("build/xcframeworks", """
        // swift-tools-version: 5.9
        import PackageDescription
        let package = Package(name: "ReactNative", products: [
            .library(name: "ReactNative", targets: ["ReactNativeStub"]),
            .library(name: "ReactNativeDependencies", targets: ["ReactNativeStub"]),
            .library(name: "hermes-engine", targets: ["ReactNativeStub"]),
        ], targets: [.target(name: "ReactNativeStub", path: "_stub", sources: ["Stub.swift"])])
        """),
        ("autolinked", """
        // swift-tools-version: 5.9
        import PackageDescription
        let package = Package(name: "Autolinked", products: [
            .library(name: "Autolinked", targets: ["AutolinkedStub"]),
        ], targets: [.target(name: "AutolinkedStub", path: "_stub", sources: ["Stub.swift"])])
        """),
        ("build/generated/ios", """
        // swift-tools-version: 5.9
        import PackageDescription
        let package = Package(name: "React-GeneratedCode", products: [
            .library(name: "ReactCodegen", targets: ["ReactGeneratedCodeStub"]),
            .library(name: "ReactAppDependencyProvider", targets: ["ReactGeneratedCodeStub"]),
        ], targets: [.target(name: "ReactGeneratedCodeStub", path: "_stub", sources: ["Stub.swift"])])
        """),
    ]
    for (dir, content) in stubs {
        let pkgSwift = packageDir + "/" + dir + "/Package.swift"
        if !fm.fileExists(atPath: pkgSwift) {
            try? fm.createDirectory(atPath: packageDir + "/" + dir + "/_stub", withIntermediateDirectories: true)
            try? content.write(toFile: pkgSwift, atomically: true, encoding: .utf8)
            try? "// Placeholder".write(toFile: packageDir + "/" + dir + "/_stub/Stub.swift", atomically: true, encoding: .utf8)
        }
    }
}

let xcfwHeaders = URL(fileURLWithPath: packageDir + "/build/xcframeworks/React.xcframework")
    .resolvingSymlinksInPath().path + "/Headers"
let depsHeaders = URL(fileURLWithPath: packageDir + "/build/xcframeworks/ReactNativeDependencies.xcframework")
    .resolvingSymlinksInPath().path + "/Headers"
let vfsOverlay = packageDir + "/build/xcframeworks/React-VFS.yaml"

let cFlags: [String] = ["-ivfsoverlay", vfsOverlay, "-I", xcfwHeaders,
    "-I", packageDir + "/autolinked/sources"]
let cxxFlags: [String] = cFlags + ["-I", depsHeaders]
let swiftFlags: [String] = ["-Xcc", "-ivfsoverlay", "-Xcc", vfsOverlay, "-Xcc", "-I", "-Xcc", xcfwHeaders]

let package = Package(
    name: "${appName}",
    platforms: [.iOS(.v${iosVersion})],
    products: [
${productsSection}
    ],
    dependencies: [
        .package(name: "Autolinked", path: "autolinked"),
        .package(name: "React-GeneratedCode", path: "build/generated/ios"),
        .package(name: "ReactNative", path: "build/xcframeworks"),
    ],
    targets: [
${targetsSection}
    ],
    cxxLanguageStandard: .cxx20
)
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(argv /*:: ?: Array<string> */) /*: void */ {
  const args = parseArgs(argv ?? process.argv.slice(2));
  // Ensure appRoot is always absolute so path.join/path.resolve produce absolute paths
  // even when called with --app-root . or other relative paths.
  const appRoot = path.resolve(args.appRoot);

  // Read app package.json
  // package.json may be in a parent directory (e.g. when appRoot is ios/).
  const projectRoot = findProjectRoot(appRoot);
  const pkgJson = readPackageJson(projectRoot);
  if (!pkgJson) {
    console.error(`[generate-spm-package] No package.json found in ${appRoot} or parent directories`);
    process.exitCode = 1;
    return;
  }

  // Resolve react-native root
  let rnRoot = args.reactNativeRoot;
  if (rnRoot == null) {
    // Try appRoot first, then projectRoot (covers ios/ subdirectory case)
    rnRoot = path.join(appRoot, 'node_modules', 'react-native');
    if (!fs.existsSync(rnRoot)) {
      rnRoot = path.join(projectRoot, 'node_modules', 'react-native');
    }
    if (!fs.existsSync(rnRoot)) {
      console.error(
        '[generate-spm-package] Could not find react-native. Pass --react-native-root.',
      );
      process.exitCode = 1;
      return;
    }
  }
  // Always resolve to absolute so path.join produces absolute paths
  rnRoot = path.resolve(rnRoot);

  // Resolve version
  let version = args.version;
  if (version == null) {
    const rnPkg = readPackageJson(rnRoot);
    version = rnPkg?.version ?? '0.0.0';
  }

  // Derive app/target names
  const rawName = pkgJson.name ?? path.basename(appRoot);
  const sourcePath = args.sourcePath ?? findSourcePath(appRoot, rawName);
  const genericSourceDirs = new Set(['ios', 'app', 'sources', 'src']);
  const cleanName = rawName.replace(/^@[^/]+\//, '');
  const defaultAppName = toSwiftName(
    sourcePath !== toSwiftName(cleanName) && !genericSourceDirs.has(sourcePath.toLowerCase())
      ? sourcePath
      : cleanName,
  );
  const appName = args.appName ?? defaultAppName;
  const targetName = args.targetName ?? appName + 'App';

  log(`App name:    ${appName}`);
  log(`Target name: ${targetName}`);
  log(`Source path: ${sourcePath}`);
  log(`Version:     ${version}`);

  // -------------------------------------------------------------------------
  // XCFrameworks sub-package: build/xcframeworks/Package.swift + symlinks
  // -------------------------------------------------------------------------

  const artifactsDir = args.artifactsDir;
  if (artifactsDir != null) {
    const artifactsJsonPath = path.join(artifactsDir, 'artifacts.json');
    if (!fs.existsSync(artifactsJsonPath)) {
      console.error(
        `[generate-spm-package] --artifacts-dir specified but artifacts.json not found at: ${artifactsJsonPath}`,
      );
      console.error(
        `  Run: node scripts/download-spm-artifacts.js --output "${artifactsDir}"`,
      );
      process.exitCode = 1;
      return;
    }

    // $FlowFixMe[incompatible-type] JSON.parse returns any
    const raw /*: {[string]: {xcframeworkPath: string, url: string}} */ = JSON.parse(fs.readFileSync(artifactsJsonPath, 'utf8'));
    const xcfwLinksDir = path.join(appRoot, 'build', 'xcframeworks');
    fs.mkdirSync(xcfwLinksDir, {recursive: true});

    // Create symlinks in build/xcframeworks/ -> actual xcframework paths in cache.
    const names /*: Array<string> */ = [];
    // $FlowFixMe[incompatible-use] Object.entries values typed as mixed
    for (const [name, entry] of Object.entries(raw)) {
      const linkName = `${name}.xcframework`;
      const linkPath = path.join(xcfwLinksDir, linkName);
      try {
        fs.lstatSync(linkPath);
        fs.unlinkSync(linkPath);
      } catch {
        // doesn't exist yet
      }
      fs.symlinkSync(entry.xcframeworkPath, linkPath);
      log(`Symlink: build/xcframeworks/${linkName} -> ${displayPath(entry.xcframeworkPath)}`);
      names.push(name);
    }

    // Generate build/xcframeworks/Package.swift
    const xcfwPkgContent = generateXCFrameworksPackageSwift(names);
    const xcfwPkgPath = path.join(xcfwLinksDir, 'Package.swift');
    fs.writeFileSync(xcfwPkgPath, xcfwPkgContent, 'utf8');
    log(`Generated: ${path.relative(appRoot, xcfwPkgPath)}`);

    log(`Artifacts dir: ${displayPath(artifactsDir)} (local xcframework mode)`);
  } else {
    // Auto-detect: if build/xcframeworks/Package.swift already exists (e.g. from a
    // previous run with --artifacts-dir), reuse it without re-downloading anything.
    const xcfwLinksDir = path.join(appRoot, 'build', 'xcframeworks');
    if (fs.existsSync(path.join(xcfwLinksDir, 'Package.swift'))) {
      log(`Auto-detected local xcframeworks: build/xcframeworks`);
    }
  }

  // -------------------------------------------------------------------------
  // --init: Generate initial main Package.swift for the developer to commit
  // -------------------------------------------------------------------------

  if (args.init) {
    const outputPath = args.output ?? path.join(appRoot, 'Package.swift');

    // Scan source directory for mixed Swift/ObjC
    const {swiftFiles, hasObjC} = scanSourceFiles(path.join(appRoot, sourcePath));
    if (swiftFiles.length > 0 && hasObjC) {
      log(`Mixed language sources detected – will generate split ObjC/Swift targets`);
      log(`  Swift: [${swiftFiles.join(', ')}]`);
    }

    const content = generateInitialPackageSwift({
      appName,
      targetName,
      sourcePath,
      iosVersion: args.iosVersion,
      swiftFiles,
      hasObjC,
      appRoot,
    });

    fs.mkdirSync(path.dirname(outputPath), {recursive: true});
    fs.writeFileSync(outputPath, content, 'utf8');
    log(`Generated initial Package.swift: ${path.relative(appRoot, outputPath)}`);
    log(`This file is yours to commit and customize.`);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  main,
  generateXCFrameworksPackageSwift,
  generateInitialPackageSwift,
  toSwiftName,
  findSourcePath,
  scanSourceFiles,
};
