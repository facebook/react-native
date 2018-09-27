/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @format
 */
'use strict';
var PropTypes = require('prop-types');

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
