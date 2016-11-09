/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

'use strict';

/*eslint consistent-return: 0*/

/**
 * Transforms function properties of the `Symbol` into
 * the presence check, and fallback string "@@<name>".
 *
 * Example:
 *
 *   Symbol.iterator;
 *
 * Transformed to:
 *
 *   typeof Symbol.iterator === 'function' ? Symbol.iterator : '@@iterator';
 */
module.exports = function symbolMember(babel) {
  const t = babel.types;

  return {
    visitor: {
      MemberExpression(path) {
        let node = path.node;

        if (!isAppropriateMember(node)) {
          return;
        }

        path.replaceWith(
          t.conditionalExpression(
            t.binaryExpression(
              '===',
              t.unaryExpression(
                'typeof',
                t.identifier('Symbol'),
                true
              ),
              t.stringLiteral('function')
            ),
            node,
            t.stringLiteral(`@@${node.property.name}`)
          )
        );

        // We should stop to avoid infinite recursion, since Babel
        // traverses replaced path, and again would hit our transform.
        path.stop();
      },
    },
  };
};

function isAppropriateMember(node) {
  return node.object.type === 'Identifier' &&
    node.object.name === 'Symbol' &&
    node.property.type === 'Identifier';
}
