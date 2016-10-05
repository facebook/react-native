/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

// RUNS UNTRANSFORMED IN A WORKER PROCESS. ONLY USE NODE 4 COMPATIBLE FEATURES!

const {traverse, types} = require('babel-core');

const isRequireCall = (callee, firstArg) =>
  callee.type !== 'Identifier' ||
  callee.name !== 'require' ||
  !firstArg ||
  firstArg.type !== 'StringLiteral';

function collectDependencies(ast, code) {
  let nextIndex = 0;
  const dependencyIndexes = new Map();

  function getIndex(depencyId) {
    let index = dependencyIndexes.get(depencyId);
    if (index !== undefined) {
      return index;
    }

    index = nextIndex++;
    dependencyIndexes.set(depencyId, index);
    return index;
  }

  traverse(ast, {
    CallExpression(path) {
      const node = path.node;
      const arg = node.arguments[0];
      if (isRequireCall(node.callee, arg)) {
        return;
      }

      node.arguments[0] = types.numericLiteral(getIndex(arg.value));
    }
  });

  return Array.from(dependencyIndexes.keys());
}

module.exports = collectDependencies;
