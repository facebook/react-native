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
      description: 'Ensure that ColorAndroid() is passed a literal.',
    },
    schema: [],
  },

  create: function(context) {
    return {
      CallExpression: function(node) {
        if (node.callee.name === 'ColorAndroid') {
          const args = node.arguments;
          if (!(args.length === 1 && args[0].type === 'Literal')) {
            context.report({
              node,
              message:
                'ColorAndroid() must take a single argument that is a literal.',
            });
          }
        }
      },
    };
  },
};
