/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('React');
const StyleSheet = require('StyleSheet');

const requireNativeComponent = require('requireNativeComponent');

import type {NativeComponent} from 'ReactNative';
import type {ImageSource} from 'ImageSource';
import type {ColorValue} from 'StyleSheetTypes';
import type {ViewProps} from 'ViewPropTypes';

type Props = $ReadOnly<{|
  ...ViewProps,

  /**
   * The progress bar style.
   */
  progressViewStyle?: ?('default' | 'bar'),

  /**
   * The progress value (between 0 and 1).
   */
  progress?: ?number,

  /**
   * The tint color of the progress bar itself.
   */
  progressTintColor?: ?ColorValue,

  /**
   * The tint color of the progress bar track.
   */
  trackTintColor?: ?ColorValue,

  /**
   * A stretchable image to display as the progress bar.
   */
  progressImage?: ?ImageSource,

  /**
   * A stretchable image to display behind the progress bar.
   */
  trackImage?: ?ImageSource,
|}>;

type NativeProgressViewIOS = Class<NativeComponent<Props>>;

const RCTProgressView = ((requireNativeComponent(
  'RCTProgressView',
): any): NativeProgressViewIOS);

/**
 * Use `ProgressViewIOS` to render a UIProgressView on iOS.
 */
const ProgressViewIOS = (
  props: Props,
  forwardedRef?: ?React.Ref<typeof RCTProgressView>,
) => (
  <RCTProgressView
    {...props}
    style={[styles.progressView, props.style]}
    ref={forwardedRef}
  />
);

const styles = StyleSheet.create({
  progressView: {
    height: 2,
  },
});

// $FlowFixMe - TODO T29156721 `React.forwardRef` is not defined in Flow, yet.
const ProgressViewIOSWithRef = React.forwardRef(ProgressViewIOS);

module.exports = (ProgressViewIOSWithRef: NativeProgressViewIOS);
