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

/**
 * Warning: Some of these properties may not be supported in all releases.
 */
var ViewStylePropTypes = {
  ...LayoutPropTypes,
  backgroundColor: ReactPropTypes.string,
  borderColor: ReactPropTypes.string,
  borderTopColor: ReactPropTypes.string,
  borderRightColor: ReactPropTypes.string,
  borderBottomColor: ReactPropTypes.string,
  borderLeftColor: ReactPropTypes.string,
  borderRadius: ReactPropTypes.number,
  opacity: ReactPropTypes.number,
  overflow: ReactPropTypes.oneOf(['visible', 'hidden']),
  shadowColor: ReactPropTypes.string,
  shadowOffset: ReactPropTypes.shape(
    {h: ReactPropTypes.number, w: ReactPropTypes.number}
  ),
  shadowOpacity: ReactPropTypes.number,
  shadowRadius: ReactPropTypes.number,
  transformMatrix: ReactPropTypes.arrayOf(ReactPropTypes.number),
  rotation: ReactPropTypes.number,
  scaleX: ReactPropTypes.number,
  scaleY: ReactPropTypes.number,
  translateX: ReactPropTypes.number,
  translateY: ReactPropTypes.number,
};

module.exports = ViewStylePropTypes;
