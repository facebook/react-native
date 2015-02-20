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

/**
 *  Extractor for React documentation in JavaScript.
 */
var ReactDocumentationParser = require('./ReactDocumentationParser');
var parser = new ReactDocumentationParser();

parser.addHandler(
  require('./handlers/propTypeHandler'),
  'propTypes'
);
parser.addHandler(
  require('./handlers/propDocBlockHandler'),
  'propTypes'
);
parser.addHandler(
  require('./handlers/defaultValueHandler'),
  'getDefaultProps'
);

parser.addHandler(
  require('./handlers/componentDocblockHandler')
);

module.exports = parser;
