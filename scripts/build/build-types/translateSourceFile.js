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

import type {PluginObj} from '@babel/core';
import type {ParseResult} from 'hermes-transform/dist/transform/parse';
import type {TransformASTResult} from 'hermes-transform/dist/transform/transformAST';

const getDependencies = require('./resolution/getDependencies');
const createReplaceDefaultExportName = require('./transforms/replaceDefaultExportName');
const babel = require('@babel/core');
const translate = require('flow-api-translator');
const {parse, print} = require('hermes-transform');

type PreTransformFn = ParseResult => Promise<TransformASTResult>;

const preTransforms: Array<PreTransformFn> = [
  require('./transforms/stripPrivateProperties'),
  require('./transforms/replaceRequiresWithImports'),
  require('./transforms/replaceEmptyWithNever'),
  require('./transforms/replaceStringishWithString'),
  require('./transforms/replaceNullablePropertiesWithUndefined'),
];
const postTransforms: Array<PluginObj<mixed>> = [];
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
  const preTransformResult = await applyPreTransforms(parsed);

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
  const tsDefResult = await translate.translateFlowDefToTSDef(
    flowDefResult,
    prettierOptions,
  );

  const unsupportedFeatureMatch = tsDefResult.match(unsupportedFeatureRegex);
  if (unsupportedFeatureMatch != null) {
    throw new Error(`Error: ${unsupportedFeatureMatch[0]}`);
  }

  // Apply post-transforms
  const result = await applyPostTransforms(tsDefResult, filePath);

  return {
    result,
    dependencies,
  };
}

async function applyPreTransforms(source: ParseResult): Promise<ParseResult> {
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

/**
 * Apply post-transforms to .d.ts source code containing @build-types directives.
 */
async function applyPostTransforms(
  source: string,
  filePath: string,
): Promise<string> {
  const result = await babel.transformAsync(source, {
    plugins: [
      '@babel/plugin-syntax-typescript',
      ...postTransforms,
      createReplaceDefaultExportName(filePath),
    ],
  });

  return result.code;
}

module.exports = translateSourceFile;
