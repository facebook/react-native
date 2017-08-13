/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

const babel = require('babel-core');
const t = babel.types;

const NAME = 'regenerator-runtime';
const REGENERATOR_NOT_NEEDED = 'NOT_NEEDED';
const REGENERATOR_NEEDED = 'NEEDED';
const REGENERATOR_ALREADY_REQUIRED = 'ALREADY_REQUIRED';

function flagState(state) {
  if (state !== REGENERATOR_ALREADY_REQUIRED) {
    state.regeneratorRequired = REGENERATOR_NEEDED;
  }
}

function checkRequire(node, state) {
  const method = node.callee.name;
  const args = node.arguments;

  if (
    method === 'require' &&
    t.isStringLiteral(args[0]) &&
    args[0].value.startsWith(NAME)
  ) {
    state.regeneratorRequired = REGENERATOR_ALREADY_REQUIRED;
  }
}

function checkFunction(node, state) {
  // Method is neither a generator nor an async function; skip.
  if (!node.generator && !node.async) {
    return;
  }

  // This will only set the status to needed if it hasn't already been required.
  if (state.regeneratorRequired === REGENERATOR_NOT_NEEDED) {
    state.regeneratorRequired = REGENERATOR_NEEDED;
  }
}

const isGeneratorRequired = {
  CallExpression(path, state) {
    checkRequire(path.node, state);
  },

  FunctionDeclaration(path, state) {
    checkFunction(path.node, state);
  },

  ClassMethod(path, state) {
    checkFunction(path.node, state);
  },

  ArrowFunctionExpression(path, state) {
    checkFunction(path.node, state);
  },

  FunctionExpression(path, state) {
    checkFunction(path.node, state);
  },

  YieldExpression(path, state) {
    flagState(state);
  },

  AwaitExpression(path, state) {
    flagState(state);
  },
};

/**
 * Adds a "const regeneratorRuntime = require('regenerator-runtime') to each
 * file that does not include regenerator-runtime, but requires it because it
 * contains async/await or generators.
 */
module.exports = function() {
  return {
    visitor: {
      Program(path, state) {
        state.regeneratorRequired = REGENERATOR_NOT_NEEDED;
        path.traverse(isGeneratorRequired, state);

        if (state.regeneratorRequired === REGENERATOR_NEEDED) {
          path.node.body.unshift(
            t.variableDeclaration('const', [
              t.variableDeclarator(
                t.identifier('regeneratorRuntime'),
                t.callExpression(t.identifier('require'), [
                  t.stringLiteral(NAME),
                ])
              )
            ])
          );
        }
      },
    },
  };
};
