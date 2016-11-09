/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.textinput;

/**
 * Implement this interface to be informed of selection changes in the ReactTextEdit
 * This is used by the ReactTextInputManager to forward events from the EditText to JS
 */
interface SelectionWatcher {
  public void onSelectionChanged(int start, int end);
}
