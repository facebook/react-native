/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule TextInputState
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
  _currentlyFocusedID: null,

  /**
   * Returns the ID of the currently focused text field, if one exists
   * If no text field is focused it returns null
   */
  currentlyFocusedField: function() {
    return this._currentlyFocusedID;
  },

  /**
   * @param {string} TextInputID id of the text field to focus
   * Focuses the specified text field
   * noop if the text field was already focused
   */
  focusTextInput: function(textFieldID) {
    if (this._currentlyFocusedID != textFieldID && textFieldID != null) {
      this._currentlyFocusedID = textFieldID;
      RCTUIManager.focus(textFieldID);
    }
  },

  /**
   * @param {string} textFieldID id of the text field to focus
   * Unfocuses the specified text field
   * noop if it wasn't focused
   */
  blurTextInput: function(textFieldID) {
    if (this._currentlyFocusedID == textFieldID && textFieldID != null) {
      this._currentlyFocusedID = null;
      RCTUIManager.blur(textFieldID);
    }
  }
};

module.exports = TextInputState;
