/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {generateCode} = require('./generateNativeCode');
const {generateSchemaInfo} = require('./generateSchemaInfos');
const {
  buildCodegenIfNeeded,
  findProjectRootLibraries,
  readPkgJsonInDirectory,
} = require('./utils');

function generateFBReactNativeSpecIOS(projectRoot /*: string */) /*: void*/ {
  const ios = 'ios';
  buildCodegenIfNeeded();
  const pkgJson = readPkgJsonInDirectory(projectRoot);
  const fbReactNativeSpecLib = findProjectRootLibraries(
    pkgJson,
    projectRoot,
  ).filter(library => library.config.name === 'FBReactNativeSpec')[0];
  if (!fbReactNativeSpecLib) {
    throw new Error(
      "[Codegen] Can't find FBReactNativeSpec library. Failed to generate rncore artifacts",
    );
  }
  const fbReactNativeSchemaInfo = generateSchemaInfo(fbReactNativeSpecLib, ios);
  generateCode('', fbReactNativeSchemaInfo, false, ios);
}

module.exports = {
  generateFBReactNativeSpecIOS,
};
