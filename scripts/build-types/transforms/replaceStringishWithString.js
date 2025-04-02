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

import type {TransformVisitor} from 'hermes-transform';
import type {ParseResult} from 'hermes-transform/dist/transform/parse';
import type {TransformASTResult} from 'hermes-transform/dist/transform/transformAST';

const {transformAST} = require('hermes-transform/dist/transform/transformAST');

const visitors: TransformVisitor = context => ({
  GenericTypeAnnotation(node): void {
    if (node.id.name === 'Stringish') {
      // $FlowExpectedError[incompatible-call] - GenericTypeAnnotation is not assignable to EmptyTypeAnnotation
      context.replaceNode(node, {
        type: 'GenericTypeAnnotation',
        id: {
          type: 'Identifier',
          name: 'string',
          optional: false,
        },
      });
    }
  },
});

/**
 * Replaces all Stringish type references with string
 */
async function replaceStringishWithString(
  source: ParseResult,
): Promise<TransformASTResult> {
  return transformAST(source, visitors);
}

module.exports = replaceStringishWithString;
