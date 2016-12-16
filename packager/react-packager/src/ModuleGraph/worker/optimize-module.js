/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const babel = require('babel-core');
const collectDependencies = require('./collect-dependencies');
const constantFolding = require('../../JSTransformer/worker/constant-folding').plugin;
const generate = require('./generate');
const inline = require('../../JSTransformer/worker/inline').plugin;
const minify = require('../../JSTransformer/worker/minify');
const sourceMap = require('source-map');

import type {TransformedFile, TransformResult} from '../types.flow';

export type OptimizationOptions = {|
  dev: boolean,
  isPolyfill?: boolean,
  platform: string,
|};

function optimizeModule(
  data: string | TransformedFile,
  optimizationOptions: OptimizationOptions,
): TransformedFile {
  if (typeof data === 'string') {
    data = JSON.parse(data);
  }
  const {code, file, transformed} = data;
  const result = {...data, transformed: {}};

  //$FlowIssue #14545724
  Object.entries(transformed).forEach(([k, t: TransformResult]: [*, TransformResult]) => {
    result.transformed[k] = optimize(t, file, code, optimizationOptions);
  });

  return result;
}

function optimize(transformed, file, originalCode, options): TransformResult {
  const {code, dependencyMapName, map} = transformed;
  const optimized = optimizeCode(code, map, file, options);

  let dependencies;
  if (options.isPolyfill) {
    dependencies = [];
  } else {
    ({dependencies} = collectDependencies.forOptimization(
      optimized.ast,
      transformed.dependencies,
      dependencyMapName,
    ));
  }

  const inputMap = transformed.map;
  const gen = generate(optimized.ast, file, originalCode);

  const min = minify(
    file,
    gen.code,
    inputMap && mergeSourceMaps(file, inputMap, gen.map),
  );
  return {code: min.code, map: inputMap && min.map, dependencies};
}

function optimizeCode(code, map, filename, inliningOptions) {
  return babel.transform(code, {
    plugins: [
      [constantFolding],
      [inline, {...inliningOptions, isWrapped: true}],
    ],
    babelrc: false,
    code: false,
    filename,
  });
}

function mergeSourceMaps(file, originalMap, secondMap) {
  const merged = new sourceMap.SourceMapGenerator();
  const inputMap = new sourceMap.SourceMapConsumer(originalMap);
  new sourceMap.SourceMapConsumer(secondMap)
    .eachMapping(mapping => {
      const original = inputMap.originalPositionFor({
        line: mapping.originalLine,
        column: mapping.originalColumn,
      });
      if (original.line == null) {
        return;
      }

      merged.addMapping({
        generated: {line: mapping.generatedLine, column: mapping.generatedColumn},
        original: {line: original.line, column: original.column || 0},
        source: file,
        name: original.name || mapping.name,
      });
    });
  return merged.toJSON();
}

module.exports = optimizeModule;
