/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TextStylePropTypes
 * @flow
 */
'use strict';

var ReactPropTypes = require('ReactPropTypes');
var ViewStylePropTypes = require('ViewStylePropTypes');

// TODO: use spread instead of Object.assign/create after #6560135 is fixed
var TextStylePropTypes = Object.assign(Object.create(ViewStylePropTypes), {
  fontFamily: ReactPropTypes.string,
  fontSize: ReactPropTypes.number,
  fontWeight: ReactPropTypes.oneOf(
    ['normal' /*default*/, 'bold',
     '100', '200', '300', '400', '500', '600', '700', '800', '900']
  ),
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
});

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

for (var ii = 0; ii < unsupportedProps.length; ii++) {
  delete TextStylePropTypes[unsupportedProps[ii]];
}

module.exports = TextStylePropTypes;
