/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/*global exports:true*/
'use strict';

var util = require('util');

var Syntax = require('./syntax');
var utils = require('jstransform/src/utils');

var parse = require('./TypeExpressionParser').parse;
var compile = require('./TypeExpressionParser').compile;
var normalize = require('./TypeExpressionParser').normalize;

function parseAndNormalize(source, name, object) {
  if (/\?$/.test(source)) {
    source = '?' + source.substring(0, source.length - 1);
  }
  try {
    var ast = parse(source);
    return compile(normalize(ast));
  } catch (e) {
    var functionName = object.id
      ? '`' + object.id.name + '\''
      : '<anonymous>';
    throw new Error(util.format('The type `%s\' specified for %s for ' +
      'the function %s, on line %s, could not be parsed. The error given was: %s',
      source, name, functionName, object.loc.start.line, e.message
    ));
  }
}

function initializeSettings(state, pragmas) {
  state.g.typechecks = 'typechecks' in pragmas;
  state.g.staticOnly = pragmas.typechecks === 'static-only';
}

function shouldTraverseFile(state, pragmas) {
  if (state.g.typechecks === undefined) {
    initializeSettings(state, pragmas);
  }
  return state.g.typechecks;
}

function shouldTransformFile(state, pragmas) {
  if (state.g.typechecks === undefined) {
    initializeSettings(state, pragmas);
  }
  return !state.g.staticOnly && state.g.typechecks;
}

function shouldTransformFunction(node, state, pragmas, params) {
  if (!shouldTransformFile(state, pragmas)) {
    throw new Error(
      'shouldTransformFunction should not be called if shouldTransformFile ' +
      'fails'
    );
  }

  return (params.params && params.params.length > 0) ||
    params.returns ||
    (node.id && /^[A-Z]/.test(node.id.name));
}

function wrapsBody() {
  return true;
}

function annotates() {
  return true;
}

exports.parseAndNormalize = parseAndNormalize;
exports.shouldTransformFile = shouldTransformFile;
exports.shouldTraverseFile = shouldTraverseFile;
exports.shouldTransformFunction = shouldTransformFunction;
exports.wrapsBody = wrapsBody;
exports.annotates = annotates;
exports.name = 'typechecks';
