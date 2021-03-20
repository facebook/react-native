/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

// This class is responsible for coordinating the "focused" state for
// TextInputs. All calls relating to the keyboard should be funneled
// through here.

const React = require('react');
const Platform = require('../../Utilities/Platform');
const {findNodeHandle} = require('../../Renderer/shims/ReactNative');
import {Commands as AndroidTextInputCommands} from '../../Components/TextInput/AndroidTextInputNativeComponent';
import {Commands as iOSTextInputCommands} from '../../Components/TextInput/RCTSingelineTextInputNativeComponent';

import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
type ComponentRef = React.ElementRef<HostComponent<mixed>>;

let currentlyFocusedInputRef: ?ComponentRef = null;
const inputs = new Set();

function currentlyFocusedInput(): ?ComponentRef {
  return currentlyFocusedInputRef;
}

/**
 * Returns the ID of the currently focused text field, if one exists
 * If no text field is focused it returns null
 */
function currentlyFocusedField(): ?number {
  if (__DEV__) {
    console.error(
      'currentlyFocusedField is deprecated and will be removed in a future release. Use currentlyFocusedInput',
    );
  }

  return findNodeHandle(currentlyFocusedInputRef);
}

function focusInput(textField: ?ComponentRef): void {
  if (currentlyFocusedInputRef !== textField && textField != null) {
    currentlyFocusedInputRef = textField;
  }
}

function blurInput(textField: ?ComponentRef): void {
  if (currentlyFocusedInputRef === textField && textField != null) {
    currentlyFocusedInputRef = null;
  }
}

function focusField(textFieldID: ?number): void {
  if (__DEV__) {
    console.error('focusField no longer works. Use focusInput');
  }

  return;
}

function blurField(textFieldID: ?number) {
  if (__DEV__) {
    console.error('blurField no longer works. Use blurInput');
  }

  return;
}

/**
 * @param {number} TextInputID id of the text field to focus
 * Focuses the specified text field
 * noop if the text field was already focused
 */
function focusTextInput(textField: ?ComponentRef) {
  if (typeof textField === 'number') {
    if (__DEV__) {
      console.error(
        'focusTextInput must be called with a host component. Passing a react tag is deprecated.',
      );
    }

    return;
  }

  if (currentlyFocusedInputRef !== textField && textField != null) {
    focusInput(textField);
    if (Platform.OS === 'ios') {
      // This isn't necessarily a single line text input
      // But commands don't actually care as long as the thing being passed in
      // actually has a command with that name. So this should work with single
      // and multiline text inputs. Ideally we'll merge them into one component
      // in the future.
      iOSTextInputCommands.focus(textField);
    } else if (Platform.OS === 'android') {
      AndroidTextInputCommands.focus(textField);
    }
  }
}

/**
 * @param {number} textFieldID id of the text field to unfocus
 * Unfocuses the specified text field
 * noop if it wasn't focused
 */
function blurTextInput(textField: ?ComponentRef) {
  if (typeof textField === 'number') {
    if (__DEV__) {
      console.error(
        'focusTextInput must be called with a host component. Passing a react tag is deprecated.',
      );
    }

    return;
  }

  if (currentlyFocusedInputRef === textField && textField != null) {
    blurInput(textField);
    if (Platform.OS === 'ios') {
      // This isn't necessarily a single line text input
      // But commands don't actually care as long as the thing being passed in
      // actually has a command with that name. So this should work with single
      // and multiline text inputs. Ideally we'll merge them into one component
      // in the future.
      iOSTextInputCommands.blur(textField);
    } else if (Platform.OS === 'android') {
      AndroidTextInputCommands.blur(textField);
    }
  }
}

function registerInput(textField: ComponentRef) {
  if (typeof textField === 'number') {
    if (__DEV__) {
      console.error(
        'registerInput must be called with a host component. Passing a react tag is deprecated.',
      );
    }

    return;
  }

  inputs.add(textField);
}

function unregisterInput(textField: ComponentRef) {
  if (typeof textField === 'number') {
    if (__DEV__) {
      console.error(
        'unregisterInput must be called with a host component. Passing a react tag is deprecated.',
      );
    }

    return;
  }
  inputs.delete(textField);
}

function isTextInput(textField: ComponentRef): boolean {
  if (typeof textField === 'number') {
    if (__DEV__) {
      console.error(
        'isTextInput must be called with a host component. Passing a react tag is deprecated.',
      );
    }

    return false;
  }

  return inputs.has(textField);
}

module.exports = {
  currentlyFocusedInput,
  focusInput,
  blurInput,

  currentlyFocusedField,
  focusField,
  blurField,
  focusTextInput,
  blurTextInput,
  registerInput,
  unregisterInput,
  isTextInput,
};
