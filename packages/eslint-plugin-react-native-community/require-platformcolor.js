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
        'require color property to be assigned result of PlatformColor()',
    },
    schema: [],
    messages: {
      usePlatformColor: 'Use PlatformColor() for color values.',
    },
  },

  create: function(context) {
    return {
      Property: function(node) {
        if (node.key.name === 'color') {
          if (node.value.type === 'ObjectExpression') {
            context.report({
              node,
              messageId: 'usePlatformColor',
            });
          }
        }
      },
    };
  },
};
