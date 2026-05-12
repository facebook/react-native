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

/*:: import type {SetupArgs} from './spm/spm-types'; */

/**
 * setup-apple-spm.js – Entry point for setting up Swift Package Manager support
 * in a React Native app using prebuilt XCFrameworks from Maven.
 *
 * Usage (from your app directory, e.g. packages/rn-tester):
 *   node node_modules/react-native/scripts/setup-apple-spm.js [options]
 *
 * Options:
 *   --version <ver>             React Native version (e.g. 0.80.0). Defaults to
 *                               the version in node_modules/react-native/package.json
 *   --local-xcframework <path>  Use a local xcframework instead of downloading
 *   --artifacts-dir <path>      Override the artifact cache directory. Defaults to
 *                               ~/Library/Caches/com.facebook.ReactNative/spm-artifacts/{version}/{flavor}/
 *                               If checksums.json is missing, download-spm-artifacts.js runs automatically.
 *   --flavor <debug|release>    Artifact flavor (default: debug)
 *   --init                      First-time setup: also generates an initial main Package.swift.
 *   --clean                     Remove all generated SPM directories (build/, .build/, legacy autolinked/)
 *                               and re-run the full setup. Open Xcode after this completes.
 *   --skip-codegen              Skip react-native codegen step
 *   --skip-download             Skip automatic artifact download even if checksums.json is missing
 *   --force-download            Clear cached artifacts and re-download from Maven
 *
 * Steps performed:
 *   1. react-native codegen → build/generated/ios/ + install SPM codegen template
 *   2. generate-spm-autolinking-config.js → build/generated/autolinking/autolinking.json
 *   3. generate-spm-autolinking.js → build/generated/autolinking/Package.swift
 *   4. download-spm-artifacts.js → <artifacts-dir>/ (skipped if already present)
 *   5. generate-spm-package.js → build/xcframeworks/Package.swift + symlinks (+ main Package.swift with --init)
 *   6. generate-spm-xcodeproj.js → <AppName>-SPM.xcodeproj (skipped with --skip-xcodeproj)
 *
 * The main Package.swift is committed by the developer and NOT overwritten on
 * subsequent runs. Use --init for first-time setup to generate an initial one.
 *
 * After running: open <AppName>-SPM.xcodeproj in Xcode.
 */

const {main: downloadArtifacts} = require('./spm/download-spm-artifacts');
const {main: generateAutolinking} = require('./spm/generate-spm-autolinking');
const {
  generateAutolinkingConfig,
} = require('./spm/generate-spm-autolinking-config');
const {main: generatePackage} = require('./spm/generate-spm-package');
const {findSourcePath} = require('./spm/generate-spm-package');
const {main: generateXcodeproj} = require('./spm/generate-spm-xcodeproj');
const {
  defaultCacheDir,
  deriveAppName,
  displayPath,
  findProjectRoot,
  makeLogger,
  readPackageJson,
  resolveAndWriteVFSOverlay,
} = require('./spm/spm-utils');
const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

const {log, warn: logError} = makeLogger('setup-apple-spm');

