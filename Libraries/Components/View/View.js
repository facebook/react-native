/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule View
 */
'use strict';

var NativeMethodsMixin = require('NativeMethodsMixin');
var PropTypes = require('ReactPropTypes');
var React = require('React');
var ReactIOSViewAttributes = require('ReactIOSViewAttributes');
var StyleSheetPropType = require('StyleSheetPropType');
var ViewStylePropTypes = require('ViewStylePropTypes');


var createReactIOSNativeComponentClass = require('createReactIOSNativeComponentClass');

var stylePropType = StyleSheetPropType(ViewStylePropTypes);

/**
 * The most fundamental component for building UI, `View` is a
 * container that supports layout with flexbox, style, some touch handling, and
 * accessibility controls, and is designed to be nested inside other views and
 * to have 0 to many children of any type. `View` maps directly to the native
 * view equivalent on whatever platform react is running on, whether that is a
 * `UIView`, `<div>`, `android.view`, etc.  This example creates a `View` that
 * wraps two colored boxes and custom component in a row with padding.
 *
 * ```
 * <View style={{flexDirection: 'row', height: 100, padding: 20}}>
 *   <View style={{backgroundColor: 'blue', flex: 0.3}} />
 *   <View style={{backgroundColor: 'red', flex: 0.5}} />
 *   <MyCustomComponent {...customProps} />
 * </View>
 * ```
 *
 * `View`s are designed to be used with `StyleSheet`s for clarity and
 * performance, although inline styles are also supported.
 */
var View = React.createClass({
  mixins: [NativeMethodsMixin],

  /**
   * `NativeMethodsMixin` will look for this when invoking `setNativeProps`. We
   * make `this` look like an actual native component class.
   */
  viewConfig: {
    uiViewClassName: 'RCTView',
    validAttributes: ReactIOSViewAttributes.RCTView
  },

  propTypes: {
    /**
     * When true, indicates that the view is an accessibility element. By default,
     * all the touchable elements are accessible.
     */
    accessible: PropTypes.bool,

    /**
     * Overrides the text that's read by the screen reader when the user interacts
     * with the element. By default, the label is constructed by traversing all the
     * children and accumulating all the Text nodes separated by space.
     */
    accessibilityLabel: PropTypes.string,

    /**
     * Used to locate this view in end-to-end tests.
     */
    testID: PropTypes.string,

    /**
     * For most touch interactions, you'll simply want to wrap your component in
     * `TouchableHighlight` or `TouchableOpacity`. Check out `Touchable.js`,
     * `ScrollResponder.js` and `ResponderEventPlugin.js` for more discussion.
     */
    onMoveShouldSetResponder: PropTypes.func,
    onResponderGrant: PropTypes.func,
    onResponderMove: PropTypes.func,
    onResponderReject: PropTypes.func,
    onResponderRelease: PropTypes.func,
    onResponderTerminate: PropTypes.func,
    onResponderTerminationRequest: PropTypes.func,
    onStartShouldSetResponder: PropTypes.func,
    onStartShouldSetResponderCapture: PropTypes.func,

    /**
     * In the absence of `auto` property, `none` is much like `CSS`'s `none`
     * value. `box-none` is as if you had applied the `CSS` class:
     *
     * ```
     * .box-none {
     *   pointer-events: none;
     * }
     * .box-none * {
     *   pointer-events: all;
     * }
     * ```
     *
     * `box-only` is the equivalent of
     *
     * ```
     * .box-only {
     *   pointer-events: all;
     * }
     * .box-only * {
     *   pointer-events: none;
     * }
     * ```
     *
     * But since `pointerEvents` does not affect layout/appearance, and we are
     * already deviating from the spec by adding additional modes, we opt to not
     * include `pointerEvents` on `style`. On some platforms, we would need to
     * implement it as a `className` anyways. Using `style` or not is an
     * implementation detail of the platform.
     */
    pointerEvents: PropTypes.oneOf([
      'box-none',
      'none',
      'box-only',
      'auto',
    ]),
    style: stylePropType,

    /**
     * This is a special performance property exposed by RCTView and is useful
     * for scrolling content when there are many subviews, most of which are
     * offscreen. For this property to be effective, it must be applied to a
     * view that contains many subviews that extend outside its bound. The
     * subviews must also have overflow: hidden, as should the containing view
     * (or one of its superviews).
     */
    removeClippedSubviews: PropTypes.bool,
  },

  render: function() {
    return <RCTView {...this.props} />;
  },
});


var RCTView = createReactIOSNativeComponentClass({
  validAttributes: ReactIOSViewAttributes.RCTView,
  uiViewClassName: 'RCTView',
});
RCTView.propTypes = View.propTypes;

var ViewToExport = RCTView;
if (__DEV__) {
  ViewToExport = View;
}


module.exports = ViewToExport;
