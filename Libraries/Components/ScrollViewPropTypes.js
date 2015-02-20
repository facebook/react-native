/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ScrollViewPropTypes
 */
'use strict';

var EdgeInsetsPropType = require('EdgeInsetsPropType');
var PointPropType = require('PointPropType');
var PropTypes = require('ReactPropTypes');
var StyleSheetPropType = require('StyleSheetPropType');
var ViewStylePropTypes = require('ViewStylePropTypes');

var nativePropType = require('nativePropType');

var ScrollViewPropTypes = {
  automaticallyAdjustContentInsets: nativePropType(PropTypes.bool), // true
  contentInset: nativePropType(EdgeInsetsPropType), // zeroes
  contentOffset: nativePropType(PointPropType), // zeroes
  onScroll: PropTypes.func,
  onScrollAnimationEnd: PropTypes.func,
  scrollEnabled: nativePropType(PropTypes.bool), // true
  scrollIndicatorInsets: nativePropType(EdgeInsetsPropType), // zeros
  showsHorizontalScrollIndicator: nativePropType(PropTypes.bool),
  showsVerticalScrollIndicator: nativePropType(PropTypes.bool),
  style: StyleSheetPropType(ViewStylePropTypes),
  throttleScrollCallbackMS: nativePropType(PropTypes.number), // 200ms
};

module.exports = ScrollViewPropTypes;
