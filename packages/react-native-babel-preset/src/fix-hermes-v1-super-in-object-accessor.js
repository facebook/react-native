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

// Workaround for the genFunctionExpression home-object bug in Hermes V1.
// Fixed in Hermes mainline by https://github.com/facebook/hermes/commit/18a963465944
// (2025-11-04) but the bundled Hermes V1 in this version of React Native
// (250829098.0.13, 2025-08-29 branch cut) predates it, and the fix is not yet
// backported to the `250829098.0.0-stable` branch (`.0.15` tip), so the bug is
// live. Remove this transform per the note in `configs/main.js`.
//
// Object-literal getters and setters that use `super.x` lookups trip Hermes
// V1's home-object path. Rewriting the accessor with a computed string key
// avoids the buggy codegen. Numeric-literal keys are normalised to string
// keys so they take the same safe path.
//
// Ported from `babel-preset-expo` (https://github.com/expo/expo/pull/45601),
// MIT licensed.

function findEnclosingNonComputedObjectAccessor(path) {
  let parentPath = path.parentPath;
  while (parentPath) {
    const node = parentPath.node;
    const type = node.type;
    switch (type) {
      case 'ClassMethod':
      case 'ClassPrivateMethod':
      case 'FunctionExpression':
      case 'FunctionDeclaration':
      case 'StaticBlock':
      case 'ClassProperty':
      case 'ClassPrivateProperty':
        return null;
      case 'ObjectMethod':
        if (!node.computed && (node.kind === 'get' || node.kind === 'set')) {
          return node;
        }
        return null;
    }
    parentPath = parentPath.parentPath;
  }
  return null;
}

module.exports = ({types: t}) => ({
  name: 'fix-hermes-v1-super-in-object-accessor',
  visitor: {
    Super(path) {
      // Only `super.x` / `super[expr]` reach the buggy home-object path.
      // `super()` lives only in derived class constructors and takes a
      // different codepath.
      const parent = path.parent;
      if (parent.type !== 'MemberExpression' || parent.object !== path.node) {
        return;
      }

      const accessor = findEnclosingNonComputedObjectAccessor(path);
      if (accessor) {
        const key = accessor.key;
        if (key.type === 'Identifier') {
          accessor.key = t.stringLiteral(key.name);
        } else if (key.type === 'NumericLiteral') {
          accessor.key = t.stringLiteral(String(key.value));
        } else if (key.type !== 'StringLiteral') {
          return;
        }
        accessor.computed = true;
      }
    },
  },
});
