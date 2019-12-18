/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const PropTypes = require('prop-types');

const DeprecatedTVViewPropTypes = {
  hasTVPreferredFocus: PropTypes.bool,
  tvParallaxShiftDistanceX: PropTypes.number,
  tvParallaxShiftDistanceY: PropTypes.number,
  tvParallaxTiltAngle: PropTypes.number,
  tvParallaxMagnification: PropTypes.number,
};

module.exports = DeprecatedTVViewPropTypes;
