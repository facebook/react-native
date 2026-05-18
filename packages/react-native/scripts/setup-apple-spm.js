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

/*:: import type {CleanOpts, CleanTarget, CliConfigJson, SetupArgs} from './spm/spm-types'; */

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

const {
  main: downloadArtifacts,
  resolveCacheSlotVersion,
} = require('./spm/download-spm-artifacts');
const {main: generateAutolinking} = require('./spm/generate-spm-autolinking');
const {
  generateAutolinkingConfig,
} = require('./spm/generate-spm-autolinking-config');
const {main: generatePackage} = require('./spm/generate-spm-package');
const {findSourcePath} = require('./spm/generate-spm-package');
const {main: generateXcodeproj} = require('./spm/generate-spm-xcodeproj');
const {scaffoldAll} = require('./spm/scaffold-package-swift');
const {
  defaultCacheDir,
  deriveAppName,
  displayPath,
  findProjectRoot,
  makeLogger,
  readPackageJson,
  renderCodegenTemplate,
  resolveAndWriteVFSOverlay,
} = require('./spm/spm-utils');
const {execSync} = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');
const yargs = require('yargs');

const {log, warn: logError} = makeLogger('setup-apple-spm');

const VALID_ACTIONS = new Set([
  'init',
  'update',
  'sync',
  'clean',
  'codegen',
  'download',
  'scaffold',
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
    // Scoping flags for the `clean` action. No-op for other actions.
    .option('project', {
      type: 'boolean',
      default: false,
      describe: '[clean] Also remove Package.swift and <App>-SPM.xcodeproj/',
    })
    .option('derived-data', {
      type: 'boolean',
      default: false,
      describe:
        "[clean] Also remove this app's Xcode DerivedData (~/Library/Developer/Xcode/DerivedData/<App>-SPM-*)",
    })
    .option('cache', {
      type: 'boolean',
      default: false,
      describe:
        '[clean] Also remove the cached xcframework slot for the current resolved version',
    })
    .option('all', {
      type: 'boolean',
      default: false,
      describe: '[clean] Shorthand for --project --derived-data --cache',
    })
    .option('yes', {
      type: 'boolean',
      default: false,
      describe:
        '[clean] Skip the confirmation prompt for destructive scopes (--derived-data, --cache, --all)',
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
    cleanProject: parsed.project,
    cleanDerivedData: parsed['derived-data'],
    cleanCache: parsed.cache,
    cleanAll: parsed.all,
    cleanYes: parsed.yes,
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

/**
 * Pure: enumerates what `clean` should remove based on opts. No I/O beyond
 * one readdirSync on appRoot (to discover `<App>-SPM.xcodeproj/` names) and
 * a readdirSync on the DerivedData root when `derivedData` is requested.
 * The caller filters out paths that don't exist before deleting.
 */
function gatherCleanTargets(
  appRoot /*: string */,
  opts /*:: ?: CleanOpts */ = {},
) /*: Array<CleanTarget> */ {
  const targets /*: Array<CleanTarget> */ = [];

  // Always: the generated dirs inside appRoot (current "clean" behavior).
  const localGenerated = [
    {
      path: path.join(appRoot, 'build', 'xcframeworks'),
      label: 'build/xcframeworks/',
    },
    {
      path: path.join(appRoot, 'build', 'generated'),
      label: 'build/generated/',
    },
    // Legacy location (pre-build/generated/autolinking move) — remove when
    // present so old workspaces upgrade cleanly.
    {path: path.join(appRoot, 'autolinked'), label: 'autolinked/ (legacy)'},
    {path: path.join(appRoot, '.build'), label: '.build/'},
  ];
  targets.push(...localGenerated);

  // Discover any `<App>-SPM.xcodeproj/` inside appRoot. Used by both
  // `--project` (delete it) and `--derived-data` (derive App name from it).
  const xcodeprojNames /*: Array<string> */ = [];
  try {
    const entries /*: Array<{name: string, isDirectory(): boolean}> */ =
      // $FlowFixMe[incompatible-type] Dirent typing
      fs.readdirSync(appRoot, {withFileTypes: true});
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.endsWith('-SPM.xcodeproj')) {
        xcodeprojNames.push(entry.name);
      }
    }
  } catch {
    // appRoot may not exist or be readable — leave list empty
  }

  if (opts.project === true) {
    targets.push({
      path: path.join(appRoot, 'Package.swift'),
      label: 'Package.swift',
    });
    for (const name of xcodeprojNames) {
      targets.push({path: path.join(appRoot, name), label: `${name}/`});
    }
  }

  if (opts.derivedData === true) {
    const derivedRoot =
      opts.derivedDataRoot ??
      path.join(os.homedir(), 'Library', 'Developer', 'Xcode', 'DerivedData');
    // App-name prefixes to match against DerivedData entries. Derived from
    // any *-SPM.xcodeproj in appRoot. If none exists, skip (we can't know
    // which DerivedData entries belong to this app).
    const appNames = xcodeprojNames.map(n => n.replace(/-SPM\.xcodeproj$/, ''));
    if (appNames.length > 0) {
      try {
        const ddEntries /*: Array<{name: string, isDirectory(): boolean}> */ =
          // $FlowFixMe[incompatible-type] Dirent typing
          fs.readdirSync(derivedRoot, {withFileTypes: true});
        for (const entry of ddEntries) {
          if (!entry.isDirectory()) continue;
          for (const appName of appNames) {
            if (entry.name.startsWith(`${appName}-SPM-`)) {
              targets.push({
                path: path.join(derivedRoot, entry.name),
                label: `~/Library/Developer/Xcode/DerivedData/${entry.name}/`,
              });
            }
          }
        }
      } catch {
        // DerivedData dir may not exist — that's fine
      }
    }
  }

  if (opts.cache === true && opts.cacheSlotDir != null) {
    targets.push({
      path: opts.cacheSlotDir,
      label: displayPath(opts.cacheSlotDir),
    });
  }

  return targets;
}

function cleanGeneratedState(
  appRoot /*: string */,
  opts /*:: ?: CleanOpts */ = {},
) /*: void */ {
  const targets = gatherCleanTargets(appRoot, opts);
  const existing = targets.filter(t => fs.existsSync(t.path));
  if (existing.length === 0) {
    log('Nothing to clean.');
    return;
  }
  log(`Cleaning ${existing.length} path(s)...`);
  for (const target of existing) {
    fs.rmSync(target.path, {recursive: true, force: true});
    log(`  Removed ${target.label}`);
  }
}

/**
 * Prompts the user before running destructive scopes that touch state
 * outside `appRoot` (DerivedData, the user-global xcframework cache).
 * `--yes` skips the prompt; non-TTY stdin also auto-confirms so CI doesn't
 * hang.
 */
/**
 * Inspects a Podfile and decides what (if anything) to insert. Returns null
 * when the file is missing, doesn't have a discoverable `target '...' do`
 * line, or ALREADY has a top-level `project '<...>.xcodeproj'` directive.
 * Otherwise returns the insertion point + the line we'd prepend before the
 * first target block.
 *
 * Without a `project` directive, CocoaPods refuses to auto-pick between
 * sibling xcodeprojs (`MyApp.xcodeproj` + `MyApp-SPM.xcodeproj`) with
 * "Could not automatically select an Xcode project". This is the most
 * common new-user footgun when SPM and CocoaPods coexist.
 */
function podfileNeedsPatch(
  podfilePath /*: string */,
) /*: {content: string, insertAt: number} | null */ {
  if (!fs.existsSync(podfilePath)) {
    return null;
  }
  const content = fs.readFileSync(podfilePath, 'utf8');
  // Already has a top-level `project '...'` directive (allow leading
  // whitespace; pin to start-of-line for top-level). Skip.
  if (/^project\s+['"][^'"]+\.xcodeproj['"]/m.test(content)) {
    return null;
  }
  // Find the first `target '<name>' do` — the directive must come before.
  const m = content.match(/^(?<indent>[ \t]*)target\s+['"][^'"]+['"]\s+do/m);
  if (m == null || m.index == null) {
    return null;
  }
  // Insertion point: start of the line containing the `target` directive.
  // m.index points there because we anchored with `^` + multiline flag.
  return {content, insertAt: m.index};
}

/**
 * Finds the legacy (non-SPM) `*.xcodeproj` in `appRoot` — the one
 * CocoaPods should integrate with. We DON'T want CocoaPods picking the
 * `<App>-SPM.xcodeproj/` we generate, because next `spm update` regenerates
 * it from scratch and would wipe any pod-injected changes.
 */
function findLegacyXcodeproj(appRoot /*: string */) /*: string | null */ {
  let entries /*: Array<{name: string, isDirectory(): boolean}> */;
  try {
    // $FlowFixMe[incompatible-type] Dirent typing
    entries = fs.readdirSync(appRoot, {withFileTypes: true});
  } catch {
    return null;
  }
  const candidates = entries
    .filter(e => {
      // $FlowFixMe[incompatible-type] Dirent.name is string|Buffer in Flow stubs; always string in our usage.
      const name /*: string */ = e.name;
      return (
        e.isDirectory() &&
        name.endsWith('.xcodeproj') &&
        !name.endsWith('-SPM.xcodeproj')
      );
    })
    .map(e => {
      // $FlowFixMe[incompatible-type] Dirent.name is string|Buffer in Flow stubs; always string in our usage.
      const name /*: string */ = e.name;
      return name;
    });
  // Most projects have exactly one legacy xcodeproj. If multiple exist,
  // pick the first deterministically — the prompt below shows the user
  // which one we'll write and they can decline if it's wrong.
  return candidates[0] ?? null;
}

function confirmPodfilePatch() /*: Promise<boolean> */ {
  // $FlowFixMe[prop-missing] process.stdin.isTTY not in Flow stubs
  if (process.stdin.isTTY !== true) {
    return Promise.resolve(true);
  }
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(
      'Add this `project` line to your Podfile now? [Y/n] ',
      answer => {
        rl.close();
        const a = answer.trim().toLowerCase();
        resolve(a === '' || a === 'y' || a === 'yes');
      },
    );
  });
}

