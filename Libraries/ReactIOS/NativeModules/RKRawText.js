/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule RKRawText
 * @typechecks static-only
 */

"use strict";

var ReactIOSViewAttributes = require('ReactIOSViewAttributes');

var createReactIOSNativeComponentClass = require('createReactIOSNativeComponentClass');

var RKRawText = createReactIOSNativeComponentClass({
  validAttributes: {
    text: true,
  },
  uiViewClassName: 'RCTRawText',
});

module.exports = RKRawText;
