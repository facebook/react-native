/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
        'Ensure that PlatformColor() and DynamicColorIOS() are passed literals of the expected shape.',
    },
    messages: {
      platformColorArgsLength:
        'PlatformColor() must have at least one argument that is a literal.',
      platformColorArgTypes:
        'PlatformColor() every argument must be a literal.',
      dynamicColorIOSArg:
        'DynamicColorIOS() must take a single argument of type Object containing two keys: light and dark.',
      dynamicColorIOSLight:
        'DynamicColorIOS() light value must be either a literal or a PlatformColor() call.',
      dynamicColorIOSDark:
        'DynamicColorIOS() dark value must be either a literal or a PlatformColor() call.',
    },
    schema: [],
  },

  create: function(context) {
    return {
      CallExpression: function(node) {
        if (node.callee.name === 'PlatformColor') {
          const args = node.arguments;
          if (args.length === 0) {
            context.report({
              node,
              messageId: 'platformColorArgsLength',
            });
            return;
          }
          if (!args.every(arg => arg.type === 'Literal')) {
            context.report({
              node,
              messageId: 'platformColorArgTypes',
            });
            return;
          }
        } else if (node.callee.name === 'DynamicColorIOS') {
          const args = node.arguments;
          if (!(args.length === 1 && args[0].type === 'ObjectExpression')) {
            context.report({
              node,
              messageId: 'dynamicColorIOSArg',
            });
            return;
          }
          const properties = args[0].properties;
          if (
            !(
              properties.length === 2 &&
              properties[0].type === 'Property' &&
              properties[0].key.name === 'light' &&
              properties[1].type === 'Property' &&
              properties[1].key.name === 'dark'
            )
          ) {
            context.report({
              node,
              messageId: 'dynamicColorIOSArg',
            });
            return;
          }
          const light = properties[0];
          if (
            !(
              light.value.type === 'Literal' ||
              (light.value.type === 'CallExpression' &&
                light.value.callee.name === 'PlatformColor')
            )
          ) {
            context.report({
              node,
              messageId: 'dynamicColorIOSLight',
            });
            return;
          }
          const dark = properties[1];
          if (
            !(
              dark.value.type === 'Literal' ||
              (dark.value.type === 'CallExpression' &&
                dark.value.callee.name === 'PlatformColor')
            )
          ) {
            context.report({
              node,
              messageId: 'dynamicColorIOSDark',
            });
            return;
          }
        }
      },
    };
  },
};