/**
 * Detects the CocoaPods-vs-SPM ambiguity (Podfile + two sibling xcodeprojs)
 * and offers to patch the Podfile. Runs only on `init` — once the user has
 * declined we don't keep nagging on every `update`.
 */
async function maybePatchPodfile(
  args /*: SetupArgs */,
  appRoot /*: string */,
) /*: Promise<void> */ {
  const podfilePath = path.join(appRoot, 'Podfile');
  const needs = podfileNeedsPatch(podfilePath);
  if (needs == null) {
    return;
  }
  const legacyXcodeproj = findLegacyXcodeproj(appRoot);
  if (legacyXcodeproj == null) {
    return;
  }

  log('');
  log(
    'Detected Podfile without an explicit `project` directive. ` pod install` ' +
      'will refuse to choose between the legacy and SPM xcodeprojs in this dir ' +
      `(error: "Could not automatically select an Xcode project").`,
  );
  log('');
  log(`I can add this line to ${path.relative(appRoot, podfilePath)}:`);
  log('');
  log(`    project '${legacyXcodeproj}'`);
  log('');
  log(
    `This pins CocoaPods to ${legacyXcodeproj} so it leaves the auto-generated ` +
      `SPM xcodeproj alone.`,
  );
  log('');

  const proceed = args.cleanYes ? true : await confirmPodfilePatch();
  if (!proceed) {
    log('Skipped Podfile patch. Add the line manually if `pod install` fails.');
    return;
  }

  // Insert the directive immediately before the first `target ... do` line,
  // with a brief explanatory comment so a reader knows why it's there.
  const insertion =
    `# Pin CocoaPods to ${legacyXcodeproj} so it doesn't pick the ` +
    `auto-generated <App>-SPM.xcodeproj.\n` +
    `# Added by \`npx react-native spm init\`.\n` +
    `project '${legacyXcodeproj}'\n\n`;
  const patched =
    needs.content.slice(0, needs.insertAt) +
    insertion +
    needs.content.slice(needs.insertAt);
  fs.writeFileSync(podfilePath, patched, 'utf8');
  log(
    `Patched ${path.relative(appRoot, podfilePath)} with project '${legacyXcodeproj}'.`,
  );
}

