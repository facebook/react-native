/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const ColorPropType = require('ColorPropType');
const LayoutPropTypes = require('LayoutPropTypes');
const ReactPropTypes = require('prop-types');
const ShadowPropTypesIOS = require('ShadowPropTypesIOS');
const TransformPropTypes = require('TransformPropTypes');

/**
 * Warning: Some of these properties may not be supported in all releases.
 */
const ViewStylePropTypes = {
  ...LayoutPropTypes,
  ...ShadowPropTypesIOS,
  ...TransformPropTypes,
  backfaceVisibility: ReactPropTypes.oneOf(['visible', 'hidden']),
  backgroundColor: ColorPropType,
  borderColor: ColorPropType,
  borderTopColor: ColorPropType,
  borderRightColor: ColorPropType,
  borderBottomColor: ColorPropType,
  borderLeftColor: ColorPropType,
  borderStartColor: ColorPropType,
  borderEndColor: ColorPropType,
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

module.exports = ViewStylePropTypes;
