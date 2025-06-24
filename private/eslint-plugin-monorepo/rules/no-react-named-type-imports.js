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
      description: 'Disallow named type imports from react',
    },
    messages: {
      noNamedTypeImports:
        'flow-api-translator relies on react types being used under a single React namespace. Prefer `import * as React`.',
    },
    schema: [],
    fixable: 'code',
  },

  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.source.value !== 'react') {
          return;
        }

        if (node.importKind === 'type') {
          context.report({
            node,
            messageId: 'noNamedTypeImports',
          });

          return;
        }

        const hasTypeSpecifier = node.specifiers.some(
          specifier =>
            specifier.type === 'ImportSpecifier' &&
            specifier.importKind === 'type',
        );

        if (hasTypeSpecifier) {
          context.report({
            node,
            messageId: 'noNamedTypeImports',
          });
        }
      },
    };
  },
};
