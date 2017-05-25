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
import type {ModuleTransportLike} from '../shared/types.flow';

type SubTree<T: ModuleTransportLike> = (
  moduleTransport: T,
  moduleTransportsByPath: Map<string, T>,
) => Generator<number, void, void>;

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

function createRamBundleGroups<T: ModuleTransportLike>(
  ramGroups: $ReadOnlyArray<string>,
  groupableModules: $ReadOnlyArray<T>,
  subtree: SubTree<T>,
): Map<number, Set<number>> {
  // build two maps that allow to lookup module data
  // by path or (numeric) module id;
  const byPath = new Map();
  const byId = new Map();
  groupableModules.forEach(m => {
    byPath.set(m.sourcePath, m);
    byId.set(m.id, m.sourcePath);
  });

  // build a map of group root IDs to an array of module IDs in the group
  const result: Map<number, Set<number>> = new Map(
    ramGroups
      .map(modulePath => {
        const root = byPath.get(modulePath);
        if (root == null) {
          throw Error(`Group root ${modulePath} is not part of the bundle`);
        }
        return [
          root.id,
          // `subtree` yields the IDs of all transitive dependencies of a module
          new Set(subtree(root, byPath)),
        ];
      })
  );

  if (ramGroups.length > 1) {
    // build a map of all grouped module IDs to an array of group root IDs
    const all = new ArrayMap();
    for (const [parent, children] of result) {
      for (const module of children) {
        all.get(module).push(parent);
      }
    }

    // find all module IDs that are part of more than one group
    const doubles = filter(all, ([, parents]) => parents.length > 1);
    for (const [moduleId, parents] of doubles) {
      const parentNames = parents.map(byId.get, byId);
      const lastName = parentNames.pop();
      throw new Error(
        `Module ${byId.get(moduleId) || moduleId} belongs to groups ${
          parentNames.join(', ')}, and ${String(lastName)
          }. Ensure that each module is only part of one group.`
      );
    }
  }

  return result;
}

function * filter(iterator, predicate) {
  for (const value of iterator) {
    if (predicate(value)) {
      yield value;
    }
  }
}

class ArrayMap extends Map {
  get(key) {
    let array = super.get(key);
    if (!array) {
      array = [];
      this.set(key, array);
    }
    return array;
  }
}

module.exports = {
  createRamBundleGroups,
  generateAssetCodeFileAst,
  generateAssetTransformResult,
  isAssetTypeAnImage,
};
