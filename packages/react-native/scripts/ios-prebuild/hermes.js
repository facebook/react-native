/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Downloads hermes artifacts from the specified version and build type. If you want to specify a specific
 * version of hermes, use the HERMES_VERSION environment variable. The path to the artifacts will be inside
 * the .build/artifacts/hermes folder, but this can be overridden by setting the HERMES_ENGINE_TARBALL_PATH
 * environment variable. If this varuable is set, the script will use the local tarball instead of downloading it.
 */
async function prepareHermesArtifactsAsync(
  version /*:string*/,
  buildType /*:string*/,
  reactNativePath /*:string*/,
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

  // Only check if the artifacts folder exists if we are not using a local tarball
  if (!localPath) {
    // Resolve the version from the environment variable or use the default version
    const resolvedVersion = process.env.HERMES_VERSION ?? version;

    // Check if the Hermes artifacts are already downloaded
    if (checkExistingVersion(resolvedVersion, artifactsPath)) {
      return artifactsPath;
    }

    const sourceType = hermesSourceType(resolvedVersion, reactNativePath);
    localPath = resolveSourceFromSourceType(
      sourceType,
      resolvedVersion,
      reactNativePath,
      artifactsPath,
    );
  } else {
    hermesLog('Using local tarball, skipping artifacts folder check');
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

/*::
type HermesEngineSourceType =
  | 'local_prebuilt_tarball'
  | 'download_prebuild_release_tarball'
  | 'download_prebuilt_nightly_tarball'
  | 'build_from_github_commit'
  | 'build_from_github_tag'
  | 'build_from_github_main'
  | 'build_from_local_source_dir';

*/

const HermesEngineSourceTypes = {
  LOCAL_PREBUILT_TARBALL: 'local_prebuilt_tarball',
  DOWNLOAD_PREBUILD_RELEASE_TARBALL: 'download_prebuild_release_tarball',
  DOWNLOAD_PREBUILT_NIGHTLY_TARBALL: 'download_prebuilt_nightly_tarball',
};

/**
 * Checks if the Hermes artifacts are already downloaded and up to date with the specified version.
 * Returns true if the artifacts are up to date, false otherwise.
 */
function checkExistingVersion(
  version /*: string */,
  artifactsPath /*: string */,
) {
  const versionFilePath = path.join(artifactsPath, 'version.txt');
  if (fs.existsSync(versionFilePath)) {
    const versionFileContent = fs.readFileSync(versionFilePath, 'utf8');
    if (versionFileContent.trim() === version) {
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
  fs.writeFileSync(versionFilePath, version, 'utf8');
  hermesLog(
    `Hermes artifacts folder created: ${artifactsPath} with version: ${version}`,
  );
  return false;
}

function hermesEngineTarballEnvvarDefined() /*: boolean */ {
  return !!process.env.HERMES_ENGINE_TARBALL_PATH;
}

function releaseTarballUrl(
  version /*: string */,
  buildType /*: 'debug' | 'release' */,
) /*: string */ {
  const mavenRepoUrl = 'https://repo1.maven.org/maven2';
  const namespace = 'com/facebook/react';
  return `${mavenRepoUrl}/${namespace}/react-native-artifacts/${version}/react-native-artifacts-${version}-hermes-ios-${buildType}.tar.gz`;
}

function nightlyTarballUrl(version /*: string */) /*: string */ {
  const params = `r=snapshots&g=com.facebook.react&a=react-native-artifacts&c=hermes-ios-debug&e=tar.gz&v=${version}-SNAPSHOT`;
  return resolveUrlRedirects(
    `http://oss.sonatype.org/service/local/artifact/maven/redirect?${params}`,
  );
}

function resolveUrlRedirects(url /*: string */) /*: string */ {
  // Synchronously resolve the final URL after redirects using curl
  try {
    return execSync(`curl -Ls -o /dev/null -w '%{url_effective}' "${url}"`)
      .toString()
      .trim();
  } catch (e) {
    hermesLog(`Failed to resolve URL redirects\n${e}`, 'error');
    return url;
  }
}

function hermesArtifactExists(tarballUrl /*: string */) /*: boolean */ {
  try {
    const code = execSync(
      `curl -o /dev/null --silent -Iw '%{http_code}' -L "${tarballUrl}"`,
    )
      .toString()
      .trim();
    return code === '200';
  } catch (e) {
    return false;
  }
}

function releaseArtifactExists(version /*: string */) /*: boolean */ {
  return hermesArtifactExists(releaseTarballUrl(version, 'debug'));
}

function nightlyArtifactExists(version /*: string */) /*: boolean */ {
  return hermesArtifactExists(nightlyTarballUrl(version).replace(/\\/g, ''));
}

function hermesSourceType(
  version /*: string */,
  reactNativePath /*: string */,
) /*: HermesEngineSourceType */ {
  if (hermesEngineTarballEnvvarDefined()) {
    hermesLog('Using local prebuild tarball');
    return HermesEngineSourceTypes.LOCAL_PREBUILT_TARBALL;
  }
  if (releaseArtifactExists(version)) {
    hermesLog('Using download prebuild release tarball');
    return HermesEngineSourceTypes.DOWNLOAD_PREBUILD_RELEASE_TARBALL;
  }
  if (nightlyArtifactExists(version)) {
    hermesLog('Using download prebuild nightly tarball');
    return HermesEngineSourceTypes.DOWNLOAD_PREBUILT_NIGHTLY_TARBALL;
  }
  hermesLog(
    'Using download prebuild nightly tarball - this is a fallback and might not work.',
  );
  return HermesEngineSourceTypes.DOWNLOAD_PREBUILT_NIGHTLY_TARBALL;
}

function resolveSourceFromSourceType(
  sourceType /*: HermesEngineSourceType */,
  version /*: string */,
  reactNativePath /*: string */,
  artifactsPath /*: string*/,
) /*: string */ {
  switch (sourceType) {
    case HermesEngineSourceTypes.LOCAL_PREBUILT_TARBALL:
      return localPrebuiltTarball();
    case HermesEngineSourceTypes.DOWNLOAD_PREBUILD_RELEASE_TARBALL:
      return downloadPrebuildReleaseTarball(
        reactNativePath,
        version,
        artifactsPath,
      );
    case HermesEngineSourceTypes.DOWNLOAD_PREBUILT_NIGHTLY_TARBALL:
      return downloadPrebuiltNightlyTarball(version, artifactsPath);
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
    return `file://${tarballPath}`;
  }
  abort(
    `[Hermes] HERMES_ENGINE_TARBALL_PATH is set, but points to a non-existing file: "${tarballPath ?? 'unknown'}"\nIf you don't want to use tarball, run 'unset HERMES_ENGINE_TARBALL_PATH'`,
  );
  return '';
}

function downloadPrebuildReleaseTarball(
  reactNativePath /*: string */,
  version /*: string */,
  artifactsPath /*: string*/,
) /*: string */ {
  const url = releaseTarballUrl(version, 'debug');
  hermesLog(`Using release tarball from URL: ${url}`);
  return downloadStableHermes(version, 'release', artifactsPath);
}

function downloadPrebuiltNightlyTarball(
  version /*: string */,
  artifactsPath /*: string*/,
) /*: string */ {
  const url = nightlyTarballUrl(version);
  hermesLog(`Using nightly tarball from URL: ${url}`);
  return downloadStableHermes(version, 'release', artifactsPath);
}

function downloadStableHermes(
  version /*: string */,
  buildType /*: 'debug' | 'release' */,
  artifactsPath /*: string */,
) /*: string */ {
  const tarballUrl = releaseTarballUrl(version, buildType);
  return downloadHermesTarball(tarballUrl, version, buildType, artifactsPath);
}

function downloadHermesTarball(
  tarballUrl /*: string */,
  version /*: string */,
  configuration /*: string */,
  artifactsPath /*: string */,
) /*: string */ {
  const destPath = configuration
    ? `${artifactsPath}/hermes-ios-${version}-${configuration}.tar.gz`
    : `${artifactsPath}/hermes-ios-${version}.tar.gz`;
  if (!fs.existsSync(destPath)) {
    const tmpFile = `${artifactsPath}/hermes-ios.download`;
    try {
      fs.mkdirSync(artifactsPath, {recursive: true});
      execSync(
        `curl "${tarballUrl}" -Lo "${tmpFile}" && mv "${tmpFile}" "${destPath}"`,
      );
    } catch (e) {
      abort(`Failed to download Hermes tarball from ${tarballUrl}`);
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
