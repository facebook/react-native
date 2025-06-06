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
      description: 'Disallow named Node imports from react',
    },
    messages: {
      nodeImport:
        'React.Node is React.ReactNode in TypeScript. To help us replace these correctly during type translation, prefer `import * as React` and using `React.Node`.',
    },
    schema: [],
  },

  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.source.value === 'react') {
          node.specifiers.forEach(specifier => {
            if (
              specifier.type === 'ImportSpecifier' &&
              specifier.imported.name === 'Node'
            ) {
              context.report({
                node: specifier,
                messageId: 'nodeImport',
              });
            }
          });
        }
      },
    };
  },
};
