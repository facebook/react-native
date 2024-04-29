/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/**
 * React Native's monorepo requires that "devDependencies" be declared at the
 * root package.json and "dependencies" in the `react-native` package.json to
 * permit the ability to segment dependent workspaces into 1) a development
 * workspace root (which depends on the monorepo) and 2) a production workspace
 * (which depends on the `react-native` package).
 */
const PACKAGE_CONSTRAINTS = {
  '@react-native/monorepo': {
    disallowed: [
      {
        property: 'dependencies',
        describe:
          "Declare 'dependencies' in `packages/react-native/package.json`.",
      },
    ],
  },
  'react-native': {
    disallowed: [
      {
        property: 'devDependencies',
        describe: "Declare 'devDependencies' in `<root>/package.json`.",
      },
    ],
  },
};

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce react-native manifest constraints',
    },
    messages: {
      propertyDisallowed:
        "'{{property}}' is disallowed in this file. {{describe}}",
    },
    schema: [],
  },

  create(context) {
    // @see https://www.npmjs.com/package/jsonc-eslint-parser
    if (!context.parserServices.isJSON) {
      return {};
    }
    return {
      'JSONExpressionStatement > JSONObjectExpression'(node) {
        const propertyNodes = {};
        for (const propertyNode of node.properties) {
          propertyNodes[propertyNode.key.value] = propertyNode;
        }

        const name = propertyNodes.name?.value?.value;
        const constraints = PACKAGE_CONSTRAINTS[name];
        if (constraints == null) {
          return;
        }

        for (const {property, describe} of constraints.disallowed) {
          const propertyNode = propertyNodes[property];
          if (propertyNode == null) {
            continue;
          }
          context.report({
            node: propertyNode,
            messageId: 'propertyDisallowed',
            data: {property, describe},
          });
        }
      },
    };
  },
};