/**
 * Prompt before scaffolding `Package.swift` into `node_modules/<dep>/` for
 * the first time. Default-Yes (`[Y/n]`) because spm-init/update has already
 * opted into setting up SPM support — the prompt is mainly for awareness.
 * Non-TTY (CI) auto-accepts.
 */
function confirmScaffold(
  depNames /*: Array<string> */,
) /*: Promise<boolean> */ {
  // $FlowFixMe[prop-missing] process.stdin.isTTY not in Flow stubs
  if (process.stdin.isTTY !== true) {
    return Promise.resolve(true);
  }
  log('');
  log(`Found ${depNames.length} community RN package(s) without SPM support:`);
  for (const n of depNames) {
    log(`  • ${n}`);
  }
  log('');
  log(
    'Scaffolding writes a Package.swift into node_modules/<dep>/ derived from\n' +
      "the dep's podspec. node_modules gets wiped by `npm install` — to persist:\n" +
      '  • add a `"postinstall": "npx react-native spm scaffold"` to package.json, OR\n' +
      '  • `npx patch-package <dep>` after scaffolding.',
  );
  log('');
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Generate Package.swift for the deps above? [Y/n] ', answer => {
      rl.close();
      const a = answer.trim().toLowerCase();
      resolve(a === '' || a === 'y' || a === 'yes');
    });
  });
}

