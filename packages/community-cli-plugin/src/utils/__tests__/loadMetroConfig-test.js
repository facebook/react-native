/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import loadMetroConfig from '../loadMetroConfig';
import {createTempPackage} from './temporary-package';
import fs from 'fs';
import path from 'path';

/**
 * Resolves a package by its name and creates a symbolic link in a node_modules directory
 */
function createPackageLink(nodeModulesPath: string, packageName: string) {
  // Resolve the packages path on disk
  const destinationPath = path.dirname(require.resolve(packageName));
  const packageScope = packageName.includes('/')
    ? packageName.split('/')[0]
    : undefined;

  // Create a parent directory for a @scoped package
  if (typeof packageScope === 'string') {
    fs.mkdirSync(path.join(nodeModulesPath, packageScope));
  }

  const sourcePath = path.join(nodeModulesPath, packageName);
  fs.symlinkSync(destinationPath, sourcePath);
}

function createTempConfig(projectRoot: string, metroConfig: {...}) {
  const content = `
    const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
    const config = ${JSON.stringify(metroConfig)};
    module.exports = mergeConfig(getDefaultConfig(__dirname), config);
  `;
  const configPath = path.join(projectRoot, 'metro.config.js');
  fs.writeFileSync(configPath, content, 'utf8');

  const nodeModulesPath = path.join(projectRoot, 'node_modules');
  fs.mkdirSync(nodeModulesPath);
  // Create a symbolic link to the '@react-native/metro-config' package used by the config
  createPackageLink(nodeModulesPath, '@react-native/metro-config');
}

const configLoadingContext = {
  reactNativePath: path.dirname(require.resolve('react-native/package.json')),
  platforms: {
    ios: {npmPackageName: 'temp-package'},
    android: {npmPackageName: 'temp-package'},
  },
};

describe('loadMetroConfig', () => {
  test('loads an empty config', async () => {
    const rootPath = createTempPackage({name: 'temp-app'});
    createTempConfig(rootPath, {});

    const loadedConfig = await loadMetroConfig({
      root: rootPath,
      ...configLoadingContext,
    });
    expect(loadedConfig.projectRoot).toEqual(rootPath);
    expect(loadedConfig.watchFolders).toEqual([rootPath]);
  });

  test('loads watch folders', async () => {
    const rootPath = createTempPackage({
      name: 'temp-app',
    });
    createTempConfig(rootPath, {
      watchFolders: ['somewhere-else'],
    });

    const loadedConfig = await loadMetroConfig({
      root: rootPath,
      ...configLoadingContext,
    });
    expect(loadedConfig.projectRoot).toEqual(rootPath);
    expect(loadedConfig.watchFolders).toEqual([rootPath, 'somewhere-else']);
  });

  test('includes an npm workspace root if no watchFolders are defined', async () => {
    const rootPath = createTempPackage({
      name: 'temp-root',
      workspaces: ['packages/temp-app'],
    });
    // Create a config inside a sub-package
    const projectRoot = createTempPackage(
      {
        name: 'temp-app',
      },
      path.join(rootPath, 'packages', 'temp-app'),
    );
    createTempConfig(projectRoot, {});

    const loadedConfig = await loadMetroConfig({
      root: projectRoot,
      ...configLoadingContext,
    });
    expect(loadedConfig.projectRoot).toEqual(projectRoot);
    expect(loadedConfig.watchFolders).toEqual([projectRoot, rootPath]);
  });

  test('does not resolve an npm workspace root if watchFolders are defined', async () => {
    const rootPath = createTempPackage({
      name: 'temp-root',
      workspaces: ['packages/temp-app'],
    });
    // Create a config inside a sub-package
    const projectRoot = createTempPackage(
      {
        name: 'temp-app',
      },
      path.join(rootPath, 'packages', 'temp-app'),
    );
    createTempConfig(projectRoot, {
      watchFolders: [],
    });

    const loadedConfig = await loadMetroConfig({
      root: projectRoot,
      ...configLoadingContext,
    });
    expect(loadedConfig.projectRoot).toEqual(projectRoot);
    expect(loadedConfig.watchFolders).toEqual([projectRoot]);
  });
});
