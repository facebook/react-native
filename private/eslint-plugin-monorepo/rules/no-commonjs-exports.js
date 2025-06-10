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

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow CommonJS `module.exports` syntax',
    },
    messages: {
      moduleExports:
        'Use `export` syntax instead of CommonJS `module.exports`.',
      exports: 'Use `export` syntax instead of CommonJS `exports`.',
    },
    schema: [],
  },

  create(context) {
    return {
      MemberExpression(node) {
        if (
          node.object.type === 'Identifier' &&
          node.object.name === 'module' &&
          node.property.type === 'Identifier' &&
          node.property.name === 'exports'
        ) {
          context.report({
            node,
            messageId: 'moduleExports',
          });
          return;
        }

        if (
          node.object.type === 'Identifier' &&
          node.object.name === 'exports'
        ) {
          context.report({
            node,
            messageId: 'exports',
          });
        }
      },
    };
  },
};
