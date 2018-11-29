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

const PropTypes = require('prop-types');

const DeprecatedTVViewPropTypes = {
  isTVSelectable: PropTypes.bool,
  hasTVPreferredFocus: PropTypes.bool,
  tvParallaxProperties: PropTypes.object,
  tvParallaxShiftDistanceX: PropTypes.number,
  tvParallaxShiftDistanceY: PropTypes.number,
  tvParallaxTiltAngle: PropTypes.number,
  tvParallaxMagnification: PropTypes.number,
};

module.exports = DeprecatedTVViewPropTypes;
