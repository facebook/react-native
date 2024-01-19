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

export type TraceUpdate = {
  id: number,
  rectangle: ElementRectangle,
  color: ?ProcessedColorValue,
};

export type ElementRectangle = {
  x: number,
  y: number,
  width: number,
  height: number,
};

interface NativeCommands {
  +highlightTraceUpdates: (
    viewRef: React.ElementRef<DebuggingOverlayNativeComponentType>,
    updates: $ReadOnlyArray<TraceUpdate>,
  ) => void;
  +highlightElements: (
    viewRef: React.ElementRef<DebuggingOverlayNativeComponentType>,
    elements: $ReadOnlyArray<ElementRectangle>,
  ) => void;
  +clearElementsHighlights: (
    viewRef: React.ElementRef<DebuggingOverlayNativeComponentType>,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: [
    'highlightTraceUpdates',
    'highlightElements',
    'clearElementsHighlights',
  ],
});

export default (codegenNativeComponent<NativeProps>(
  'DebuggingOverlay',
): HostComponent<NativeProps>);
