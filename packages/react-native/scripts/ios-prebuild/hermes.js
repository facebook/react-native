/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const {promisify} = require('util');
const pipeline = promisify(stream.pipeline);

/**
 * Downloads hermes artifacts from the specified version and build type. If you want to specify a specific
 * version of hermes, use the HERMES_VERSION environment variable. The path to the artifacts will be inside
 * the .build/artifacts/hermes folder, but this can be overridden by setting the HERMES_ENGINE_TARBALL_PATH
 * environment variable. If this varuable is set, the script will use the local tarball instead of downloading it.
 */
async function prepareHermesArtifactsAsync(
  version /*:string*/,
  buildType /*: 'debug' | 'release' */,
) /*: Promise<string> */ {
  hermesLog(`Preparing Hermes...`);

  // See if the user has set the HERMES_ENGINE_TARBALL_PATH environment variable
  let localPath = process.env.HERMES_ENGINE_TARBALL_PATH ?? '';

  // Create artifacts folder
  const artifactsPath /*: string*/ = path.resolve(
    process.cwd(),
    '.build',
    'artifacts',
    'hermes',
  );

  // Ensure that the artifacts folder exists
  fs.mkdirSync(artifactsPath, {recursive: true});

  // Path for keeping track of the current version in the artifacts folder
  const versionFilePath = path.join(artifactsPath, 'version.txt');

  // Only check if the artifacts folder exists if we are not using a local tarball
  if (!localPath) {
    // Resolve the version from the environment variable or use the default version
    let resolvedVersion = process.env.HERMES_VERSION ?? version;

    if (resolvedVersion === 'nightly') {
      hermesLog('Using latest nightly tarball');
      const hermesVersion = await getNightlyVersionFromNPM();
      resolvedVersion = hermesVersion;
    }

    // Check if the Hermes artifacts are already downloaded
    if (
      checkExistingVersion(
        versionFilePath,
        resolvedVersion,
        buildType,
        artifactsPath,
      )
    ) {
      return artifactsPath;
    }

    const sourceType = await hermesSourceType(resolvedVersion, buildType);
    localPath = await resolveSourceFromSourceType(
      sourceType,
      resolvedVersion,
      buildType,
      artifactsPath,
    );
  } else {
    hermesLog('Using local tarball, skipping artifacts folder check');
    // Delete version.txt if it exists
    if (fs.existsSync(versionFilePath)) {
      fs.unlinkSync(versionFilePath);
    }
  }

  // Extract the tar.gz
  execSync(`tar -xzf "${localPath}" -C "${artifactsPath}"`, {
    stdio: 'inherit',
  });

  // Delete the tarball after extraction
  if (!process.env.HERMES_ENGINE_TARBALL_PATH) {
    fs.unlinkSync(localPath);
  }

  return artifactsPath;
}

async function getNightlyVersionFromNPM() /*: Promise<string> */ {
  const npmResponse /*: Response */ = await fetch(
    'https://registry.npmjs.org/react-native/nightly',
  );

  if (!npmResponse.ok) {
    throw new Error(
      `Couldn't get an answer from NPM: ${npmResponse.status} ${npmResponse.statusText}`,
    );
  }

  const json = await npmResponse.json();
  const latestNightly = json.version;
  hermesLog(`Using version ${latestNightly}`);
  return latestNightly;
}

/*::
type HermesEngineSourceType =
  | 'local_prebuilt_tarball'
  | 'download_prebuild_tarball'
  | 'download_prebuilt_nightly_tarball'
*/

const HermesEngineSourceTypes = {
    LOCAL_PREBUILT_TARBALL: 'local_prebuilt_tarball',
    DOWNLOAD_PREBUILD_TARBALL: 'download_prebuild_tarball',
    DOWNLOAD_PREBUILT_NIGHTLY_TARBALL: 'download_prebuilt_nightly_tarball',
  } /*:: as const */;

/**
 * Checks if the Hermes artifacts are already downloaded and up to date with the specified version.
 * Returns true if the artifacts are up to date, false otherwise.
 */
