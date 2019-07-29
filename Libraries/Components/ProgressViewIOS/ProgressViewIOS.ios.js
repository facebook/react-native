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

const React = require('react');
const StyleSheet = require('../../StyleSheet/StyleSheet');

import RCTProgressViewNativeComponent from './RCTProgressViewNativeComponent';
import type {ImageSource} from '../../Image/ImageSource';
import type {ColorValue} from '../../StyleSheet/StyleSheetTypes';
import type {ViewProps} from '../View/ViewPropTypes';

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

/**
 * Use `ProgressViewIOS` to render a UIProgressView on iOS.
 */
const ProgressViewIOS = (
  props: Props,
  forwardedRef?: ?React.Ref<typeof RCTProgressViewNativeComponent>,
) => (
  <RCTProgressViewNativeComponent
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

const ProgressViewIOSWithRef = React.forwardRef(ProgressViewIOS);

/* $FlowFixMe(>=0.89.0 site=react_native_ios_fb) This comment suppresses an
 * error found when Flow v0.89 was deployed. To see the error, delete this
 * comment and run Flow. */
module.exports = (ProgressViewIOSWithRef: typeof RCTProgressViewNativeComponent);
