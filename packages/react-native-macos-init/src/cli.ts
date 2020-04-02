/**
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 *
 * @format
 */

import * as yargs from 'yargs';
import * as fs from 'fs';
import * as semver from 'semver';
import {execSync} from 'child_process';
import * as validUrl from 'valid-url';
import * as prompts from 'prompts';
import * as findUp from 'find-up';
import * as chalk from 'chalk';
// @ts-ignore
import * as Registry from 'npm-registry';

const npmConfReg = execSync('npm config get registry')
  .toString()
  .trim();
const NPM_REGISTRY_URL = validUrl.isUri(npmConfReg)
  ? npmConfReg
  : 'http://registry.npmjs.org';
const npm = new Registry({registry: NPM_REGISTRY_URL});

const argv = yargs.version(false).options({
  version: {
    type: 'string',
    describe: 'The version of react-native-macos to use',
  },
  verbose: {type: 'boolean', describe: 'Enables logging'},
  overwrite: {
    type: 'boolean',
    describe: 'Overwrite any existing files without prompting',
  },
  prerelease: {
    type: 'boolean',
    describe: 'Install prerelease version without prompting',
  },
}).argv;

const EXITCODE_NO_MATCHING_RNMACOS = 2;
const EXITCODE_UNSUPPORTED_VERION_RN = 3;
const EXITCODE_USER_CANCEL = 4;
const EXITCODE_NO_REACTNATIVE_FOUND = 5;
const EXITCODE_UNKNOWN_ERROR = 6;
const EXITCODE_NO_PACKAGE_JSON = 7;

function reactNativeMacOSGeneratePath() {
  return require.resolve('react-native-macos/local-cli/generate-macos.js', {
    paths: [process.cwd()],
  });
}

function getReactNativeAppName() {
  console.log('Reading application name from package.json...');
  const cwd = process.cwd();
  const pkgJsonPath = findUp.sync('package.json', {cwd});
  if (!pkgJsonPath) {
    console.error(
      'Unable to find package.json.  This should be run from within an existing react-native app.',
    );
    process.exit(EXITCODE_NO_PACKAGE_JSON);
  }
  let name = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')).name;
  if (!name) {
    const appJsonPath = findUp.sync('app.json', {cwd});
    if (appJsonPath) {
      console.log('Reading application name from app.json...');
      name = JSON.parse(fs.readFileSync(appJsonPath, 'utf8')).name;
    }
  }
  if (!name) {
    console.error('Please specify name in package.json or app.json');
  }
  return name;
}

function getReactNativeVersion() {
  console.log('Reading react-native version from node_modules...');
  const rnPkgJsonPath = require.resolve('react-native/package.json', {
    paths: [process.cwd()],
  });
  if (fs.existsSync(rnPkgJsonPath)) {
    return require(rnPkgJsonPath).version;
  }

  console.error(
    'Error: Must be run from a project that already depends on react-native, and has react-native installed.',
  );
  process.exit(EXITCODE_NO_REACTNATIVE_FOUND);
}

function errorOutOnUnsupportedVersionOfReactNative(rnVersion: string) {
  console.error(`Error: Unsupported version of react-native: ${chalk.cyan(
    rnVersion,
  )}
react-native-macos supports react-native versions ${chalk.cyan('>=0.60')}`);
  process.exit(EXITCODE_UNSUPPORTED_VERION_RN);
}

function getDefaultReactNativeMacOSSemVerForReactNativeVersion(
  rnVersion: string,
  reactNativeMacOSLatestVersion: string
) {
  const validVersion = semver.valid(rnVersion);
  if (validVersion) {
    const majorRN = semver.major(validVersion);
    const minorRN = semver.minor(validVersion);
    if (majorRN === 0 && minorRN >= 60) {
      const majorRNMac = semver.major(reactNativeMacOSLatestVersion);
      const minorRNMac = semver.minor(reactNativeMacOSLatestVersion);
      const major = Math.min(majorRN, majorRNMac);
      const minor = Math.min(minorRN, minorRNMac);
      return `^${major}.${minor}.0-0`;
    }
  }
  errorOutOnUnsupportedVersionOfReactNative(rnVersion);
}

function getMatchingReactNativeSemVerForReactNativeMacOSVersion(
  rnmacVersion: string,
) {
  const validVersion = semver.valid(rnmacVersion);
  if (validVersion) {
    const major = semver.major(validVersion);
    const minor = semver.minor(validVersion);
    if (major === 0 && minor >= 60) {
      return `^${major}.${minor}`;
    }
  }
  return 'unknown';
}

