/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule View
 * @flow
 */
'use strict';

var NativeMethodsMixin = require('NativeMethodsMixin');
var PropTypes = require('ReactPropTypes');
var RCTUIManager = require('NativeModules').UIManager;
var React = require('React');
var ReactNativeStyleAttributes = require('ReactNativeStyleAttributes');
var ReactNativeViewAttributes = require('ReactNativeViewAttributes');
var StyleSheetPropType = require('StyleSheetPropType');
var ViewStylePropTypes = require('ViewStylePropTypes');

var createReactNativeComponentClass = require('createReactNativeComponentClass');

var stylePropType = StyleSheetPropType(ViewStylePropTypes);

var AccessibilityTraits = [
  'none',
  'button',
  'link',
  'header',
  'search',
  'image',
  'selected',
  'plays',
  'key',
  'text',
  'summary',
  'disabled',
  'frequentUpdates',
  'startsMedia',
  'adjustable',
  'allowsDirectInteraction',
  'pageTurn',
];

/**
 * The most fundamental component for building UI, `View` is a
 * container that supports layout with flexbox, style, some touch handling, and
 * accessibility controls, and is designed to be nested inside other views and
 * to have 0 to many children of any type. `View` maps directly to the native
 * view equivalent on whatever platform React is running on, whether that is a
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
    validAttributes: ReactNativeViewAttributes.RCTView
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
     * Provides additional traits to screen reader. By default no traits are
     * provided unless specified otherwise in element
     */
    accessibilityTraits: PropTypes.oneOfType([
      PropTypes.oneOf(AccessibilityTraits),
      PropTypes.arrayOf(PropTypes.oneOf(AccessibilityTraits)),
    ]),

    /**
     * When `accessible` is true, the system will try to invoke this function
     * when the user performs accessibility tap gesture.
     */
    onAcccessibilityTap: PropTypes.func,

    /**
     * When `accessible` is true, the system will invoke this function when the
     * user performs the magic tap gesture.
     */
    onMagicTap: PropTypes.func,

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
     * Invoked on mount and layout changes with
     *
     *   {nativeEvent: { layout: {x, y, width, height}}}.
     */
    onLayout: PropTypes.func,

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

    /**
     * Whether this view should render itself (and all of its children) into a
     * single hardware texture on the GPU.
     *
     * On Android, this is useful for animations and interactions that only
     * modify opacity, rotation, translation, and/or scale: in those cases, the
     * view doesn't have to be redrawn and display lists don't need to be
     * re-executed. The texture can just be re-used and re-composited with
     * different parameters. The downside is that this can use up limited video
     * memory, so this prop should be set back to false at the end of the
     * interaction/animation.
     */
    renderToHardwareTextureAndroid: PropTypes.bool,
  },

  render: function() {
    return <RCTView {...this.props} />;
  },
});

var RCTView = createReactNativeComponentClass({
  validAttributes: ReactNativeViewAttributes.RCTView,
  uiViewClassName: 'RCTView',
});
RCTView.propTypes = View.propTypes;
if (__DEV__) {
  var viewConfig = RCTUIManager.viewConfigs && RCTUIManager.viewConfigs.RCTView || {};
  for (var prop in viewConfig.nativeProps) {
    var viewAny: any = View; // Appease flow
    if (!viewAny.propTypes[prop] && !ReactNativeStyleAttributes[prop]) {
      throw new Error(
        'View is missing propType for native prop `' + prop + '`'
      );
    }
  }
}

var ViewToExport = RCTView;
if (__DEV__) {
  ViewToExport = View;
}

module.exports = ViewToExport;
