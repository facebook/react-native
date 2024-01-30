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
import type {HostComponent} from '../../../../Libraries/Renderer/shims/ReactNativeTypes';
import type {
  DirectEventHandler,
  Int32,
} from '../../../../Libraries/Types/CodegenTypes';

import codegenNativeCommands from '../../../../Libraries/Utilities/codegenNativeCommands';
import codegenNativeComponent from '../../../../Libraries/Utilities/codegenNativeComponent';
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
