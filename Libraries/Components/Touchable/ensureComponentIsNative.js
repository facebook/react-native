/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ensureComponentIsNative
 */
'use strict';

var invariant = require('invariant');

var ensureComponentIsNative = function(component) {
  invariant(
    component && typeof component.setNativeProps === 'function',
    'Touchable child must either be native or forward setNativeProps to a ' +
    'native component'
  );
};

module.exports = ensureComponentIsNative;
