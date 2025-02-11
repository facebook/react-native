/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  HostComponent,
  PartialViewConfig,
} from '../../Renderer/shims/ReactNativeTypes';
import type {TextInputNativeCommands} from './TextInputNativeCommands';

import * as NativeComponentRegistry from '../../NativeComponent/NativeComponentRegistry';
import codegenNativeCommands from '../../Utilities/codegenNativeCommands';
import RCTTextInputViewConfig from './RCTTextInputViewConfig';

type NativeType = HostComponent<{...}>;

type NativeCommands = TextInputNativeCommands<NativeType>;

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['focus', 'blur', 'setTextAndSelection'],
});

export const __INTERNAL_VIEW_CONFIG: PartialViewConfig = {
  uiViewClassName: 'RCTSinglelineTextInputView',
  ...RCTTextInputViewConfig,
};

const SinglelineTextInputNativeComponent: HostComponent<{...}> =
  NativeComponentRegistry.get<{...}>(
    'RCTSinglelineTextInputView',
    () => __INTERNAL_VIEW_CONFIG,
  );

// flowlint-next-line unclear-type:off
export default ((SinglelineTextInputNativeComponent: any): HostComponent<{
  ...
}>);
