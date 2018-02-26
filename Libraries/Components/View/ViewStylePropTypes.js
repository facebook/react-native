/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ViewStylePropTypes
 * @flow
 */
'use strict';

var ColorPropType = require('ColorPropType');
var LayoutPropTypes = require('LayoutPropTypes');
var ReactPropTypes = require('prop-types');
var PlatformViewStylePropTypes = require('PlatformViewStylePropTypes');
var ShadowPropTypesIOS = require('ShadowPropTypesIOS');
var TransformPropTypes = require('TransformPropTypes');

/**
 * Warning: Some of these properties may not be supported in all releases.
 */
var ViewStylePropTypes = {
  ...LayoutPropTypes,
  ...PlatformViewStylePropTypes,
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
};

module.exports = ViewStylePropTypes;
