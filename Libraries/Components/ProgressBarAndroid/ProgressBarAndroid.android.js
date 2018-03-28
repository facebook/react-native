/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ProgressBarAndroid
 */
'use strict';

const ColorPropType = require('ColorPropType');
const PropTypes = require('prop-types');
const React = require('React');
const ReactNative = require('ReactNative');
const ViewPropTypes = require('ViewPropTypes');

const requireNativeComponent = require('requireNativeComponent');

const STYLE_ATTRIBUTES = [
  'Horizontal',
  'Normal',
  'Small',
  'Large',
  'Inverse',
  'SmallInverse',
  'LargeInverse',
];

const indeterminateType = function(props, propName, componentName, ...rest) {
  const checker = function() {
    const indeterminate = props[propName];
    const styleAttr = props.styleAttr;
    if (!indeterminate && styleAttr !== 'Horizontal') {
      return new Error('indeterminate=false is only valid for styleAttr=Horizontal');
    }
  };

  return PropTypes.bool(props, propName, componentName, ...rest) || checker();
};

/**
 * React component that wraps the Android-only `ProgressBar`. This component is used to indicate
 * that the app is loading or there is some activity in the app.
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
class ProgressBarAndroid extends ReactNative.NativeComponent {
  static propTypes = {
    ...ViewPropTypes,

    /**
     * Style of the ProgressBar. One of:
     *
     * - Horizontal
     * - Normal (default)
     * - Small
     * - Large
     * - Inverse
     * - SmallInverse
     * - LargeInverse
     */
    styleAttr: PropTypes.oneOf(STYLE_ATTRIBUTES),
    /**
     * Whether to show the ProgressBar (true, the default) or hide it (false).
     */
    animating: PropTypes.bool,
    /**
     * If the progress bar will show indeterminate progress. Note that this
     * can only be false if styleAttr is Horizontal.
     */
    indeterminate: indeterminateType,
    /**
     * The progress value (between 0 and 1).
     */
    progress: PropTypes.number,
    /**
     * Color of the progress bar.
     */
    color: ColorPropType,
    /**
     * Used to locate this view in end-to-end tests.
     */
    testID: PropTypes.string,
  };

  static defaultProps = {
    styleAttr: 'Normal',
    indeterminate: true,
    animating: true,
  };

  render() {
    return <AndroidProgressBar {...this.props} />;
  }
}

const AndroidProgressBar = requireNativeComponent(
  'AndroidProgressBar',
  ProgressBarAndroid,
  {
    nativeOnly: {
      animating: true,
    },
  }
);

module.exports = ProgressBarAndroid;
