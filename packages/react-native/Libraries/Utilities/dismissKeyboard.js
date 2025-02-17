/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// This function dismisses the currently-open keyboard, if any.

'use strict';

const TextInputState =
  require('../Components/TextInput/TextInputState').default;

function dismissKeyboard() {
  TextInputState.blurTextInput(TextInputState.currentlyFocusedInput());
}

export default dismissKeyboard;
