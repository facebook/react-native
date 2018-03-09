/**
 * Copyright (c) 2004-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
        if (!isAppropriateMember(path)) {
          return;
        }

        let node = path.node;

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

function isAppropriateMember(path) {
  let node = path.node;

  return path.parentPath.type !== 'AssignmentExpression' &&
    node.object.type === 'Identifier' &&
    node.object.name === 'Symbol' &&
    node.property.type === 'Identifier';
}
