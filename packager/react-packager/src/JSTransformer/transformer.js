/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * Note: This is a fork of the fb-specific transform.js
 */
'use strict';

var jstransform = require('jstransform').transform;

var reactVisitors =
  require('react-tools/vendor/fbtransform/visitors').getAllVisitors();
var staticTypeSyntax =
  require('jstransform/visitors/type-syntax').visitorList;
// Note that reactVisitors now handles ES6 classes, rest parameters, arrow
// functions, template strings, and object short notation.
var visitorList = reactVisitors;


function transform(transformSets, srcTxt, options) {
  options = options || {};

  // These tranforms mostly just erase type annotations and static typing
  // related statements, but they were conflicting with other tranforms.
  // Running them first solves that problem
  var staticTypeSyntaxResult = jstransform(
    staticTypeSyntax,
    srcTxt
  );

  return jstransform(visitorList, staticTypeSyntaxResult.code);
}

exports.transform = transform;
