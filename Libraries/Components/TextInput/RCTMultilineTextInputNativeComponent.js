/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import requireNativeComponent from '../../ReactNative/requireNativeComponent';
import codegenNativeCommands from '../../Utilities/codegenNativeCommands';
import type {TextInputNativeCommands} from './TextInputNativeCommands';
import RCTTextInputViewConfig from './RCTTextInputViewConfig';
import ReactNativeViewConfigRegistry from '../../Renderer/shims/ReactNativeViewConfigRegistry';

type NativeType = HostComponent<mixed>;

type NativeCommands = TextInputNativeCommands<NativeType>;

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['focus', 'blur', 'setTextAndSelection'],
});

let MultilineTextInputNativeComponent;
if (global.RN$Bridgeless) {
  ReactNativeViewConfigRegistry.register('RCTMultilineTextInputView', () => {
    return RCTTextInputViewConfig;
  });
  MultilineTextInputNativeComponent = 'RCTMultilineTextInputView';
} else {
  MultilineTextInputNativeComponent = requireNativeComponent<mixed>(
    'RCTMultilineTextInputView',
  );
}

// flowlint-next-line unclear-type:off
export default ((MultilineTextInputNativeComponent: any): HostComponent<mixed>);
