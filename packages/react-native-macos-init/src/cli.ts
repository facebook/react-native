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
import npmFetch from 'npm-registry';

const npmConfReg = execSync('npm config get registry').toString().trim();
const NPM_REGISTRY_URL = validUrl.isUri(npmConfReg)
  ? npmConfReg
  : 'http://registry.npmjs.org';

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

const RNPKG = 'react-native';
const MACOSPKG = 'react-native-macos';

function reactNativeMacOSGeneratePath() {
  return require.resolve(`${MACOSPKG}/local-cli/generate-macos.js`, {
    paths: [process.cwd()],
  });
}

function getReactNativeAppName() {
  console.log(`Reading ${chalk.cyan('application name')} from package.json…`);
  const cwd = process.cwd();
  const pkgJsonPath = findUp.sync('package.json', {cwd});
  if (!pkgJsonPath) {
    printError(
      `Unable to find package.json. This should be run from within an existing ${RNPKG} app.`,
    );
    process.exit(EXITCODE_NO_PACKAGE_JSON);
  }
  let name = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')).name;
  if (!name) {
    const appJsonPath = findUp.sync('app.json', {cwd});
    if (appJsonPath) {
      console.log(`Reading ${chalk.cyan('application name')} from app.json…`);
      name = JSON.parse(fs.readFileSync(appJsonPath, 'utf8')).name;
    }
  }
  if (!name) {
    printError('Please specify name in package.json or app.json.');
  }
  return name;
}

function getPackageVersion(packageName: string, exitOnError: boolean = true) {
  console.log(`Reading ${chalk.cyan(packageName)} version from node_modules…`);

  try {
    const pkgJsonPath = require.resolve(`${packageName}/package.json`, {
      paths: [process.cwd()],
    });
    if (fs.existsSync(pkgJsonPath)) {
      return require(pkgJsonPath).version;
    }
  } catch (error) {
    if (exitOnError) {
      printError(
        `Must be run from a project that already depends on ${packageName}, and has ${packageName} installed.`,
      );
      process.exit(EXITCODE_NO_REACTNATIVE_FOUND);
    }
  }
}

function getReactNativeVersion() {
  return getPackageVersion(RNPKG);
}

function getReactNativeMacOSVersion() {
  return getPackageVersion(MACOSPKG, false);
}

function errorOutOnUnsupportedVersionOfReactNative(rnVersion: string) {
  printError(`Unsupported version of ${RNPKG}: ${chalk.cyan(rnVersion)}
${MACOSPKG} supports ${RNPKG} versions ${chalk.cyan('>=0.60')}`);
  process.exit(EXITCODE_UNSUPPORTED_VERION_RN);
}

