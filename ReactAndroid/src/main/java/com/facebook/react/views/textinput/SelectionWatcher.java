/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.views.textinput;

/**
 * Implement this interface to be informed of selection changes in the ReactTextEdit This is used by
 * the ReactTextInputManager to forward events from the EditText to JS
 */
interface SelectionWatcher {
  public void onSelectionChanged(int start, int end);
}
