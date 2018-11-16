/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const Platform = require('Platform');
const ReactNative = require('ReactNative'); // eslint-disable-line no-unused-vars

const requireNativeComponent = require('requireNativeComponent');

import type {Props} from 'TextInputTypes';

let AndroidTextInput = null;
let RCTMultilineTextInputView = null;
let RCTSinglelineTextInputView = null;

if (Platform.OS === 'android') {
  AndroidTextInput = requireNativeComponent('AndroidTextInput');
} else if (Platform.OS === 'ios') {
  RCTMultilineTextInputView = requireNativeComponent(
    'RCTMultilineTextInputView',
  );
  RCTSinglelineTextInputView = requireNativeComponent(
    'RCTSinglelineTextInputView',
  );
}

type NativeProps = $ReadOnly<{|
  ...Props,
  text?: ?string,
  onSelectionChangeShouldSetResponder?: ?() => boolean,
  mostRecentEventCount?: ?number,
|}>;

declare class TextInputType extends ReactNative.NativeComponent<NativeProps> {
  /**
   * Removes all text from the `TextInput`.
   */
  clear(): mixed;

  /**
   * Returns `true` if the input is currently focused; `false` otherwise.
   */
  isFocused(): boolean;
}

export type {TextInputType};

module.exports = {
  AndroidTextInput: ((AndroidTextInput: any): Class<TextInputType>),
  RCTMultilineTextInputView: ((RCTMultilineTextInputView: any): Class<
    TextInputType,
  >),
  RCTSinglelineTextInputView: ((RCTSinglelineTextInputView: any): Class<
    TextInputType,
  >),
};
