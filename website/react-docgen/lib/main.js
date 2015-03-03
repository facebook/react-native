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

var handlers = require('./handlers');
var parse = require('./parse');
var resolver = require('./resolver');
var utils = require('./utils');

var defaultResolver = resolver.findExportedReactCreateClassCall;
var defaultHandlers = [
  handlers.propTypeHandler,
  handlers.propDocBlockHandler,
  handlers.defaultPropsHandler,
  handlers.componentDocblockHandler,
];

/**
 * See `lib/parse.js` for more information about the arguments. This function
 * simply sets default values for convenience.
 *
 * The default resolver looks for *exported* `React.createClass(def)` calls
 * and expected `def` to resolve to an object expression.
 *
 * The default `handlers` look for `propTypes` and `getDefaultProps` in the
 * provided object expression, and extract prop type information, prop
 * documentation (from docblocks), default prop values and component
 * documentation (from a docblock).
 */
function defaultParse(
  src: string,
  resolver?: ?Resolver,
  handlers?: ?Array<Handler>
): (Array<Object>|Object) {
  if (!resolver) {
    resolver = defaultResolver;
  }
  if (!handlers) {
    handlers = defaultHandlers;
  }

  return parse(src, resolver, handlers);
}

module.exports = {
  parse: defaultParse,
  handlers,
  resolver,
  utils
};
