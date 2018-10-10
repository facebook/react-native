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

const DeprecatedColorPropType = require('DeprecatedColorPropType');
const DeprecatedLayoutPropTypes = require('DeprecatedLayoutPropTypes');
const ReactPropTypes = require('prop-types');
const DeprecatedShadowPropTypesIOS = require('DeprecatedShadowPropTypesIOS');
const DeprecatedTransformPropTypes = require('DeprecatedTransformPropTypes');

/**
 * Warning: Some of these properties may not be supported in all releases.
 */
const DeprecatedViewStylePropTypes = {
  ...DeprecatedLayoutPropTypes,
  ...DeprecatedShadowPropTypesIOS,
  ...DeprecatedTransformPropTypes,
  backfaceVisibility: ReactPropTypes.oneOf(['visible', 'hidden']),
  backgroundColor: DeprecatedColorPropType,
  borderColor: DeprecatedColorPropType,
  borderTopColor: DeprecatedColorPropType,
  borderRightColor: DeprecatedColorPropType,
  borderBottomColor: DeprecatedColorPropType,
  borderLeftColor: DeprecatedColorPropType,
  borderStartColor: DeprecatedColorPropType,
  borderEndColor: DeprecatedColorPropType,
  borderRadius: ReactPropTypes.number,
  borderTopLeftRadius: ReactPropTypes.number,
  borderTopRightRadius: ReactPropTypes.number,
  borderTopStartRadius: ReactPropTypes.number,
  borderTopEndRadius: ReactPropTypes.number,
  borderBottomLeftRadius: ReactPropTypes.number,
  borderBottomRightRadius: ReactPropTypes.number,
  borderBottomStartRadius: ReactPropTypes.number,
  borderBottomEndRadius: ReactPropTypes.number,
  borderStyle: ReactPropTypes.oneOf(['solid', 'dotted', 'dashed']),
  borderWidth: ReactPropTypes.number,
  borderTopWidth: ReactPropTypes.number,
  borderRightWidth: ReactPropTypes.number,
  borderBottomWidth: ReactPropTypes.number,
  borderLeftWidth: ReactPropTypes.number,
  opacity: ReactPropTypes.number,
  /**
   * (Android-only) Sets the elevation of a view, using Android's underlying
   * [elevation API](https://developer.android.com/training/material/shadows-clipping.html#Elevation).
   * This adds a drop shadow to the item and affects z-order for overlapping views.
   * Only supported on Android 5.0+, has no effect on earlier versions.
   * @platform android
   */
  elevation: ReactPropTypes.number,
};

module.exports = DeprecatedViewStylePropTypes;
