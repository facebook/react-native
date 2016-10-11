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

const fs = require('fs');
const dirname = require('path').dirname;

const babel = require('babel-core');
const generate = require('babel-generator').default;

const mkdirp = require('mkdirp');
const series = require('async/series');
const sourceMap = require('source-map');

const collectDependencies = require('../JSTransformer/worker/collect-dependencies');
const constantFolding = require('../JSTransformer/worker/constant-folding').plugin;
const inline = require('../JSTransformer/worker/inline').plugin;
const minify = require('../JSTransformer/worker/minify');

const docblock = require('../node-haste/DependencyGraph/docblock');

function transformModule(infile, options, outfile, callback) {
  let code, transform;
  try {
    transform = require(options.transform);
    code = fs.readFileSync(infile, 'utf8');
  } catch (readError) {
    callback(readError);
    return;
  }

  const filename = options.filename || infile;
  const variants = options.variants || {default: {}};

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

  const gen = generate(file, {
    comments: false,
    compact: true,
    filename,
    sourceMaps: true,
    sourceMapTarget: filename,
    sourceFileName: filename,
  }, sourceCode);
  return {code: gen.code, map: gen.map, dependencies};
}

function wrapModule(file) {
  const p = file.program;
  const t = babel.types;
  const factory = t.functionExpression(t.identifier(''), [
    t.identifier('require'),
    t.identifier('module'),
    t.identifier('global'),
    t.identifier('exports')
  ], t.blockStatement(p.body, p.directives));
  const def = t.callExpression(t.identifier('__d'), [factory]);
  return t.file(t.program([t.expressionStatement(def)]));
}

function optimize(transformed, file, originalCode, options) {
  const optimized =
    optimizeCode(transformed.code, transformed.map, file, options);

  const dependencies = collectDependencies.forOptimization(
    optimized.ast, transformed.dependencies);

  const gen = generate(optimized.ast, {
    comments: false,
    compact: true,
    filename: file,
    sourceMaps: true,
    sourceMapTarget: file,
    sourceFileName: file,
  }, originalCode);

  const merged = new sourceMap.SourceMapGenerator();
  const inputMap = new sourceMap.SourceMapConsumer(transformed.map);
  new sourceMap.SourceMapConsumer(gen.map)
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

  const min = minify(file, gen.code, merged.toJSON());
  return {code: min.code, map: min.map, dependencies};
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

function writeResult(outfile, result) {
  mkdirp.sync(dirname(outfile));
  fs.writeFileSync(outfile, JSON.stringify(result), 'utf8');
}

exports.transformModule = transformModule;
exports.optimizeModule = optimizeModule;
