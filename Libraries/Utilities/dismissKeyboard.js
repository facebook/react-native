/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * This function dismisses the currently-open keyboard, if any
 *
 * @format
 */

'use strict';

const TextInputState = require('TextInputState');

function dismissKeyboard() {
  TextInputState.blurTextInput(TextInputState.currentlyFocusedField());
}

module.exports = dismissKeyboard;