function parseArgs(argv /*: Array<string> */) /*: SetupArgs */ {
  const parsed = yargs(argv)
    .version(false)
    .option('version', {
      type: 'string',
      describe:
        'React Native version (e.g. 0.80.0). Defaults to the version in node_modules/react-native/package.json',
    })
    .option('local-xcframework', {
      type: 'string',
      describe: 'Use a local xcframework instead of downloading',
    })
    .option('artifacts-dir', {
      type: 'string',
      describe: 'Override the artifact cache directory',
    })
    .option('flavor', {
      type: 'string',
      default: 'debug',
      describe: 'Artifact flavor (debug or release)',
    })
    .option('init', {
      type: 'boolean',
      default: false,
      describe:
        'First-time setup: also generates an initial main Package.swift',
    })
    .option('clean', {
      type: 'boolean',
      default: false,
      describe: 'Remove all generated SPM directories and re-run setup.',
    })
    .option('skip-codegen', {
      type: 'boolean',
      default: false,
      describe: 'Skip react-native codegen step',
    })
    .option('skip-download', {
      type: 'boolean',
      default: false,
      describe:
        'Skip automatic artifact download even if checksums.json is missing',
    })
    .option('force-download', {
      type: 'boolean',
      default: false,
      describe: 'Clear cached artifacts and re-download from Maven',
    })
    .option('skip-xcodeproj', {
      type: 'boolean',
      default: false,
      describe: 'Skip .xcodeproj generation step',
    })
    .option('bundle-identifier', {
      type: 'string',
      describe: 'Override CFBundleIdentifier in generated Info.plist',
    })
    .option('product-name', {
      type: 'string',
      describe: 'Override PRODUCT_NAME in generated Info.plist',
    })
    .option('entry-file', {
      type: 'string',
      describe:
        'JS entry file relative to app root (default: package.json "main" or index.js)',
    })
    .usage(
      'Usage: $0 [options]\n\nSets up Swift Package Manager support in a React Native app.',
    )
    .help()
    .parseSync();

  return {
    version: parsed.version ?? null,
    localXcframework: parsed['local-xcframework'] ?? null,
    artifactsDir: parsed['artifacts-dir'] ?? null,
    flavor: parsed.flavor,
    init: parsed.init,
    clean: parsed.clean,
    skipCodegen: parsed['skip-codegen'],
    skipDownload: parsed['skip-download'],
    forceDownload: parsed['force-download'],
    skipXcodeproj: parsed['skip-xcodeproj'],
    bundleIdentifier: parsed['bundle-identifier'] ?? null,
    productName: parsed['product-name'] ?? null,
    entryFile: parsed['entry-file'] ?? null,
  };
}

const SPM_GITIGNORE_ENTRIES = [
  'Package.resolved',
  'build/generated/',
  'build/xcframeworks/',
  '.build/',
];

/**
 * Ensure the project's .gitignore contains entries for SPM-generated
 * directories. Called during --init so that generated artifacts are not
 * accidentally committed.
 */
function ensureGitignoreSpmEntries(appRoot /*: string */) {
  const gitignorePath = path.join(appRoot, '.gitignore');
  let content = '';
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf8');
  }

  const existingEntries = new Set(content.split('\n').map(l => l.trim()));
  const missing = SPM_GITIGNORE_ENTRIES.filter(e => !existingEntries.has(e));

  if (missing.length === 0) {
    return;
  }

  const block = [
    '',
    '# SPM – auto-generated at build time (do not commit)',
    ...missing,
  ].join('\n');

  // Append, ensuring we start on a fresh line
  const separator = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
  fs.writeFileSync(gitignorePath, content + separator + block + '\n', 'utf8');
  log(`Updated .gitignore with SPM entries: ${missing.join(', ')}`);
}

