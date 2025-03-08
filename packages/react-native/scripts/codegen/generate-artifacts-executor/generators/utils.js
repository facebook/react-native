/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {CORE_LIBRARIES_WITH_OUTPUT_FOLDER} = require('../constants');

function isReactNativeCoreLibrary(libraryName) {
  return libraryName in CORE_LIBRARIES_WITH_OUTPUT_FOLDER;
}

module.exports = {
  isReactNativeCoreLibrary,
};
