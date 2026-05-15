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

/*:: import type {CliConfigJson, SetupArgs} from './spm/spm-types'; */

/**
 * setup-apple-spm.js – Entry point for setting up Swift Package Manager support
 * in a React Native app using prebuilt XCFrameworks from Maven.
 *
 * Usage (from your app directory, e.g. packages/rn-tester):
 *   node node_modules/react-native/scripts/setup-apple-spm.js [action] [options]
 *
 * Actions:
 *   init                       First-time setup: generate root Package.swift,
 *                              generated packages, artifacts, and .xcodeproj.
 *   update                     Regenerate generated packages/artifacts/project
 *                              without overwriting root Package.swift.
 *   sync                       Lightweight sync invoked by the Xcode auto-sync
 *                              build phase: regenerates autolinking and
 *                              xcframeworks sub-packages and writes the
 *                              .spm-sync-stamp file. Skips .xcodeproj regen.
 *   clean                      Remove generated SPM state only.
 *   codegen                    Run only codegen and install the SPM template.
 *   download                   Download/check xcframework artifacts only.
 *
 * With no action: defaults to update.
 *
 * Options:
 *   --version <ver>             React Native version (e.g. 0.80.0). Defaults to
 *                               the version in node_modules/react-native/package.json
 *   --local-xcframework <path>  Use a local xcframework instead of downloading
 *   --artifacts-dir <path>      Override the artifact cache directory. Defaults to
 *                               ~/Library/Caches/com.facebook.ReactNative/spm-artifacts/{version}/{flavor}/
 *                               If checksums.json is missing, download-spm-artifacts.js runs automatically.
 *   --flavor <debug|release>    Artifact flavor (default: debug)
 *   --skip-codegen              Skip react-native codegen step
 *   --skip-download             Skip automatic artifact download even if checksums.json is missing
 *   --force-download            Clear cached artifacts and re-download from Maven
 *
 * Steps performed:
 *   1. react-native codegen → build/generated/ios/ + install SPM codegen template
 *   2. generate-spm-autolinking-config.js → build/generated/autolinking/autolinking.json
 *   3. generate-spm-autolinking.js → build/generated/autolinking/Package.swift
 *   4. download-spm-artifacts.js → <artifacts-dir>/ (skipped if already present)
 *   5. generate-spm-package.js → build/xcframeworks/Package.swift + symlinks (+ main Package.swift with init)
 *   6. generate-spm-xcodeproj.js → <AppName>-SPM.xcodeproj (skipped with --skip-xcodeproj)
 *
 * The main Package.swift is committed by the developer and NOT overwritten on
 * subsequent runs. Use init for first-time setup to generate an initial one.
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

const VALID_ACTIONS = new Set([
  'init',
  'update',
  'sync',
  'clean',
  'codegen',
  'download',
]);

/*::
type AutolinkingConfigResult = {
  config: CliConfigJson,
  outputPath: string,
  rawJson: string,
};
*/

