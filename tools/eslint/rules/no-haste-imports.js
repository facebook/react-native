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
      description: 'Disallow importing Haste module names',
      recommended: true,
    },
    messages: {
      hasteImport:
        "'{{importPath}}' seems to be a Haste module name; use path-based imports intead",
    },
    schema: [],
  },

  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments.length === 1
        ) {
          processSource(node.arguments[0]);
        }
      },
      ImportExpression(node) {
        processSource(node.source);
      },
      ImportDeclaration(node) {
        processSource(node.source);
      },
    };

    function processSource(source) {
      if (source.type !== 'Literal' || typeof source.value !== 'string') {
        return;
      }
      const importPath = source.value;
      if (!isLikelyHasteModuleName(importPath)) {
        return;
      }
      context.report({
        node: source,
        messageId: 'hasteImport',
        data: {
          importPath,
        },
      });
    }
  },
};

function isLikelyHasteModuleName(importPath) {
  // Our heuristic assumes an import path is a Haste module name if it is not a
  // path and doesn't appear to be an npm package. For several years, npm has
  // disallowed uppercase characters in package names.
  //
  // This heuristic has a ~1% false negative rate for the filenames in React
  // Native, which is acceptable since the linter will not complain wrongly and
  // the rate is so low. False negatives that slip through will be caught by
  // tests with Haste disabled.
  return (
    // Exclude relative paths
    !importPath.startsWith('.') &&
    // Exclude package-internal paths and scoped packages
    !importPath.includes('/') &&
    // Include camelCase and UpperCamelCase
    /[A-Z]/.test(importPath)
  );
}
