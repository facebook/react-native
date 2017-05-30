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

import type {TransformedSourceFile, TransformResult} from '../types.flow';
import type {MappingsMap, SourceMap} from '../../lib/SourceMap';
import type {PostMinifyProcess} from '../../Bundler/index.js';


export type OptimizationOptions = {|
  dev: boolean,
  isPolyfill?: boolean,
  platform: string,
  postMinifyProcess: PostMinifyProcess,
|};

function optimizeModule(
  content: Buffer,
  optimizationOptions: OptimizationOptions,
): TransformedSourceFile {
  const data: TransformedSourceFile = JSON.parse(content.toString('utf8'));

  if (data.type !== 'code') {
    return data;
  }

  const {details} = data;
  const {code, file, transformed} = details;
  const result = {...details, transformed: {}};
  const {postMinifyProcess} = optimizationOptions;

  //$FlowIssue #14545724
  Object.entries(transformed).forEach(([k, t: TransformResult]: [*, TransformResult]) => {
    const optimized = optimize(t, file, code, optimizationOptions);
    const processed = postMinifyProcess({code: optimized.code, map: optimized.map});
    optimized.code = processed.code;
    optimized.map = processed.map;
    result.transformed[k] = optimized;
  });

  return {type: 'code', details: result};
}

function optimize(transformed, file, originalCode, options) {
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
  return {code: min.code, map: min.map, dependencies};
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

function mergeSourceMaps(
  file: string,
  originalMap: SourceMap,
  secondMap: SourceMap,
): MappingsMap {
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
