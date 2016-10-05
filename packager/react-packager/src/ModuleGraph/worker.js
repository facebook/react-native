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
const series = require('async/series');
const mkdirp = require('mkdirp');

const collectDependencies = require('../JSTransformer/worker/collect-dependencies');
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
      mkdirp.sync(dirname(outfile));
      fs.writeFileSync(outfile, JSON.stringify(result), 'utf8');
    } catch (writeError) {
      callback(writeError);
      return;
    }
    callback(null);
  });
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

exports.transformModule = transformModule;
