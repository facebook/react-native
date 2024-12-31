/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ColorValue} from '../../StyleSheet/StyleSheet';
import type {ViewProps} from '../View/ViewPropTypes';

import ProgressBarAndroidNativeComponent from './ProgressBarAndroidNativeComponent';

const React = require('react');

export type ProgressBarAndroidProps = $ReadOnly<{|
  ...ViewProps,

  /**
   * Style of the ProgressBar and whether it shows indeterminate progress (e.g. spinner).
   *
   * `indeterminate` can only be false if `styleAttr` is Horizontal, and requires a
   * `progress` value.
   */
  ...
    | {|
        styleAttr: 'Horizontal',
        indeterminate: false,
        progress: number,
      |}
    | {|
        typeAttr:
          | 'Horizontal'
          | 'Normal'
          | 'Small'
          | 'Large'
          | 'Inverse'
          | 'SmallInverse'
          | 'LargeInverse',
        indeterminate: true,
      |},
  /**
   * Whether to show the ProgressBar (true, the default) or hide it (false).
   */
  animating?: ?boolean,
  /**
   * Color of the progress bar.
   */
  color?: ?ColorValue,
  /**
   * Used to locate this view in end-to-end tests.
   */
  testID?: ?string,
|}>;

/**
 * React component that wraps the Android-only `ProgressBar`. This component is
 * used to indicate that the app is loading or there is activity in the app.
 *
 * Example:
 *
 * ```
 * render: function() {
 *   var progressBar =
 *     <View style={styles.container}>
 *       <ProgressBar styleAttr="Inverse" />
 *     </View>;

 *   return (
 *     <MyLoadingComponent
 *       componentView={componentView}
 *       loadingView={progressBar}
 *       style={styles.loadingComponent}
 *     />
 *   );
 * },
 * ```
 */
const ProgressBarAndroidWithForwardedRef: component(
  ref: React.RefSetter<
    React.ElementRef<typeof ProgressBarAndroidNativeComponent>,
  >,
  ...props: ProgressBarAndroidProps
) = React.forwardRef(function ProgressBarAndroid(
  {
    // $FlowFixMe[incompatible-type]
    styleAttr = 'Normal',
    indeterminate = true,
    animating = true,
    ...restProps
  }: ProgressBarAndroidProps,
  forwardedRef: ?React.RefSetter<
    React.ElementRef<typeof ProgressBarAndroidNativeComponent>,
  >,
) {
  return (
    <ProgressBarAndroidNativeComponent
      styleAttr={styleAttr}
      indeterminate={indeterminate}
      animating={animating}
      {...restProps}
      ref={forwardedRef}
    />
  );
});

module.exports =
  /* $FlowFixMe(>=0.89.0 site=react_native_android_fb) This comment suppresses an
   * error found when Flow v0.89 was deployed. To see the error, delete this
   * comment and run Flow. */
  (ProgressBarAndroidWithForwardedRef: typeof ProgressBarAndroidNativeComponent);
