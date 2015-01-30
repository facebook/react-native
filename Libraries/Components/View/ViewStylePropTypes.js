/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ViewStylePropTypes
 */
'use strict';

var LayoutPropTypes = require('LayoutPropTypes');
var ReactPropTypes = require('ReactPropTypes');

var merge = require('merge');

/**
 * Warning: Some of these properties may not be supported in all releases.
 */
var ViewStylePropTypes = merge(
  LayoutPropTypes, {
  backgroundColor: ReactPropTypes.string,
  borderColor: ReactPropTypes.string,
  borderTopColor: ReactPropTypes.string,
  borderRightColor: ReactPropTypes.string,
  borderBottomColor: ReactPropTypes.string,
  borderLeftColor: ReactPropTypes.string,
  borderRadius: ReactPropTypes.number,
  opacity: ReactPropTypes.number,
  overflow: ReactPropTypes.oneOf(['visible', 'hidden']),
  shadowColor: ReactPropTypes.string,
  shadowOffset: ReactPropTypes.shape(
    {h: ReactPropTypes.number, w: ReactPropTypes.number}
  ),
  shadowOpacity: ReactPropTypes.number,
  shadowRadius: ReactPropTypes.number,
  transformMatrix: ReactPropTypes.arrayOf(ReactPropTypes.number),
  rotation: ReactPropTypes.number,
  scaleX: ReactPropTypes.number,
  scaleY: ReactPropTypes.number,
  translateX: ReactPropTypes.number,
  translateY: ReactPropTypes.number,
});

module.exports = ViewStylePropTypes;
