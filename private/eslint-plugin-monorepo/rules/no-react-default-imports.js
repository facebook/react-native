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
      description: 'Disallow default React imports from react',
    },
    messages: {
      defaultReactImport:
        'import React from "react" is not consistent. Prefer `import * as React`.',
    },
    schema: [],
    fixable: 'code',
  },

  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.source.value === 'react') {
          const defaultSpecifier = node.specifiers.find(
            specifier => specifier.type === 'ImportDefaultSpecifier',
          );

          if (defaultSpecifier && defaultSpecifier.local.name === 'React') {
            if (node.specifiers.length === 1) {
              context.report({
                node: defaultSpecifier,
                messageId: 'defaultReactImport',
                fix(fixer) {
                  return fixer.replaceText(
                    node,
                    "import * as React from 'react';",
                  );
                },
              });
            } else {
              context.report({
                node: defaultSpecifier,
                messageId: 'defaultReactImport',
              });
            }
          }
        }
      },
    };
  },
};
