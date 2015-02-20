/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule View
 */
'use strict';

var NativeMethodsMixin = require('NativeMethodsMixin');
var NativeModules = require('NativeModules');
var PropTypes = require('ReactPropTypes');
var React = require('React');
var ReactIOSViewAttributes = require('ReactIOSViewAttributes');
var StyleSheetPropType = require('StyleSheetPropType');
var ViewStylePropTypes = require('ViewStylePropTypes');

/**
 * <View> - The most fundamental component for building UI, `View` is a
 * container that supports layout with flexbox, style, some touch handling, and
 * accessibility controls, and is designed to be nested inside other views and
 * to have 0 to many children of any type. `View` maps directly to the native
 * view equivalent on whatever platform react is running on, whether that is a
 * `UIView`, `<div>`, `android.view`, etc.  This example creates a `View` that
 * wraps two colored boxes and custom component in a row with padding.
 *
 *  <View style={{flexDirection: 'row', height: 100, padding: 20}}>
 *    <View style={{backgroundColor: 'blue', flex: 0.3}} />
 *    <View style={{backgroundColor: 'red', flex: 0.5}} />
 *    <MyCustomComponent {...customProps} />
 *  </View>
 *
 * By default, `View`s have a primary flex direction of 'column', so children
 * will stack up vertically by default.  `View`s also expand to fill the parent
 * in the direction of the parent's flex direction by default, so in the case of
 * a default parent (flexDirection: 'column'), the children will fill the width,
 * but not the height.
 *
 * Many library components can be treated like plain `Views` in many cases, for
 * example passing them children, setting style, etc.
 *
 * `View`s are designed to be used with `StyleSheet`s for clarity and
 * performance, although inline styles are also supported.  It is common for
 * `StyleSheet`s to be combined dynamically.  See `StyleSheet.js` for more info.
 *
 * Check out `ViewExample.js`, `LayoutExample.js`, and other apps for more code
 * examples.
 */

var StyleConstants = NativeModules.RKUIManager.StyleConstants;

var createReactIOSNativeComponentClass = require('createReactIOSNativeComponentClass');

var stylePropType = StyleSheetPropType(ViewStylePropTypes);

var View = React.createClass({
  statics: {
    pointerEvents: StyleConstants.PointerEventsValues,
    stylePropType,
  },

  mixins: [NativeMethodsMixin],

  /**
   * `NativeMethodsMixin` will look for this when invoking `setNativeProps`. We
   * make `this` look like an actual native component class.
   */
  viewConfig: {
    uiViewClassName: 'RCTView',
    validAttributes: ReactIOSViewAttributes.RKView
  },

  propTypes: {
    /**
     * When true, indicates that the view is an accessibility element
     */
    accessible: PropTypes.bool,

    /**
     * This string can be used to identify the accessible element.
     */
    testID: PropTypes.string,

    /**
     * For most touch interactions, you'll simply want to wrap your component in
     * `TouchableHighlight.js`.  Check out `Touchable.js` and
     * `ScrollResponder.js` for more discussion.
     */
    onResponderGrant: PropTypes.func,
    onResponderReject: PropTypes.func,
    onResponderMove: PropTypes.func,
    onResponderRelease: PropTypes.func,
    onResponderTerminate: PropTypes.func,
    onResponderTerminationRequest: PropTypes.func,
    onMoveShouldSetResponder: PropTypes.func,
    onStartShouldSetResponder: PropTypes.func,
    onStartShouldSetResponderCapture: PropTypes.func,

    /**
     * In the absence of `auto` property, `none` is much like `CSS`'s `none`
     * value. `boxNone` is as if you had applied the `CSS` class:
     *
     *   .cantTouchThis * {
     *     pointer-events: auto;
     *   }
     *   .cantTouchThis {
     *     pointer-events: none;
     *   }
     *
     * But since `pointerEvents` does not affect layout/appearance, and we are
     * already deviating from the spec by adding additional modes, we opt to not
     * include `pointerEvents` on `style`. On some platforms, we would need to
     * implement it as a `className` anyways. Using `style` or not is an
     * implementation detail of the platform.
     */
    pointerEvents: PropTypes.oneOf([
      StyleConstants.PointerEventsValues.boxNone,
      StyleConstants.PointerEventsValues.none,
      StyleConstants.PointerEventsValues.boxOnly,
      StyleConstants.PointerEventsValues.unspecified
    ]),

    /**
     * Used to style and layout the `View`.  See `StyleSheet.js` and
     * `ViewStylePropTypes.js` for more info.
     */
    style: stylePropType,

    /**
     * This is a special performance property exposed by RKView and is useful
     * for scrolling content when there are many subviews, most of which are
     * offscreen. For this property to be effective, it must be applied to a
     * view that contains many subviews that extend outside its bound. The
     * subviews must also have overflow: hidden, as should the containing view
     * (or one of its superviews).
     */
    removeClippedSubviews: PropTypes.bool,
  },

  render: function() {
    return <RKView {...this.props} />;
  },
});


var RKView = createReactIOSNativeComponentClass({
  validAttributes: ReactIOSViewAttributes.RKView,
  uiViewClassName: 'RCTView',
});

var ViewToExport = RKView;
if (__DEV__) {
  ViewToExport = View;
}

ViewToExport.pointerEvents = View.pointerEvents;
ViewToExport.stylePropType = stylePropType;

module.exports = ViewToExport;
