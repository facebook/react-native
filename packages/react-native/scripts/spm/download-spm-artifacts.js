/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 *
 */

'use strict';

/*:: import type {DownloadArgs, ResolvedArtifact, ProcessResult, ArtifactResultEntry} from './spm-types'; */

/**
 * download-spm-artifacts.js
 *
 * Downloads the three React Native iOS xcframeworks from Maven, extracts
 * them to a local cache directory, and writes artifacts.json for use by
 * generate-spm-package.js.
 *
 * Supports stable releases, nightlies, and snapshot builds, matching
 * the same resolution logic used by the existing CocoaPods scripts.
 *
 * Artifacts handled:
 *   React                  – react-native-core tarball from Maven
 *   ReactNativeDependencies – react-native-dependencies tarball from Maven
 *   hermes-engine          – hermes-ios tarball from Maven
 *
 * Usage:
 *   node scripts/download-spm-artifacts.js [options]
 *
 * Options:
 *   --version <ver>    RN version. Defaults to version in package.json.
 *                      Use "nightly" to resolve the latest nightly.
 *   --flavor  <f>      debug (default) or release.
 *   --output  <dir>    Where to write xcframeworks.
 *                      Default: ~/Library/Caches/com.facebook.ReactNative/spm-artifacts/{version}/{flavor}/
 *
 * Per-artifact version overrides (mirrors existing env vars):
 *   HERMES_VERSION=<ver|nightly|latest-v1>
 *   RN_DEP_VERSION=<ver|nightly>
 *   ENTERPRISE_REPOSITORY=<url>   Custom Maven mirror (must match Maven structure)
 *
 * Output:
 *   <output>/React.xcframework/
 *   <output>/ReactNativeDependencies.xcframework/
 *   <output>/hermes-engine.xcframework/
 *   <output>/artifacts.json        ← maps target names to xcframework paths
 */

const {defaultCacheDir, displayPath, makeLogger} = require('./spm-utils');
const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const yargs = require('yargs');

const {log, warn, die} = makeLogger('download-spm-artifacts');

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

function parseArgs(argv /*: Array<string> */) /*: DownloadArgs */ {
  const parsed = yargs(argv)
    .version(false)
    .option('version', {
      alias: 'v',
      type: 'string',
      describe:
        'RN version. Defaults to version in package.json. Use "nightly" to resolve the latest nightly.',
    })
    .option('flavor', {
      type: 'string',
      default: 'debug',
      describe: 'debug or release',
    })
    .option('output', {
      alias: 'o',
      type: 'string',
      describe:
        'Where to write xcframeworks. Default: ~/Library/Caches/com.facebook.ReactNative/spm-artifacts/{version}/{flavor}/',
    })
    .usage(
      'Usage: $0 [options]\n\nDownloads React Native iOS xcframeworks from Maven.',
    )
    .help()
    .parseSync();

  return {
    version: parsed.version ?? null,
    flavor: parsed.flavor.toLowerCase(),
    output: parsed.output ?? null,
  };
}

// ---------------------------------------------------------------------------
// Maven URL builders
// ---------------------------------------------------------------------------

const MAVEN_RELEASE =
  process.env.ENTERPRISE_REPOSITORY ?? 'https://repo1.maven.org/maven2';
const MAVEN_SNAPSHOT =
  'https://central.sonatype.com/repository/maven-snapshots';

function rnCoreReleaseUrl(
  version /*: string */,
  flavor /*: string */,
) /*: string */ {
  return (
    `${MAVEN_RELEASE}/com/facebook/react/react-native-artifacts/${version}/` +
    `react-native-artifacts-${version}-reactnative-core-${flavor}.tar.gz`
  );
}
function rnDepsReleaseUrl(
  version /*: string */,
  flavor /*: string */,
) /*: string */ {
  return (
    `${MAVEN_RELEASE}/com/facebook/react/react-native-artifacts/${version}/` +
    `react-native-artifacts-${version}-reactnative-dependencies-${flavor}.tar.gz`
  );
}
function hermesReleaseUrl(
  version /*: string */,
  flavor /*: string */,
) /*: string */ {
  return (
    `${MAVEN_RELEASE}/com/facebook/hermes/hermes-ios/${version}/` +
    `hermes-ios-${version}-hermes-ios-${flavor}.tar.gz`
  );
}

