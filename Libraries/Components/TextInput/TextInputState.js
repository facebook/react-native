/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * This class is responsible for coordinating the "focused"
 * state for TextInputs. All calls relating to the keyboard
 * should be funneled through here
 *
 * @format
 * @flow strict-local
 */

'use strict';

const Platform = require('../../Utilities/Platform');
const UIManager = require('../../ReactNative/UIManager');

let currentlyFocusedID: ?number = null;
const inputs = new Set();

/**
 * Returns the ID of the currently focused text field, if one exists
 * If no text field is focused it returns null
 */
function currentlyFocusedField(): ?number {
  return currentlyFocusedID;
}

/**
 * @param {number} TextInputID id of the text field to focus
 * Focuses the specified text field
 * noop if the text field was already focused
 */
function focusTextInput(textFieldID: ?number) {
  if (currentlyFocusedID !== textFieldID && textFieldID !== null) {
    currentlyFocusedID = textFieldID;
    if (Platform.OS === 'ios') {
      UIManager.focus(textFieldID);
    } else if (Platform.OS === 'android') {
      UIManager.dispatchViewManagerCommand(
        textFieldID,
        UIManager.getViewManagerConfig('AndroidTextInput').Commands
          .focusTextInput,
        null,
      );
    }
  }
}

/**
 * @param {number} textFieldID id of the text field to unfocus
 * Unfocuses the specified text field
 * noop if it wasn't focused
 */
function blurTextInput(textFieldID: ?number) {
  if (currentlyFocusedID === textFieldID && textFieldID !== null) {
    currentlyFocusedID = null;
    if (Platform.OS === 'ios') {
      UIManager.blur(textFieldID);
    } else if (Platform.OS === 'android') {
      UIManager.dispatchViewManagerCommand(
        textFieldID,
        UIManager.getViewManagerConfig('AndroidTextInput').Commands
          .blurTextInput,
        null,
      );
    }
  }
}

function registerInput(textFieldID: number) {
  inputs.add(textFieldID);
}

function unregisterInput(textFieldID: number) {
  inputs.delete(textFieldID);
}

function isTextInput(textFieldID: number) {
  return inputs.has(textFieldID);
}

module.exports = {
  currentlyFocusedField,
  focusTextInput,
  blurTextInput,
  registerInput,
  unregisterInput,
  isTextInput,
};