function checkExistingVersion(
  versionFilePath /*: string */,
  version /*: string */,
  buildType /*: 'debug' | 'release' */,
  artifactsPath /*: string */,
) {
  const resolvedVersion = `${version}-${buildType}`;
  const hermesXCFramework = path.join(
    artifactsPath,
    'destroot',
    'Libraries',
    'Frameworks',
    'universal',
    'hermes.xcframework',
  );

  if (fs.existsSync(versionFilePath) && fs.existsSync(hermesXCFramework)) {
    const versionFileContent = fs.readFileSync(versionFilePath, 'utf8');
    if (versionFileContent.trim() === resolvedVersion) {
      hermesLog(
        `Hermes artifacts already downloaded and up to date: ${artifactsPath}`,
      );
      return true;
    }
  }
  // If the version file does not exist or the version does not match, delete the artifacts folder
  fs.rmSync(artifactsPath, {recursive: true, force: true});
  hermesLog(
    `Hermes artifacts folder already exists, but version does not match. Deleting: ${artifactsPath}`,
  );
  // Lets create the version.txt file
  fs.mkdirSync(artifactsPath, {recursive: true});
  fs.writeFileSync(versionFilePath, resolvedVersion, 'utf8');
  hermesLog(
    `Hermes artifacts folder created: ${artifactsPath} with version: ${resolvedVersion}`,
  );
  return false;
}

function hermesEngineTarballEnvvarDefined() /*: boolean */ {
  return !!process.env.HERMES_ENGINE_TARBALL_PATH;
}

function getTarballUrl(
  version /*: string */,
  buildType /*: 'debug' | 'release' */,
) /*: string */ {
  const mavenRepoUrl = 'https://repo1.maven.org/maven2';
  const namespace = 'com/facebook/react';
  return `${mavenRepoUrl}/${namespace}/react-native-artifacts/${version}/react-native-artifacts-${version}-hermes-ios-${buildType}.tar.gz`;
}

function getNightlyTarballUrl(
  version /*: string */,
  buildType /*: 'debug' | 'release' */,
) /*: string */ {
  const params = `r=snapshots&g=com.facebook.react&a=react-native-artifacts&c=hermes-ios-${buildType}&e=tar.gz&v=${version}-SNAPSHOT`;
  return `https://oss.sonatype.org/service/local/artifact/maven/redirect?${params}`;
}

/**
 * Resolves URL redirects using fetch instead of curl
 */
async function resolveUrlRedirects(url /*: string */) /*: Promise<string> */ {
  try {
    const response /*: Response */ = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
    });

    return response.url;
  } catch (e) {
    hermesLog(`Failed to resolve URL redirects\n${e}`, 'error');
    return url;
  }
}

/**
 * Checks if a Hermes artifact exists at the given URL using fetch instead of curl
 */
async function hermesArtifactExists(
  tarballUrl /*: string */,
) /*: Promise<boolean> */ {
  try {
    const response /*: Response */ = await fetch(tarballUrl, {
      method: 'HEAD',
    });

    return response.status === 200;
  } catch (e) {
    return false;
  }
}

/**
 * Determines the source type for Hermes based on availability
 */
async function hermesSourceType(
  version /*: string */,
  buildType /*: 'debug' | 'release' */,
) /*: Promise<HermesEngineSourceType> */ {
  if (hermesEngineTarballEnvvarDefined()) {
    hermesLog('Using local prebuild tarball');
    return HermesEngineSourceTypes.LOCAL_PREBUILT_TARBALL;
  }

  const tarballUrl = getTarballUrl(version, buildType);
  if (await hermesArtifactExists(tarballUrl)) {
    hermesLog(`Using download prebuild ${buildType} tarball`);
    return HermesEngineSourceTypes.DOWNLOAD_PREBUILD_TARBALL;
  }

  // For nightly tarball, we need to resolve redirects first
  const nightlyUrl = await resolveUrlRedirects(
    getNightlyTarballUrl(version, buildType),
  );
  if (await hermesArtifactExists(nightlyUrl)) {
    hermesLog('Using download prebuild nightly tarball');
    return HermesEngineSourceTypes.DOWNLOAD_PREBUILT_NIGHTLY_TARBALL;
  }

  hermesLog(
    'Using download prebuild nightly tarball - this is a fallback and might not work.',
  );
  return HermesEngineSourceTypes.DOWNLOAD_PREBUILT_NIGHTLY_TARBALL;
}

async function resolveSourceFromSourceType(
  sourceType /*: HermesEngineSourceType */,
  version /*: string */,
  buildType /*: 'debug' | 'release' */,
  artifactsPath /*: string*/,
) /*: Promise<string> */ {
  switch (sourceType) {
    case HermesEngineSourceTypes.LOCAL_PREBUILT_TARBALL:
      return localPrebuiltTarball();
    case HermesEngineSourceTypes.DOWNLOAD_PREBUILD_TARBALL:
      return downloadPrebuildTarball(version, buildType, artifactsPath);
    case HermesEngineSourceTypes.DOWNLOAD_PREBUILT_NIGHTLY_TARBALL:
      return downloadPrebuiltNightlyTarball(version, buildType, artifactsPath);
    default:
      abort(
        `[Hermes] Unsupported or invalid source type provided: ${sourceType}`,
      );
      return '';
  }
}

