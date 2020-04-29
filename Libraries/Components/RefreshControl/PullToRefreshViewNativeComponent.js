/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
<<<<<<< HEAD
 * @flow
=======
 * @flow strict-local
>>>>>>> fb/0.62-stable
 */

'use strict';

import type {DirectEventHandler, WithDefault} from '../../Types/CodegenTypes';
import type {ColorValue} from '../../StyleSheet/StyleSheetTypes';
import type {ViewProps} from '../View/ViewPropTypes';
<<<<<<< HEAD

import codegenNativeComponent from '../../Utilities/codegenNativeComponent';
import {type NativeComponentType} from '../../Utilities/codegenNativeComponent';
=======
import * as React from 'react';

import codegenNativeComponent from '../../Utilities/codegenNativeComponent';
import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import codegenNativeCommands from 'react-native/Libraries/Utilities/codegenNativeCommands';
>>>>>>> fb/0.62-stable

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  /**
   * The color of the refresh indicator.
   */
  tintColor?: ?ColorValue,
  /**
   * Title color.
   */
  titleColor?: ?ColorValue,
  /**
   * The title displayed under the refresh indicator.
   */
  title?: WithDefault<string, null>,

  /**
   * Called when the view starts refreshing.
   */
  onRefresh?: ?DirectEventHandler<null>,

  /**
   * Whether the view should be indicating an active refresh.
   */
  refreshing: boolean,
|}>;

<<<<<<< HEAD
export default (codegenNativeComponent<NativeProps>('PullToRefreshView', {
  paperComponentName: 'RCTRefreshControl',
}): NativeComponentType<NativeProps>);
=======
type ComponentType = HostComponent<NativeProps>;

interface NativeCommands {
  +setNativeRefreshing: (
    viewRef: React.ElementRef<ComponentType>,
    refreshing: boolean,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['setNativeRefreshing'],
});

export default (codegenNativeComponent<NativeProps>('PullToRefreshView', {
  paperComponentName: 'RCTRefreshControl',
}): HostComponent<NativeProps>);
>>>>>>> fb/0.62-stable