/**
 * Resolves a Maven snapshot URL by fetching maven-metadata.xml and extracting
 * the latest timestamp+buildNumber. Mirrors computeNightlyTarballURL() in utils.js.
 *
 * @param {string} version    Base version without -SNAPSHOT suffix (e.g. "0.85.0")
 * @param {string} subGroup   com/facebook/<subGroup>
 * @param {string} coordinate Maven artifact coordinate (e.g. "react-native-artifacts")
 * @param {string} artifactName  Classifier part of the filename (e.g. "reactnative-core-debug.tar.gz")
 */
async function resolveSnapshotUrl(
  version /*: string */,
  subGroup /*: string */,
  coordinate /*: string */,
  artifactName /*: string */,
) /*: Promise<string> */ {
  const metadataUrl =
    `${MAVEN_SNAPSHOT}/com/facebook/${subGroup}/${coordinate}/` +
    `${version}-SNAPSHOT/maven-metadata.xml`;

  log(`  Fetching snapshot metadata: ${metadataUrl}`);
  const res = await fetch(metadataUrl);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch snapshot metadata (${res.status}): ${metadataUrl}`,
    );
  }
  const xml = await res.text();

  const ts = (xml.match(/<timestamp>(.*?)<\/timestamp>/) ?? [])[1];
  const bn = (xml.match(/<buildNumber>(.*?)<\/buildNumber>/) ?? [])[1];
  if (!ts || !bn) {
    throw new Error(
      `Could not parse timestamp/buildNumber from ${metadataUrl}`,
    );
  }

  const fullVersion = `${version}-${ts}-${bn}`;
  return (
    `${MAVEN_SNAPSHOT}/com/facebook/${subGroup}/${coordinate}/` +
    `${version}-SNAPSHOT/${coordinate}-${fullVersion}-${artifactName}`
  );
}

// Snapshot helpers for each artifact
async function rnCoreSnapshotUrl(
  version /*: string */,
  flavor /*: string */,
) /*: Promise<string> */ {
  return resolveSnapshotUrl(
    version,
    'react',
    'react-native-artifacts',
    `reactnative-core-${flavor}.tar.gz`,
  );
}
async function rnDepsSnapshotUrl(
  version /*: string */,
  flavor /*: string */,
) /*: Promise<string> */ {
  return resolveSnapshotUrl(
    version,
    'react',
    'react-native-artifacts',
    `reactnative-dependencies-${flavor}.tar.gz`,
  );
}
async function hermesSnapshotUrl(
  version /*: string */,
  flavor /*: string */,
) /*: Promise<string> */ {
  return resolveSnapshotUrl(
    version,
    'hermes',
    'hermes-ios',
    `hermes-ios-${flavor}.tar.gz`,
  );
}

// ---------------------------------------------------------------------------
// Version resolution
// ---------------------------------------------------------------------------

async function resolveNightlyVersion(
  npmPackage /*: string */,
) /*: Promise<string> */ {
  log(`  Resolving nightly version from npm: ${npmPackage}`);

  const res = await fetch(`https://registry.npmjs.org/${npmPackage}/nightly`);
  if (!res.ok) {
    throw new Error(`npm lookup failed for ${npmPackage}: ${res.status}`);
  }
  const ver = (await res.json()).version;
  log(`  Resolved nightly: ${ver}`);
  return ver;
}

