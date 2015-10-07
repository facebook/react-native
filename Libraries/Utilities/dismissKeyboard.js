/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule dismissKeyboard
 *
 * This function dismisses the currently-open keyboard, if any
 */
'use strict';

var TextInputState = require('TextInputState');

function dismissKeyboard() {
  TextInputState.blurTextInput(TextInputState.currentlyFocusedField());
}

module.exports = dismissKeyboard;
