/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow deep imports from react native',
    },
    messages: {
      deepImport:
        "'{{importPath}}' React Native deep imports are deprecated. Please use the top level import instead.",
    },
    schema: [],
  },

  create: function (context) {
    return {
      ImportDeclaration(node) {
        processImport(node.source);
      },
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments.length === 1
        ) {
          processImport(node.arguments[0]);
        }
      },
    };

    function isDeepReactNativeImport(source) {
      if (source.type !== 'Literal' || typeof source.value !== 'string') {
        return false;
      }

      const importPath = source.value;
      const parts = importPath.split('/');
      return parts.length > 1 && parts[0] === 'react-native';
    }

    function processImport(source) {
      if (isDeepReactNativeImport(source)) {
        context.report({
          node: source,
          messageId: 'deepImport',
          data: {
            importPath: source.value,
          },
        });
      }
    }
  },
};
