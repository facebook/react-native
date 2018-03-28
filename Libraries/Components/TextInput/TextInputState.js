/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule TextInputState
 * @flow
 *
 * This class is responsible for coordinating the "focused"
 * state for TextInputs. All calls relating to the keyboard
 * should be funneled through here
 */
'use strict';

const Platform = require('Platform');
const UIManager = require('UIManager');

const TextInputState = {
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
      if (Platform.OS === 'ios') {
        UIManager.focus(textFieldID);
      } else if (Platform.OS === 'android') {
        UIManager.dispatchViewManagerCommand(
          textFieldID,
          UIManager.AndroidTextInput.Commands.focusTextInput,
          null
        );
      }
    }
  },

  /**
   * @param {number} textFieldID id of the text field to unfocus
   * Unfocuses the specified text field
   * noop if it wasn't focused
   */
  blurTextInput: function(textFieldID: ?number) {
    if (this._currentlyFocusedID === textFieldID && textFieldID !== null) {
      this._currentlyFocusedID = null;
      if (Platform.OS === 'ios') {
        UIManager.blur(textFieldID);
      } else if (Platform.OS === 'android') {
        UIManager.dispatchViewManagerCommand(
          textFieldID,
          UIManager.AndroidTextInput.Commands.blurTextInput,
          null
        );
      }
    }
  }
};

module.exports = TextInputState;
