/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/*global exports:true*/
/*jslint node:true*/
'use strict';

var util = require('util');

var Syntax = require('./syntax');
var utils = require('jstransform/src/utils');

// Top level file pragmas that must not exist for the meta transform to
// be applied.
var mustNotHave = [
  'nosourcemeta',
];

function shouldTraverseFile(state, pragmas) {
  if (state.g.sourcemeta === undefined) {
    var notHaves = true;
    mustNotHave.forEach(function (value) {
      notHaves = notHaves && !(value in pragmas);
    });
    state.g.sourcemeta = notHaves;
  }
  return state.g.sourcemeta;
}

var shouldTransformFile = shouldTraverseFile;

function shouldTransformFunction(node, state, pragmas, params) /*bool*/ {
  if (!shouldTransformFile(state, pragmas)) {
    throw new Error(
      'shouldTransformFunction should not be called if shouldTransformFile ' +
      'fails'
    );
  }
  return true;
}

function wrapsBody() {
  return false;
}

function annotates() {
  return true;
}

exports.shouldTransformFile = shouldTransformFile;
exports.shouldTraverseFile = shouldTraverseFile;
exports.shouldTransformFunction = shouldTransformFunction;
exports.wrapsBody = wrapsBody;
exports.annotates = annotates;
exports.name = 'sourcemeta';
