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

const symbolReplacements: {[string]: string} = {
  '@@iterator': '__iterator',
  '@@asyncIterator': '__asyncIterator',
  '@@dispose': '__dispose',
  '@@asyncDispose': '__asyncDispose',
};

const visitors: TransformVisitor = context => ({
  Identifier(node): void {
    const replacement = symbolReplacements[node.name];

    if (
      replacement != null &&
      node.parent.type === 'ObjectTypeProperty' &&
      node.parent.method
    ) {
      context.modifyNodeInPlace(node, {name: replacement});
    }
  },
});

/**
 * Replaces Flow @@symbol syntax (e.g. @@iterator) with __symbol prefixed
 * identifiers (e.g. __iterator).
 *
 * This is the first phase of a two-phase transform. Flow uses @@symbol
 * syntax to represent well-known symbols, but this syntax is not valid in
 * TypeScript. Since flow-api-translator doesn't understand @@symbol syntax
 * either, we first rewrite them to __symbol identifiers that survive the
 * translation pass. A second transform (transforms/typescript/replaceSymbolSyntax)
 * then converts __symbol to the final [Symbol.*] computed property syntax.
 */
async function replaceSymbolSyntax(
  source: ParseResult,
): Promise<TransformASTResult> {
  return transformAST(source, visitors);
}

module.exports = replaceSymbolSyntax;
