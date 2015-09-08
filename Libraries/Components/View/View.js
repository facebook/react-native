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

var AccessibilityComponentType = [
  'none',
  'button',
  'radiobutton_checked',
  'radiobutton_unchecked',
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

  statics: {
    AccessibilityTraits,
    AccessibilityComponentType,
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
     * Indicates to accessibility services to treat UI component like a
     * native one. Works for Android only.
     * @platform android
     */
    accessibilityComponentType: PropTypes.oneOf(AccessibilityComponentType),

    /**
     * Indicates to accessibility services whether the user should be notified
     * when this view changes. Works for Android API >= 19 only.
     * See http://developer.android.com/reference/android/view/View.html#attr_android:accessibilityLiveRegion
     * for references.
     * @platform android
     */
    accessibilityLiveRegion: PropTypes.oneOf([
      'none',
      'polite',
      'assertive',
    ]),

    /**
     * Controls how view is important for accessibility which is if it
     * fires accessibility events and if it is reported to accessibility services
     * that query the screen. Works for Android only.
     * See http://developer.android.com/reference/android/R.attr.html#importantForAccessibility
     * for references.
     * Possible values:
     * 'auto' - The system determines whether the view is important for accessibility -
     *    default (recommended).
     * 'yes' - The view is important for accessibility.
     * 'no' - The view is not important for accessibility.
     * 'no-hide-descendants' - The view is not important for accessibility,
     *    nor are any of its descendant views.
     *
     * @platform android
     */
    importantForAccessibility: PropTypes.oneOf([
      'auto',
      'yes',
      'no',
      'no-hide-descendants',
    ]),

    /**
     * Provides additional traits to screen reader. By default no traits are
     * provided unless specified otherwise in element
     * @platform ios
     */
    accessibilityTraits: PropTypes.oneOfType([
      PropTypes.oneOf(AccessibilityTraits),
      PropTypes.arrayOf(PropTypes.oneOf(AccessibilityTraits)),
    ]),

    /**
     * When `accessible` is true, the system will try to invoke this function
     * when the user performs accessibility tap gesture.
     */
    onAccessibilityTap: PropTypes.func,

    /**
     * When `accessible` is true, the system will invoke this function when the
     * user performs the magic tap gesture.
     */
    onMagicTap: PropTypes.func,

    /**
     * Used to locate this view in end-to-end tests. NB: disables the 'layout-only
     * view removal' optimization for this view!
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
     *
     * This event is fired immediately once the layout has been calculated, but
     * the new layout may not yet be reflected on the screen at the time the
     * event is received, especially if a layout animation is in progress.
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
     * @platform android
     */
    renderToHardwareTextureAndroid: PropTypes.bool,

    /**
     * Whether this view should be rendered as a bitmap before compositing.
     *
     * On iOS, this is useful for animations and interactions that do not
     * modify this component's dimensions nor its children; for example, when
     * translating the position of a static view, rasterization allows the
     * renderer to reuse a cached bitmap of a static view and quickly composite
     * it during each frame.
     *
     * Rasterization incurs an off-screen drawing pass and the bitmap consumes
     * memory. Test and measure when using this property.
     * @platform ios
     */
    shouldRasterizeIOS: PropTypes.bool,

    /**
     * Views that are only used to layout their children or otherwise don't draw
     * anything may be automatically removed from the native hierarchy as an
     * optimization. Set this property to `false` to disable this optimization and
     * ensure that this View exists in the native view hierarchy.
     * @platform android
     */
    collapsable: PropTypes.bool,

    /**
     * Whether this view needs to rendered offscreen and composited with an alpha
     * in order to preserve 100% correct colors and blending behavior. The default
     * (false) falls back to drawing the component and its children with an alpha
     * applied to the paint used to draw each element instead of rendering the full
     * component offscreen and compositing it back with an alpha value. This default
     * may be noticeable and undesired in the case where the View you are setting
     * an opacity on has multiple overlapping elements (e.g. multiple overlapping
     * Views, or text and a background).
     *
     * Rendering offscreen to preserve correct alpha behavior is extremely
     * expensive and hard to debug for non-native developers, which is why it is
     * not turned on by default. If you do need to enable this property for an
     * animation, consider combining it with renderToHardwareTextureAndroid if the
     * view **contents** are static (i.e. it doesn't need to be redrawn each frame).
     * If that property is enabled, this View will be rendered off-screen once,
     * saved in a hardware texture, and then composited onto the screen with an alpha
     * each frame without having to switch rendering targets on the GPU.
     *
     * @platform android
     */
    needsOffscreenAlphaCompositing: PropTypes.bool,
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
