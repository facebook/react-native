/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TextInputState
 * @flow
 *
 * This class is responsible for coordinating the "focused"
 * state for TextInputs. All calls relating to the keyboard
 * should be funneled through here
 */
'use strict';

var RCTUIManager = require('NativeModules').UIManager;

var TextInputState = {
   /**
   * Internal state
   */
  _currentlyFocusedID: (null: ?number),

  /**
   * Returns the ID of the currently focused text field, if one exists
   * If no text field is focused it returns null
   */
  currentlyFocusedField: function(): ?number {
    return this._currentlyFocusedID;
  },

  /**
   * @param {number} TextInputID id of the text field to focus
   * Focuses the specified text field
   * noop if the text field was already focused
   */
  focusTextInput: function(textFieldID: ?number) {
    if (this._currentlyFocusedID !== textFieldID && textFieldID !== null) {
      this._currentlyFocusedID = textFieldID;
      RCTUIManager.focus(textFieldID);
    }
  },

  /**
   * @param {number} textFieldID id of the text field to focus
   * Unfocuses the specified text field
   * noop if it wasn't focused
   */
  blurTextInput: function(textFieldID: ?number) {
    if (this._currentlyFocusedID === textFieldID && textFieldID !== null) {
      this._currentlyFocusedID = null;
      RCTUIManager.blur(textFieldID);
    }
  }
};

module.exports = TextInputState;
