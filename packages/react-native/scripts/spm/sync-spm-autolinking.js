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

/**
 * sync-spm-autolinking.js – Lightweight script invoked by the Xcode pre-build
 * phase to re-run autolinking (step 2) and package generation (step 4) when
 * dependency inputs have changed.
 *
 * Usage (called from the Xcode build phase shell script):
 *   node sync-spm-autolinking.js --app-root <path> --react-native-root <path>
 *
 * This script:
 *   0. Runs react-native codegen → build/generated/ios/
 *   1. Ensures xcframework artifacts are downloaded (auto-heals fresh clones)
 *   2. Calls generate-spm-autolinking.js → build/generated/autolinking/Package.swift
 *   3. Calls generate-spm-package.js → build/xcframeworks/Package.swift + symlinks
 *   4. Resolves the VFS overlay template → build/xcframeworks/React-VFS.yaml
 *   5. Writes build/generated/autolinking/.spm-sync-stamp
 */

const {
  main: downloadArtifacts,
  resolveCacheSlotVersion,
} = require('./download-spm-artifacts');
const {main: generateAutolinking} = require('./generate-spm-autolinking');
const {
  generateAutolinkingConfig,
} = require('./generate-spm-autolinking-config');
const {main: generatePackage} = require('./generate-spm-package');
const {
  defaultCacheDir,
  displayPath,
  findProjectRoot,
  installSpmCodegenTemplate,
  makeLogger,
  readPackageJson,
  resolveAndWriteVFSOverlay,
  runCodegenAndInstallTemplate,
} = require('./spm-utils');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

const {log} = makeLogger('sync-spm-autolinking');

async function main(argv /*:: ?: Array<string> */) /*: Promise<void> */ {
  const parsed = yargs(argv ?? process.argv.slice(2))
    .version(false)
    .option('app-root', {
      type: 'string',
      demandOption: true,
      describe: 'Path to the app directory',
    })
    .option('react-native-root', {
      type: 'string',
      demandOption: true,
      describe: 'Path to react-native package root',
    })
    .help()
    .parseSync();

  const appRoot = path.resolve(parsed['app-root']);
  const reactNativeRoot = path.resolve(parsed['react-native-root']);
  const projectRoot = findProjectRoot(appRoot);

  try {
    runCodegenAndInstallTemplate(projectRoot, appRoot, reactNativeRoot, {log});
  } catch {
    log('Codegen failed — continuing with existing output');
  }

  try {
    const {outputPath} = generateAutolinkingConfig({projectRoot});
    log(`Refreshed ${path.relative(appRoot, outputPath)}`);
  } catch (e) {
    log(
      `Autolinking config refresh failed: ${e.message}. Using existing autolinking.json if present.`,
    );
  }

  const pkg = readPackageJson(reactNativeRoot);
  const rawVersion = pkg?.version ?? '0.0.0';
  const flavor = 'debug';

  // Resolve the cache slot for the current RN version. For dev / nightly
  // labels this is the actual nightly hash, so we look at the right slot
  // even when package.json still says '1000.0.0'. A new nightly publish
  // means a new slot — old `1000.0.0` slots no longer prevent re-download.
  const slotVersion = await resolveCacheSlotVersion(rawVersion);
  const expectedCacheDir = defaultCacheDir(slotVersion, flavor);
  const expectedArtifactsJson = path.join(expectedCacheDir, 'artifacts.json');

  if (!fs.existsSync(expectedArtifactsJson)) {
    log(
      `Downloading xcframework artifacts (slot: ${slotVersion}, ${displayPath(expectedCacheDir)})...`,
    );
    await downloadArtifacts([
      '--version',
      rawVersion,
      '--flavor',
      flavor,
      '--output',
      expectedCacheDir,
    ]);
  } else {
    log(
      `Using cached xcframework artifacts (slot: ${slotVersion}, ${displayPath(expectedCacheDir)})`,
    );
  }
  // Always feed the expected slot into generate-spm-package — it rewrites the
  // local symlinks at <app>/build/xcframeworks/ to point at this slot. If the
  // version changed and they previously pointed at an older slot, this fixes
  // them up. Idempotent when nothing changed.
  const artifactsDir /*: string */ = expectedCacheDir;

  log('Re-generating build/generated/autolinking/Package.swift...');
  generateAutolinking([
    '--app-root',
    appRoot,
    '--react-native-root',
    reactNativeRoot,
  ]);

  log('Re-generating xcframeworks sub-package...');
  generatePackage([
    '--app-root',
    appRoot,
    '--react-native-root',
    reactNativeRoot,
    '--artifacts-dir',
    artifactsDir,
  ]);

  // Re-install the codegen template now that the xcframework symlinks have
  // been (re-)pointed at the current slot. Without this, the template keeps
  // the runtime URL expression from the first install and SPM's cached
  // manifest eval pins the slot path — Xcode then compiles against headers
  // from whichever slot was active when the cache was warmed.
  installSpmCodegenTemplate(appRoot, reactNativeRoot, {log});

  resolveAndWriteVFSOverlay(appRoot, reactNativeRoot, {log});

  const stampPath = path.join(
    appRoot,
    'build',
    'generated',
    'autolinking',
    '.spm-sync-stamp',
  );
  fs.mkdirSync(path.dirname(stampPath), {recursive: true});
  fs.writeFileSync(stampPath, new Date().toISOString() + '\n', 'utf8');
  log('SPM autolinking sync complete.');
}

if (require.main === module) {
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
}

module.exports = {main};