function confirmDestructive(
  targets /*: Array<CleanTarget> */,
) /*: Promise<boolean> */ {
  // $FlowFixMe[prop-missing] process.stdin.isTTY not in Flow stubs
  if (process.stdin.isTTY !== true) {
    return Promise.resolve(true);
  }
  log('');
  log('About to remove:');
  for (const t of targets) {
    log(`  - ${t.label}`);
  }
  log('');
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Proceed? [y/N] ', answer => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

function resolveAction(
  requestedAction /*: SetupArgs['action'] */,
  appRoot /*: string */,
) /*: 'init' | 'update' | 'sync' | 'clean' | 'codegen' | 'download' | 'scaffold' */ {
  if (requestedAction != null) {
    return requestedAction;
  }
  return 'update';
}

/**
 * Detects the JS-root-vs-ios-dir mismatch that produces silently-broken
 * builds for standard RN apps. The community CLI writes
 * `autolinking.json` under `<project.ios.sourceDir>/build/generated/autolinking/`
 * (i.e. `<projectRoot>/ios/...`), while every SPM script anchors its
 * inputs/outputs on `process.cwd()`. Running from the JS root therefore
 * (a) writes outputs at `<projectRoot>/build/...` — away from the iOS
 * project, and (b) makes the autolinker miss `autolinking.json` and
 * silently skip every npm native dep. The build "succeeds" but anything
 * touching a native module crashes at runtime.
 *
 * Returns null when the cwd is fine, or a string describing the problem
 * when the user should `cd` into `ios/`.
 */
function describeRnRootMismatch(
  appRoot /*: string */,
  projectRoot /*: string */,
) /*: string | null */ {
  // Only relevant when cwd === projectRoot (i.e. user is at the JS root
  // of their RN app). If they've already cd'd into a subdir, projectRoot
  // walks up to find package.json and the two paths differ — leave alone.
  if (path.resolve(appRoot) !== path.resolve(projectRoot)) {
    return null;
  }
  // Standard RN layout has an `ios/` subdir holding the native project.
  // Without it (e.g. rn-tester's flat layout), no mismatch to flag.
  const iosSubdir = path.join(projectRoot, 'ios');
  let isDir = false;
  try {
    isDir = fs.statSync(iosSubdir).isDirectory();
  } catch {
    return null;
  }
  if (!isDir) {
    return null;
  }
  return (
    `Detected standard RN layout: package.json at ${displayPath(projectRoot)}, ` +
    `iOS project at ${displayPath(iosSubdir)}.\n\n` +
    `Please run from the ios/ subdirectory:\n\n` +
    `  cd ios && npx react-native spm <action>\n\n` +
    `Running from the JS root would write SPM artifacts at the wrong location and ` +
    `the autolinker would silently skip every npm native dependency (the community ` +
    `CLI writes autolinking.json under <project>/ios/build/generated/autolinking/, ` +
    `but this script would read it from <project>/build/generated/autolinking/). ` +
    `The build would succeed but native modules would fail at runtime.`
  );
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
    const rendered = renderCodegenTemplate(
      fs.readFileSync(spmTemplate, 'utf8'),
      appRoot,
    );
    fs.writeFileSync(codegenPkgSwift, rendered, 'utf8');
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

/**
 * Walks autolinking.json and writes a Package.swift into each community RN
 * package that ships a podspec but no SPM manifest. Reuses the dep's
 * podspec (via `pod ipc spec` when available) so the scaffolded file
 * captures the dep's actual sources, header search paths, frameworks, and
 * dependencies. Files carrying the scaffolder's own marker are regenerated
 * when the cache slot changes (manifest-hash bump); files without the
 * marker are left alone (upstream-shipped or user-managed).
 *
 * Runs as part of `init` / `update` / `scaffold` actions. Each invocation
 * is a no-op for deps already in a clean state.
 */
async function runScaffold(
  args /*: SetupArgs */,
  appRoot /*: string */,
  projectRoot /*: string */,
  reactNativeRoot /*: string */,
  // Caller's resolved action — same union as resolveAction's return type.
  // Typed precisely so Flow accepts the `action === 'scaffold'` checks
  // below (strict mode rejects `string === <singleton>` as invalid-compare).
  action /*: 'init' | 'update' | 'sync' | 'clean' | 'codegen' | 'download' | 'scaffold' */,
) /*: Promise<void> */ {
  // Resolve the cache slot identifier so the scaffolded files carry it as
  // a comment — that's how SPM's manifest hash bumps on slot transitions.
  let cacheSlotLabel /*: ?string */ = null;
  try {
    const rawVersion = args.version ?? determineVersion(args, reactNativeRoot);
    const slotVersion = await resolveCacheSlotVersion(rawVersion);
    cacheSlotLabel = `${slotVersion}/${args.flavor}`;
  } catch {
    // Without a slot label the scaffolder still works; the file just
    // doesn't get the slot-bump comment.
  }

  // Pass 1: dry-run to discover which deps would be scaffolded for the
  // FIRST time (no existing Package.swift). Those are the only ones we
  // prompt the user about — regens of files we already own happen silently.
  let dryResults;
  try {
    dryResults = scaffoldAll({
      appRoot,
      projectRoot,
      reactNativeRoot,
      cacheSlotLabel,
      force: action === 'scaffold',
      dryRun: true,
    });
  } catch (e) {
    logError(
      `scaffold dry-run failed: ${e.message}. Continuing — community deps may not autolink.`,
    );
    return;
  }

  const newScaffoldDeps /*: Array<string> */ = [];
  for (const r of dryResults) {
    if (r.status === 'written' && r.previouslyExisted === false) {
      newScaffoldDeps.push(r.depName);
    }
  }

  // Decide which (if any) first-time deps the user wants scaffolded.
  // - `scaffold` action: user explicitly asked → no prompt
  // - `--yes`: bypass prompt
  // - non-TTY (CI): auto-accept
  // - otherwise: prompt with a list; default Yes
  let skipDeps /*: Array<string> */ = [];
  if (
    newScaffoldDeps.length > 0 &&
    action !== 'scaffold' &&
    !args.cleanYes &&
    process.stdin.isTTY === true
  ) {
    const proceed = await confirmScaffold(newScaffoldDeps);
    if (!proceed) {
      // Decline ALL first-time scaffolds; existing scaffolder-marker files
      // still get regenerated (slot changes etc.).
      skipDeps = newScaffoldDeps;
      log(
        'Skipping first-time scaffolds for this run. ' +
          'Re-run `npx react-native spm scaffold` (or pass --yes) to accept.',
      );
    }
  }

  let results;
  try {
    results = scaffoldAll({
      appRoot,
      projectRoot,
      reactNativeRoot,
      cacheSlotLabel,
      // `scaffold` action forces a re-render even when slot is unchanged,
      // so a user re-running it after editing a podspec gets the new
      // content. `update`/`init` are non-forcing (idempotent).
      force: action === 'scaffold',
      skipDeps,
    });
  } catch (e) {
    logError(
      `scaffold failed: ${e.message}. Continuing — community deps may not autolink.`,
    );
    return;
  }

  const written = results.filter(r => r.status === 'written');
  const errored = results.filter(r => r.status === 'error');
  const warned = results.filter(
    r => r.status === 'written' && r.warnings && r.warnings.length > 0,
  );

  if (written.length > 0) {
    log(`Scaffolded Package.swift for ${written.length} dep(s):`);
    for (const r of written) {
      log(`  • ${r.depName}`);
    }
    log('');
    log(
      'TIP: node_modules is wiped by `npm install`. To persist:\n' +
        '  • add `"postinstall": "npx react-native spm scaffold"` to package.json (preferred), OR\n' +
        '  • `npx patch-package <dep>` after scaffolding (cross-machine portability with caveats).',
    );
    log('');
  }

  for (const r of warned) {
    if (r.status !== 'written') continue;
    for (const w of r.warnings) {
      log(`  ! ${r.depName}: ${w}`);
    }
  }

  for (const r of errored) {
    if (r.status !== 'error') continue;
    logError(`  ! ${r.depName}: ${r.reason}`);
  }
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
  // Resolve the cache-slot version before computing the cache dir. For dev /
  // nightly labels this is the actual nightly hash, so each nightly gets its
  // own slot and a new nightly invalidates the old slot automatically. Stable
  // versions pass through unchanged.
  const rawVersion = args.version ?? version;
  const slotVersion = await resolveCacheSlotVersion(rawVersion);
  const resolvedArtifactsDir =
    artifactsDir != null
      ? path.resolve(artifactsDir)
      : defaultCacheDir(slotVersion, args.flavor);

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
    log(`Downloading xcframework artifacts (slot: ${slotVersion})...`);
    await downloadArtifacts([
      '--version',
      rawVersion,
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

  const mismatch = describeRnRootMismatch(appRoot, projectRoot);
  if (mismatch != null) {
    logError(mismatch);
    process.exitCode = 1;
    return;
  }

  if (action === 'clean') {
    const wantProject = args.cleanProject || args.cleanAll;
    const wantDerivedData = args.cleanDerivedData || args.cleanAll;
    const wantCache = args.cleanCache || args.cleanAll;
    const cleanOpts /*: CleanOpts */ = {
      project: wantProject,
      derivedData: wantDerivedData,
      cache: wantCache,
    };

    // Resolve cache slot path only when --cache (or --all) is requested.
    // Falls back silently if we can't determine a version — clean just
    // skips the cache target instead of crashing.
    if (wantCache) {
      try {
        const reactNativeRoot = path.resolve(__dirname, '..');
        const rawVersion =
          args.version ?? determineVersion(args, reactNativeRoot);
        const slotVersion = await resolveCacheSlotVersion(rawVersion);
        cleanOpts.cacheSlotDir = defaultCacheDir(slotVersion, args.flavor);
      } catch (e) {
        logError(
          `Could not resolve cache slot for --cache: ${e.message}. Skipping cache cleanup.`,
        );
      }
    }

    // Destructive scopes (DerivedData / cache) touch state outside appRoot.
    // Ask for confirmation unless --yes is passed or stdin isn't a TTY.
    const isDestructive = wantDerivedData || wantCache;
    if (isDestructive && !args.cleanYes) {
      const targets = gatherCleanTargets(appRoot, cleanOpts).filter(t =>
        fs.existsSync(t.path),
      );
      if (targets.length > 0) {
        const proceed = await confirmDestructive(targets);
        if (!proceed) {
          log('Aborted.');
          return;
        }
      }
    }

    cleanGeneratedState(appRoot, cleanOpts);
    log('SPM cleanup complete.');
    return;
  }

  const needsCliConfig =
    action === 'init' ||
    action === 'update' ||
    action === 'sync' ||
    action === 'scaffold';
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
  // The artifact cache directory is resolved later in ensureArtifacts so the
  // nightly hash can be folded in for dev / nightly labels. That branch logs
  // either "Downloading xcframework artifacts (slot: ...)" or
  // "Artifacts already present in ...".

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

  // Scaffold Package.swift for community RN packages that don't ship SPM
  // support. Runs BEFORE the autolinker so the autolinker sees the
  // scaffolded files as self-managed (via isSelfManagedPackage's
  // AUTOGEN_MARKER check) and references them directly from the aggregator.
  // No-op for deps that already have an upstream Package.swift, opted out,
  // or had no .podspec.
  await runScaffold(args, appRoot, projectRoot, reactNativeRoot, action);

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

  // On `init` only: detect the CocoaPods ambiguity that occurs when the
  // Podfile has no `project '<path>.xcodeproj'` directive and there's both
  // a legacy and an SPM xcodeproj in the dir. Offer to add the directive
  // pinning CocoaPods to the legacy project. Skipped on `update` so we
  // don't keep nagging users who explicitly declined.
  if (action === 'init') {
    try {
      await maybePatchPodfile(args, appRoot);
    } catch (e) {
      logError(`Podfile check failed: ${e.message}. Continuing.`);
    }
  }

  logNextSteps(projectRoot, appRoot, args.productName);
}

if (require.main === module) {
  void main();
}

module.exports = {
  main,
  cleanGeneratedState,
  gatherCleanTargets,
  describeRnRootMismatch,
  findLegacyXcodeproj,
  podfileNeedsPatch,
};
