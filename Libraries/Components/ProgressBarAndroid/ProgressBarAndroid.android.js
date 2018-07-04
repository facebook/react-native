/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const React = require('React');

const requireNativeComponent = require('requireNativeComponent');

import type {NativeComponent} from 'ReactNative';
import type {ViewProps} from 'ViewPropTypes';

const AndroidProgressBar = requireNativeComponent('AndroidProgressBar');

type Props = $ReadOnly<{|
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
  color?: ?string,
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
const ProgressBarAndroid = (
  props: Props,
  forwardedRef: ?React.Ref<'AndroidProgressBar'>,
) => {
  return <AndroidProgressBar {...props} ref={forwardedRef} />;
};

// $FlowFixMe - TODO T29156721 `React.forwardRef` is not defined in Flow, yet.
const ProgressBarAndroidToExport = React.forwardRef(ProgressBarAndroid);

ProgressBarAndroidToExport.defaultProps = {
  styleAttr: 'Normal',
  indeterminate: true,
  animating: true,
};

module.exports = (ProgressBarAndroidToExport: Class<NativeComponent<Props>>);
