/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule TextStylePropTypes
 */
'use strict';

var ReactPropTypes = require('ReactPropTypes');
var ViewStylePropTypes = require('ViewStylePropTypes');

var TextStylePropTypes = {
  ...ViewStylePropTypes,
  fontFamily: ReactPropTypes.string,
  fontSize: ReactPropTypes.number,
  fontWeight: ReactPropTypes.oneOf(['normal' /*default*/, 'bold']),
  fontStyle: ReactPropTypes.oneOf(['normal', 'italic']),
  lineHeight: ReactPropTypes.number,
  color: ReactPropTypes.string,
  containerBackgroundColor: ReactPropTypes.string,
  textAlign: ReactPropTypes.oneOf(
    ['auto' /*default*/, 'left', 'right', 'center']
  ),
  writingDirection: ReactPropTypes.oneOf(
    ['auto' /*default*/, 'ltr', 'rtl']
  ),
};

// Text doesn't support padding correctly (#4841912)
var unsupportedProps = Object.keys({
  padding: null,
  paddingTop: null,
  paddingLeft: null,
  paddingRight: null,
  paddingBottom: null,
  paddingVertical: null,
  paddingHorizontal: null,
});

for (var key in unsupportedProps) {
  delete TextStylePropTypes[key];
}

module.exports = TextStylePropTypes;
