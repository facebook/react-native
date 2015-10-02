/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ViewStylePropTypes
 * @flow
 */
'use strict';

var LayoutPropTypes = require('LayoutPropTypes');
var ReactPropTypes = require('ReactPropTypes');
var TransformPropTypes = require('TransformPropTypes');

/**
 * Warning: Some of these properties may not be supported in all releases.
 */
var ViewStylePropTypes = {
  ...LayoutPropTypes,
  ...TransformPropTypes,
  backfaceVisibility: ReactPropTypes.oneOf(['visible', 'hidden']),
  backgroundColor: ReactPropTypes.string,
  borderColor: ReactPropTypes.string,
  borderTopColor: ReactPropTypes.string,
  borderRightColor: ReactPropTypes.string,
  borderBottomColor: ReactPropTypes.string,
  borderLeftColor: ReactPropTypes.string,
  borderRadius: ReactPropTypes.number,
  borderTopLeftRadius: ReactPropTypes.number,
  borderTopRightRadius: ReactPropTypes.number,
  borderBottomLeftRadius: ReactPropTypes.number,
  borderBottomRightRadius: ReactPropTypes.number,
  borderStyle: ReactPropTypes.oneOf(['solid', 'dotted', 'dashed']),
  borderWidth: ReactPropTypes.number,
  borderTopWidth: ReactPropTypes.number,
  borderRightWidth: ReactPropTypes.number,
  borderBottomWidth: ReactPropTypes.number,
  borderLeftWidth: ReactPropTypes.number,
  opacity: ReactPropTypes.number,
  overflow: ReactPropTypes.oneOf(['visible', 'hidden']),
  shadowColor: ReactPropTypes.string,
  shadowOffset: ReactPropTypes.shape(
    {width: ReactPropTypes.number, height: ReactPropTypes.number}
  ),
  shadowOpacity: ReactPropTypes.number,
  shadowRadius: ReactPropTypes.number,
};

module.exports = ViewStylePropTypes;
