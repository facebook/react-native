/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewProps} from 'react-native/Libraries/Components/View/ViewPropTypes';
import type {HostComponent} from 'react-native/Libraries/Renderer/shims/ReactNativeTypes';
import type {
  DirectEventHandler,
  Int32,
} from 'react-native/Libraries/Types/CodegenTypes';

import * as React from 'react';
import codegenNativeCommands from 'react-native/Libraries/Utilities/codegenNativeCommands';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

type PopupMenuSelectionEvent = $ReadOnly<{
  item: Int32,
}>;

type NativeProps = $ReadOnly<{
  ...ViewProps,

  //Props
  menuItems?: ?$ReadOnlyArray<string>,

  onSelectionChange?: DirectEventHandler<PopupMenuSelectionEvent>,
}>;

type ComponentType = HostComponent<NativeProps>;

interface NativeCommands {
  +show: (viewRef: React.ElementRef<ComponentType>) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['show'],
});

export default (codegenNativeComponent<NativeProps>(
  'AndroidPopupMenu',
): HostComponent<NativeProps>);
