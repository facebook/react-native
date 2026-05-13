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

// Workaround for the variable-caching-for-legacy-classes bug in Hermes V1.
// Fixed in Hermes mainline by https://github.com/facebook/hermes/commit/1e94fbe0ebb4
// (2026-02-12) but the bundled Hermes V1 in this version of React Native
// (250829098.0.13, 2025-08-29 branch cut) predates it, and the fix is not yet
// backported to the `250829098.0.0-stable` branch (`.0.15` tip), so the bug is
// live. Remove this transform per the note in `configs/main.js`.
//
// Class declarations inside a `finally` block trip Hermes V1's variable
// caching path. Wrap them in an IIFE so the class lives in its own function
// scope and the cache miss never happens. Declarations become a `var` binding
// (matching the validated babel-preset-expo source), which widens a
// block-scoped class to function scope: referencing the class before its
// declaration in the same `finally`, or relying on its block scoping, changes
// behaviour.
//
// Ported from `babel-preset-expo` (https://github.com/expo/expo/pull/45601),
// MIT licensed.

function isInFinalizerScope(path) {
  let inner = path;
  let parentPath = path.parentPath;
  while (parentPath) {
    const type = parentPath.node.type;
    switch (type) {
      case 'FunctionExpression':
      case 'FunctionDeclaration':
      case 'ArrowFunctionExpression':
      case 'ObjectMethod':
      case 'ClassMethod':
      case 'ClassPrivateMethod':
      case 'StaticBlock':
        return false;
      case 'TryStatement':
        if (inner.key === 'finalizer') {
          return true;
        }
        break;
    }
    inner = parentPath;
    parentPath = parentPath.parentPath;
  }
  return false;
}

module.exports = ({types: t}) => ({
  name: 'fix-hermes-v1-class-in-finally',
  visitor: {
    ClassDeclaration(path) {
      const id = path.node.id;
      if (
        (path.node.decorators && path.node.decorators.length) ||
        !id ||
        !isInFinalizerScope(path)
      ) {
        return;
      }

      const inner = t.classDeclaration(
        t.cloneNode(id),
        path.node.superClass,
        path.node.body,
        [],
      );

      const arrow = t.arrowFunctionExpression(
        [],
        t.blockStatement([inner, t.returnStatement(t.cloneNode(id))]),
      );

      path.replaceWith(
        t.variableDeclaration('var', [
          t.variableDeclarator(t.cloneNode(id), t.callExpression(arrow, [])),
        ]),
      );
      path.skip();
    },

    ClassExpression(path) {
      if (
        (path.node.decorators && path.node.decorators.length) ||
        !isInFinalizerScope(path)
      ) {
        return;
      }

      let node = path.node;
      if (!node.id) {
        // Preserve the name the class would infer from its binding; the IIFE
        // wrapper drops it because NamedEvaluation only applies to a direct
        // `name = class {}`.
        const parent = path.parent;
        let binding = null;
        if (
          parent.type === 'VariableDeclarator' &&
          parent.id.type === 'Identifier'
        ) {
          binding = parent.id;
        } else if (
          parent.type === 'AssignmentExpression' &&
          parent.left.type === 'Identifier'
        ) {
          binding = parent.left;
        }
        if (binding) {
          node = t.classExpression(
            t.cloneNode(binding),
            node.superClass,
            node.body,
            [],
          );
        }
      }

      const arrow = t.arrowFunctionExpression([], node);
      path.replaceWith(t.callExpression(arrow, []));
      path.skip();
    },
  },
});
