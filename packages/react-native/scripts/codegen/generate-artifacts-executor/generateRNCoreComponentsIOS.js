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

function generateRNCoreComponentsIOS(projectRoot /*: string */) /*: void*/ {
  const ios = 'ios';
  buildCodegenIfNeeded();
  const pkgJson = readPkgJsonInDirectory(projectRoot);
  const rncoreLib = findProjectRootLibraries(pkgJson, projectRoot).filter(
    library => library.config.name === 'rncore',
  )[0];
  if (!rncoreLib) {
    throw new Error(
      "[Codegen] Can't find rncore library. Failed to generate rncore artifacts",
    );
  }
  const rncoreSchemaInfo = generateSchemaInfo(rncoreLib, ios);
  generateCode('', rncoreSchemaInfo, false, ios);
}

module.exports = {
  generateRNCoreComponentsIOS,
};