function getLatestMatchingVersion(
  pkg: string,
  versionSemVer: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (semver.validRange(versionSemVer)) {
      // Ideally we'd be able to just use npm.packages.range(pkg, versionSemVer) here,
      // but alas it fails to give us the right result for react-native-macos@^0.60.0-microsoft.57
      // as it fails to return pre-release versions
      npm.packages.releases(
        pkg,
        (err: any, details: {[key: string]: object}) => {
          if (err) {
            reject(err);
          } else if (details) {
            const versions = Object.keys(details);
            if (versions.length > 0) {
              const candidates = versions
                .filter(v => semver.satisfies(v, versionSemVer))
                .sort(semver.rcompare);
              if (candidates && candidates.length > 0) {
                resolve(candidates[0]);
                return;
              }
            }
          }
          reject(
            new Error(`No matching version of ${pkg}@${versionSemVer} found`),
          );
        },
      );
    } else {
      // Assume that versionSemVer is actually a tag
      npm.packages.release(
        pkg,
        versionSemVer,
        (err: any, details: {version: string}[]) => {
          if (err) {
            reject(err);
          } else if (details && details.length > 0) {
            resolve(details[0].version);
            return;
          }
          reject(
            new Error(`No matching version of ${pkg}@${versionSemVer} found`),
          );
        },
      );
    }
  });
}

async function getLatestMatchingReactNativeMacOSVersion(
  versionSemVer: string,
): Promise<string> {
  try {
    const version = await getLatestMatchingVersion(
      'react-native-macos',
      versionSemVer,
    );
    return version;
  } catch (err) {
    console.error(
      `Error: No version of react-native-macos@${versionSemVer} found`,
    );
    process.exit(EXITCODE_NO_MATCHING_RNMACOS);
    return "";
  }
}

/**
 * Check if project is using Yarn (has `yarn.lock` in the tree)
 */
function isProjectUsingYarn(cwd: string) {
  return findUp.sync('yarn.lock', {cwd});
}

(async () => {
  try {
    const name = getReactNativeAppName();
    let version = argv.version;

    const reactNativeMacOSLatestVersion = await getLatestMatchingReactNativeMacOSVersion('latest');

    if (!version) {
      const rnVersion = getReactNativeVersion();
      version = getDefaultReactNativeMacOSSemVerForReactNativeVersion(
        rnVersion,
        reactNativeMacOSLatestVersion
      );
    }

    const reactNativeMacOSResolvedVersion = await getLatestMatchingReactNativeMacOSVersion(version);

    if (!argv.version) {
      console.log(
        `Latest matching version of ${chalk.bold(
          'react-native-macos',
        )} for ${chalk.green('react-native')}@${chalk.cyan(
          getReactNativeVersion(),
        )} is ${chalk.green('react-native-macos')}@${chalk.cyan(
          reactNativeMacOSResolvedVersion,
        )}`,
      );

      if (semver.prerelease(reactNativeMacOSResolvedVersion)) {
        console.warn(
          `
${chalk.green('react-native-macos')}@${chalk.cyan(
            reactNativeMacOSResolvedVersion,
          )} is a ${chalk.yellow('pre-release')} version.
The latest supported version is ${chalk.green(
            'react-native-macos',
          )}@${chalk.cyan(reactNativeMacOSLatestVersion)}.
You can either downgrade your version of ${chalk.green(
            'react-native',
          )} to ${chalk.cyan(
            getMatchingReactNativeSemVerForReactNativeMacOSVersion(
              reactNativeMacOSLatestVersion,
            ),
          )}, or continue with a ${chalk.yellow(
            'pre-release',
          )} version of ${chalk.bold('react-native-macos')}.
`,
        );

        if (!argv.prerelease) {
          const confirm = (await prompts({
            type: 'confirm',
            name: 'confirm',
            message: `Do you wish to continue with ${chalk.green(
              'react-native-macos',
            )}@${chalk.cyan(reactNativeMacOSResolvedVersion)}?`,
          })).confirm;

          if (!confirm) {
            process.exit(EXITCODE_USER_CANCEL);
          }
        }
      }
    }

    const pkgmgr = isProjectUsingYarn(process.cwd())
      ? 'yarn add'
      : 'npm install --save';

    const execOptions = argv.verbose ? {stdio: 'inherit' as 'inherit'} : {};
    console.log(
      `Installing ${chalk.green('react-native-macos')}@${chalk.cyan(
        version,
      )}...`,
    );
    execSync(`${pkgmgr} "react-native-macos@${version}"`, execOptions);
    console.log(
      chalk.green(`react-native-macos@${version} successfully installed.`),
    );

    const generateMacOS = require(reactNativeMacOSGeneratePath());
    generateMacOS(process.cwd(), name, {
      overwrite: argv.overwrite,
      verbose: argv.verbose,
    });
  } catch (error) {
    console.error(chalk.red(error.message));
    console.error(error);
    process.exit(EXITCODE_UNKNOWN_ERROR);
  }
})();