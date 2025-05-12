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
  const resolved_version = process.env.HERMES_VERSION ?? version;
  hermes_log(`Preparing Hermes v.${resolved_version}...`);

  // Check if the Hermes artifacts are already downloaded
  const artifactsPath /*: string*/ = path.resolve(
    process.cwd(),
    '.build',
    'artifacts',
    'hermes',
  );

  fs.mkdirSync(artifactsPath, {recursive: true});

  let local_path = process.env.HERMES_ENGINE_TARBALL_PATH ?? '';

  // Only check if the artifacts folder exists if we are not using a local tarball
  if (!local_path) {
    if (fs.existsSync(artifactsPath)) {
      // Check hermes version file
      const versionFilePath = path.join(artifactsPath, 'version.txt');
      if (fs.existsSync(versionFilePath)) {
        const versionFileContent = fs.readFileSync(versionFilePath, 'utf8');
        if (versionFileContent.trim() === resolved_version) {
          hermes_log(
            `Hermes artifacts already downloaded and up to date: ${artifactsPath}`,
          );
          return artifactsPath;
        }
      }
      // If the version file does not exist or the version does not match, delete the artifacts folder
      fs.rmSync(artifactsPath, {recursive: true, force: true});
      hermes_log(
        `Hermes artifacts folder already exists, but version does not match. Deleting: ${artifactsPath}`,
      );
      // Lets create the version.txt file
      fs.mkdirSync(artifactsPath, {recursive: true});
      fs.writeFileSync(versionFilePath, resolved_version, 'utf8');
      hermes_log(
        `Hermes artifacts folder created: ${artifactsPath} with version: ${resolved_version}`,
      );
    }

    const sourceType = hermesSourceType(resolved_version, reactNativePath);
    local_path = resolve_source_type(
      sourceType,
      resolved_version,
      reactNativePath,
      artifactsPath,
    );
  } else {
    hermes_log('Using local tarball, skipping artifacts folder check');
  }

  // Extract the tar.gz
  execSync(`tar -xzf "${local_path}" -C "${artifactsPath}"`, {
    stdio: 'inherit',
  });

  // Delete the tarball after extraction
  if (!process.env.HERMES_ENGINE_TARBALL_PATH) {
    fs.unlinkSync(local_path);
  }

  return artifactsPath;
}

/*::
type HermesEngineSourceTypeT =
  | 'local_prebuilt_tarball'
  | 'download_prebuild_release_tarball'
  | 'download_prebuilt_nightly_tarball'
  | 'build_from_github_commit'
  | 'build_from_github_tag'
  | 'build_from_github_main'
  | 'build_from_local_source_dir';

*/

const HermesEngineSourceType = {
  LOCAL_PREBUILT_TARBALL: 'local_prebuilt_tarball',
  DOWNLOAD_PREBUILD_RELEASE_TARBALL: 'download_prebuild_release_tarball',
  DOWNLOAD_PREBUILT_NIGHTLY_TARBALL: 'download_prebuilt_nightly_tarball',
};

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
    hermes_log(`Failed to resolve URL redirects\n${e}`, 'error');
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
) /*: HermesEngineSourceTypeT */ {
  if (hermesEngineTarballEnvvarDefined()) {
    hermes_log('Using local prebuild tarball');
    return HermesEngineSourceType.LOCAL_PREBUILT_TARBALL;
  }
  if (releaseArtifactExists(version)) {
    hermes_log('Using download prebuild release tarball');
    return HermesEngineSourceType.DOWNLOAD_PREBUILD_RELEASE_TARBALL;
  }
  if (nightlyArtifactExists(version)) {
    hermes_log('Using download prebuild nightly tarball');
    return HermesEngineSourceType.DOWNLOAD_PREBUILT_NIGHTLY_TARBALL;
  }
  //return HermesEngineSourceType.BUILD_FROM_GITHUB_MAIN;
  hermes_log(
    'Using download prebuild nightly tarball - this is a fallback and might not work.',
  );
  return HermesEngineSourceType.DOWNLOAD_PREBUILT_NIGHTLY_TARBALL;
}

function resolve_source_type(
  sourceType /*: HermesEngineSourceTypeT */,
  version /*: string */,
  reactNativePath /*: string */,
  artifactsPath /*: string*/,
) /*: string */ {
  switch (sourceType) {
    case HermesEngineSourceType.LOCAL_PREBUILT_TARBALL:
      return local_prebuilt_tarball(artifactsPath);
    case HermesEngineSourceType.DOWNLOAD_PREBUILD_RELEASE_TARBALL:
      return _download_prebuild_release_tarball(
        reactNativePath,
        version,
        artifactsPath,
      );
    case HermesEngineSourceType.DOWNLOAD_PREBUILT_NIGHTLY_TARBALL:
      return _download_prebuilt_nightly_tarball(version, artifactsPath);
    default:
      abort(
        `[Hermes] Unsupported or invalid source type provided: ${sourceType}`,
      );
      return '';
  }
}

function local_prebuilt_tarball(artifactsPath /*: string*/) /*: string */ {
  const tarballPath = process.env.HERMES_ENGINE_TARBALL_PATH;
  if (tarballPath && fs.existsSync(tarballPath)) {
    hermes_log(
      `Using pre-built binary from local path defined by HERMES_ENGINE_TARBALL_PATH envvar: ${tarballPath}`,
    );
    return `file://${tarballPath}`;
  }
  abort(
    `[Hermes] HERMES_ENGINE_TARBALL_PATH is set, but points to a non-existing file: "${tarballPath ?? 'unknown'}"\nIf you don't want to use tarball, run 'unset HERMES_ENGINE_TARBALL_PATH'`,
  );
  return '';
}

function _download_prebuild_release_tarball(
  reactNativePath /*: string */,
  version /*: string */,
  artifactsPath /*: string*/,
) /*: string */ {
  const url = releaseTarballUrl(version, 'debug');
  hermes_log(`Using release tarball from URL: ${url}`);
  return download_stable_hermes(
    reactNativePath,
    version,
    'release',
    artifactsPath,
  );
}

function _download_prebuilt_nightly_tarball(
  version /*: string */,
  artifactsPath /*: string*/,
) /*: string */ {
  const url = nightlyTarballUrl(version);
  hermes_log(`Using nightly tarball from URL: ${url}`);
  return download_stable_hermes('', version, 'release', artifactsPath);
}

function download_stable_hermes(
  reactNativePath /*: string */,
  version /*: string */,
  buildType /*: 'debug' | 'release' */,
  artifactsPath /*: string */,
) /*: string */ {
  const tarballUrl = releaseTarballUrl(version, buildType);
  return download_hermes_tarball(
    reactNativePath,
    tarballUrl,
    version,
    buildType,
    artifactsPath,
  );
}

function download_hermes_tarball(
  reactNativePath /*: string */,
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
  hermes_log(message, 'error');
  throw new Error(message);
}

function hermes_log(
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
