/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {HostInstance} from '../../../types/public/ReactNativeTypes';

declare function currentlyFocusedInput(): null | undefined | HostInstance;

/**
 * Returns the ID of the currently focused text field, if one exists
 * If no text field is focused it returns null
 */
declare function currentlyFocusedField(): null | undefined | number;

declare function focusInput(textField: null | undefined | HostInstance): void;
declare function blurInput(textField: null | undefined | HostInstance): void;
declare function focusField(textFieldID: null | undefined | number): void;
declare function blurField(textFieldID: null | undefined | number): void;

/**
 * @param {number} TextInputID id of the text field to focus
 * Focuses the specified text field
 * noop if the text field was already focused or if the field is not editable
 */
declare function focusTextInput(
  textField: null | undefined | HostInstance,
): void;

/**
 * @param {number} textFieldID id of the text field to unfocus
 * Unfocuses the specified text field
 * noop if it wasn't focused
 */
declare function blurTextInput(
  textField: null | undefined | HostInstance,
): void;

declare function registerInput(textField: HostInstance): void;
declare function unregisterInput(textField: HostInstance): void;
declare function isTextInput(textField: HostInstance): boolean;

/**
 * Responsible for coordinating the "focused" state for text inputs. All calls
 * relating to the keyboard should be funneled through here.
 */
declare const TextInputState: {
  currentlyFocusedInput: typeof currentlyFocusedInput;
  focusInput: typeof focusInput;
  blurInput: typeof blurInput;
  currentlyFocusedField: typeof currentlyFocusedField;
  focusField: typeof focusField;
  blurField: typeof blurField;
  focusTextInput: typeof focusTextInput;
  blurTextInput: typeof blurTextInput;
  registerInput: typeof registerInput;
  unregisterInput: typeof unregisterInput;
  isTextInput: typeof isTextInput;
};

declare const $$EXPORT_DEFAULT_DECLARATION$$: typeof TextInputState;
export default $$EXPORT_DEFAULT_DECLARATION$$;
