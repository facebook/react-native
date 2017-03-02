/**
 * Copyright (c) 2016-present, Facebook, Inc.
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
const babylon = require('babylon');

/**
 * Extracts dependencies (module IDs imported with the `require` function) from
 * a string containing code. This walks the full AST for correctness (versus
 * using, for example, regular expressions, that would be faster but inexact.)
 *
 * The result of the dependency extraction is an de-duplicated array of
 * dependencies, and an array of offsets to the string literals with module IDs.
 * The index points to the opening quote.
 */
function extractDependencies(code: string) {
  const ast = babylon.parse(code);
  const dependencies = new Set();
  const dependencyOffsets = [];

  babel.traverse(ast, {
    CallExpression(path) {
      const node = path.node;
      const callee = node.callee;
      const arg = node.arguments[0];
      if (
        callee.type !== 'Identifier' ||
        callee.name !== 'require' ||
        !arg ||
        arg.type !== 'StringLiteral'
      ) {
        return;
      }
      dependencyOffsets.push(arg.start);
      dependencies.add(arg.value);
    },
  });

  return {dependencyOffsets, dependencies: Array.from(dependencies)};
}

module.exports = extractDependencies;
