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
var deprecatedPropType = require('deprecatedPropType');

var ArrayOfNumberPropType = ReactPropTypes.arrayOf(ReactPropTypes.number);

var TransformMatrixPropType = function(
  props : Object,
  propName : string,
  componentName : string
) : ?Error {
  if (props[propName]) {
    return new Error(
      'The transformMatrix style property is deprecated. ' +
      'Use `transform: [{ matrix: ... }]` instead.'
    );
  }
};

var DecomposedMatrixPropType = function(
  props : Object,
  propName : string,
  componentName : string
) : ?Error {
  if (props[propName]) {
    return new Error(
      'The decomposedMatrix style property is deprecated. ' +
      'Use `transform: [...]` instead.'
    );
  }
};

var TransformPropTypes = {
  transform: ReactPropTypes.arrayOf(
    ReactPropTypes.oneOfType([
      ReactPropTypes.shape({perspective: ReactPropTypes.number}),
      ReactPropTypes.shape({rotate: ReactPropTypes.string}),
      ReactPropTypes.shape({rotateX: ReactPropTypes.string}),
      ReactPropTypes.shape({rotateY: ReactPropTypes.string}),
      ReactPropTypes.shape({rotateZ: ReactPropTypes.string}),
      ReactPropTypes.shape({scale: ReactPropTypes.number}),
      ReactPropTypes.shape({scaleX: ReactPropTypes.number}),
      ReactPropTypes.shape({scaleY: ReactPropTypes.number}),
      ReactPropTypes.shape({translateX: ReactPropTypes.number}),
      ReactPropTypes.shape({translateY: ReactPropTypes.number}),
      ReactPropTypes.shape({skewX: ReactPropTypes.string}),
      ReactPropTypes.shape({skewY: ReactPropTypes.string})
    ])
  ),

  /* Deprecated */
  transformMatrix: TransformMatrixPropType,
  decomposedMatrix: DecomposedMatrixPropType,

  /* Deprecated transform props used on Android only */
  scaleX: deprecatedPropType(ReactPropTypes.number, 'Use the transform prop instead.'),
  scaleY: deprecatedPropType(ReactPropTypes.number, 'Use the transform prop instead.'),
  rotation: deprecatedPropType(ReactPropTypes.number, 'Use the transform prop instead.'),
  translateX: deprecatedPropType(ReactPropTypes.number, 'Use the transform prop instead.'),
  translateY: deprecatedPropType(ReactPropTypes.number, 'Use the transform prop instead.'),
};

module.exports = TransformPropTypes;
