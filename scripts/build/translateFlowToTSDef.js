/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {ParseResult} from 'hermes-transform/dist/transform/parse';
import type {TransformASTResult} from 'hermes-transform/dist/transform/transformAST';

const applyBabelTransformsSeq = require('./utils/applyBabelTransformsSeq');
const translate = require('flow-api-translator');
const {parse, print} = require('hermes-transform');

type PreTransformFn = ParseResult => Promise<TransformASTResult>;

const preTransforms: Array<PreTransformFn> = [
  require('./transforms/flow/replaceSymbolSyntax'),
];
const postTransforms = [require('./transforms/typescript/replaceSymbolSyntax')];

/**
 * Translate the public API of a Flow source file to TypeScript definition.
 *
 * This uses [flow-api-translator](https://www.npmjs.com/package/flow-api-translator),
 * and applies extra transformations such as stripping private properties.
 */
async function translateFlowToTSDef(
  source: string,
  prettierOptions: {...},
): Promise<string> {
  // Parse Flow source
  const parsed = await parse(source);

  // Apply pre-transforms
  const preTransformResult = await applyPreTransforms(parsed, prettierOptions);

  // Translate to Flow defs (prunes non-type imports)
  const flowDefResult = await translate.translateFlowToFlowDef(
    preTransformResult.code,
    prettierOptions,
  );

  // Translate to TypeScript defs
  const tsDefResult = await translate.translateFlowDefToTSDef(
    flowDefResult,
    prettierOptions,
  );

  // Apply post-transforms
  const result = await applyBabelTransformsSeq(tsDefResult, postTransforms);

  return result;
}

async function applyPreTransforms(
  source: ParseResult,
  prettierOptions: {...},
): Promise<ParseResult> {
  return preTransforms.reduce((input, transform) => {
    return input.then(async result => {
      const transformed = await transform(result);
      const code = transformed.astWasMutated
        ? await print(transformed.ast, transformed.mutatedCode, prettierOptions)
        : transformed.mutatedCode;
      return parse(code);
    });
  }, Promise.resolve(source));
}

module.exports = translateFlowToTSDef;
