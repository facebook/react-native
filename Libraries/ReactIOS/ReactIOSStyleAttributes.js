/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ReactIOSStyleAttributes
 */

"use strict";

var TextStylePropTypes = require('TextStylePropTypes');
var ViewStylePropTypes = require('ViewStylePropTypes');

var deepDiffer = require('deepDiffer');
var keyMirror = require('keyMirror');
var matricesDiffer = require('matricesDiffer');
var merge = require('merge');

var ReactIOSStyleAttributes = merge(
  keyMirror(ViewStylePropTypes),
  keyMirror(TextStylePropTypes)
);

ReactIOSStyleAttributes.transformMatrix = { diff: matricesDiffer };
ReactIOSStyleAttributes.shadowOffset = { diff: deepDiffer };

module.exports = ReactIOSStyleAttributes;
