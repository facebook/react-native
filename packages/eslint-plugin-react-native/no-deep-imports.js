/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {publicAPIMapping} = require('./utils.js');

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
    fixable: 'code',
  },

  create: function (context) {
    return {
      ImportDeclaration(node) {
        if (
          !isDeepReactNativeImport(node.source) ||
          isInitializeCoreImport(node.source)
        ) {
          return;
        }
        if (isDefaultImport(node)) {
          const reactNativeSource = node.source.value.slice(
            'react-native/'.length,
          );
          const publicAPIDefaultComponent = publicAPIMapping[reactNativeSource];
          if (publicAPIDefaultComponent) {
            context.report({
              ...getStandardReport(node.source),
              fix(fixer) {
                return fixer.replaceText(
                  node,
                  `import {${publicAPIDefaultComponent}} from 'react-native';`,
                );
              },
            });
          } else {
            context.report(getStandardReport(node.source));
          }
        } else {
          context.report(getStandardReport(node.source));
        }
      },
      CallExpression(node) {
        if (!isDeepRequire(node) || isInitializeCoreImport(node.arguments[0])) {
          return;
        }

        const parent = node.parent;
        const importPath = node.arguments[0].value;

        if (
          parent.type === 'VariableDeclarator' &&
          parent.id.type === 'Identifier'
        ) {
          const reactNativeSource = importPath.slice('react-native/'.length);
          const publicAPIDefaultComponent = publicAPIMapping[reactNativeSource];
          if (publicAPIDefaultComponent) {
            context.report({
              ...getStandardReport(node.arguments[0]),
              fix(fixer) {
                return fixer.replaceText(
                  parent,
                  `{${publicAPIDefaultComponent}} = require('react-native')`,
                );
              },
            });
          } else {
            context.report(getStandardReport(node.arguments[0]));
          }
        } else {
          context.report(getStandardReport(node.arguments[0]));
        }
      },
    };

    function getStandardReport(source) {
      return {
        node: source,
        messageId: 'deepImport',
        data: {
          importPath: source.value,
        },
      };
    }

    function isDefaultImport(node) {
      return (
        node.specifiers.length === 1 &&
        node.specifiers.some(
          specifier => specifier.type === 'ImportDefaultSpecifier',
        )
      );
    }

    function isDeepRequire(node) {
      return (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'require' &&
        node.arguments.length === 1 &&
        node.arguments[0].type === 'Literal' &&
        typeof node.arguments[0].value === 'string' &&
        isDeepReactNativeImport(node.arguments[0])
      );
    }

    function isDeepReactNativeImport(source) {
      if (source.type !== 'Literal' || typeof source.value !== 'string') {
        return false;
      }

      const importPath = source.value;
      const parts = importPath.split('/');
      return parts.length > 1 && parts[0] === 'react-native';
    }

    function isInitializeCoreImport(source) {
      if (source.type !== 'Literal' || typeof source.value !== 'string') {
        return false;
      }

      return source.value === 'react-native/Libraries/Core/InitializeCore';
    }
  },
};