function parseArgs(argv /*: Array<string> */) /*: SetupArgs */ {
  const parsed = yargs(argv)
    .version(false)
    .command('$0 [action]', 'Set up Apple SPM support')
    .positional('action', {
      type: 'string',
      choices: Array.from(VALID_ACTIONS),
      describe:
        'Action to run: init, update, sync, clean, codegen, or download. Defaults to update.',
    })
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
      'Usage: $0 [action] [options]\n\nSets up Swift Package Manager support in a React Native app.',
    )
    .strictOptions()
    .help()
    .parseSync();

  const positional = parsed._.map(String);
  const requestedAction = parsed.action ?? positional[0] ?? null;
  if (positional.length > 1) {
    throw new Error(
      `Expected at most one action, got: ${positional.join(', ')}`,
    );
  }
  if (requestedAction != null && !VALID_ACTIONS.has(requestedAction)) {
    throw new Error(
      `Unknown action "${requestedAction}". Expected one of: ${Array.from(
        VALID_ACTIONS,
      ).join(', ')}`,
    );
  }

  return {
    action: requestedAction,
    version: parsed.version ?? null,
    localXcframework: parsed['local-xcframework'] ?? null,
    artifactsDir: parsed['artifacts-dir'] ?? null,
    flavor: parsed.flavor,
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
 * directories. Called during init so that generated artifacts are not
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

function cleanGeneratedState(appRoot /*: string */) {
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
}

function resolveAction(
  requestedAction /*: SetupArgs['action'] */,
  appRoot /*: string */,
) /*: 'init' | 'update' | 'sync' | 'clean' | 'codegen' | 'download' */ {
  if (requestedAction != null) {
    return requestedAction;
  }
  return 'update';
}

function loadAutolinkingConfig(
  projectRoot /*: string */,
  appRoot /*: string */,
) /*: ?AutolinkingConfigResult */ {
  log('Generating autolinking.json (CLI config)...');
  try {
    const result = generateAutolinkingConfig({projectRoot});
    log(`Wrote ${path.relative(appRoot, result.outputPath)}`);
    return result;
  } catch (e) {
    logError(
      `generate-spm-autolinking-config failed: ${e.message}. External native modules may not be discovered.`,
    );
    return null;
  }
}

function resolveReactNativeRoot(
  autolinkingConfigResult /*: ?AutolinkingConfigResult */,
  projectRoot /*: string */,
) /*: string */ {
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
  return reactNativeRoot;
}

function determineVersion(
  args /*: SetupArgs */,
  reactNativeRoot /*: string */,
) /*: string */ {
  let version = args.version;
  if (version == null) {
    // $FlowFixMe[incompatible-type] JSON.parse returns any
    const pkgJson /*: {version: string} */ = JSON.parse(
      fs.readFileSync(path.join(reactNativeRoot, 'package.json'), 'utf8'),
    );
    version = pkgJson.version;
  }
  return version;
}

function runCodegenStep(
  projectRoot /*: string */,
  appRoot /*: string */,
  scriptsDir /*: string */,
  skipCodegen /*: boolean */,
) /*: void */ {
  let codegenSucceeded = false;
  if (!skipCodegen) {
    log('Running react-native codegen...');
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
    log('Skipping codegen (--skip-codegen)');
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
}

function generateAutolinkingPackage(
  appRoot /*: string */,
  reactNativeRoot /*: string */,
) {
  log('Generating build/generated/autolinking/Package.swift...');
  generateAutolinking([
    '--app-root',
    appRoot,
    '--react-native-root',
    reactNativeRoot,
  ]);
}

function prepareLocalXcframeworkArtifacts(
  args /*: SetupArgs */,
  appRoot /*: string */,
  version /*: string */,
) /*: string | null */ {
  if (args.localXcframework == null || args.artifactsDir != null) {
    return args.artifactsDir;
  }

  const localReactPath = path.resolve(args.localXcframework);
  if (
    !localReactPath.endsWith('.xcframework') ||
    !fs.existsSync(localReactPath)
  ) {
    throw new Error(
      `--local-xcframework path does not exist or is not an .xcframework: ${localReactPath}`,
    );
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
  log(`Using local xcframework: ${displayPath(localReactPath)}`);
  return xcfwLinksDir;
}

async function ensureArtifacts(
  args /*: SetupArgs */,
  version /*: string */,
  artifactsDir /*: string | null */,
) /*: Promise<string | null> */ {
  const resolvedArtifactsDir =
    artifactsDir != null
      ? path.resolve(artifactsDir)
      : defaultCacheDir(args.version ?? version, args.flavor);

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
    log('Downloading xcframework artifacts...');
    await downloadArtifacts([
      '--version',
      args.version ?? version,
      '--flavor',
      args.flavor,
      '--output',
      resolvedArtifactsDir,
    ]);
  } else if (resolvedArtifactsDir != null && args.skipDownload) {
    log('Skipping artifact download (--skip-download)');
  } else if (resolvedArtifactsDir != null) {
    log(`Artifacts already present in ${displayPath(resolvedArtifactsDir)}`);
  } else {
    log('No --artifacts-dir set, skipping download step');
  }

  return resolvedArtifactsDir;
}

function generateXcframeworksPackage(
  args /*: SetupArgs */,
  appRoot /*: string */,
  reactNativeRoot /*: string */,
  version /*: string */,
  resolvedArtifactsDir /*: string | null */,
  shouldInit /*: boolean */,
) {
  log('Generating xcframeworks sub-package...');
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
  if (shouldInit) {
    packageArgs.push('--init');
  }
  generatePackage(packageArgs);
}

function warnForMissingPackageSwift(appRoot /*: string */) {
  const mainPackageSwift = path.join(appRoot, 'Package.swift');
  if (fs.existsSync(mainPackageSwift)) {
    return;
  }

  log('');
  log(
    '\x1b[33mWARNING: Package.swift not found.\x1b[0m Run init to generate an initial one:',
  );
  log('  react-native spm init');
  log('');
}

function warnForMissingVfsOverlayFlags(appRoot /*: string */) {
  const mainPackageSwift = path.join(appRoot, 'Package.swift');
  if (!fs.existsSync(mainPackageSwift)) {
    return;
  }

  const pkgContent = fs.readFileSync(mainPackageSwift, 'utf8');
  if (!pkgContent.includes('ivfsoverlay')) {
    log('');
    log(
      '\x1b[33mWARNING: Your Package.swift does not include -ivfsoverlay flags.\x1b[0m',
    );
    log('Add the following to your Package.swift for stable header identity:');
    log('');
    log('  let vfsOverlay = packageDir + "/build/xcframeworks/React-VFS.yaml"');
    log('');
    log('  // Add to cFlags:');
    log('  "-ivfsoverlay", vfsOverlay');
    log('  // Add to swiftFlags:');
    log('  "-Xcc", "-ivfsoverlay", "-Xcc", vfsOverlay');
    log('');
  }
}

function generateXcodeProject(
  args /*: SetupArgs */,
  appRoot /*: string */,
  reactNativeRoot /*: string */,
) {
  if (args.skipXcodeproj) {
    log('Skipping .xcodeproj generation (--skip-xcodeproj)');
    return;
  }

  log('Generating .xcodeproj...');
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
  generateXcodeproj(xcodeprojArgs);
}

function logNextSteps(
  projectRoot /*: string */,
  appRoot /*: string */,
  productName /*: string | null */,
) {
  const appPkgJson = readPackageJson(projectRoot);
  const rawName =
    (appPkgJson != null ? appPkgJson.name : null) ?? path.basename(projectRoot);
  const sourcePath = findSourcePath(appRoot, rawName);
  const appDisplayName = productName ?? deriveAppName(rawName, sourcePath);

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

async function main(argv /*:: ?: Array<string> */) /*: Promise<void> */ {
  const appRoot = process.cwd();
  const projectRoot = findProjectRoot(appRoot);
  const args = parseArgs(argv ?? process.argv.slice(2));
  const action = resolveAction(args.action, appRoot);

  log(`Running SPM ${action} in: ${displayPath(appRoot)}`);
  if (projectRoot !== appRoot) {
    log(`Project root (package.json): ${displayPath(projectRoot)}`);
  }

  if (action === 'clean') {
    cleanGeneratedState(appRoot);
    log('SPM generated state cleaned.');
    return;
  }

  const needsCliConfig =
    action === 'init' || action === 'update' || action === 'sync';
  const autolinkingConfigResult = needsCliConfig
    ? loadAutolinkingConfig(projectRoot, appRoot)
    : null;
  const reactNativeRoot = resolveReactNativeRoot(
    autolinkingConfigResult,
    projectRoot,
  );
  const scriptsDir = path.join(reactNativeRoot, 'scripts');
  const version = determineVersion(args, reactNativeRoot);
  log(`React Native version: ${version}`);
  if (args.localXcframework == null) {
    log(
      `Artifact cache:       ${displayPath(defaultCacheDir(args.version ?? version, args.flavor))}`,
    );
  }

  if (action === 'codegen') {
    runCodegenStep(projectRoot, appRoot, scriptsDir, false);
    return;
  }

  if (action === 'sync') {
    const {main: runSync} = require('./spm/sync-spm-autolinking');
    try {
      await runSync([
        '--app-root',
        appRoot,
        '--react-native-root',
        reactNativeRoot,
      ]);
    } catch (e) {
      logError(`SPM sync failed: ${e.message}`);
      process.exitCode = 1;
    }
    return;
  }

  let resolvedArtifactsDir = null;
  if (action === 'download') {
    try {
      const artifactsDir = prepareLocalXcframeworkArtifacts(
        args,
        appRoot,
        version,
      );
      await ensureArtifacts(args, version, artifactsDir);
    } catch (e) {
      logError(`Artifact setup failed: ${e.message}`);
      process.exitCode = 1;
    }
    return;
  }

  runCodegenStep(projectRoot, appRoot, scriptsDir, args.skipCodegen);
  try {
    generateAutolinkingPackage(appRoot, reactNativeRoot);
  } catch (e) {
    logError(`generate-spm-autolinking.js failed: ${e.message}`);
    process.exitCode = 1;
    return;
  }

  try {
    const artifactsDir = prepareLocalXcframeworkArtifacts(
      args,
      appRoot,
      version,
    );
    resolvedArtifactsDir = await ensureArtifacts(args, version, artifactsDir);
  } catch (e) {
    logError(`Artifact setup failed: ${e.message}`);
    process.exitCode = 1;
    return;
  }

  try {
    generateXcframeworksPackage(
      args,
      appRoot,
      reactNativeRoot,
      version,
      resolvedArtifactsDir,
      action === 'init',
    );
  } catch (e) {
    logError(`generate-spm-package.js failed: ${e.message}`);
    process.exitCode = 1;
    return;
  }

  resolveAndWriteVFSOverlay(appRoot, reactNativeRoot, {log});

  if (action === 'init') {
    ensureGitignoreSpmEntries(appRoot);
  } else {
    warnForMissingPackageSwift(appRoot);
  }
  warnForMissingVfsOverlayFlags(appRoot);

  try {
    generateXcodeProject(args, appRoot, reactNativeRoot);
  } catch (e) {
    logError(`generate-spm-xcodeproj.js failed: ${e.message}`);
    process.exitCode = 1;
    return;
  }

  logNextSteps(projectRoot, appRoot, args.productName);
}

if (require.main === module) {
  void main();
}

module.exports = {main};
