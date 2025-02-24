/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewProps} from '../../../../Libraries/Components/View/ViewPropTypes';
import type {ProcessedColorValue} from '../../../../Libraries/StyleSheet/processColor';
import type {HostComponent} from '../../types/HostComponent';

import codegenNativeCommands from '../../../../Libraries/Utilities/codegenNativeCommands';
import codegenNativeComponent from '../../../../Libraries/Utilities/codegenNativeComponent';
import * as React from 'react';

type NativeProps = $ReadOnly<{
  ...ViewProps,
}>;
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
