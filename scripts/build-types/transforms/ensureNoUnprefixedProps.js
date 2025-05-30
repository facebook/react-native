/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TransformVisitor} from 'hermes-transform';
import type {ParseResult} from 'hermes-transform/dist/transform/parse';
import type {TransformASTResult} from 'hermes-transform/dist/transform/transformAST';

const {transformAST} = require('hermes-transform/dist/transform/transformAST');

const visitors: TransformVisitor = context => ({
  TypeAlias(node): void {
    if (node.id.name === 'Props') {
      throw new Error(
        `Type alias 'Props' is not allowed. Use more descriptive name.`,
      );
    }
  },
  InterfaceDeclaration(node): void {
    if (node.id.name === 'Props') {
      throw new Error(
        `Type alias 'Props' is not allowed. Use more descriptive name.`,
      );
    }
  },
});

/**
 * flow-api-translator doesn't translate empty type to never due to difference
 * in semantics between the two. This is desirable behavtior in this case,
 * as it's the closest approximation of the empty type.
 */
async function ensureNoUnprefixedProps(
  source: ParseResult,
): Promise<TransformASTResult> {
  return transformAST(source, visitors);
}

module.exports = ensureNoUnprefixedProps;