function localPrebuiltTarball() /*: string */ {
  const tarballPath = process.env.HERMES_ENGINE_TARBALL_PATH;
  if (tarballPath && fs.existsSync(tarballPath)) {
    hermesLog(
      `Using pre-built binary from local path defined by HERMES_ENGINE_TARBALL_PATH envvar: ${tarballPath}`,
    );
    return tarballPath;
  }
  abort(
    `[Hermes] HERMES_ENGINE_TARBALL_PATH is set, but points to a non-existing file: "${tarballPath ?? 'unknown'}"\nIf you don't want to use tarball, run 'unset HERMES_ENGINE_TARBALL_PATH'`,
  );
  return '';
}

async function downloadPrebuildTarball(
  version /*: string */,
  buildType /*: 'debug' | 'release' */,
  artifactsPath /*: string*/,
) /*: Promise<string> */ {
  const url = getTarballUrl(version, buildType);
  hermesLog(`Using release tarball from URL: ${url}`);
  return downloadStableHermes(version, buildType, artifactsPath);
}

async function downloadPrebuiltNightlyTarball(
  version /*: string */,
  buildType /*: 'debug' | 'release' */,
  artifactsPath /*: string*/,
) /*: Promise<string> */ {
  const url = await resolveUrlRedirects(
    getNightlyTarballUrl(version, buildType),
  );
  hermesLog(`Using nightly tarball from URL: ${url}`);
  return downloadHermesTarball(url, version, buildType, artifactsPath);
}

async function downloadStableHermes(
  version /*: string */,
  buildType /*: 'debug' | 'release' */,
  artifactsPath /*: string */,
) /*: Promise<string> */ {
  const tarballUrl = getTarballUrl(version, buildType);
  return downloadHermesTarball(tarballUrl, version, buildType, artifactsPath);
}

/**
 * Downloads a Hermes tarball using fetch instead of curl
 */
async function downloadHermesTarball(
  tarballUrl /*: string */,
  version /*: string */,
  buildType /*: 'debug' | 'release' */,
  artifactsPath /*: string */,
) /*: Promise<string> */ {
  const destPath = buildType
    ? `${artifactsPath}/hermes-ios-${version}-${buildType}.tar.gz`
    : `${artifactsPath}/hermes-ios-${version}.tar.gz`;

  if (!fs.existsSync(destPath)) {
    const tmpFile = `${artifactsPath}/hermes-ios.download`;
    try {
      fs.mkdirSync(artifactsPath, {recursive: true});
      hermesLog(`Downloading Hermes tarball from ${tarballUrl}`);

      const response /*: Response */ = await fetch(tarballUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to download: ${response.status} ${response.statusText}`,
        );
      }

      // Create a write stream to the temporary file
      const fileStream = fs.createWriteStream(tmpFile);

      // Use Node.js stream pipeline to safely pipe the response body to the file
      if (response.body) {
        await pipeline(response.body, fileStream);
      } else {
        // For older fetch implementations that don't support response.body as a stream
        const buffer = await response.arrayBuffer();

        fs.writeFileSync(tmpFile, Buffer.from(buffer));
      }

      // Move the temporary file to the destination path
      fs.renameSync(tmpFile, destPath);
    } catch (e) {
      // Clean up the temporary file if it exists
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
      abort(
        `Failed to download Hermes tarball from ${tarballUrl}: ${e.message}`,
      );
    }
  }
  return destPath;
}

function abort(message /*: string */) {
  hermesLog(message, 'error');
  throw new Error(message);
}

function hermesLog(
  message /*: string */,
  level /*: 'info' | 'warning' | 'error' */ = 'warning',
) {
  // Simple log coloring for terminal output
  const prefix = '[Hermes] ';
  let colorFn = (x /*:string*/) => x;
  if (process.stdout.isTTY) {
    if (level === 'info') colorFn = x => `\x1b[32m${x}\x1b[0m`;
    else if (level === 'error') colorFn = x => `\x1b[31m${x}\x1b[0m`;
    else colorFn = x => `\x1b[33m${x}\x1b[0m`;
  }

  console.log(colorFn(prefix + message));
}

module.exports = {
  prepareHermesArtifactsAsync,
};
