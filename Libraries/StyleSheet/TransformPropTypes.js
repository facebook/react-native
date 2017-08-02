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

var ReactPropTypes = require('prop-types');

var deprecatedPropType = require('deprecatedPropType');

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
  /**
   * `transform` accepts an array of transformation objects. Each object specifies
   * the property that will be transformed as the key, and the value to use in the
   * transformation. Objects should not be combined. Use a single key/value pair
   * per object.
   *
   * The rotate transformations require a string so that the transform may be
   * expressed in degrees (deg) or radians (rad). For example:
   *
   * `transform([{ rotateX: '45deg' }, { rotateZ: '0.785398rad' }])`
   *
   * The skew transformations require a string so that the transform may be
   * expressed in degrees (deg). For example:
   *
   * `transform([{ skewX: '45deg' }])`
   */
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

  /**
   * Deprecated. Use the transform prop instead.
   */
  transformMatrix: TransformMatrixPropType,
  /**
   * Deprecated. Use the transform prop instead.
   */
  decomposedMatrix: DecomposedMatrixPropType,

  /* Deprecated transform props used on Android only */
  scaleX: deprecatedPropType(ReactPropTypes.number, 'Use the transform prop instead.'),
  scaleY: deprecatedPropType(ReactPropTypes.number, 'Use the transform prop instead.'),
  rotation: deprecatedPropType(ReactPropTypes.number, 'Use the transform prop instead.'),
  translateX: deprecatedPropType(ReactPropTypes.number, 'Use the transform prop instead.'),
  translateY: deprecatedPropType(ReactPropTypes.number, 'Use the transform prop instead.'),
};

module.exports = TransformPropTypes;
