/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import codegenNativeCommands from '../../Utilities/codegenNativeCommands';
import type {TextInputNativeCommands} from './TextInputNativeCommands';
import RCTTextInputViewConfig from './RCTTextInputViewConfig';
import * as NativeComponentRegistry from '../../NativeComponent/NativeComponentRegistry';

type NativeType = HostComponent<mixed>;

type NativeCommands = TextInputNativeCommands<NativeType>;

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['focus', 'blur', 'setTextAndSelection'],
});

const SinglelineTextInputNativeComponent: HostComponent<mixed> =
  NativeComponentRegistry.get<mixed>('RCTSinglelineTextInputView', () => ({
    uiViewClassName: 'RCTSinglelineTextInputView',
    ...RCTTextInputViewConfig,
  }));

// flowlint-next-line unclear-type:off
export default ((SinglelineTextInputNativeComponent: any): HostComponent<mixed>);
