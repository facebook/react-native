/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewProps} from '../Components/View/ViewPropTypes';
import type {HostComponent} from '../Renderer/shims/ReactNativeTypes';
import type {ProcessedColorValue} from '../StyleSheet/processColor';

import codegenNativeCommands from '../Utilities/codegenNativeCommands';
import codegenNativeComponent from '../Utilities/codegenNativeComponent';
import * as React from 'react';

type NativeProps = $ReadOnly<{|
  ...ViewProps,
|}>;
export type DebuggingOverlayNativeComponentType = HostComponent<NativeProps>;
export type Overlay = {
  rect: {left: number, top: number, width: number, height: number},
  color: ?ProcessedColorValue,
};

interface NativeCommands {
  +draw: (
    viewRef: React.ElementRef<DebuggingOverlayNativeComponentType>,
    // TODO(T144046177): Ideally we can pass array of Overlay, but currently
    // Array type is not supported in RN codegen for building native commands.
    overlays: string,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['draw'],
});

export default (codegenNativeComponent<NativeProps>(
  'DebuggingOverlay',
): HostComponent<NativeProps>);
