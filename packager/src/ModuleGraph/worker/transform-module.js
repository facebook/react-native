/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @format
 */
'use strict';

const JsFileWrapping = require('./JsFileWrapping');

const asyncify = require('async/asyncify');
const collectDependencies = require('./collect-dependencies');
const defaults = require('../../defaults');
const docblock = require('../../node-haste/DependencyGraph/docblock');
const generate = require('./generate');
const path = require('path');
const series = require('async/series');

const {basename} = require('path');

import type {
  Callback,
  TransformedCodeFile,
  TransformedSourceFile,
  Transformer,
  TransformerResult,
  TransformResult,
  TransformVariants,
} from '../types.flow';

export type TransformOptions = {|
  filename: string,
  polyfill?: boolean,
  transformer: Transformer<*>,
  variants?: TransformVariants,
|};

const defaultTransformOptions = {
  dev: true,
  generateSourceMaps: true,
  hot: false,
  inlineRequires: false,
  platform: '',
  projectRoot: '',
};
const defaultVariants = {default: {}};

const ASSET_EXTENSIONS = new Set(defaults.assetExts);

function transformModule(
  content: Buffer,
  options: TransformOptions,
  callback: Callback<TransformedSourceFile>,
): void {
  if (ASSET_EXTENSIONS.has(path.extname(options.filename).substr(1))) {
    transformAsset(content, options, callback);
    return;
  }

  const code = content.toString('utf8');
  if (options.filename.endsWith('.json')) {
    transformJSON(code, options, callback);
    return;
  }

  const {filename, transformer, variants = defaultVariants} = options;
  const tasks = {};
  Object.keys(variants).forEach(name => {
    tasks[name] = asyncify(() =>
      transformer.transform({
        filename,
        localPath: filename,
        options: {...defaultTransformOptions, ...variants[name]},
        src: code,
      }),
    );
  });

  series(tasks, (error, results: {[key: string]: TransformerResult}) => {
    if (error) {
      callback(error);
      return;
    }

    const transformed: {[key: string]: TransformResult} = {};

    //$FlowIssue #14545724
    Object.entries(results).forEach(([key, value]: [*, TransformFnResult]) => {
      transformed[key] = makeResult(
        value.ast,
        filename,
        code,
        options.polyfill,
      );
    });

    const annotations = docblock.parseAsObject(docblock.extract(code));

    callback(null, {
      type: 'code',
      details: {
        assetContent: null,
        code,
        file: filename,
        hasteID: annotations.providesModule || null,
        transformed,
        type: options.polyfill ? 'script' : 'module',
      },
    });
  });
  return;
}

function transformJSON(json, options, callback) {
  const value = JSON.parse(json);
  const {filename} = options;
  const code = `__d(function(${JsFileWrapping.MODULE_FACTORY_PARAMETERS.join(', ')}) { module.exports = \n${json}\n});`;

  const moduleData = {
    code,
    map: null, // no source map for JSON files!
    dependencies: [],
  };
  const transformed = {};

  Object.keys(options.variants || defaultVariants).forEach(
    key => (transformed[key] = moduleData),
  );

  const result: TransformedCodeFile = {
    assetContent: null,
    code: json,
    file: filename,
    hasteID: value.name,
    transformed,
    type: 'module',
  };

  if (basename(filename) === 'package.json') {
    result.package = {
      name: value.name,
      main: value.main,
      browser: value.browser,
      'react-native': value['react-native'],
    };
  }
  callback(null, {type: 'code', details: result});
}

function transformAsset(
  content: Buffer,
  options: TransformOptions,
  callback: Callback<TransformedSourceFile>,
) {
  callback(null, {
    details: {
      assetContentBase64: content.toString('base64'),
      filePath: options.filename,
    },
    type: 'asset',
  });
}

function makeResult(ast, filename, sourceCode, isPolyfill = false) {
  let dependencies, dependencyMapName, file;
  if (isPolyfill) {
    dependencies = [];
    file = JsFileWrapping.wrapPolyfill(ast);
  } else {
    ({dependencies, dependencyMapName} = collectDependencies(ast));
    file = JsFileWrapping.wrapModule(ast, dependencyMapName);
  }

  const gen = generate(file, filename, sourceCode);
  return {code: gen.code, map: gen.map, dependencies, dependencyMapName};
}

module.exports = transformModule;
