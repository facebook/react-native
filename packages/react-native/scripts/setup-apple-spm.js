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
 *   init                       First-time setup: generate sub-packages,
 *                              artifacts, and .xcodeproj. Adds SPM entries
 *                              to .gitignore.
 *   update                     Regenerate sub-packages/artifacts. Does NOT
 *                              touch <App>-SPM.xcodeproj (it's committed —
 *                              see below). Pass --force-xcodeproj to opt in.
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
 *                               ~/Library/Caches/ReactNative/spm-artifacts/{version}/{flavor}/
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
 *   5. generate-spm-package.js → build/xcframeworks/Package.swift + symlinks
 *   6. generate-spm-xcodeproj.js → <AppName>-SPM.xcodeproj (create-if-missing;
 *                                  skipped with --skip-xcodeproj; opt back
 *                                  into overwrite with --force-xcodeproj)
 *
 * Commit policy: <AppName>-SPM.xcodeproj is COMMITTED to your repo, like
 * the legacy <AppName>.xcodeproj. It holds your signing, capabilities,
 * Build Phases, schemes — edit it in Xcode the normal way. Its
 * XCLocalSwiftPackageReference entries point at three stable sub-package
 * paths under build/ (xcframeworks, generated/autolinking, generated/ios);
 * adding/removing community deps changes the contents of those sub-packages
 * (gitignored) and never requires regenerating the xcodeproj. No app-level
 * Package.swift is generated or required.
 *
 * Legacy-xcodeproj migration: on `init`, if a CocoaPods-driven
 * <AppName>.xcodeproj exists alongside the SPM xcodeproj, `init` offers to
 * rename it to <AppName>.xcodeproj.legacy. The `.legacy` extension hides it
 * from the community CLI's findXcodeProject heuristic, so `npm run ios`
 * resolves to the SPM xcodeproj. Declining preserves both side-by-side;
 * `init` then patches the Podfile to pin CocoaPods to the legacy project.
 *
 * After running: open <AppName>-SPM.xcodeproj in Xcode.
 */

