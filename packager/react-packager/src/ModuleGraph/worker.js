/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

// RUNS UNTRANSFORMED IN A WORKER PROCESS. ONLY USE NODE 4 COMPATIBLE FEATURES!

const babel = require('babel-core');
const babelGenerate = require('babel-generator').default;
const collectDependencies = require('../JSTransformer/worker/collect-dependencies');
const constantFolding = require('../JSTransformer/worker/constant-folding').plugin;
const docblock = require('../node-haste/DependencyGraph/docblock');
const fs = require('fs');
const inline = require('../JSTransformer/worker/inline').plugin;
const minify = require('../JSTransformer/worker/minify');
const mkdirp = require('mkdirp');
const path = require('path');
const series = require('async/series');
const sourceMap = require('source-map');

const basename = path.basename;
const dirname = path.dirname;
const defaultVariants = {default: {}};
const moduleFactoryParameters = ['require', 'module', 'global', 'exports'];

function transformJSON(infile, options, outfile, callback) {
  let json, value;
  try {
    json = fs.readFileSync(infile, 'utf8');
    value = JSON.parse(json);
  } catch (readError) {
    callback(readError);
    return;
  }

  const filename = options.filename || infile;
  const code =
    `__d(function(${moduleFactoryParameters.join(', ')}) { module.exports = \n${
      json
    }\n})`;

  const moduleData = {
    code,
    map: null, // no source map for JSON files!
    dependencies: [],
  };
  const transformed = {};

  Object
    .keys(options.variants || defaultVariants)
    .forEach(key => (transformed[key] = moduleData));

  const result = {
    file: filename,
    code: json,
    transformed,
    hasteID: value.name,
  };

  if (basename(filename) === 'package.json') {
    result.package = {
      name: value.name,
      main: value.main,
      browser: value.browser,
      'react-native': value['react-native'],
    };
  }

  try {
    writeResult(outfile, result);
  } catch (writeError) {
    callback(writeError);
    return;
  }

  callback(null);
}

function transformModule(infile, options, outfile, callback) {
  const filename = options.filename || infile;
  if (filename.endsWith('.json')) {
    return transformJSON(infile, options, outfile, callback);
  }

  let code, transform;
  try {
    transform = require(options.transform);
    code = fs.readFileSync(infile, 'utf8');
  } catch (readError) {
    callback(readError);
    return;
  }

  const variants = options.variants || defaultVariants;
  const tasks = {};
  Object.keys(variants).forEach(name => {
    tasks[name] = cb => transform({
      filename,
      sourceCode: code,
      options: variants[name],
    }, cb);
  });

  series(tasks, (error, transformed) => {
    if (error) {
      callback(error);
      return;
    }

    Object.keys(transformed).forEach(key => {
      transformed[key] = makeResult(transformed[key].ast, filename, code);
    });

    const annotations = docblock.parseAsObject(docblock.extract(code));

    const result = {
      file: filename,
      code,
      transformed,
      hasteID: annotations.providesModule || annotations.provide || null,
    };

    try {
      writeResult(outfile, result);
    } catch (writeError) {
      callback(writeError);
      return;
    }
    callback(null);
  });
}

function optimizeModule(infile, outfile, options, callback) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(infile, 'utf8'));
  } catch (readError) {
    callback(readError);
    return;
  }

  const transformed = data.transformed;
  const result = Object.assign({}, data);
  result.transformed = {};

  const file = data.file;
  const code = data.code;
  try {
    Object.keys(transformed).forEach(key => {
      result.transformed[key] = optimize(transformed[key], file, code, options);
    });

    writeResult(outfile, result);
  } catch (error) {
    callback(error);
    return;
  }

  callback(null);
}

function makeResult(ast, filename, sourceCode) {
  const dependencies = collectDependencies(ast);
  const file = wrapModule(ast);

  const gen = generate(file, filename, sourceCode);
  return {code: gen.code, map: gen.map, dependencies};
}

function wrapModule(file) {
  const p = file.program;
  const t = babel.types;
  const factory = t.functionExpression(
    t.identifier(''),
    moduleFactoryParameters.map(makeIdentifier),
    t.blockStatement(p.body, p.directives),
  );
  const def = t.callExpression(t.identifier('__d'), [factory]);
  return t.file(t.program([t.expressionStatement(def)]));
}

function optimize(transformed, file, originalCode, options) {
  const optimized =
    optimizeCode(transformed.code, transformed.map, file, options);

  const dependencies = collectDependencies.forOptimization(
    optimized.ast, transformed.dependencies);

  const inputMap = transformed.map;
  const gen = generate(optimized.ast, file, originalCode);

  const min = minify(
    file,
    gen.code,
    inputMap && mergeSourceMaps(file, inputMap, gen.map),
  );
  return {code: min.code, map: inputMap && min.map, dependencies};
}

function optimizeCode(code, map, filename, options) {
  const inlineOptions = Object.assign({isWrapped: true}, options);
  return babel.transform(code, {
    plugins: [[constantFolding], [inline, inlineOptions]],
    babelrc: false,
    code: false,
    filename,
  });
}

function generate(ast, filename, sourceCode) {
  return babelGenerate(ast, {
    comments: false,
    compact: true,
    filename,
    sourceFileName: filename,
    sourceMaps: true,
    sourceMapTarget: filename,
  }, sourceCode);
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

function writeResult(outfile, result) {
  mkdirp.sync(dirname(outfile));
  fs.writeFileSync(outfile, JSON.stringify(result), 'utf8');
}

function makeIdentifier(name) {
  return babel.types.identifier(name);
}

exports.transformModule = transformModule;
exports.optimizeModule = optimizeModule;
