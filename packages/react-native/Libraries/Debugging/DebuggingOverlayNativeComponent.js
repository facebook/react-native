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
  rect: ElementRectangle,
  color: ?ProcessedColorValue,
};

export type ElementRectangle = {
  x: number,
  y: number,
  width: number,
  height: number,
};

interface NativeCommands {
  +draw: (
    viewRef: React.ElementRef<DebuggingOverlayNativeComponentType>,
    // TODO(T144046177): Ideally we can pass array of Overlay, but currently
    // Array type is not supported in RN codegen for building native commands.
    overlays: string,
  ) => void;
  +highlightElements: (
    viewRef: React.ElementRef<DebuggingOverlayNativeComponentType>,
    // TODO(T144046177): Codegen doesn't support array type for native commands yet.
    elements: string,
  ) => void;
  +clearElementsHighlights: (
    viewRef: React.ElementRef<DebuggingOverlayNativeComponentType>,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['draw', 'highlightElements', 'clearElementsHighlights'],
});

export default (codegenNativeComponent<NativeProps>(
  'DebuggingOverlay',
): HostComponent<NativeProps>);
