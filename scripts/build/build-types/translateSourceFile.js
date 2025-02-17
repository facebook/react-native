/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

import type {ParseResult} from 'hermes-transform/dist/transform/parse';
import type {TransformASTResult} from 'hermes-transform/dist/transform/transformAST';

const getDependencies = require('./resolution/getDependencies');
const translate = require('flow-api-translator');
const {parse, print} = require('hermes-transform');

type TransformFn = ParseResult => Promise<TransformASTResult>;

const preTransforms: Array<TransformFn> = [
  require('./transforms/stripPrivateProperties'),
  require('./transforms/replaceRequiresWithImports'),
  require('./transforms/replaceEmptyWithNever'),
];
const prettierOptions = {parser: 'babel'};
const unsupportedFeatureRegex =
  /Unsupported feature: Translating ".*" is currently not supported/;

type TranslateSourceFileResult = {
  result: string,
  dependencies: Set<string>,
};

/**
 * Translate the public API of a Flow source file to TypeScript definition.
 *
 * This uses [flow-api-translator](https://www.npmjs.com/package/flow-api-translator),
 * and applies extra transformations such as stripping private properties.
 */
async function translateSourceFile(
  source: string,
  filePath: string,
): Promise<TranslateSourceFileResult> {
  // Parse Flow source
  const parsed = await parse(source);

  // Apply pre-transforms
  const preTransformResult = await applyTransforms(parsed, preTransforms);

  // Translate to Flow defs (prunes non-type imports)
  const flowDefResult = await translate.translateFlowToFlowDef(
    preTransformResult.code,
    prettierOptions,
  );

  // Resolve dependencies
  const dependencies = await getDependencies(
    await parse(flowDefResult),
    filePath,
  );

  // Translate to TypeScript defs
  const result = await translate.translateFlowToTSDef(
    flowDefResult,
    prettierOptions,
  );

  const unsupportedFeatureMatch = result.match(unsupportedFeatureRegex);
  if (unsupportedFeatureMatch != null) {
    throw new Error(`Error: ${unsupportedFeatureMatch[0]}`);
  }

  return {
    result,
    dependencies,
  };
}

async function applyTransforms(
  source: ParseResult,
  transforms: $ReadOnlyArray<TransformFn>,
): Promise<ParseResult> {
  return transforms.reduce((input, transform) => {
    return input.then(async result => {
      const transformed = await transform(result);
      const code = transformed.astWasMutated
        ? await print(transformed.ast, transformed.mutatedCode, prettierOptions)
        : transformed.mutatedCode;

      return parse(code);
    });
  }, Promise.resolve(source));
}

module.exports = translateSourceFile;
