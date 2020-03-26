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
        'Ensure that DynamicColorIOS() is passed on Object literal of the expected shape.',
    },
    schema: [],
  },

  create: function(context) {
    return {
      CallExpression: function(node) {
        if (node.callee.name === 'DynamicColorIOS') {
          const args = node.arguments;
          if (!(args.length === 1 && args[0].type === 'ObjectExpression')) {
            context.report({
              node,
              message:
                'DynamicColorIOS() must take a single argument of type Object.',
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
              message:
                'DynamicColorIOS() Object argument must a light and a dark key.',
            });
            return;
          }
          const light = properties[0];
          if (
            !(
              light.value.type === 'Literal' ||
              (light.value.type === 'CallExpression' &&
                (light.value.callee.name === 'PlatformColor' ||
                  light.value.callee.name === 'PlatformColorIOS'))
            )
          ) {
            context.report({
              node,
              message:
                'DynamicColorIOS() light value must be either a literal or a PlatformColor() call.',
            });
            return;
          }
          const dark = properties[1];
          if (
            !(
              dark.value.type === 'Literal' ||
              (dark.value.type === 'CallExpression' &&
                (dark.value.callee.name === 'PlatformColor' ||
                  dark.value.callee.name === 'PlatformColorIOS'))
            )
          ) {
            context.report({
              node,
              message:
                'DynamicColorIOS() dark value must be either a literal or a PlatformColor() call.',
            });
            return;
          }
        }
      },
    };
  },
};
