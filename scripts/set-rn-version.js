/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/**
 * This script updates relevant React Native files with supplied version:
 *   * Prepares a package.json suitable for package consumption
 *   * Updates package.json for template project
 *   * Updates the version in gradle files and makes sure they are consistent between each other
 *   * Creates a gemfile
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const {cat, echo, exec, exit, sed} = require('shelljs');
const yargs = require('yargs');
const {parseVersion, validateBuildType} = require('./version-utils');
const {saveFiles} = require('./scm-utils');

let argv = yargs
  .option('v', {
    alias: 'to-version',
    type: 'string',
    required: true,
  })
  .option('b', {
    alias: 'build-type',
    type: 'string',
    required: true,
  }).argv;

const buildType = argv.buildType;
const version = argv.toVersion;
validateBuildType(buildType);

let major,
  minor,
  patch,
  prerelease = -1;
try {
  ({major, minor, patch, prerelease} = parseVersion(version, buildType));
} catch (e) {
  echo(e.message);
  exit(1);
}

const tmpVersioningFolder = fs.mkdtempSync(
  path.join(os.tmpdir(), 'rn-set-version'),
);
echo(`The temp versioning folder is ${tmpVersioningFolder}`);

saveFiles(['package.json', 'template/package.json'], tmpVersioningFolder);

fs.writeFileSync(
  'ReactAndroid/src/main/java/com/facebook/react/modules/systeminfo/ReactNativeVersion.java',
  cat('scripts/versiontemplates/ReactNativeVersion.java.template')
    .replace('${major}', major)
    .replace('${minor}', minor)
    .replace('${patch}', patch)
    .replace(
      '${prerelease}',
      prerelease !== undefined ? `"${prerelease}"` : 'null',
    ),
  'utf-8',
);

fs.writeFileSync(
  'React/Base/RCTVersion.m',
  cat('scripts/versiontemplates/RCTVersion.m.template')
    .replace('${major}', `@(${major})`)
    .replace('${minor}', `@(${minor})`)
    .replace('${patch}', `@(${patch})`)
    .replace(
      '${prerelease}',
      prerelease !== undefined ? `@"${prerelease}"` : '[NSNull null]',
    ),
  'utf-8',
);

fs.writeFileSync(
  'ReactCommon/cxxreact/ReactNativeVersion.h',
  cat('scripts/versiontemplates/ReactNativeVersion.h.template')
    .replace('${major}', major)
    .replace('${minor}', minor)
    .replace('${patch}', patch)
    .replace(
      '${prerelease}',
      prerelease !== undefined ? `"${prerelease}"` : '""',
    ),
  'utf-8',
);

fs.writeFileSync(
  'Libraries/Core/ReactNativeVersion.js',
  cat('scripts/versiontemplates/ReactNativeVersion.js.template')
    .replace('${major}', major)
    .replace('${minor}', minor)
    .replace('${patch}', patch)
    .replace(
      '${prerelease}',
      prerelease !== undefined ? `'${prerelease}'` : 'null',
    ),
  'utf-8',
);

let packageJson = JSON.parse(cat('package.json'));
packageJson.version = version;
delete packageJson.workspaces;
delete packageJson.private;

// Copy repo-config/package.json dependencies as devDependencies
const repoConfigJson = JSON.parse(cat('repo-config/package.json'));
packageJson.devDependencies = {
  ...packageJson.devDependencies,
  ...repoConfigJson.dependencies,
};
// Make @react-native/codegen a direct dependency of react-native
delete packageJson.devDependencies['@react-native/codegen'];
packageJson.dependencies = {
  ...packageJson.dependencies,
  '@react-native/codegen': repoConfigJson.dependencies['@react-native/codegen'],
};
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2), 'utf-8');

// Change ReactAndroid/gradle.properties
saveFiles(['ReactAndroid/gradle.properties'], tmpVersioningFolder);
if (
  sed(
    '-i',
    /^VERSION_NAME=.*/,
    `VERSION_NAME=${version}`,
    'ReactAndroid/gradle.properties',
  ).code
) {
  echo("Couldn't update version for Gradle");
  exit(1);
}

// Change react-native version in the template's package.json
exec(`node scripts/set-rn-template-version.js ${version}`);

// Make sure to update ruby version
if (exec('scripts/update-ruby.sh').code) {
  echo('Failed to update Ruby version');
  exit(1);
}

// Verify that files changed, we just do a git diff and check how many times version is added across files
const filesToValidate = [
  'package.json',
  'ReactAndroid/gradle.properties',
  'template/package.json',
];

const numberOfChangedLinesWithNewVersion = exec(
  `diff -r ${tmpVersioningFolder} . | grep '^[>]' | grep -c ${version} `,
  {silent: true},
).stdout.trim();

if (+numberOfChangedLinesWithNewVersion !== filesToValidate.length) {
  // TODO: the logic that checks whether all the changes have been applied
  // is missing several files. For example, it is not checking Ruby version nor that
  // the Objecive-C files, the codegen and other files are properly updated.
  // We are going to work on this in another PR.
  echo('WARNING:');
  echo(
    `Failed to update all the files: [${filesToValidate.join(
      ', ',
    )}] must have versions in them`,
  );
  echo(`These files already had version ${version} set.`);
}

exit(0);