async function resolveLatestV1Version() /*: Promise<string> */ {
  log('  Resolving latest-v1 Hermes from npm...');
  // $FlowFixMe[incompatible-call] global fetch not in Flow stubs
  const res = await fetch(
    'https://registry.npmjs.org/hermes-compiler/latest-v1',
  );
  if (!res.ok) {
    throw new Error(`npm lookup failed: ${res.status}`);
  }
  const ver = (await res.json()).version;
  log(`  Resolved latest-v1: ${ver}`);
  return ver;
}

async function exists(url /*: string */) /*: Promise<boolean> */ {
  try {
    // $FlowFixMe[incompatible-call] global fetch not in Flow stubs
    const res = await fetch(url, {method: 'HEAD'});
    return res.status === 200;
  } catch {
    return false;
  }
}

/**
 * Returns {url, version} for the React Native core xcframework tarball.
 * Resolution order:
 *   1. Stable release on Maven Central
 *   2. Snapshot build on Sonatype
 */
async function resolveRNCoreArtifact(
  version /*: string */,
  flavor /*: string */,
) /*: Promise<ResolvedArtifact> */ {
  const releaseUrl = rnCoreReleaseUrl(version, flavor);
  if (await exists(releaseUrl)) {
    log(`  Using stable release: ${releaseUrl}`);
    return {url: releaseUrl, version};
  }
  log(`  Release not found, trying snapshot...`);
  const snapshotUrl = await rnCoreSnapshotUrl(version, flavor);
  return {url: snapshotUrl, version};
}

/**
 * Returns {url, version} for ReactNativeDependencies.
 * Respects RN_DEP_VERSION env var.
 */
async function resolveRNDepsArtifact(
  rnVersion /*: string */,
  flavor /*: string */,
) /*: Promise<ResolvedArtifact> */ {
  let version = process.env.RN_DEP_VERSION ?? rnVersion;
  if (version === 'nightly') {
    version = await resolveNightlyVersion('react-native');
  }

  const releaseUrl = rnDepsReleaseUrl(version, flavor);
  if (await exists(releaseUrl)) {
    log(`  Using stable release: ${releaseUrl}`);
    return {url: releaseUrl, version};
  }
  log(`  Release not found, trying snapshot...`);
  const snapshotUrl = await rnDepsSnapshotUrl(version, flavor);
  return {url: snapshotUrl, version};
}

/**
 * Returns {url, version} for Hermes.
 * Respects HERMES_VERSION env var (nightly | latest-v1 | specific version).
 *
 * @param {string} rnVersion  Resolved RN version (e.g. "0.85.0-nightly-...")
 * @param {string} flavor     debug or release
 * @param {string|null} rawVersion  Original --version arg before resolution (may be "nightly")
 */
async function resolveHermesArtifact(
  rnVersion /*: string */,
  flavor /*: string */,
  rawVersion /*: string | null */,
) /*: Promise<ResolvedArtifact> */ {
  // HERMES_VERSION overrides everything. If not set, use the raw --version arg
  // (which may be 'nightly') so Hermes resolves its own nightly independently
  // of the RN nightly string that was already resolved.
  let version = process.env.HERMES_VERSION ?? rawVersion ?? rnVersion;

  if (version === 'nightly') {
    version = await resolveNightlyVersion('hermes-compiler');
  } else if (version === 'latest-v1') {
    version = await resolveLatestV1Version();
  }

  const releaseUrl = hermesReleaseUrl(version, flavor);
  if (await exists(releaseUrl)) {
    log(`  Using stable release: ${releaseUrl}`);
    return {url: releaseUrl, version};
  }
  log(`  Release not found, trying snapshot...`);
  const snapshotUrl = await hermesSnapshotUrl(version, flavor);
  return {url: snapshotUrl, version};
}

// ---------------------------------------------------------------------------
// Download with progress
// ---------------------------------------------------------------------------

