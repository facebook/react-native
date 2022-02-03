/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {
  DirectEventHandler,
  Float,
  WithDefault,
} from '../../Types/CodegenTypes';
import type {ColorValue} from '../../StyleSheet/StyleSheet';
import type {ViewProps} from '../View/ViewPropTypes';
import * as React from 'react';

import codegenNativeComponent from '../../Utilities/codegenNativeComponent';
import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import codegenNativeCommands from 'react-native/Libraries/Utilities/codegenNativeCommands';

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
   * Progress view top offset
   */
  progressViewOffset?: WithDefault<Float, 0>,

  /**
   * Called when the view starts refreshing.
   */
  onRefresh?: ?DirectEventHandler<null>,

  /**
   * Whether the view should be indicating an active refresh.
   */
  refreshing: boolean,
|}>;

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
  excludedPlatforms: ['android'],
}): HostComponent<NativeProps>);
