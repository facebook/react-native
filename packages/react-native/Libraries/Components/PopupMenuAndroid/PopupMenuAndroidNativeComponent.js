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
import type {DirectEventHandler, Int32} from '../../Types/CodegenTypes';
import type {ViewProps} from '../View/ViewPropTypes';

import codegenNativeCommands from '../../Utilities/codegenNativeCommands';
import codegenNativeComponent from '../../Utilities/codegenNativeComponent';
import * as React from 'react';

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