function formatBytes(bytes /*: number */) /*: string */ {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatSpeed(bytesPerSec /*: number */) /*: string */ {
  if (bytesPerSec < 1024 * 1024) {
    return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
  }
  return `${(bytesPerSec / 1024 / 1024).toFixed(1)} MB/s`;
}

// ---------------------------------------------------------------------------
// Multi-line progress display for parallel downloads
// ---------------------------------------------------------------------------

/**
 * Creates a multi-line progress display that keeps N lines pinned at the
 * bottom of the terminal. Each line can be updated independently.
 */
function createProgressDisplay(lineCount /*: number */) /*: {
  update: (index: number, text: string) => void,
  finish: () => void,
} */ {
  const lines /*: Array<string> */ = new Array(lineCount).fill('');
  let initialized = false;

  function init() {
    if (initialized) return;
    // Print empty lines to reserve space
    for (let i = 0; i < lineCount; i++) {
      process.stdout.write('\n');
    }
    initialized = true;
  }

  function update(index /*: number */, text /*: string */) {
    init();
    lines[index] = text;
    // Move cursor up from bottom to the target line, clear it, write, then move back down
    const moveUp = lineCount - index;
    process.stdout.write(
      `\x1b[${moveUp}A\x1b[2K\r${text}\x1b[${moveUp}B\r`,
    );
  }

  function finish() {
    // Move to after the last line (cursor is already at the bottom)
  }

  return {update, finish};
}

/*::
type ProgressCallback = (label: string, downloaded: number, total: number, speed: number, done: boolean, elapsed: number) => void;
*/

async function download(
  url /*: string */,
  destPath /*: string */,
  onProgress /*:: ?: ProgressCallback */,
) /*: Promise<void> */ {
  if (fs.existsSync(destPath)) {
    log(`  Already cached: ${path.basename(destPath)}`);
    return;
  }

  const tmpPath = destPath + '.download';
  try {
    // $FlowFixMe[incompatible-call] global fetch not in Flow stubs
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${url}`);
    }

    const totalBytes = parseInt(res.headers.get('content-length') ?? '0', 10);
    let downloadedBytes = 0;
    let lastPrintTime = Date.now();
    let lastPrintBytes = 0;
    const startTime = Date.now();

    const fileStream = fs.createWriteStream(tmpPath);

    const reportProgress = (final /*: boolean */ = false) => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;
      const intervalMs = now - lastPrintTime;
      const intervalBytes = downloadedBytes - lastPrintBytes;
      const speed = intervalMs > 0 ? (intervalBytes / intervalMs) * 1000 : 0;

      if (onProgress) {
        onProgress(path.basename(destPath), downloadedBytes, totalBytes, speed, final, elapsed);
      } else {
        // Fallback: single-line progress (used when not in parallel mode)
        let line = `  ${formatBytes(downloadedBytes)}`;
        if (totalBytes > 0) {
          const pct = ((downloadedBytes / totalBytes) * 100).toFixed(1);
          line += ` / ${formatBytes(totalBytes)} (${pct}%)`;
        }
        line += ` @ ${formatSpeed(speed)}`;

        if (final) {
          const totalMb = formatBytes(downloadedBytes);
          const totalSec = elapsed.toFixed(1);
          const avgSpeed =
            elapsed > 0 ? formatSpeed(downloadedBytes / elapsed) : '';
          process.stdout.write(
            `\r  Done: ${totalMb} in ${totalSec}s (avg ${avgSpeed})          \n`,
          );
        } else {
          process.stdout.write(`\r${line}    `);
        }
      }

      if (!final) {
        lastPrintTime = now;
        lastPrintBytes = downloadedBytes;
      }
    };

    if (res.body) {
      // fetch() returns a Web ReadableStream, not a Node.js Readable.
      // Convert it so we can pipe to a file stream and track progress.
      // $FlowFixMe[prop-missing] stream.Readable.fromWeb not in Flow stubs
      const nodeReadable = stream.Readable.fromWeb(res.body);

      await new Promise((resolve, reject) => {
        let progressInterval;
        try {
          progressInterval = setInterval(() => reportProgress(), 500);

          nodeReadable
            .on('data', chunk => {
              downloadedBytes += chunk.length;
            })
            .on('error', err => {
              clearInterval(progressInterval);
              reject(err);
            })
            .pipe(fileStream)
            .on('finish', () => {
              clearInterval(progressInterval);
              reportProgress(true);
              resolve();
            })
            .on('error', err => {
              clearInterval(progressInterval);
              reject(err);
            });
        } catch (err) {
          if (progressInterval != null) clearInterval(progressInterval);
          reject(err);
        }
      });
    } else {
      const buf = await res.arrayBuffer();
      downloadedBytes = buf.byteLength;
      fs.writeFileSync(tmpPath, Buffer.from(buf));
      reportProgress(true);
    }

    fs.renameSync(tmpPath, destPath);
  } catch (err) {
    // Clean up partial .download temp file on failure
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      // temp file may not exist yet
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Extract xcframework from tarball
// ---------------------------------------------------------------------------

/**
 * Extracts a .tar.gz and returns the path to the first .xcframework found.
 */
function extractXCFramework(
  tarPath /*: string */,
  extractDir /*: string */,
) /*: string */ {
  fs.mkdirSync(extractDir, {recursive: true});
  log(`  Extracting ${path.basename(tarPath)}...`);
  execSync(`tar -xzf "${tarPath}" -C "${extractDir}"`, {stdio: 'pipe'});

  const found = findFirst(extractDir, name => name.endsWith('.xcframework'), 8);
  if (found == null) {
    throw new Error(`No .xcframework found after extracting ${tarPath}`);
  }
  log(`  Found: ${path.relative(extractDir, found)}`);
  return found;
}

function findFirst(
  dir /*: string */,
  predicate /*: (name: string) => boolean */,
  depth /*: number */,
) /*: string | null */ {
  if (depth <= 0 || !fs.existsSync(dir)) {
    return null;
  }
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    // $FlowFixMe[incompatible-type] Dirent.name is string|Buffer in Flow but always string here
    const full /*: string */ = path.join(dir, entry.name);
    // $FlowFixMe[incompatible-type] Dirent.name is string|Buffer in Flow but always string here
    if (predicate(entry.name)) {
      return full;
    }
    if (entry.isDirectory()) {
      const hit = findFirst(full, predicate, depth - 1);
      if (hit != null) {
        return hit;
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Per-artifact pipeline: resolve → download → extract xcframework
// ---------------------------------------------------------------------------

/**
 * Downloads a tarball, extracts the xcframework, and places it directly in
 * the output directory as <xcframeworkName>.xcframework/.
 *
 * SPM binaryTarget(path:) accepts a bare .xcframework directory — no zip or
 * checksum needed for local path-based targets.
 *
 * @param {string} label           Internal label (used for log messages)
 * @param {string} xcframeworkName The SPM target name (e.g. "React", "hermes-engine")
 * @param resolvedArtifact         {url, version} from resolve*Artifact()
 * @param {string} downloadDir     Where to cache downloaded tarballs
 * @param {string} outputDir       Where to place the final <name>.xcframework directory
 */
async function processArtifact(
  label /*: string */,
  xcframeworkName /*: string */,
  resolvedArtifact /*: ResolvedArtifact */,
  downloadDir /*: string */,
  outputDir /*: string */,
  onProgress /*:: ?: ProgressCallback */,
) /*: Promise<ProcessResult> */ {
  const {url, version} = resolvedArtifact;

  const destXcfwPath = path.join(outputDir, `${xcframeworkName}.xcframework`);
  if (fs.existsSync(destXcfwPath)) {
    if (onProgress) {
      onProgress(xcframeworkName, 0, 0, 0, true, 0);
    } else {
      log(`  Already extracted: ${xcframeworkName}.xcframework`);
    }
    return {label, version, xcframeworkPath: destXcfwPath, url};
  }

  const tarName = url.split('/').pop() ?? '';
  const tarPath = path.join(downloadDir, tarName);

  await download(url, tarPath, onProgress
    ? (name, downloaded, total, speed, done, elapsed) =>
        onProgress(xcframeworkName, downloaded, total, speed, done, elapsed)
    : undefined,
  );

  // Extract to a temp dir, rename to the expected name, then move into outputDir
  if (onProgress) {
    onProgress(xcframeworkName, 0, 0, 0, false, 0);
  }
  const tmpExtractDir = path.join(outputDir, '.extract-tmp', label);
  const xcfwPath = extractXCFramework(tarPath, tmpExtractDir);

  const actualBasename = path.basename(xcfwPath);
  const expectedBasename = `${xcframeworkName}.xcframework`;
  if (actualBasename !== expectedBasename) {
    const renamed = path.join(tmpExtractDir, expectedBasename);
    fs.renameSync(xcfwPath, renamed);
    fs.renameSync(renamed, destXcfwPath);
  } else {
    fs.renameSync(xcfwPath, destXcfwPath);
  }

  fs.rmSync(tmpExtractDir, {recursive: true, force: true});

  return {label, version, xcframeworkPath: destXcfwPath, url};
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(argv /*:: ?: Array<string> */) /*: Promise<void> */ {
  const args = parseArgs(argv ?? process.argv.slice(2));
  const rnRoot = path.resolve(__dirname, '../..');
  const flavor = args.flavor;

  // Resolve base RN version
  // rawVersion preserves the original --version arg (e.g. 'nightly') before resolution.
  // It is passed to Hermes resolution so it can independently resolve its nightly.
  let rawVersion = args.version;
  let rnVersion = args.version;
  if (rnVersion == null) {
    // $FlowFixMe[incompatible-type] JSON.parse returns any
    rnVersion = (JSON.parse(
      fs.readFileSync(path.join(rnRoot, 'package.json'), 'utf8'),
    ) /*: {version: string} */).version;
  }
  if (rnVersion === '1000.0.0') {
    log('Detected dev version (1000.0.0), resolving as nightly...');
    rawVersion = 'nightly';
  }
  if (rnVersion === 'nightly' || rnVersion === '1000.0.0') {
    rnVersion = await resolveNightlyVersion('react-native');
  }
  if (rnVersion == null) {
    die('Could not determine RN version');
  }

  // Use the raw --version arg (e.g. 'nightly') as the cache key so the slot
  // stays stable even as the resolved nightly hash changes each day.
  const cacheVersionKey = rawVersion ?? rnVersion;
  const outputDir =
    args.output != null
      ? path.resolve(args.output)
      : defaultCacheDir(cacheVersionKey, flavor);
  // Tarballs are cached in a .downloads/ subdirectory to keep them separate
  // from the extracted .xcframework directories.
  const downloadDir = path.join(outputDir, '.downloads');

  fs.mkdirSync(outputDir, {recursive: true});
  fs.mkdirSync(downloadDir, {recursive: true});

  log(`RN version : ${rnVersion}`);
  log(`Flavor     : ${flavor}`);
  log(`Output     : ${displayPath(outputDir)}`);
  log('');

  // Download all three artifacts in parallel for faster setup
  log('Downloading artifacts in parallel...');

  const labels = ['React', 'ReactNativeDeps', 'hermes-engine'];
  const progress = createProgressDisplay(labels.length);

  const makeCallback = (index /*: number */) /*: ProgressCallback */ =>
    (label, downloaded, total, speed, done, elapsed) => {
      if (done && downloaded === 0 && total === 0) {
        progress.update(index, `  ${label}: already cached`);
      } else if (done) {
        const avg = elapsed > 0 ? formatSpeed(downloaded / elapsed) : '';
        progress.update(index, `  ${label}: done ${formatBytes(downloaded)} in ${elapsed.toFixed(1)}s (${avg})`);
      } else if (total > 0) {
        const pct = ((downloaded / total) * 100).toFixed(1);
        progress.update(index, `  ${label}: ${formatBytes(downloaded)} / ${formatBytes(total)} (${pct}%) @ ${formatSpeed(speed)}`);
      } else {
        progress.update(index, `  ${label}: extracting...`);
      }
    };

  const artifactPromises = [
    (async () => {
      try {
        const artifact = await resolveRNCoreArtifact(rnVersion, flavor);
        progress.update(0, `  React: resolving...`);
        const r = await processArtifact(
          'react-core',
          'React',
          artifact,
          downloadDir,
          outputDir,
          makeCallback(0),
        );
        return ({name: 'React', error: undefined, ...r} /*: ArtifactResultEntry */);
      } catch (e) {
        progress.update(0, `  React: FAILED - ${e.message}`);
        return ({name: 'React', error: e.message} /*: ArtifactResultEntry */);
      }
    })(),
    (async () => {
      try {
        const artifact = await resolveRNDepsArtifact(rnVersion, flavor);
        progress.update(1, `  ReactNativeDeps: resolving...`);
        const r = await processArtifact(
          'rndeps',
          'ReactNativeDependencies',
          artifact,
          downloadDir,
          outputDir,
          makeCallback(1),
        );
        return ({name: 'ReactNativeDependencies', error: undefined, ...r} /*: ArtifactResultEntry */);
      } catch (e) {
        progress.update(1, `  ReactNativeDeps: FAILED - ${e.message}`);
        return ({name: 'ReactNativeDependencies', error: e.message} /*: ArtifactResultEntry */);
      }
    })(),
    (async () => {
      try {
        const artifact = await resolveHermesArtifact(rnVersion, flavor, rawVersion);
        progress.update(2, `  hermes-engine: resolving...`);
        const r = await processArtifact(
          'hermes',
          'hermes-engine',
          artifact,
          downloadDir,
          outputDir,
          makeCallback(2),
        );
        return ({name: 'hermes-engine', error: undefined, ...r} /*: ArtifactResultEntry */);
      } catch (e) {
        progress.update(2, `  hermes-engine: FAILED - ${e.message}`);
        return ({name: 'hermes-engine', error: e.message} /*: ArtifactResultEntry */);
      }
    })(),
  ];

  const results /*: Array<ArtifactResultEntry> */ = await Promise.all(artifactPromises);
  progress.finish();
  log('');

  // Write artifacts.json – maps SPM target name → xcframework path + source URL
  const artifactsJson /*: {[string]: {xcframeworkPath: string, url: string}} */ =
    {};
  for (const r of results) {
    if (r.error == null) {
      artifactsJson[r.name] = {xcframeworkPath: r.xcframeworkPath, url: r.url};
    }
  }
  const artifactsJsonPath = path.join(outputDir, 'artifacts.json');
  fs.writeFileSync(
    artifactsJsonPath,
    JSON.stringify(artifactsJson, null, 2) + '\n',
    'utf8',
  );

  // Summary
  log('='.repeat(60));
  let hasOk = false;
  let hasFailed = false;
  for (const r of results) {
    if (r.error == null) {
      if (!hasOk) {
        log('Extracted xcframeworks:');
        log('');
        hasOk = true;
      }
      log(`  ${r.name}`);
      log(`    path: ${displayPath(r.xcframeworkPath)}`);
      log('');
    } else {
      if (!hasFailed) {
        log('Failed:');
        hasFailed = true;
      }
      warn(`  ${r.name}: ${r.error}`);
    }
  }
  if (hasFailed) {
    log('');
  }
  log(`Artifact index: ${displayPath(artifactsJsonPath)}`);
}

if (require.main === module) {
  main().catch(err => {
    console.error(`\x1b[31m${err.message}\x1b[0m`);
    process.exitCode = 1;
  });
}

module.exports = {main, defaultCacheDir, displayPath};
