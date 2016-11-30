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
const docblock = require('../../node-haste/DependencyGraph/docblock');
const generate = require('./generate');
const series = require('async/series');

const {basename} = require('path');

import type {
  Callback,
  TransformedFile,
  TransformFn,
  TransformFnResult,
  TransformResult,
} from '../types.flow';

type TransformVariants = {[key: string]: Object};
export type TransformOptions = {|
  filename: string,
  polyfill?: boolean,
  transform: TransformFn,
  variants?: TransformVariants,
|};

const defaultVariants = {default: {}};
const moduleFactoryParameters = ['require', 'module', 'global', 'exports'];
const polyfillFactoryParameters = ['global'];

function transformModule(
  code: string,
  options: TransformOptions,
  callback: Callback<TransformedFile>,
): void {
  if (options.filename.endsWith('.json')) {
    return transformJSON(code, options, callback);
  }

  const {filename, transform, variants = defaultVariants} = options;
  const tasks = {};
  Object.keys(variants).forEach(name => {
    tasks[name] = cb => transform({
      filename,
      sourceCode: code,
      options: variants[name],
    }, cb);
  });

  series(tasks, (error, results: {[key: string]: TransformFnResult}) => {
    if (error) {
      callback(error);
      return;
    }

    const transformed: {[key: string]: TransformResult} = {};

    //$FlowIssue #14545724
    Object.entries(results).forEach(([key, value]: [*, TransformFnResult]) => {
      transformed[key] = makeResult(value.ast, filename, code, options.polyfill);
    });

    const annotations = docblock.parseAsObject(docblock.extract(code));

    callback(null, {
      code,
      file: filename,
      hasteID: annotations.providesModule || annotations.provide || null,
      transformed,
      type: options.polyfill ? 'script' : 'module',
    });
  });
}

function transformJSON(json, options, callback) {
  const value = JSON.parse(json);
  const {filename} = options;
  const code =
    `__d(function(${moduleFactoryParameters.join(', ')}) { module.exports = \n${
      json
    }\n});`;

  const moduleData = {
    code,
    map: null, // no source map for JSON files!
    dependencies: [],
  };
  const transformed = {};

  Object
    .keys(options.variants || defaultVariants)
    .forEach(key => (transformed[key] = moduleData));

  const result: TransformedFile = {
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
  callback(null, result);
}

function makeResult(ast, filename, sourceCode, isPolyfill = false) {
  let dependencies, dependencyMapName, file;
  if (isPolyfill) {
    dependencies = [];
    file = wrapPolyfill(ast);
  } else {
    ({dependencies, dependencyMapName} = collectDependencies(ast));
    file = wrapModule(ast, dependencyMapName);
  }

  const gen = generate(file, filename, sourceCode);
  return {code: gen.code, map: gen.map, dependencies, dependencyMapName};
}

function wrapModule(file, dependencyMapName) {
  const t = babel.types;
  const params = moduleFactoryParameters.concat(dependencyMapName);
  const factory = functionFromProgram(file.program, params);
  const def = t.callExpression(t.identifier('__d'), [factory]);
  return t.file(t.program([t.expressionStatement(def)]));
}

function wrapPolyfill(file) {
  const t = babel.types;
  const factory = functionFromProgram(file.program, polyfillFactoryParameters);
  const iife = t.callExpression(factory, [t.identifier('this')]);
  return t.file(t.program([t.expressionStatement(iife)]));
}

function functionFromProgram(program, parameters) {
  const t = babel.types;
  return t.functionExpression(
    t.identifier(''),
    parameters.map(makeIdentifier),
    t.blockStatement(program.body, program.directives),
  );
}

function makeIdentifier(name) {
  return babel.types.identifier(name);
}

module.exports = transformModule;
