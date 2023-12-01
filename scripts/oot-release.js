/**
 * Based on `scripts/trigger-react-native-release.js` and `set-rn-version.js`
 *
 * @format
 */

'use strict';

const forEachPackage = require('./monorepo/for-each-package');
const {applyPackageVersions, publishPackage} = require('./npm-utils');
const updateTemplatePackage = require('./update-template-package');
const fs = require('fs');
const path = require('path');
const {cat, echo, exit} = require('shelljs');
const yargs = require('yargs');

/**
 * This script updates core packages to the version of React Native that we are basing on,
 * updates internal visionOS packages and releases them.
 */
if (require.main === module) {
  let {argv} = yargs
    .option('v', {
      alias: 'new-version',
      type: 'string',
      describe:
        'New version of `@callstack/react-native-visionos` to be released',
      required: true,
    })
    .option('r', {
      alias: 'react-native-version',
      type: 'string',
      describe:
        'React Native version that this release is based on. Ex. "0.72.7" or "0.74.0-nightly-20231130-7e5f15b88"',
      required: true,
    })
    .option('t', {
      alias: 'tag',
      type: 'string',
      describe: 'Tag to be used for publishing packages',
      required: false,
    })
    .option('o', {
      alias: 'one-time-password',
      type: 'string',
      describe: 'One time password for npm publish',
      required: false,
    });

  releaseOOT(
    argv.newVersion,
    argv.reactNativeVersion,
    argv.oneTimePassword,
    argv.tag,
  );
  exit(0);
}

function getPackages() {
  const packages = {};
  forEachPackage(
    (packageAbsolutePath, packageRelativePathFromRoot, packageManifest) => {
      packages[packageManifest.name] = packageRelativePathFromRoot;
    },
    {includeReactNative: true},
  );
  return packages;
}

function setPackage(packagePath, version, dependencyVersions) {
  const originalPackageJson = JSON.parse(cat(`${packagePath}/package.json`));
  const packageJson =
    dependencyVersions != null
      ? applyPackageVersions(originalPackageJson, dependencyVersions)
      : originalPackageJson;

  packageJson.version = version;

  fs.writeFileSync(
    `${packagePath}/package.json`,
    JSON.stringify(packageJson, null, 2),
    'utf-8',
  );
}

function releaseOOT(
  newVersion,
  reactNativeVersion,
  oneTimePassword,
  tag = 'latest',
) {
  const allPackages = getPackages();
  const corePackages = Object.keys(allPackages).filter(packageName =>
    packageName.startsWith('@react-native/'),
  );
  const visionOSPackages = Object.keys(allPackages).filter(packageName =>
    packageName.startsWith('@callstack/'),
  );

  const corePackagesVersions = corePackages.reduce(
    (acc, pkg) => ({...acc, [pkg]: reactNativeVersion}),
    {},
  );

  // Update `packges/react-native` package.json and all visionOS packages
  visionOSPackages.forEach(pkg => {
    echo(`Setting ${pkg} version to ${newVersion} `);
    setPackage(allPackages[pkg], newVersion, corePackagesVersions);
  });

  // Update template package.json
  updateTemplatePackage({
    'react-native': reactNativeVersion,
    ...corePackagesVersions,
    ...visionOSPackages.reduce((acc, pkg) => ({...acc, [pkg]: newVersion}), {}),
  });
  echo(`Updating template and it's dependencies to ${reactNativeVersion}`);

  // Release visionOS packages only if OTP is passed
  if (!oneTimePassword) {
    return;
  }

  const results = visionOSPackages
    .map(npmPackage => {
      return path.join(__dirname, '..', allPackages[npmPackage]);
    })
    .map(packagePath => {
      echo(`Releasing ${packagePath}`);
      const result = publishPackage(packagePath, {
        tag,
        otp: oneTimePassword,
      });

      return result.code;
    });

  if (results.every(Boolean)) {
    echo(`Failed to publish ${visionOSPackages.join(', ')} packages to npm`);
    return exit(1);
  } else {
    echo(
      `Published ${visionOSPackages.join(
        ', ',
      )} to npm with version: ${newVersion}`,
    );
    return exit(0);
  }
}

module.exports = releaseOOT;
