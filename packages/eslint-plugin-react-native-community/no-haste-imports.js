/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'disallow Haste module names in import statements and require calls',
    },
    schema: [],
  },

  create(context) {
    return {
      ImportDeclaration(node) {
        checkImportForHaste(context, node.source.value, node.source);
      },
      CallExpression(node) {
        if (isStaticRequireCall(node)) {
          const [firstArgument] = node.arguments;
          checkImportForHaste(context, firstArgument.value, firstArgument);
        }
      },
    };
  },
};

function checkImportForHaste(context, importPath, node) {
  if (isLikelyHasteModuleName(importPath)) {
    context.report({
      node,
      message: `"${importPath}" appears to be a Haste module name. Use path-based imports instead.`,
    });
  }
}

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

function isStaticRequireCall(node) {
  return (
    node &&
    node.callee &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require' &&
    node.arguments.length === 1 &&
    node.arguments[0].type === 'Literal' &&
    typeof node.arguments[0].value === 'string'
  );
}
