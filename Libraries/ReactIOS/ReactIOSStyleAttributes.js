/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactIOSStyleAttributes
 * @flow
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
