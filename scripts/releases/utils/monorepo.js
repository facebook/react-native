/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @oncall react_native
 */

const {REPO_ROOT} = require('../../consts');
const fs = require('fs');
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

type ProjectInfo = {
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
      .map(async packageJsonPath => {
        const packagePath = path.dirname(packageJsonPath);
        const packageJson = JSON.parse(
          await fs.promises.readFile(packageJsonPath, 'utf-8'),
        );

        return [
          packageJson.name,
          {
            name: packageJson.name,
            path: packagePath,
            packageJson,
          },
        ];
      }),
  );

  return Object.fromEntries(
    packagesEntries.filter(
      ([_, {packageJson}]) => !packageJson.private || includePrivate,
    ),
  );
}

module.exports = {
  getPackages,
};
