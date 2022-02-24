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
const {cat, echo, exec, exit, sed} = require('shelljs');
const yargs = require('yargs');
const {parseVersion} = require('./version-utils');

let argv = yargs.option('v', {
  alias: 'to-version',
  type: 'string',
}).argv;

const version = argv.toVersion;

if (!version) {
  echo('You must specify a version using -v');
  exit(1);
}

let major,
  minor,
  patch,
  prerelease = -1;
try {
  ({major, minor, patch, prerelease} = parseVersion(version));
} catch (e) {
  echo(e.message);
  exit(1);
}

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
// Make react-native-codegen a direct dependency of react-native
delete packageJson.devDependencies['react-native-codegen'];
packageJson.dependencies = {
  ...packageJson.dependencies,
  'react-native-codegen': repoConfigJson.dependencies['react-native-codegen'],
};
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2), 'utf-8');

// Change ReactAndroid/gradle.properties
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
  `git diff -U0 ${filesToValidate.join(
    ' ',
  )}| grep '^[+]' | grep -c ${version} `,
  {silent: true},
).stdout.trim();

if (+numberOfChangedLinesWithNewVersion !== filesToValidate.length) {
  echo(
    `Failed to update all the files: [${filesToValidate.join(
      ', ',
    )}] must have versions in them`,
  );
  echo('Fix the issue and try again');
  exit(1);
}

exit(0);
