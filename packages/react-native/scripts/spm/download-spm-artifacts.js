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
 *                      Default: ~/Library/Caches/ReactNative/spm-artifacts/{version}/{flavor}/
 *                      (downloaded tarballs are shared with CocoaPods in
 *                      ~/Library/Caches/ReactNative/; RCT_SKIP_CACHES=1 bypasses.)
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

const {
  defaultCacheDir,
  displayPath,
  makeLogger,
  sharedCacheDir,
} = require('./spm-utils');
const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const yargs = require('yargs');

const {log, warn, die} = makeLogger('download-spm-artifacts');

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
        'Where to write xcframeworks. Default: ~/Library/Caches/ReactNative/spm-artifacts/{version}/{flavor}/',
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

/**
 * Returns the cache-slot key for a given raw version label.
 *
 * Stable versions ('0.80.0', '0.81.0', …) become their own slot.
 * Dev / nightly labels ('1000.0.0', 'nightly') resolve to the current
 * nightly version (e.g. '0.85.0-nightly-20260515-abc') so each published
 * nightly is its own slot — a new nightly invalidates automatically
 * instead of sticking on a stale `1000.0.0` cache forever.
 *
 * If the npm registry lookup fails (offline, transient error), falls back
 * to the raw label so a previously-cached slot under that label can still
 * be used. A subsequent download attempt would surface the real error.
 */
