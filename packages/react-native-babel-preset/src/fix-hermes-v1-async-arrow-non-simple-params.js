/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

// Workaround for https://github.com/facebook/hermes/issues/1761.
// Fixed in Hermes mainline by https://github.com/facebook/hermes/commit/68bfb3a48b31
// (2025-09-11) but the bundled Hermes V1 in this version of React Native
// (250829098.0.13, 2025-08-29 branch cut) predates it, and the fix is not yet
// backported to the `250829098.0.0-stable` branch (`.0.15` tip; graft attempt
// facebook/hermes#2030 is still open), so the bug is live. Remove this
// transform per the note in `configs/main.js`.
//
// Async arrow functions with non-simple parameters (destructured patterns,
// defaults, rest) cause Hermes V1 to resolve `await` with `undefined` while
// the function body continues executing in the background. This rewrites the
// arrow into one with a simple identifier parameter and inline destructuring
// so Hermes never sees the buggy shape.
//
// Ported from `babel-preset-expo` (https://github.com/expo/expo/pull/45601),
// MIT licensed.

module.exports = ({types: t}) => ({
  name: 'fix-hermes-v1-async-arrow-non-simple-params',
  visitor: {
    ArrowFunctionExpression(path) {
      const {node} = path;
      if (!node.async || node.params.every(p => t.isIdentifier(p))) {
        return;
      }

      // Hermes V1 rejects any rest param on async arrows. Wrap the body in
      // a sync arrow that calls an inner async arrow with no params.
      if (node.params.some(p => t.isRestElement(p))) {
        const body = !t.isBlockStatement(node.body)
          ? t.blockStatement([t.returnStatement(node.body)])
          : node.body;
        const innerAsync = t.arrowFunctionExpression([], body, true);
        node.async = false;
        node.body = t.callExpression(innerAsync, []);
        return;
      }

      const newParams = [];
      const init = [];
      for (const param of node.params) {
        if (t.isIdentifier(param)) {
          newParams.push(param);
          continue;
        }

        const sym = path.scope.generateUidIdentifier('p');
        if (t.isAssignmentPattern(param)) {
          newParams.push(sym);
          init.push(
            t.variableDeclaration('var', [
              t.variableDeclarator(
                param.left,
                t.conditionalExpression(
                  t.binaryExpression(
                    '===',
                    t.cloneNode(sym),
                    t.identifier('undefined'),
                  ),
                  param.right,
                  t.cloneNode(sym),
                ),
              ),
            ]),
          );
        } else {
          newParams.push(sym);
          init.push(
            t.variableDeclaration('var', [
              t.variableDeclarator(param, t.cloneNode(sym)),
            ]),
          );
        }
      }

      const body = !t.isBlockStatement(node.body)
        ? t.blockStatement([t.returnStatement(node.body)])
        : node.body;
      body.body.unshift(...init);
      node.params = newParams;
      node.body = body;
    },
  },
});
