/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/**
 * @flow
 */
"use strict";

var Documentation = require('./Documentation');

var recast = require('recast');

var ERROR_MISSING_DEFINITION = 'No suitable component definition found.';

function executeHandlers(handlers, componentDefinitions) {
  return componentDefinitions.map(componentDefinition => {
    var documentation = new Documentation();
    handlers.forEach(handler => handler(documentation, componentDefinition));
    return documentation.toObject();
  });
}

/**
 * Takes JavaScript source code and returns an object with the information
 * extract from it.
 *
 * `resolver` is a strategy to find the AST node(s) of the component
 * definition(s) inside `src`.
 * It is a function that gets passed the program AST node of
 * the source as first argument, and a reference to recast as second argument.
 *
 * This allows you define your own strategy for finding component definitions.
 *
 * `handlers` is an array of functions which are passed a reference to the
 * component definitions (extracted by `resolver`) so that they can extract
 * information from it. They get also passed a reference to a `Documentation`
 * object to attach the information to.
 *
 * If `resolver` returns an array of component definitions, `parse` will return
 * an array of documentation objects. If `resolver` returns a single node
 * instead, `parse` will return a documentation object.
 */
function parse(
  src: string,
  resolver: Resolver,
  handlers: Array<Handler>
): (Array<Object>|Object) {
  var ast = recast.parse(src);
  var componentDefinitions = resolver(ast.program, recast);
  var isArray = Array.isArray(componentDefinitions);

  if (!componentDefinitions || (isArray && componentDefinitions.length === 0)) {
    throw new Error(ERROR_MISSING_DEFINITION);
  }

  return isArray ?
    executeHandlers(handlers, componentDefinitions) :
    executeHandlers(handlers, [componentDefinitions])[0];
}

module.exports = parse;
exports.ERROR_MISSING_DEFINITION = ERROR_MISSING_DEFINITION;