function getDefaultReactNativeMacOSSemVerForReactNativeVersion(
  rnVersion: string,
  reactNativeMacOSLatestVersion: string,
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

async function getLatestMatchingVersion(
  pkg: string,
  versionSemVer: string,
): Promise<string> {
  const npmResponse = await npmFetch.json(pkg, {registry: NPM_REGISTRY_URL});

  // Check if versionSemVer is a tag (i.e. 'canary', 'latest', 'preview', etc.)
  if ('dist-tags' in npmResponse) {
    const distTags = npmResponse['dist-tags'] as Record<string, string>;
    if (versionSemVer in distTags) {
      return distTags[versionSemVer];
    }
  }

  // Check if versionSemVer is a semver version (i.e. '^0.60.0-0', '0.63.1', etc.)
  if ('versions' in npmResponse) {
    const versions = Object.keys(
      npmResponse.versions as Record<string, unknown>,
    );
    if (versions.length > 0) {
      const candidates = versions
        .filter(v => semver.satisfies(v, versionSemVer))
        .sort(semver.rcompare);
      if (candidates.length > 0) {
        return candidates[0];
      }
    }
  }

  throw new Error(`No matching version of ${pkg}@${versionSemVer} found`);
}

async function getLatestMatchingReactNativeMacOSVersion(
  versionSemVer: string,
): Promise<string> {
  try {
    const version = await getLatestMatchingVersion(MACOSPKG, versionSemVer);
    return version;
  } catch (err) {
    printError(`No version of ${printPkg(MACOSPKG, versionSemVer)} found!`);
    process.exit(EXITCODE_NO_MATCHING_RNMACOS);
    return '';
  }
}

/**
 * Check if project is using Yarn (has `yarn.lock` in the tree)
 */
function isProjectUsingYarn(cwd: string) {
  return findUp.sync('yarn.lock', {cwd});
}

/**
 * Outputs decorated version of the package for the CLI
 */
function printPkg(name: string, version?: string) {
  return `${chalk.yellow(name)}${
    version ? `${chalk.grey('@')}${chalk.cyan(version)}` : ''
  }`;
}

/**
 * Prints decorated version of console.error to the CLI
 */
function printError(message: string, ...optionalParams: any[]) {
  console.error(chalk.red(chalk.bold(message)), ...optionalParams);
}

(async () => {
  try {
    const {overwrite, verbose} = argv;
    let version = argv.version;

    const name = getReactNativeAppName();
    const reactNativeVersion = getReactNativeVersion();
    const reactNativeMacOSVersion = getReactNativeMacOSVersion();
    const reactNativeMacOSLatestVersion =
      await getLatestMatchingReactNativeMacOSVersion('latest');

    if (!version) {
      version = getDefaultReactNativeMacOSSemVerForReactNativeVersion(
        reactNativeVersion,
        reactNativeMacOSLatestVersion,
      );
    }

    const reactNativeMacOSResolvedVersion =
      await getLatestMatchingReactNativeMacOSVersion(version);

    if (!argv.version) {
      console.log(
        `Latest matching version of ${chalk.green(MACOSPKG)} for ${printPkg(
          RNPKG,
          reactNativeVersion,
        )} is ${printPkg(MACOSPKG, reactNativeMacOSResolvedVersion)}.`,
      );

      if (semver.prerelease(reactNativeMacOSResolvedVersion)) {
        console.warn(
          `
${printPkg(MACOSPKG, reactNativeMacOSResolvedVersion)} is a ${chalk.bgYellow(
            'pre-release',
          )} version.
The latest supported version is ${printPkg(
            MACOSPKG,
            reactNativeMacOSLatestVersion,
          )}.
You can either downgrade your version of ${chalk.yellow(RNPKG)} to ${chalk.cyan(
            getMatchingReactNativeSemVerForReactNativeMacOSVersion(
              reactNativeMacOSLatestVersion,
            ),
          )}, or continue with a ${chalk.bgYellow(
            'pre-release',
          )} version of ${chalk.yellow(MACOSPKG)}.
`,
        );

        if (!argv.prerelease) {
          const confirm = (
            await prompts({
              type: 'confirm',
              name: 'confirm',
              message: `Do you wish to continue with ${printPkg(
                MACOSPKG,
                reactNativeMacOSResolvedVersion,
              )}?`,
            })
          ).confirm;

          if (!confirm) {
            process.exit(EXITCODE_USER_CANCEL);
          }
        }
      }
    }

    const pkgLatest = printPkg(MACOSPKG, version);

    if (reactNativeMacOSResolvedVersion !== reactNativeMacOSVersion) {
      console.log(
        `${
          reactNativeMacOSVersion ? 'Upgrading to' : 'Installing'
        } ${pkgLatest}…`,
      );

      const pkgmgr = isProjectUsingYarn(process.cwd())
        ? `yarn add${verbose ? '' : ' -s'}`
        : `npm install --save${verbose ? '' : ' --silent'}`;
      const execOptions = verbose ? {stdio: 'inherit' as 'inherit'} : {};
      execSync(`${pkgmgr} "${MACOSPKG}@${version}"`, execOptions);

      console.log(`${pkgLatest} ${chalk.green('successfully installed!')}`);
    } else {
      console.log(
        `${chalk.green('Latest version')} of ${pkgLatest} already installed.`,
      );
    }

    const generateMacOS = require(reactNativeMacOSGeneratePath());
    generateMacOS(process.cwd(), name, {
      overwrite,
      verbose,
    });
  } catch (error) {
    printError(error.message, error);
    process.exit(EXITCODE_UNKNOWN_ERROR);
  }
})();
