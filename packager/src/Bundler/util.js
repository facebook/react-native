/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const babel = require('babel-core');
const babelGenerate = require('babel-generator').default;
const babylon = require('babylon');

import type {AssetDescriptor} from '.';

const assetPropertyBlacklist = new Set([
  'files',
  'fileSystemLocation',
  'path',
]);

const ASSET_REGISTRY_PATH = 'react-native/Libraries/Image/AssetRegistry';

function generateAssetCodeFileAst(assetDescriptor: AssetDescriptor): Object {
  const properDescriptor = filterObject(assetDescriptor, assetPropertyBlacklist);
  const descriptorAst = babylon.parseExpression(JSON.stringify(properDescriptor));
  const t = babel.types;
  const moduleExports = t.memberExpression(t.identifier('module'), t.identifier('exports'));
  const requireCall =
    t.callExpression(t.identifier('require'), [t.stringLiteral(ASSET_REGISTRY_PATH)]);
  const registerAssetFunction = t.memberExpression(requireCall, t.identifier('registerAsset'));
  const registerAssetCall = t.callExpression(registerAssetFunction, [descriptorAst]);
  return t.file(t.program([
    t.expressionStatement(t.assignmentExpression('=', moduleExports, registerAssetCall)),
  ]));
}

function generateAssetTransformResult(assetDescriptor: AssetDescriptor): {|
  code: string,
  dependencies: Array<string>,
  dependencyOffsets: Array<number>,
|} {
  const {code} = babelGenerate(
    generateAssetCodeFileAst(assetDescriptor),
    {comments: false, compact: true},
  );
  const dependencies = [ASSET_REGISTRY_PATH];
  const dependencyOffsets = [code.indexOf(ASSET_REGISTRY_PATH) - 1];
  return {code, dependencies, dependencyOffsets};
}

// Test extension against all types supported by image-size module.
// If it's not one of these, we won't treat it as an image.
function isAssetTypeAnImage(type: string): boolean {
  return [
    'png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp', 'psd', 'svg', 'tiff',
  ].indexOf(type) !== -1;
}

function filterObject(object, blacklist) {
  const copied = Object.assign({}, object);
  for (const key of blacklist) {
    delete copied[key];
  }
  return copied;
}

module.exports = {
  generateAssetCodeFileAst,
  generateAssetTransformResult,
  isAssetTypeAnImage
};
