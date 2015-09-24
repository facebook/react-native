/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ProgressBarAndroid
 */
'use strict';

var NativeMethodsMixin = require('NativeMethodsMixin');
var React = require('React');
var ReactPropTypes = require('ReactPropTypes');
var ReactNativeViewAttributes = require('ReactNativeViewAttributes');

var createReactNativeComponentClass = require('createReactNativeComponentClass');

var STYLE_ATTRIBUTES = [
  'Horizontal',
  'Small',
  'Large',
  'Inverse',
  'SmallInverse',
  'LargeInverse'
];

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
var ProgressBarAndroid = React.createClass({
  propTypes: {
    /**
     * Style of the ProgressBar. One of:
     *
     * - Horizontal
     * - Small
     * - Large
     * - Inverse
     * - SmallInverse
     * - LargeInverse
     */
    styleAttr: ReactPropTypes.oneOf(STYLE_ATTRIBUTES),
    /**
     * Used to locate this view in end-to-end tests.
     */
    testID: ReactPropTypes.string,
  },

  getDefaultProps: function() {
    return {
      styleAttr: 'Large',
    };
  },

  mixins: [NativeMethodsMixin],

  render: function() {
    return <AndroidProgressBar {...this.props} />;
  },
});

var AndroidProgressBar = createReactNativeComponentClass({
  validAttributes: {
    ...ReactNativeViewAttributes.UIView,
    styleAttr: true,
  },
  uiViewClassName: 'AndroidProgressBar',
});

module.exports = ProgressBarAndroid;
