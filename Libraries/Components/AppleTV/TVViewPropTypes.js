/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TVViewPropTypes
 * @flow
 */
'use strict';
var PropTypes = require('prop-types');

/**
 * Additional View properties for Apple TV
 */
var TVViewPropTypes = {
    /**
     * *(Apple TV only)* When set to true, this view will be focusable
     * and navigable using the Apple TV remote.
     *
     * @platform ios
     */
    isTVSelectable: PropTypes.bool,

    /**
     * *(Apple TV only)* May be set to true to force the Apple TV focus engine to move focus to this view.
     *
     * @platform ios
     */
    hasTVPreferredFocus: PropTypes.bool,

    /**
     * *(Apple TV only)* Object with properties to control Apple TV parallax effects.
     *
     * enabled: If true, parallax effects are enabled.  Defaults to true.
     * shiftDistanceX: Defaults to 2.0.
     * shiftDistanceY: Defaults to 2.0.
     * tiltAngle: Defaults to 0.05.
     * magnification: Defaults to 1.0.
     *
     * @platform ios
     */
    tvParallaxProperties: PropTypes.object,

    /**
     * *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of focus.  Defaults to 2.0.
     *
     * @platform ios
     */
    tvParallaxShiftDistanceX: PropTypes.number,

    /**
     * *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of focus.  Defaults to 2.0.
     *
     * @platform ios
     */
    tvParallaxShiftDistanceY: PropTypes.number,

    /**
     * *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of focus.  Defaults to 0.05.
     *
     * @platform ios
     */
    tvParallaxTiltAngle: PropTypes.number,

    /**
     * *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of focus.  Defaults to 1.0.
     *
     * @platform ios
     */
    tvParallaxMagnification: PropTypes.number,

};

export type TVViewProps = {
  isTVSelectable?: bool,
  hasTVPreferredFocus?: bool,
  tvParallaxProperties?: Object,
  tvParallaxShiftDistanceX?: number,
  tvParallaxShiftDistanceY?: number,
  tvParallaxTiltAngle?: number,
  tvParallaxMagnification?: number,
};

module.exports = TVViewPropTypes;
