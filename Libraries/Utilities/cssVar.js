/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule cssVar
 * @typechecks
 */
'use strict';

var invariant = require('invariant');
var CSSVarConfig = require('CSSVarConfig');

var cssVar = function(/*string*/ key) /*string*/ {
  invariant(CSSVarConfig[key], 'invalid css variable ' + key);

  return CSSVarConfig[key];
};

module.exports = cssVar;
