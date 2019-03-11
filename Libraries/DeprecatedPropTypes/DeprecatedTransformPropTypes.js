/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const ReactPropTypes = require('prop-types');

const deprecatedPropType = require('deprecatedPropType');

const TransformMatrixPropType = function(
  props: Object,
  propName: string,
  componentName: string,
): ?Error {
  if (props[propName]) {
    return new Error(
      'The transformMatrix style property is deprecated. ' +
        'Use `transform: [{ matrix: ... }]` instead.',
    );
  }
};

const DecomposedMatrixPropType = function(
  props: Object,
  propName: string,
  componentName: string,
): ?Error {
  if (props[propName]) {
    return new Error(
      'The decomposedMatrix style property is deprecated. ' +
        'Use `transform: [...]` instead.',
    );
  }
};

const DeprecatedTransformPropTypes = {
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
      ReactPropTypes.shape({skewY: ReactPropTypes.string}),
    ]),
  ),
  transformMatrix: TransformMatrixPropType,
  decomposedMatrix: DecomposedMatrixPropType,
  scaleX: deprecatedPropType(
    ReactPropTypes.number,
    'Use the transform prop instead.',
  ),
  scaleY: deprecatedPropType(
    ReactPropTypes.number,
    'Use the transform prop instead.',
  ),
  rotation: deprecatedPropType(
    ReactPropTypes.number,
    'Use the transform prop instead.',
  ),
  translateX: deprecatedPropType(
    ReactPropTypes.number,
    'Use the transform prop instead.',
  ),
  translateY: deprecatedPropType(
    ReactPropTypes.number,
    'Use the transform prop instead.',
  ),
};

module.exports = DeprecatedTransformPropTypes;
