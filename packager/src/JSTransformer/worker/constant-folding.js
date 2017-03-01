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

import type {Ast, SourceMap} from 'babel-core';
const t = babel.types;

const Conditional = {
  exit(path) {
    const node = path.node;
    const test = node.test;
    if (t.isLiteral(test)) {
      if (test.value || node.alternate) {
        path.replaceWith(test.value ? node.consequent : node.alternate);
      } else if (!test.value) {
        path.remove();
      }
    }
  },
};

const plugin = {
  visitor: {
    BinaryExpression: {
      exit(path) {
        const node = path.node;
        if (t.isLiteral(node.left) && t.isLiteral(node.right)) {
          const result = path.evaluate();
          if (result.confident) {
            path.replaceWith(t.valueToNode(result.value));
          }
        }
      },
    },
    ConditionalExpression: Conditional,
    IfStatement: Conditional,
    LogicalExpression: {
      exit(path) {
        const node = path.node;
        const left = node.left;
        if (t.isLiteral(left)) {
          const value = t.isNullLiteral(left) ? null : left.value;
          if (node.operator === '||') {
            path.replaceWith(value ? left : node.right);
          } else {
            path.replaceWith(value ? node.right : left);
          }
        }
      },
    },
    UnaryExpression: {
      exit(path) {
        const node = path.node;
        if (node.operator === '!' && t.isLiteral(node.argument)) {
          path.replaceWith(t.valueToNode(!node.argument.value));
        }
      },
    },
  },
};

function constantFolding(filename: string, transformResult: {
  ast: Ast,
  code?: ?string,
  map: ?SourceMap,
}) {
  return babel.transformFromAst(transformResult.ast, transformResult.code, {
    filename,
    plugins: [plugin],
    inputSourceMap: transformResult.map,
    sourceMaps: true,
    sourceFileName: filename,
    babelrc: false,
    compact: true,
    retainLines: true,
  });
}

constantFolding.plugin = plugin;
module.exports = constantFolding;
