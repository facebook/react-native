/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const path = require('path');

const {REACT_NATIVE_PACKAGE_ROOT_FOLDER} = require('../constants');

const TEMPLATES_FOLDER_PATH = path.join(
  REACT_NATIVE_PACKAGE_ROOT_FOLDER,
  'scripts',
  'codegen',
  'templates',
);

function isReactNativeCoreLibrary(libraryName) {
  return libraryName in CORE_LIBRARIES_WITH_OUTPUT_FOLDER;
}

module.exports = {
  TEMPLATES_FOLDER_PATH,
};