const {
  main: downloadArtifacts,
  resolveCacheSlotVersion,
  validateArtifactsCache,
} = require('./spm/download-spm-artifacts');
const {main: generateAutolinking} = require('./spm/generate-spm-autolinking');
const {
  generateAutolinkingConfig,
} = require('./spm/generate-spm-autolinking-config');
const {main: generatePackage} = require('./spm/generate-spm-package');
const {findSourcePath} = require('./spm/generate-spm-package');
const {
  SPM_MANAGED_MARKER,
  main: generateXcodeproj,
} = require('./spm/generate-spm-xcodeproj');
const {scaffoldAll} = require('./spm/scaffold-package-swift');
const {
  buildPerAppHeaderTree,
  buildSharedReactCoreHeaderTree,
  defaultCacheDir,
  deriveAppName,
  displayPath,
  findProjectRoot,
  installSpmCodegenTemplate,
  logCrossTreeShadows,
  makeLogger,
  readPackageJson,
  runCodegenAndInstallTemplate,
  writeAppPathsJson,
  writeSharedPathsJson,
} = require('./spm/spm-utils');
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
    .option('force-xcodeproj', {
      type: 'boolean',
      default: false,
      describe:
        'Regenerate <App>-SPM.xcodeproj even if it already exists. WARNING: overwrites in-place Xcode edits (signing, capabilities, build phases). The xcodeproj is committed to your repo; SPM references stable sub-package paths under build/, so regeneration is not normally needed.',
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
      describe:
        '[clean] Also remove the committed <App>-SPM.xcodeproj/ (will prompt for confirmation; bypass with --yes)',
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
    forceXcodeproj: parsed['force-xcodeproj'],
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
  // The SoT contract + shared header tree (machine-absolute paths — never
  // commit). This appRoot entry covers the common single-app case; the
  // authoritative exclusion is a self-ignoring `.react-native/.gitignore`
  // written by writeSharedPathsJson, which works even when `.react-native/`
  // sits at a project root above the app's own .gitignore (monorepo).
  '.react-native/',
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

// Enumerates clean targets. `--project` may emit a `rename` target restoring
// `<App>.xcodeproj.legacy` alongside the SPM xcodeproj deletion.
function gatherCleanTargets(
  appRoot /*: string */,
  opts /*:: ?: CleanOpts */ = {},
) /*: Array<CleanTarget> */ {
  const targets /*: Array<CleanTarget> */ = [];

  // Always: the generated dirs inside appRoot (current "clean" behavior).
  targets.push(
    {
      kind: 'delete',
      path: path.join(appRoot, 'build', 'xcframeworks'),
      label: 'build/xcframeworks/',
    },
    {
      kind: 'delete',
      path: path.join(appRoot, 'build', 'generated'),
      label: 'build/generated/',
    },
    // Legacy location (pre-build/generated/autolinking move) — remove when
    // present so old workspaces upgrade cleanly.
    {
      kind: 'delete',
      path: path.join(appRoot, 'autolinked'),
      label: 'autolinked/ (legacy)',
    },
    {
      kind: 'delete',
      path: path.join(appRoot, '.build'),
      label: '.build/',
    },
  );

  // Xcodeproj names drive both --project deletion and --derived-data
  // discovery (DerivedData entries are prefixed by the xcodeproj base name).
  const spmXcodeprojNames = listSpmXcodeprojs(appRoot).map(m => m.name);

  if (opts.project === true) {
    for (const name of spmXcodeprojNames) {
      targets.push({
        kind: 'delete',
        path: path.join(appRoot, name),
        label: `${name}/`,
      });
      // If a `.legacy` backup sits alongside, restore it as the canonical
      // `<App>.xcodeproj`. Only safe when we're also deleting the SPM
      // xcodeproj that occupies that name — otherwise the rename would
      // collide with the still-present SPM project. We're inside the
      // `for (name of spmXcodeprojNames)` loop, so that invariant holds.
      const legacyBackup = path.join(appRoot, `${name}.legacy`);
      if (fs.existsSync(legacyBackup)) {
        targets.push({
          kind: 'rename',
          from: legacyBackup,
          to: path.join(appRoot, name),
          label: `${name}.legacy/ → ${name}/  (restore CocoaPods xcodeproj)`,
        });
      }
    }
  }

  if (opts.derivedData === true) {
    const derivedRoot =
      opts.derivedDataRoot ??
      path.join(os.homedir(), 'Library', 'Developer', 'Xcode', 'DerivedData');
    // Build app-name prefixes from the xcodeproj base names. We accept
    // both `<App>-SPM-*` (old layout) and `<App>-*` (new layout) DerivedData
    // entries. Trimming `.xcodeproj` is enough — Xcode names DerivedData
    // dirs after the xcodeproj base name, not the target name.
    const appNames = spmXcodeprojNames.map(n => n.replace(/\.xcodeproj$/, ''));
    if (appNames.length > 0) {
      try {
        const ddEntries /*: Array<{name: string, isDirectory(): boolean}> */ =
          // $FlowFixMe[incompatible-type] Dirent typing
          fs.readdirSync(derivedRoot, {withFileTypes: true});
        for (const entry of ddEntries) {
          if (!entry.isDirectory()) continue;
          for (const appName of appNames) {
            if (entry.name.startsWith(`${appName}-`)) {
              targets.push({
                kind: 'delete',
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
      kind: 'delete',
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
  // Split into deletes and renames, filtering by source existence as we go.
  // Run deletes BEFORE renames so the rename target slot is free (we'd
  // otherwise rename `<App>.xcodeproj.legacy` → `<App>.xcodeproj` while the
  // SPM `<App>.xcodeproj` still exists).
  const deletes /*: Array<{path: string, label: string}> */ = [];
  const renames /*: Array<{from: string, to: string, label: string}> */ = [];
  for (const t of targets) {
    if (t.kind === 'rename') {
      if (fs.existsSync(t.from)) {
        renames.push({from: t.from, to: t.to, label: t.label});
      }
    } else if (fs.existsSync(t.path)) {
      deletes.push({path: t.path, label: t.label});
    }
  }
  const total = deletes.length + renames.length;
  if (total === 0) {
    log('Nothing to clean.');
    return;
  }
  log(`Cleaning ${total} action(s)...`);
  for (const d of deletes) {
    fs.rmSync(d.path, {recursive: true, force: true});
    log(`  Removed ${d.label}`);
  }
  for (const r of renames) {
    fs.renameSync(r.from, r.to);
    log(`  ${r.label}`);
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
 * CocoaPods should integrate with. "Legacy" means: a `*.xcodeproj`
 * directory that is NOT SPM-managed. SPM-managed xcodeprojs are
 * identified by the `.spm-managed` sidecar marker, OR by the historical
 * `-SPM.xcodeproj` filename suffix (backward compat with older
 * generator output).
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
      if (
        !e.isDirectory() ||
        !name.endsWith('.xcodeproj') ||
        name.endsWith('-SPM.xcodeproj')
      ) {
        return false;
      }
      // A `<App>.xcodeproj/.spm-managed` marker means this is the SPM
      // project sharing the legacy filename — not a CocoaPods target.
      return !fs.existsSync(path.join(appRoot, name, SPM_MANAGED_MARKER));
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

/**
 * The community CLI's findXcodeProject scans for `*.xcodeproj` directories
 * and returns the first match. We rename the legacy to
 * `<App>.xcodeproj.legacy` so its extension becomes `.legacy` — invisible
 * to that heuristic, leaving the SPM project as the only candidate.
 */
function decideLegacyMigration(
  appRoot /*: string */,
) /*: {kind: 'rename', from: string, to: string}
     | {kind: 'skip-no-legacy'}
     | {kind: 'skip-already-migrated', legacy: string}
     | {kind: 'skip-conflict', from: string, to: string} */ {
  const legacyName = findLegacyXcodeproj(appRoot);
  if (legacyName == null) {
    // No active `<App>.xcodeproj`. Maybe there's a `.legacy` from a prior
    // migration — report it so callers can log appropriately.
    let entries /*: Array<{name: string, isDirectory(): boolean}> */;
    try {
      // $FlowFixMe[incompatible-type] Dirent typing
      entries = fs.readdirSync(appRoot, {withFileTypes: true});
    } catch {
      return {kind: 'skip-no-legacy'};
    }
    const alreadyMigrated = entries.find(e => {
      // $FlowFixMe[incompatible-type] Dirent.name is string|Buffer in Flow stubs
      const name /*: string */ = e.name;
      return e.isDirectory() && name.endsWith('.xcodeproj.legacy');
    });
    if (alreadyMigrated != null) {
      // $FlowFixMe[incompatible-type] Dirent.name is string|Buffer in Flow stubs
      const name /*: string */ = alreadyMigrated.name;
      return {kind: 'skip-already-migrated', legacy: name};
    }
    return {kind: 'skip-no-legacy'};
  }
  const backupName = `${legacyName}.legacy`;
  if (fs.existsSync(path.join(appRoot, backupName))) {
    return {kind: 'skip-conflict', from: legacyName, to: backupName};
  }
  return {kind: 'rename', from: legacyName, to: backupName};
}

/**
 * Single TTY-gated Y/N prompt helper used by every interactive confirmation
 * in this file. Non-TTY (CI / piped stdin) auto-confirms — every callsite
 * either opted into the action explicitly or is downstream of an opt-in.
 */
function promptYesNo(
  question /*: string */,
  defaultYes /*: boolean */,
) /*: Promise<boolean> */ {
  // $FlowFixMe[prop-missing] process.stdin.isTTY not in Flow stubs
  if (process.stdin.isTTY !== true) {
    return Promise.resolve(true);
  }
  const suffix = defaultYes ? '[Y/n]' : '[y/N]';
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(`${question} ${suffix} `, answer => {
      rl.close();
      const a = answer.trim().toLowerCase();
      const yes = a === 'y' || a === 'yes';
      resolve(defaultYes ? a === '' || yes : yes);
    });
  });
}

function confirmLegacyMigration(
  from /*: string */,
  to /*: string */,
) /*: Promise<boolean> */ {
  return promptYesNo(
    `Rename ${from} → ${to} so \`npm run ios\` uses the SPM xcodeproj?`,
    true,
  );
}

/**
 * On `spm init`: if a legacy CocoaPods `<App>.xcodeproj` exists, offer to
 * rename it to `<App>.xcodeproj.legacy` so the SPM generator can write
 * the new `<App>.xcodeproj` (same filename) in the now-free slot. This is
 * what makes `npm run ios` resolve to the SPM xcodeproj unambiguously.
 *
 * Returns the new {from, to} names when a rename actually happened, so
 * the caller can emit a "to roll back" hint in next-steps. Returns null
 * when no rename occurred (no legacy / declined / already migrated /
 * conflict).
 */
async function maybeMigrateLegacyXcodeproj(
  args /*: SetupArgs */,
  appRoot /*: string */,
) /*: Promise<{from: string, to: string} | null> */ {
  const decision = decideLegacyMigration(appRoot);
  switch (decision.kind) {
    case 'skip-no-legacy':
      return null;
    case 'skip-already-migrated':
      log(
        `Legacy ${decision.legacy} present (renamed by a prior \`spm init\`); ` +
          `\`npm run ios\` resolves to the SPM xcodeproj.`,
      );
      return null;
    case 'skip-conflict':
      log(
        `\x1b[33mFound both ${decision.from} and ${decision.to}.\x1b[0m ` +
          `Skipping rename — resolve manually (remove one) before re-running init.`,
      );
      return null;
    case 'rename': {
      log('');
      log(
        `Found legacy CocoaPods ${decision.from}. The SPM xcodeproj uses the ` +
          `same filename, so the legacy must be renamed first to free that ` +
          `slot. The directory is preserved as ${decision.to} for rollback ` +
          `(\`git mv\` tracks the rename cleanly).`,
      );
      log('');

      const proceed = args.cleanYes
        ? true
        : await confirmLegacyMigration(decision.from, decision.to);
      if (!proceed) {
        // Refuse to continue — the next step (generateXcodeProject) would
        // otherwise refuse anyway because the slot is taken by the legacy.
        log(
          `Skipped legacy rename. \`spm init\` cannot continue because the ` +
            `legacy ${decision.from} occupies the slot the SPM xcodeproj ` +
            `would use. Re-run init and accept the rename, or manually ` +
            `rename to ${decision.to} first.`,
        );
        process.exitCode = 1;
        throw new Error('Legacy rename declined — init cannot proceed');
      }
      fs.renameSync(
        path.join(appRoot, decision.from),
        path.join(appRoot, decision.to),
      );
      log(`Renamed: ${decision.from} → ${decision.to}`);
      return {from: decision.from, to: decision.to};
    }
  }
}

function confirmPodfilePatch() /*: Promise<boolean> */ {
  return promptYesNo('Add this `project` line to your Podfile now?', true);
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

function confirmScaffold(
  depNames /*: Array<string> */,
) /*: Promise<boolean> */ {
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
  return promptYesNo('Generate Package.swift for the deps above?', true);
}

function confirmDestructive(
  targets /*: Array<CleanTarget> */,
) /*: Promise<boolean> */ {
  log('');
  log('About to remove:');
  for (const t of targets) {
    log(`  - ${t.label}`);
  }
  log('');
  return promptYesNo('Proceed?', false);
}

function resolveAction(
  requestedAction /*: SetupArgs['action'] */,
  appRoot /*: string */,
) /*: 'init' | 'update' | 'sync' | 'clean' | 'codegen' | 'download' | 'scaffold' */ {
  if (requestedAction != null) {
    return requestedAction;
  }
  // Auto-detect first-run: if no `<App>-SPM.xcodeproj/` exists yet, the user
  // has never run init in this app — treat the implicit action as `init`.
  // This is what triggers one-time setup steps (gitignore entries, the
  // legacy-xcodeproj migration prompt, the Podfile patch). After the first
  // run, the SPM xcodeproj is present and subsequent invocations default to
  // `update` (sub-package regen only, no first-time setup).
  return findExistingSpmXcodeproj(appRoot) != null ? 'update' : 'init';
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
 * Returns the absolute path to the redirected app root (`<projectRoot>/ios`)
 * when the redirect heuristic applies, else null. Pure: no side effects.
 * The caller decides whether to auto-redirect (non-destructive actions) or
 * refuse (destructive actions like `clean`).
 */
function detectStandardRnLayoutRedirect(
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
  try {
    if (!fs.statSync(iosSubdir).isDirectory()) {
      return null;
    }
  } catch {
    return null;
  }
  return iosSubdir;
}

/**
 * Builds the JS-root-mismatch refuse-message. Used by `clean`, which doesn't
 * auto-redirect (destructive scopes shouldn't silently retarget).
 */
function formatRnRootMismatchMessage(
  projectRoot /*: string */,
  iosSubdir /*: string */,
) /*: string */ {
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
  reactNativeRoot /*: string */,
  skipCodegen /*: boolean */,
) /*: void */ {
  if (skipCodegen) {
    // Output dir may already exist from a previous run; still refresh the
    // SPM template so cache-slot changes propagate.
    log('Skipping codegen (--skip-codegen)');
    installSpmCodegenTemplate(appRoot, reactNativeRoot, {log});
    return;
  }
  log('Running react-native codegen...');
  try {
    runCodegenAndInstallTemplate(projectRoot, appRoot, reactNativeRoot, {log});
  } catch {
    logError('Codegen failed. Continuing anyway...');
  }
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

  if (resolvedArtifactsDir == null) {
    log('No --artifacts-dir set, skipping download step');
    return resolvedArtifactsDir;
  }
  if (args.skipDownload) {
    log('Skipping artifact download (--skip-download)');
    return resolvedArtifactsDir;
  }

  // Validate the cache before trusting it. A bare existsSync(artifacts.json)
  // check would accept a partial write from a prior failed download (e.g.
  // hermes-engine 404 on a not-yet-published nightly) and silently propagate
  // the gap into the xcodeproj, surfacing only as "Missing package product"
  // in Xcode. validateArtifactsCache reads the JSON and confirms every
  // REQUIRED_ARTIFACT has a present xcframework on disk.
  const cacheError = validateArtifactsCache(resolvedArtifactsDir);
  if (cacheError == null) {
    log(`Artifacts already present in ${displayPath(resolvedArtifactsDir)}`);
    return resolvedArtifactsDir;
  }
  log(`Cache incomplete (${cacheError}); re-downloading...`);
  log(`Downloading xcframework artifacts (slot: ${slotVersion})...`);
  await downloadArtifacts([
    '--version',
    rawVersion,
    '--flavor',
    args.flavor,
    '--output',
    resolvedArtifactsDir,
  ]);
  return resolvedArtifactsDir;
}

function generateXcframeworksPackage(
  args /*: SetupArgs */,
  appRoot /*: string */,
  reactNativeRoot /*: string */,
  version /*: string */,
  resolvedArtifactsDir /*: string | null */,
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
  generatePackage(packageArgs);
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

  // Safety: the generator writes `<App>.xcodeproj` (same filename as the
  // legacy CocoaPods project). If a legacy is sitting in that slot AND no
  // SPM-managed marker is present, generation would silently overwrite the
  // user's CocoaPods project. Refuse and ask them to accept the migration
  // prompt (which renames legacy → `<App>.xcodeproj.legacy` first).
  const legacy = findLegacyXcodeproj(appRoot);
  if (legacy != null) {
    logError(
      `Refusing to generate .xcodeproj: ${legacy} appears to be a legacy ` +
        `CocoaPods project. Re-run \`spm init\` and accept the rename prompt ` +
        `(or manually rename to ${legacy}.legacy) before the SPM xcodeproj ` +
        `can take its slot.`,
    );
    process.exitCode = 1;
    throw new Error('Legacy xcodeproj would be overwritten');
  }

  // The xcodeproj is committed; its XCLocalSwiftPackageReference entries
  // point at three stable sub-package paths under build/, so adding/removing
  // community deps never requires regenerating it. Regenerate only when
  // missing (fresh clone / first init) or when the user explicitly opts in
  // via --force-xcodeproj.
  const existing = findExistingSpmXcodeproj(appRoot);
  if (existing != null && !args.forceXcodeproj) {
    log(
      `Found existing ${path.basename(existing)}; skipping regeneration ` +
        `(pass --force-xcodeproj to overwrite, e.g. after deleting it).`,
    );
    return;
  }

  log(
    existing != null
      ? `Regenerating .xcodeproj (--force-xcodeproj will overwrite Xcode-side edits)...`
      : 'Generating .xcodeproj...',
  );
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

/**
 * Lists every SPM-managed xcodeproj directly inside `appRoot`. A xcodeproj
 * is SPM-managed if it carries the `.spm-managed` sidecar marker or if its
 * name still has the legacy `-SPM.xcodeproj` suffix (backward compat).
 */
function listSpmXcodeprojs(
  appRoot /*: string */,
) /*: Array<{name: string, absPath: string, hasMarker: boolean}> */ {
  let entries /*: Array<{name: string, isDirectory(): boolean}> */;
  try {
    // $FlowFixMe[incompatible-type] Dirent typing
    entries = fs.readdirSync(appRoot, {withFileTypes: true});
  } catch {
    return [];
  }
  const out = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    // $FlowFixMe[incompatible-type] Dirent.name is string|Buffer in Flow stubs
    const name /*: string */ = entry.name;
    if (!name.endsWith('.xcodeproj')) continue;
    const absPath = path.join(appRoot, name);
    const hasMarker = fs.existsSync(path.join(absPath, SPM_MANAGED_MARKER));
    if (hasMarker || name.endsWith('-SPM.xcodeproj')) {
      out.push({name, absPath, hasMarker});
    }
  }
  return out;
}

// Returns the marker-tagged xcodeproj if any, else the first suffix-tagged
// fallback, else null. Used by the create-if-missing branch and resolveAction.
function findExistingSpmXcodeproj(appRoot /*: string */) /*: string | null */ {
  const matches = listSpmXcodeprojs(appRoot);
  return (matches.find(m => m.hasMarker) ?? matches[0])?.absPath ?? null;
}

function logNextSteps(
  projectRoot /*: string */,
  appRoot /*: string */,
  productName /*: string | null */,
  rename /*: {from: string, to: string} | null */,
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
  log(`  • Open ${appDisplayName}.xcodeproj in Xcode (or \`npm run ios\`)`);
  log('  • Set your Development Team in Signing & Capabilities');
  log('  • Build and run on Simulator or device');

  if (rename != null) {
    log('');
    log('To roll back to CocoaPods later:');
    log(`  mv ${rename.to} ${rename.from}`);
    log(`  rm -rf ${appDisplayName}.xcodeproj build/`);
    log('Or:');
    log('  npx react-native spm clean --project');
  }
}

async function main(argv /*:: ?: Array<string> */) /*: Promise<void> */ {
  let appRoot = process.cwd();
  const projectRoot = findProjectRoot(appRoot);
  const args = parseArgs(argv ?? process.argv.slice(2));

  // Standard-RN-layout redirect: if invoked from the JS root and there's an
  // `ios/` subdir, route the run there. Runs BEFORE resolveAction so the
  // first-run heuristic (does `<App>-SPM.xcodeproj` exist?) checks the
  // correct directory. `clean` keeps refusing because its destructive
  // scopes (--project, --derived-data, --cache) shouldn't silently
  // retarget a different directory.
  const redirectTo = detectStandardRnLayoutRedirect(appRoot, projectRoot);
  if (redirectTo != null) {
    const redirectAction = args.action ?? 'init';
    if (redirectAction === 'clean') {
      logError(formatRnRootMismatchMessage(projectRoot, redirectTo));
      process.exitCode = 1;
      return;
    }
    log(
      `\x1b[33mDetected standard RN layout — running ${redirectAction} in ${displayPath(redirectTo)} ` +
        `instead of ${displayPath(appRoot)}.\x1b[0m`,
    );
    appRoot = redirectTo;
  }

  const action = resolveAction(args.action, appRoot);

  log(`Running SPM ${action} in: ${displayPath(appRoot)}`);
  if (projectRoot !== appRoot) {
    log(`Project root (package.json): ${displayPath(projectRoot)}`);
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

    // Destructive scopes ask for confirmation unless --yes is passed:
    //   --derived-data / --cache   touch state outside appRoot
    //   --project                  removes the committed <App>-SPM.xcodeproj/
    // The xcodeproj carries the user's signing, capabilities, build phases
    // and is committed to the repo — deleting it loses Xcode-side edits.
    const isDestructive = wantDerivedData || wantCache || wantProject;
    if (isDestructive && !args.cleanYes) {
      const targets = gatherCleanTargets(appRoot, cleanOpts).filter(t => {
        // Existence check varies by target shape: rename targets reference
        // a `from` (the .legacy backup); delete targets reference a `path`.
        if (t.kind === 'rename') {
          return fs.existsSync(t.from);
        }
        return fs.existsSync(t.path);
      });
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
  let autolinkingConfigResult /*: ?AutolinkingConfigResult */ = null;
  if (needsCliConfig) {
    log('Generating autolinking.json (CLI config)...');
    try {
      autolinkingConfigResult = generateAutolinkingConfig({projectRoot});
      log(
        `Wrote ${path.relative(appRoot, autolinkingConfigResult.outputPath)}`,
      );
    } catch (e) {
      logError(
        `generate-spm-autolinking-config failed: ${e.message}. External native modules may not be discovered.`,
      );
    }
  }
  const reactNativeRoot = resolveReactNativeRoot(
    autolinkingConfigResult,
    projectRoot,
  );
  const version = determineVersion(args, reactNativeRoot);
  log(`React Native version: ${version}`);
  // The artifact cache directory is resolved later in ensureArtifacts so the
  // nightly hash can be folded in for dev / nightly labels. That branch logs
  // either "Downloading xcframework artifacts (slot: ...)" or
  // "Artifacts already present in ...".

  if (action === 'codegen') {
    runCodegenStep(projectRoot, appRoot, reactNativeRoot, false);
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

  runCodegenStep(projectRoot, appRoot, reactNativeRoot, args.skipCodegen);
  log('Generating build/generated/autolinking/Package.swift...');
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
    );
  } catch (e) {
    logError(`generate-spm-package.js failed: ${e.message}`);
    process.exitCode = 1;
    return;
  }

  // (Re)install the static codegen Package.swift template once build/generated/ios exists.
  installSpmCodegenTemplate(appRoot, reactNativeRoot, {log});

  // Materialize the split header trees (shared RN-core/deps + per-app codegen/
  // autolinking) and write the single-source-of-truth path files the generated
  // manifests read at SPM-eval time. Runs last: folds in the xcframework,
  // codegen, and autolinking headers.
  const headerSlotVersion = await resolveCacheSlotVersion(
    args.version ?? version,
  );
  const sharedHeaders = buildSharedReactCoreHeaderTree(
    projectRoot,
    headerSlotVersion,
    path.join(appRoot, 'build', 'xcframeworks'),
    {log},
  );
  const perAppHeaders = buildPerAppHeaderTree(appRoot, {log});
  logCrossTreeShadows(sharedHeaders, perAppHeaders, {log});
  writeSharedPathsJson(
    projectRoot,
    headerSlotVersion,
    args.version ?? version,
    {log},
  );
  writeAppPathsJson(appRoot, projectRoot, headerSlotVersion, {log});

  let migrationRename /*: {from: string, to: string} | null */ = null;
  if (action === 'init') {
    ensureGitignoreSpmEntries(appRoot);

    // Rename `<App>.xcodeproj` → `<App>.xcodeproj.legacy` so the SPM
    // generator can use the bare `<App>.xcodeproj` slot. Must run BEFORE
    // generateXcodeProject — otherwise the generator's safety check
    // refuses (it won't clobber a legacy without a backup).
    try {
      migrationRename = await maybeMigrateLegacyXcodeproj(args, appRoot);
    } catch (e) {
      logError(`Legacy xcodeproj migration failed: ${e.message}.`);
      return;
    }
  }

  try {
    generateXcodeProject(args, appRoot, reactNativeRoot);
  } catch (e) {
    logError(`generate-spm-xcodeproj.js failed: ${e.message}`);
    process.exitCode = 1;
    return;
  }

  // On `init` only: the Podfile-patch flow is now mostly obsolete because
  // the rename migration eliminates the dual-xcodeproj ambiguity that drove
  // it. It still runs defensively in case the user has a Podfile and an
  // unmigrated legacy somehow remains (e.g. they restored `.legacy` →
  // active and re-ran init).
  if (action === 'init') {
    try {
      await maybePatchPodfile(args, appRoot);
    } catch (e) {
      logError(`Podfile check failed: ${e.message}. Continuing.`);
    }
  }

  logNextSteps(projectRoot, appRoot, args.productName, migrationRename);
}

if (require.main === module) {
  void main();
}

module.exports = {
  main,
  cleanGeneratedState,
  gatherCleanTargets,
  decideLegacyMigration,
  detectStandardRnLayoutRedirect,
  findExistingSpmXcodeproj,
  findLegacyXcodeproj,
  podfileNeedsPatch,
  resolveAction,
};
