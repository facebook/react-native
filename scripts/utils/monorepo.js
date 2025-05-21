/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

const {REPO_ROOT} = require('../consts');
const {promises: fs} = require('fs');
const glob = require('glob');
const path = require('path');

const WORKSPACES_CONFIG = 'packages/*';

/*::
export type PackageJson = {
  name: string,
  version: string,
  private?: boolean,
  dependencies?: Record<string, string>,
  devDependencies?: Record<string, string>,
  main?: string,
  ...
};

type PackagesFilter = $ReadOnly<{
  includeReactNative: boolean,
  includePrivate?: boolean,
}>;

export type PackageInfo = {
  // The name of the package
  name: string,

  // The absolute path to the package
  path: string,

  // The parsed package.json contents
  packageJson: PackageJson,
};

export type ProjectInfo = {
  [packageName: string]: PackageInfo,
};
*/

/**
 * Locates monrepo packages and returns a mapping of package names to their
 * metadata. Considers Yarn workspaces under `packages/`.
 */
async function getPackages(
  filter /*: PackagesFilter */,
) /*: Promise<ProjectInfo> */ {
  const {includeReactNative, includePrivate = false} = filter;

  const packagesEntries = await Promise.all(
    glob
      .sync(`${WORKSPACES_CONFIG}/package.json`, {
        cwd: REPO_ROOT,
        absolute: true,
        ignore: includeReactNative
          ? []
          : ['packages/react-native/package.json'],
      })
      .map(parsePackageInfo),
  );

  return Object.fromEntries(
    packagesEntries.filter(
      ([_, {packageJson}]) => packageJson.private !== true || includePrivate,
    ),
  );
}

/**
 * Get the parsed package metadata for the workspace root.
 */
async function getWorkspaceRoot() /*: Promise<PackageInfo> */ {
  const [, packageInfo] = await parsePackageInfo(
    path.join(REPO_ROOT, 'package.json'),
  );

  return packageInfo;
}

async function parsePackageInfo(
  packageJsonPath /*: string */,
) /*: Promise<[string, PackageInfo]> */ {
  const packagePath = path.dirname(packageJsonPath);
  const packageJson /*: PackageJson */ = JSON.parse(
    await fs.readFile(packageJsonPath, 'utf-8'),
  );

  return [
    packageJson.name,
    {
      name: packageJson.name,
      path: packagePath,
      packageJson,
    },
  ];
}

/**
 * Update a given package with the package versions.
 */
async function updatePackageJson(
  {path: packagePath, packageJson} /*: PackageInfo */,
  newPackageVersions /*: $ReadOnly<{[string]: string}> */,
) /*: Promise<void> */ {
  const packageName = packageJson.name;

  if (packageName in newPackageVersions) {
    packageJson.version = newPackageVersions[packageName];
  }

  for (const dependencyField of ['dependencies', 'devDependencies']) {
    const deps = packageJson[dependencyField];

    if (deps == null) {
      continue;
    }

    for (const dependency in newPackageVersions) {
      if (dependency in deps) {
        deps[dependency] = newPackageVersions[dependency];
      }
    }
  }

  return writePackageJson(path.join(packagePath, 'package.json'), packageJson);
}

/**
 * Write a `package.json` file to disk.
 */
async function writePackageJson(
  packageJsonPath /*: string */,
  packageJson /*: PackageJson */,
) /*: Promise<void> */ {
  return fs.writeFile(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + '\n',
  );
}

module.exports = {
  getPackages,
  getWorkspaceRoot,
  updatePackageJson,
};