async function main(argv /*:: ?: Array<string> */) /*: Promise<void> */ {
  const appRoot = process.cwd();
  const projectRoot = findProjectRoot(appRoot);
  const args = parseArgs(argv ?? process.argv.slice(2));

  log(`Setting up SPM support in: ${displayPath(appRoot)}`);
  if (projectRoot !== appRoot) {
    log(`Project root (package.json): ${displayPath(projectRoot)}`);
  }

  // --clean: remove all generated SPM directories, then re-run setup so
  // real packages are in place before Xcode opens. This avoids the problem
  // where stubs are resolved by SPM and never re-resolved mid-build.
  if (args.clean) {
    const dirsToClean = [
      path.join(appRoot, 'build', 'xcframeworks'),
      path.join(appRoot, 'build', 'generated'),
      // Legacy location (pre-build/generated/autolinking move) — remove
      // when present so old workspaces upgrade cleanly.
      path.join(appRoot, 'autolinked'),
      path.join(appRoot, '.build'),
    ];
    log('Cleaning SPM generated directories...');
    for (const dir of dirsToClean) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, {recursive: true, force: true});
        log(`  Removed ${path.relative(appRoot, dir)}/`);
      }
    }
    log('Re-running setup to regenerate real packages...');
    // Fall through to the normal setup flow below (skip --init so
    // Package.swift and .xcodeproj are not overwritten).
  }

  let autolinkingConfigResult = null;
  log('Step 1/6: Generating autolinking.json (CLI config)...');
  try {
    autolinkingConfigResult = generateAutolinkingConfig({projectRoot});
    log(`Wrote ${path.relative(appRoot, autolinkingConfigResult.outputPath)}`);
  } catch (e) {
    logError(
      `generate-spm-autolinking-config failed: ${e.message}. External native modules may not be discovered.`,
    );
  }

  // Prefer the React Native path resolved by the CLI config we already run for
  // autolinking. Fall back to this script's package root for direct repo usage.
  let reactNativeRoot = path.resolve(__dirname, '..');
  const cliConfig = autolinkingConfigResult?.config;
  const cliReactNativePath = cliConfig?.reactNativePath;
  const cliConfigRoot = cliConfig?.root;
  if (typeof cliReactNativePath === 'string' && cliReactNativePath.length > 0) {
    reactNativeRoot = path.resolve(
      typeof cliConfigRoot === 'string' && cliConfigRoot.length > 0
        ? cliConfigRoot
        : projectRoot,
      cliReactNativePath,
    );
  }

  const scriptsDir = path.join(reactNativeRoot, 'scripts');

  // Determine version
  let version = args.version;
  if (version == null) {
    // $FlowFixMe[incompatible-type] JSON.parse returns any
    const pkgJson /*: {version: string} */ = JSON.parse(
      fs.readFileSync(path.join(reactNativeRoot, 'package.json'), 'utf8'),
    );
    version = pkgJson.version;
  }
  log(`React Native version: ${version}`);
  if (args.localXcframework == null) {
    log(
      `Artifact cache:       ${displayPath(defaultCacheDir(args.version ?? version, args.flavor))}`,
    );
  }

  let codegenSucceeded = false;
  if (!args.skipCodegen) {
    log('Step 2/6: Running react-native codegen...');
    try {
      // -p points to the project root (where package.json lives) so codegen
      // can discover specs and dependencies. -o points to appRoot so the
      // output (build/generated/ios/) lands in the current working directory,
      // which may be a subdirectory like ios/.
      const codegenArgs = [
        `node "${path.join(scriptsDir, 'generate-codegen-artifacts.js')}"`,
        `-p "${projectRoot}"`,
        `-t ios`,
      ];
      if (projectRoot !== appRoot) {
        codegenArgs.push(`-o "${appRoot}"`);
      }
      execSync(codegenArgs.join(' '), {stdio: 'inherit', cwd: projectRoot});
      codegenSucceeded = true;
    } catch (e) {
      logError('Codegen failed. Continuing anyway...');
    }
  } else {
    log('Step 2/6: Skipping codegen (--skip-codegen)');
    // When skipping codegen, the output directory may already exist from a
    // previous run — treat that as success for template installation.
    codegenSucceeded = true;
  }

  // Install SPM-specific codegen template (replaces the CocoaPods-oriented one).
  // This self-contained template has all xcframework configuration built in,
  // eliminating the need for post-generation patching.
  // Only install when codegen succeeded to avoid overwriting a valid template
  // with one that references non-existent generated files.
  const codegenPkgSwift = path.join(
    appRoot,
    'build',
    'generated',
    'ios',
    'Package.swift',
  );
  const spmTemplate = path.join(
    scriptsDir,
    'codegen',
    'templates',
    'Package.swift.spm-template',
  );
  if (codegenSucceeded && fs.existsSync(path.dirname(codegenPkgSwift))) {
    fs.copyFileSync(spmTemplate, codegenPkgSwift);
    log('Installed SPM codegen template → build/generated/ios/Package.swift');
  }

  log('Step 3/6: Generating build/generated/autolinking/Package.swift...');
  try {
    generateAutolinking([
      '--app-root',
      appRoot,
      '--react-native-root',
      reactNativeRoot,
    ]);
  } catch (e) {
    logError(`generate-spm-autolinking.js failed: ${e.message}`);
    process.exitCode = 1;
    return;
  }

  // When --local-xcframework is given, create build/xcframeworks/ with symlinks
  // and a synthetic artifacts.json so the rest of the pipeline works normally.
  if (args.localXcframework != null && args.artifactsDir == null) {
    const localReactPath = path.resolve(args.localXcframework);
    if (
      !localReactPath.endsWith('.xcframework') ||
      !fs.existsSync(localReactPath)
    ) {
      logError(
        `--local-xcframework path does not exist or is not an .xcframework: ${localReactPath}`,
      );
      process.exitCode = 1;
      return;
    }
    const localXcfwDir = path.resolve(localReactPath, '..');
    const xcfwLinksDir = path.join(appRoot, 'build', 'xcframeworks');
    fs.mkdirSync(xcfwLinksDir, {recursive: true});

    // Build artifacts.json from the local xcframework + any siblings or cached deps
    const artifacts /*: {[string]: {xcframeworkPath: string, url: string}} */ =
      {};
    artifacts.React = {xcframeworkPath: localReactPath, url: ''};

    // Look for ReactNativeDependencies and hermes-engine alongside or in cache
    for (const name of ['ReactNativeDependencies', 'hermes-engine']) {
      const siblingPath = path.join(localXcfwDir, `${name}.xcframework`);
      const cachePath = path.join(
        defaultCacheDir(args.version ?? version, args.flavor),
        `${name}.xcframework`,
      );
      if (fs.existsSync(siblingPath)) {
        artifacts[name] = {xcframeworkPath: siblingPath, url: ''};
      } else if (fs.existsSync(cachePath)) {
        artifacts[name] = {xcframeworkPath: cachePath, url: ''};
      }
    }

    fs.writeFileSync(
      path.join(xcfwLinksDir, 'artifacts.json'),
      JSON.stringify(artifacts, null, 2),
      'utf8',
    );
    args.artifactsDir = xcfwLinksDir;
    log(`Using local xcframework: ${displayPath(localReactPath)}`);
  }

  // Compute the artifacts directory:
  //   - explicit --artifacts-dir → use as-is
  //   - default → versioned cache in ~/Library/Caches/...
  const resolvedArtifactsDir =
    args.artifactsDir != null
      ? path.resolve(args.artifactsDir)
      : defaultCacheDir(args.version ?? version, args.flavor);
  // --force-download: clear cached artifacts so they get re-downloaded
  if (args.forceDownload && resolvedArtifactsDir != null) {
    log('Clearing cached artifacts (--force-download)...');
    fs.rmSync(resolvedArtifactsDir, {recursive: true, force: true});
  }

  const artifactsJsonPath =
    resolvedArtifactsDir != null
      ? path.join(resolvedArtifactsDir, 'artifacts.json')
      : null;
  const needsDownload =
    resolvedArtifactsDir != null &&
    !args.skipDownload &&
    artifactsJsonPath != null &&
    !fs.existsSync(artifactsJsonPath);

  if (needsDownload === true && resolvedArtifactsDir != null) {
    log('Step 4/6: Downloading xcframework artifacts...');
    try {
      await downloadArtifacts([
        '--version',
        args.version ?? version,
        '--flavor',
        args.flavor,
        '--output',
        resolvedArtifactsDir,
      ]);
    } catch (e) {
      logError(`download-spm-artifacts.js failed: ${e.message}`);
      process.exitCode = 1;
      return;
    }
  } else if (resolvedArtifactsDir != null && args.skipDownload) {
    log('Step 4/6: Skipping artifact download (--skip-download)');
  } else if (resolvedArtifactsDir != null) {
    log(
      `Step 3/5: Artifacts already present in ${displayPath(resolvedArtifactsDir)}`,
    );
  } else {
    log('Step 4/6: No --artifacts-dir set, skipping download step');
  }

  log('Step 5/6: Generating xcframeworks sub-package...');
  const packageArgs = [
    '--app-root',
    appRoot,
    '--react-native-root',
    reactNativeRoot,
    '--version',
    version,
  ];
  if (args.localXcframework != null) {
    packageArgs.push('--local-xcframework', args.localXcframework);
  }
  if (resolvedArtifactsDir != null) {
    packageArgs.push('--artifacts-dir', resolvedArtifactsDir);
  }
  if (args.init) {
    packageArgs.push('--init');
  }
  try {
    generatePackage(packageArgs);
  } catch (e) {
    logError(`generate-spm-package.js failed: ${e.message}`);
    process.exitCode = 1;
    return;
  }

  resolveAndWriteVFSOverlay(appRoot, reactNativeRoot, {log});

  if (args.init) {
    ensureGitignoreSpmEntries(appRoot);
  }

  // Warn if the main Package.swift is missing and --init was not passed.
  const mainPackageSwift = path.join(appRoot, 'Package.swift');
  if (!fs.existsSync(mainPackageSwift) && !args.init) {
    log('');
    log(
      '\x1b[33mWARNING: Package.swift not found.\x1b[0m Run with --init to generate an initial one:',
    );
    log(
      `  node ${path.relative(appRoot, path.join(scriptsDir, 'setup-apple-spm.js'))} --init`,
    );
    log('');
  }

  // Warn if existing Package.swift doesn't have -ivfsoverlay
  if (fs.existsSync(mainPackageSwift)) {
    const pkgContent = fs.readFileSync(mainPackageSwift, 'utf8');
    if (!pkgContent.includes('ivfsoverlay')) {
      log('');
      log(
        '\x1b[33mWARNING: Your Package.swift does not include -ivfsoverlay flags.\x1b[0m',
      );
      log(
        'Add the following to your Package.swift for stable header identity:',
      );
      log('');
      log(
        '  let vfsOverlay = packageDir + "/build/xcframeworks/React-VFS.yaml"',
      );
      log('');
      log('  // Add to cFlags:');
      log('  "-ivfsoverlay", vfsOverlay');
      log('  // Add to swiftFlags:');
      log('  "-Xcc", "-ivfsoverlay", "-Xcc", vfsOverlay');
      log('');
    }
  }

  if (!args.skipXcodeproj) {
    log('Step 6/6: Generating .xcodeproj...');
    const xcodeprojArgs = [
      '--app-root',
      appRoot,
      '--react-native-root',
      reactNativeRoot,
    ];
    if (args.bundleIdentifier != null) {
      xcodeprojArgs.push('--bundle-identifier', args.bundleIdentifier);
    }
    if (args.productName != null) {
      xcodeprojArgs.push('--app-name', args.productName);
    }
    if (args.entryFile != null) {
      xcodeprojArgs.push('--entry-file', args.entryFile);
    }
    try {
      generateXcodeproj(xcodeprojArgs);
    } catch (e) {
      logError(`generate-spm-xcodeproj.js failed: ${e.message}`);
      process.exitCode = 1;
      return;
    }
  } else {
    log('Step 6/6: Skipping .xcodeproj generation (--skip-xcodeproj)');
  }

  const appPkgJson = readPackageJson(projectRoot);
  const rawName =
    (appPkgJson != null ? appPkgJson.name : null) ?? path.basename(projectRoot);
  const sourcePath = findSourcePath(appRoot, rawName);
  const appDisplayName = args.productName ?? deriveAppName(rawName, sourcePath);

  log('');
  log('SPM setup complete!');
  log('');
  log('Next steps:');
  log(`  • Open ${appDisplayName}-SPM.xcodeproj in Xcode`);
  log('  • Set your Development Team in Signing & Capabilities');
  log('  • Build and run on Simulator or device');
  log('');
  log('Note: CocoaPods (pod install) still works in parallel.');
}

if (require.main === module) {
  void main();
}

module.exports = {main};
