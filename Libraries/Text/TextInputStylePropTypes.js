/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TextInputStylePropTypes
 * @flow
 */
'use strict';

var ReactPropTypes = require('ReactPropTypes');
var TextStylePropTypes = require('TextStylePropTypes');

// TODO: use spread instead of Object.assign/create after #6560135 is fixed
var TextInputStylePropTypes = Object.assign(Object.create(TextStylePropTypes), {
    placeholderTextColor: ReactPropTypes.string,
    placeholderFontFamily: ReactPropTypes.string,
    placeholderFontSize: ReactPropTypes.number,
    placeholderFontWeight: ReactPropTypes.oneOf(
        ['normal' /*default*/, 'bold',
            '100', '200', '300', '400', '500', '600', '700', '800', '900']
    ),
    placeholderFontStyle: ReactPropTypes.oneOf(['normal', 'italic']),
});

module.exports = TextInputStylePropTypes;
