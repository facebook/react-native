/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
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

const REACT_NATIVE_PACKAGE_ROOT_FOLDER = path.join(
    __dirname,
    '..',
    '..',
    '..',
  ) /*:: as string */;
const CODEGEN_REPO_PATH = `${REACT_NATIVE_REPOSITORY_ROOT}/packages/react-native-codegen`;

const CORE_LIBRARIES_WITH_OUTPUT_FOLDER = {
    FBReactNativeSpec: {
      ios: path.join(
        REACT_NATIVE_PACKAGE_ROOT_FOLDER,
        'React',
        'FBReactNativeSpec',
      ) /*:: as string */,
      android: path.join(
        REACT_NATIVE_PACKAGE_ROOT_FOLDER,
        'ReactAndroid',
        'build',
        'generated',
        'source',
        'codegen',
      ) /*:: as string */,
    },
  } /*:: as {[string]: $FlowFixMe} */;

const packageJsonPath = path.join(
  REACT_NATIVE_PACKAGE_ROOT_FOLDER,
  'package.json',
);

// $FlowFixMe[signature-verification-failure]
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const REACT_NATIVE = packageJson.name;

const TEMPLATES_FOLDER_PATH = path.join(
    REACT_NATIVE_PACKAGE_ROOT_FOLDER,
    'scripts',
    'codegen',
    'templates',
  ) /*:: as string */;

module.exports = {
  CODEGEN_REPO_PATH,
  CORE_LIBRARIES_WITH_OUTPUT_FOLDER,
  REACT_NATIVE_PACKAGE_ROOT_FOLDER,
  REACT_NATIVE,
  TEMPLATES_FOLDER_PATH,
  packageJson,
};