async function resolveCacheSlotVersion(
  rawVersion /*: string */,
) /*: Promise<string> */ {
  if (rawVersion !== '1000.0.0' && rawVersion !== 'nightly') {
    return rawVersion;
  }
  try {
    return await resolveNightlyVersion('react-native');
  } catch {
    return rawVersion;
  }
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
 * Returns {url, version} for Hermes. Hermes uses its own version space
 * decoupled from React Native's nightly cadence — RN's `hermes-compiler`
 * npm package publishes a `latest-v1` dist-tag that always resolves to a
 * binary that's been built and uploaded to Maven. Our default mirrors RN's
 * CocoaPods prebuild path (see scripts/ios-prebuild/hermes.js):
 *
 *   HERMES_VERSION unset       → 'latest-v1' dist-tag
 *   HERMES_VERSION=latest-v1   → same (explicit)
 *   HERMES_VERSION=nightly     → hermes-compiler@nightly dist-tag
 *   HERMES_VERSION=<literal>   → use that version verbatim
 *
 * Note: rnVersion / rawVersion are intentionally not consulted. There is no
 * guarantee a hermes-ios artifact exists for any given RN nightly hash —
 * tying them together produces 404s like #(repro case from spikes/MyApp).
 */
async function resolveHermesArtifact(
  rnVersion /*: string */,
  flavor /*: string */,
  rawVersion /*: string | null */,
) /*: Promise<ResolvedArtifact> */ {
  let version = process.env.HERMES_VERSION ?? 'latest-v1';

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

/**
 * Creates a multi-line progress display that keeps N lines pinned at the
 * bottom of the terminal. Each line is prefixed and truncated to the current
 * terminal width — without truncation, a long line (e.g. a FAILED message
 * carrying a URL) wraps to a second row and `\x1b[2K` only clears the first,
 * leaving stray fragments after the next update.
 */
function createProgressDisplay(
  lineCount /*: number */,
  prefix /*: string */ = '',
) /*: {update: (index: number, text: string) => void} */ {
  let initialized = false;

  function truncateToWidth(s /*: string */) /*: string */ {
    // $FlowFixMe[prop-missing] columns lives on tty$WriteStream not stream$Writable
    const cols = process.stdout.columns ?? 120;
    const budget = Math.max(10, cols - 1);
    let out = '';
    let visLen = 0;
    let i = 0;
    while (i < s.length) {
      if (s[i] === '\x1b' && s[i + 1] === '[') {
        // CSI escape: forward through the final letter without counting.
        let j = i + 2;
        while (j < s.length && !/[a-zA-Z]/.test(s[j])) j++;
        out += s.slice(i, j + 1);
        i = j + 1;
      } else {
        if (visLen >= budget - 1) return out + '…\x1b[0m';
        out += s[i];
        visLen++;
        i++;
      }
    }
    return out;
  }

  function update(index /*: number */, text /*: string */) {
    if (!initialized) {
      for (let i = 0; i < lineCount; i++) {
        process.stdout.write('\n');
      }
      initialized = true;
    }
    const moveUp = lineCount - index;
    const line = truncateToWidth(prefix + text);
    process.stdout.write(`\x1b[${moveUp}A\x1b[2K\r${line}\x1b[${moveUp}B\r`);
  }

  return {update};
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
        onProgress(
          path.basename(destPath),
          downloadedBytes,
          totalBytes,
          speed,
          final,
          elapsed,
        );
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
 * @param sharedTarballName        Filename in the flat shared cache to reuse/populate
 *                                 (matches CocoaPods' convention), or null to not share.
 */
async function processArtifact(
  label /*: string */,
  xcframeworkName /*: string */,
  resolvedArtifact /*: ResolvedArtifact */,
  downloadDir /*: string */,
  outputDir /*: string */,
  onProgress /*:: ?: ProgressCallback */,
  sharedTarballName /*:: ?: ?string */,
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

  // Tarball acquisition: prefer the flat shared cache (~/Library/Caches/
  // ReactNative/<name>) that CocoaPods also populates, so SPM and `pod install`
  // reuse the same download. RCT_SKIP_CACHES=1 bypasses it (mirrors CocoaPods).
  const skipCaches = process.env.RCT_SKIP_CACHES === '1';
  const sharedPath =
    !skipCaches && sharedTarballName != null
      ? path.join(sharedCacheDir(), sharedTarballName)
      : null;

  const downloadAndCache = async () /*: Promise<string> */ => {
    const tarName = url.split('/').pop() ?? '';
    const localPath = path.join(downloadDir, tarName);
    await download(
      url,
      localPath,
      onProgress
        ? (name, downloaded, total, speed, done, elapsed) =>
            onProgress(xcframeworkName, downloaded, total, speed, done, elapsed)
        : undefined,
    );
    // Best-effort: save into the flat shared cache for future SPM/CocoaPods runs.
    if (sharedPath != null) {
      try {
        fs.mkdirSync(sharedCacheDir(), {recursive: true});
        fs.copyFileSync(localPath, sharedPath);
      } catch {
        // ignore shared-cache write failures
      }
    }
    return localPath;
  };

  let tarPath /*: string */;
  let fromShared = false;
  if (sharedPath != null && fs.existsSync(sharedPath)) {
    // Shared cache hit — skip the download entirely.
    tarPath = sharedPath;
    fromShared = true;
    if (onProgress) {
      onProgress(xcframeworkName, 0, 0, 0, true, 0);
    } else {
      log(`  Shared cache hit: ${path.basename(sharedPath)}`);
    }
  } else {
    tarPath = await downloadAndCache();
  }

  // Extract to a temp dir, rename to the expected name, then move into outputDir
  if (onProgress) {
    onProgress(xcframeworkName, 0, 0, 0, false, 0);
  }
  const tmpExtractDir = path.join(outputDir, '.extract-tmp', label);
  let xcfwPath /*: string */;
  try {
    xcfwPath = extractXCFramework(tarPath, tmpExtractDir);
  } catch (e) {
    // A poisoned shared tarball must not permanently break SPM: drop it and
    // re-download to the local dir once.
    if (fromShared) {
      try {
        fs.rmSync(tarPath, {force: true});
      } catch {}
      tarPath = await downloadAndCache();
      xcfwPath = extractXCFramework(tarPath, tmpExtractDir);
    } else {
      throw e;
    }
  }

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
    const rnPkg /*: {version: string} */ = JSON.parse(
      fs.readFileSync(path.join(rnRoot, 'package.json'), 'utf8'),
    );
    rnVersion = rnPkg.version;
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
  // Re-bind to const so Flow keeps the non-null narrowing across the closures
  // below (let-bound vars are widened across function boundaries).
  const resolvedRnVersion /*: string */ = rnVersion;

  // Cache key: stable versions slot under their own number. Dev / nightly
  // labels use the resolved nightly hash (e.g. "0.85.0-nightly-20260515-abc")
  // so each published nightly is its own slot — picks up new specs and fixes
  // automatically instead of sticking on a stale "1000.0.0" cache forever.
  const cacheVersionKey =
    rawVersion === 'nightly' || rawVersion === '1000.0.0' || rawVersion == null
      ? resolvedRnVersion
      : rawVersion;
  const outputDir =
    args.output != null
      ? path.resolve(args.output)
      : defaultCacheDir(cacheVersionKey, flavor);
  // Tarballs are cached in a .downloads/ subdirectory to keep them separate
  // from the extracted .xcframework directories.
  const downloadDir = path.join(outputDir, '.downloads');

  fs.mkdirSync(outputDir, {recursive: true});
  fs.mkdirSync(downloadDir, {recursive: true});

  log(`RN version : ${resolvedRnVersion}`);
  log(`Flavor     : ${flavor}`);
  log(`Output     : ${displayPath(outputDir)}`);
  log('');

  // Download all three artifacts in parallel for faster setup
  log('Downloading artifacts in parallel...');

  // `sharedName` builds the flat shared-cache filename in the canonical
  // ~/Library/Caches/ReactNative/ dir, matching the names other RN tooling uses
  // (CocoaPods' rncore.rb / rndependencies.rb for core+deps, and the hermes
  // prebuilt tarball name) so SPM and `pod install` reuse the same downloads.
  // `v` is each artifact's resolved version (RN version for core/deps, the
  // hermes-ios version for hermes).
  const artifactSpecs = [
    {
      label: 'react-core',
      name: 'React',
      resolve: () => resolveRNCoreArtifact(resolvedRnVersion, flavor),
      sharedName: (v /*: string */) => `reactnative-core-${v}-${flavor}.tar.gz`,
    },
    {
      label: 'rndeps',
      name: 'ReactNativeDependencies',
      resolve: () => resolveRNDepsArtifact(resolvedRnVersion, flavor),
      sharedName: (v /*: string */) =>
        `reactnative-dependencies-${v}-${flavor}.tar.gz`,
    },
    {
      label: 'hermes',
      name: 'hermes-engine',
      resolve: () =>
        resolveHermesArtifact(resolvedRnVersion, flavor, rawVersion),
      sharedName: (v /*: string */) => `hermes-ios-${v}-${flavor}.tar.gz`,
    },
  ];

  const progress = createProgressDisplay(
    artifactSpecs.length,
    '\x1b[32m[download-spm-artifacts]\x1b[0m ',
  );

  const makeCallback = (index /*: number */) /*: ProgressCallback */ =>
    (name, downloaded, total, speed, done, elapsed) => {
      if (done && downloaded === 0 && total === 0) {
        progress.update(index, `  ${name}: already cached`);
      } else if (done) {
        const avg = elapsed > 0 ? formatSpeed(downloaded / elapsed) : '';
        progress.update(
          index,
          `  ${name}: done ${formatBytes(downloaded)} in ${elapsed.toFixed(1)}s (${avg})`,
        );
      } else if (total > 0) {
        const pct = ((downloaded / total) * 100).toFixed(1);
        progress.update(
          index,
          `  ${name}: ${formatBytes(downloaded)} / ${formatBytes(total)} (${pct}%) @ ${formatSpeed(speed)}`,
        );
      } else {
        progress.update(index, `  ${name}: extracting...`);
      }
    };

  const results /*: Array<ArtifactResultEntry> */ = await Promise.all(
    artifactSpecs.map(async (spec, index) => {
      try {
        const artifact = await spec.resolve();
        progress.update(index, `  ${spec.name}: resolving...`);
        const sharedTarballName =
          spec.sharedName != null ? spec.sharedName(artifact.version) : null;
        const r = await processArtifact(
          spec.label,
          spec.name,
          artifact,
          downloadDir,
          outputDir,
          makeCallback(index),
          sharedTarballName,
        );
        const ok /*: ArtifactResultEntry */ = {
          name: spec.name,
          error: undefined,
          ...r,
        };
        return ok;
      } catch (e) {
        progress.update(index, `  ${spec.name}: FAILED - ${e.message}`);
        const failed /*: ArtifactResultEntry */ = {
          name: spec.name,
          error: e.message,
        };
        return failed;
      }
    }),
  );
  log('');

  const succeeded = results.filter(r => r.error == null);
  const failed = results.filter(r => r.error != null);

  log('='.repeat(60));
  if (succeeded.length > 0) {
    log('Extracted xcframeworks:');
    log('');
    for (const r of succeeded) {
      if (r.error == null) {
        log(`  ${r.name}`);
        log(`    path: ${displayPath(r.xcframeworkPath)}`);
        log('');
      }
    }
  }
  // Abort on ANY failure — the three artifacts (React, ReactNativeDependencies,
  // hermes-engine) are all required; proceeding with a partial set would only
  // surface as a confusing build error in Xcode. We also intentionally do NOT
  // write artifacts.json when there are failures: the orchestrator uses its
  // presence as the "already present" signal, so a partial write would mask
  // the problem and prevent retries.
  if (failed.length > 0) {
    log('Failed:');
    for (const r of failed) {
      warn(`  ${r.name}: ${r.error ?? 'unknown error'}`);
    }
    die(
      `Failed to download ${failed.length} of ${results.length} artifact(s): ` +
        failed.map(r => r.name).join(', '),
    );
  }

  // Write artifacts.json only on full success.
  const artifactsJson /*: {[string]: {xcframeworkPath: string, url: string}} */ =
    {};
  for (const r of succeeded) {
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
  log(`Artifact index: ${displayPath(artifactsJsonPath)}`);
}

// Canonical set of xcframework artifacts the SPM pipeline downloads. The
// xcodeproj references all three as package products; missing any one
// surfaces as "Missing package product" only at Xcode build time. Used by
// `setup-apple-spm.js` to validate the cache before skipping a re-download.
const REQUIRED_ARTIFACTS = [
  'React',
  'ReactNativeDependencies',
  'hermes-engine',
];

/**
 * Returns null if `artifacts.json` is present, complete (covers every entry
 * in REQUIRED_ARTIFACTS), and each entry's xcframework dir exists on disk.
 * Otherwise returns a string describing what's wrong — caller treats that as
 * "needs re-download". Catches stale partial-write states from older runs
 * that didn't fail loudly on download errors.
 */
function validateArtifactsCache(
  artifactsDir /*: string */,
) /*: string | null */ {
  const artifactsJsonPath = path.join(artifactsDir, 'artifacts.json');
  if (!fs.existsSync(artifactsJsonPath)) {
    return `artifacts.json missing in ${artifactsDir}`;
  }
  let json /*: {[string]: {xcframeworkPath: string, url: string}} */;
  try {
    // $FlowFixMe[unclear-type] JSON.parse returns any
    const parsed /*: any */ = JSON.parse(
      fs.readFileSync(artifactsJsonPath, 'utf8'),
    );
    json = parsed;
  } catch (e) {
    return `artifacts.json is unreadable: ${e.message}`;
  }
  for (const name of REQUIRED_ARTIFACTS) {
    const entry = json[name];
    if (entry == null) {
      return `artifacts.json missing entry for "${name}"`;
    }
    if (!fs.existsSync(entry.xcframeworkPath)) {
      return `xcframework for "${name}" not found at ${entry.xcframeworkPath}`;
    }
  }
  return null;
}

if (require.main === module) {
  main().catch(err => {
    console.error(`\x1b[31m${err.message}\x1b[0m`);
    process.exitCode = 1;
  });
}

module.exports = {
  main,
  resolveCacheSlotVersion,
  resolveHermesArtifact,
  REQUIRED_ARTIFACTS,
  validateArtifactsCache,
};
