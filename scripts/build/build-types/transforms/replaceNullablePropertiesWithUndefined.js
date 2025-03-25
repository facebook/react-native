/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {ESNode, TypeAnnotationType} from 'hermes-estree';
import type {TransformVisitor} from 'hermes-transform';
import type {ParseResult} from 'hermes-transform/dist/transform/parse';
import type {TransformASTResult} from 'hermes-transform/dist/transform/transformAST';

const {transformAST} = require('hermes-transform/dist/transform/transformAST');

function isInsideObjectTypeProperty(node: TypeAnnotationType) {
  let current: ESNode = node;
  while (current) {
    if (current.type === 'ObjectTypeProperty') {
      return true;
    }
    current = current.parent;
  }
  return false;
}

const visitors: TransformVisitor = context => ({
  NullableTypeAnnotation(node): void {
    if (!isInsideObjectTypeProperty(node)) {
      return;
    }

    // $FlowExpectedError[incompatible-call] - UnionTypeAnnotation is not assignable to NullableTypeAnnotation
    context.replaceNode(node, {
      type: 'UnionTypeAnnotation',
      types: [
        node.typeAnnotation,
        {
          type: 'GenericTypeAnnotation',
          id: {
            type: 'Identifier',
            name: 'undefined',
          },
        },
      ],
    });
  },
});

/**
 * Replaces all Stringish type references with string
 */
async function replaceNullablePropertiesWithUndefined(
  source: ParseResult,
): Promise<TransformASTResult> {
  return transformAST(source, visitors);
}

module.exports = replaceNullablePropertiesWithUndefined;
