/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';
import {Constructor} from 'Utilities';
import {ImageURISource} from '../../Image/ImageSource';
import {NativeMethods} from '../../Renderer/shims/ReactNativeTypes';
import {ColorValue} from '../../StyleSheet/StyleSheet';
import {ViewProps} from '../View/ViewPropTypes';

/**
 * @see https://reactnative.dev/docs/progressviewios
 * @see ProgressViewIOS.ios.js
 */
export interface ProgressViewIOSProps extends ViewProps {
  /**
   * The progress bar style.
   */
  progressViewStyle?: 'default' | 'bar' | undefined;

  /**
   * The progress value (between 0 and 1).
   */
  progress?: number | undefined;

  /**
   * The tint color of the progress bar itself.
   */
  progressTintColor?: ColorValue | undefined;

  /**
   * The tint color of the progress bar track.
   */
  trackTintColor?: ColorValue | undefined;

  /**
   * A stretchable image to display as the progress bar.
   */
  progressImage?: ImageURISource | ImageURISource[] | undefined;

  /**
   * A stretchable image to display behind the progress bar.
   */
  trackImage?: ImageURISource | ImageURISource[] | undefined;
}

declare class ProgressViewIOSComponent extends React.Component<ProgressViewIOSProps> {}
declare const ProgressViewIOSBase: Constructor<NativeMethods> &
  typeof ProgressViewIOSComponent;
/**
 * ProgressViewIOS has been extracted from react-native core and will be removed in a future release.
 * It can now be installed and imported from `@react-native-community/progress-view` instead of 'react-native'.
 * @see https://github.com/react-native-community/progress-view
 * @deprecated
 */
export class ProgressViewIOS extends ProgressViewIOSBase {}
