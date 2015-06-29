/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TransformPropTypes
 * @flow
 */
'use strict';

var ReactPropTypes = require('ReactPropTypes');

var TransformPropTypes = {
  transform: ReactPropTypes.arrayOf(
    ReactPropTypes.oneOfType([
      ReactPropTypes.shape({rotate: ReactPropTypes.string}),
      ReactPropTypes.shape({scaleX: ReactPropTypes.number}),
      ReactPropTypes.shape({scaleY: ReactPropTypes.number}),
      ReactPropTypes.shape({translateX: ReactPropTypes.number}),
      ReactPropTypes.shape({translateY: ReactPropTypes.number})
    ])
  ),

  /*
   * `transformMatrix` accepts a 4x4 matrix expressed as a row-major ordered
   * array. This property is DEPRECATED and cannot be used simultaneously with
   * the `transform` property.
   */
  transformMatrix: ReactPropTypes.arrayOf(ReactPropTypes.number),

  // DEPRECATED
  rotation: ReactPropTypes.number,
  scaleX: ReactPropTypes.number,
  scaleY: ReactPropTypes.number,
  translateX: ReactPropTypes.number,
  translateY: ReactPropTypes.number,
};

module.exports = TransformPropTypes;
