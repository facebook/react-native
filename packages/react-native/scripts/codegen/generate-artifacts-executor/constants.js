/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const fs = require('fs');
const path = require('path');

const REACT_NATIVE_REPOSITORY_ROOT = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
);

const REACT_NATIVE_PACKAGE_ROOT_FOLDER = path.join(__dirname, '..', '..', '..');
const CODEGEN_REPO_PATH = `${REACT_NATIVE_REPOSITORY_ROOT}/packages/react-native-codegen`;

const RNCORE_CONFIGS = {
  ios: path.join(REACT_NATIVE_PACKAGE_ROOT_FOLDER, 'ReactCommon'),
  android: path.join(
    REACT_NATIVE_PACKAGE_ROOT_FOLDER,
    'ReactAndroid',
    'build',
    'generated',
    'source',
    'codegen',
  ),
};

const CORE_LIBRARIES_WITH_OUTPUT_FOLDER = {
  rncore: RNCORE_CONFIGS,
  FBReactNativeSpec: {
    ios: path.join(
      REACT_NATIVE_PACKAGE_ROOT_FOLDER,
      'React',
      'FBReactNativeSpec',
    ),
    android: path.join(
      REACT_NATIVE_PACKAGE_ROOT_FOLDER,
      'ReactAndroid',
      'build',
      'generated',
      'source',
      'codegen',
    ),
  },
};

const packageJsonPath = path.join(
  REACT_NATIVE_PACKAGE_ROOT_FOLDER,
  'package.json',
);

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
const REACT_NATIVE = packageJson.name;

const TEMPLATES_FOLDER_PATH = path.join(
  REACT_NATIVE_PACKAGE_ROOT_FOLDER,
  'scripts',
  'codegen',
  'templates',
);

module.exports = {
  CODEGEN_REPO_PATH,
  CORE_LIBRARIES_WITH_OUTPUT_FOLDER,
  REACT_NATIVE_PACKAGE_ROOT_FOLDER,
  REACT_NATIVE,
  TEMPLATES_FOLDER_PATH,
  packageJson,
};
