/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ScrollView
 */
'use strict';

var ArrayOfPropType = require('ArrayOfPropType');
var React = require('React');
var ReactIOSViewAttributes = require('ReactIOSViewAttributes');
var ReactIOSTagHandles = require('ReactIOSTagHandles');
var RKScrollView = require('NativeModules').RKUIManager.RCTScrollView;
var RKScrollViewConsts = RKScrollView.Constants;
var RKUIManager = require('NativeModulesDeprecated').RKUIManager;
var ScrollResponder = require('ScrollResponder');
var ScrollViewPropTypes = require('ScrollViewPropTypes');
var StyleSheetPropType = require('StyleSheetPropType');
var StyleSheet = require('StyleSheet');
var View = require('View');
var ViewStylePropTypes = require('ViewStylePropTypes');

var createReactIOSNativeComponentClass = require('createReactIOSNativeComponentClass');
var flattenStyle = require('flattenStyle');
var invariant = require('invariant');
var merge = require('merge');
var nativePropType = require('nativePropType');
var validAttributesFromPropTypes = require('validAttributesFromPropTypes');

var PropTypes = React.PropTypes;

var SCROLLVIEW = 'ScrollView';
var INNERVIEW = 'InnerScrollView';

var keyboardDismissModeConstants = {
  'none': RKScrollViewConsts.KeyboardDismissMode.None, // default
  'interactive': RKScrollViewConsts.KeyboardDismissMode.Interactive,
  'onDrag': RKScrollViewConsts.KeyboardDismissMode.OnDrag,
};

/**
 * `React` component that wraps platform `RKScrollView` while providing
 * integration with touch locking "responder" system.
 *
 * Doesn't yet support other contained responders from blocking this scroll
 * view from becoming the responder.
 */

var ScrollView = React.createClass({
  propTypes: {
    ...ScrollViewPropTypes,

    /**
     * When true, the scroll view bounces horizontally when it reaches the end
     * even if the content is smaller than the scroll view itself. The default
     * value is true when `horizontal={true}` and false otherwise.
     */
    alwaysBounceHorizontal: nativePropType(PropTypes.bool),
    /**
     * When true, the scroll view bounces vertically when it reaches the end
     * even if the content is smaller than the scroll view itself. The default
     * value is false when `horizontal={true}` and true otherwise.
     */
    alwaysBounceVertical: nativePropType(PropTypes.bool),
    /**
     * When true, the scroll view automatically centers the content when the
     * content is smaller than the scroll view bounds; when the content is
     * larger than the scroll view, this property has no effect. The default
     * value is false.
     */
    centerContent: nativePropType(PropTypes.bool),
    /**
     * These styles will be applied to the scroll view content container which
     * wraps all of the child views. Example:
     *
     *   return (
     *     <ScrollView contentContainerStyle={styles.contentContainer}>
     *     </ScrollView>
     *   );
     *   ...
     *   var styles = StyleSheet.create({
     *     contentContainer: {
     *       paddingVertical: 20
     *     }
     *   });
     */
    contentContainerStyle: StyleSheetPropType(ViewStylePropTypes),
    /**
     * A floating-point number that determines how quickly the scroll view
     * decelerates after the user lifts their finger. Reasonable choices include
     *   - Normal: 0.998 (the default)
     *   - Fast: 0.9
     */
    decelerationRate: nativePropType(PropTypes.number),
    /**
     * When true, the scroll view's children are arranged horizontally in a row
     * instead of vertically in a column. The default value is false.
     */
    horizontal: PropTypes.bool,
    /**
     * Determines whether the keyboard gets dismissed in response to a drag.
     *   - 'none' (the default), drags do not dismiss the keyboard.
     *   - 'onDrag', the keyboard is dismissed when a drag begins.
     *   - 'interactive', the keyboard is dismissed interactively with the drag
     *     and moves in synchrony with the touch; dragging upwards cancels the
     *     dismissal.
     */
    keyboardDismissMode: PropTypes.oneOf([
      'none', // default
      'interactive',
      'onDrag',
    ]),
    /**
     * When false, tapping outside of the focused text input when the keyboard
     * is up dismisses the keyboard. When true, the scroll view will not catch
     * taps, and the keyboard will not dismiss automatically. The default value
     * is false.
     */
    keyboardShouldPersistTaps: nativePropType(PropTypes.bool),
    /**
     * The maximum allowed zoom scale. The default value is 1.0.
     */
    maximumZoomScale: nativePropType(PropTypes.number),
    /**
     * The minimum allowed zoom scale. The default value is 1.0.
     */
    minimumZoomScale: nativePropType(PropTypes.number),
    /**
     * When true, the scroll view stops on multiples of the scroll view's size
     * when scrolling. This can be used for horizontal pagination. The default
     * value is false.
     */
    pagingEnabled: nativePropType(PropTypes.bool),
    /**
     * When true, the scroll view scrolls to top when the status bar is tapped.
     * The default value is true.
     */
    scrollsToTop: nativePropType(PropTypes.bool),
    /**
     * An array of child indices determining which children get docked to the
     * top of the screen when scrolling. For example, passing
     * `stickyHeaderIndices={[0]}` will cause the first child to be fixed to the
     * top of the scroll view. This property is not supported in conjunction
     * with `horizontal={true}`.
     */
    stickyHeaderIndices: nativePropType(ArrayOfPropType(PropTypes.number)),
    /**
     * Experimental: When true, offscreen child views (whose `overflow` value is
     * `hidden`) are removed from their native backing superview when offscreen.
     * This canimprove scrolling performance on long lists. The default value is
     * false.
     */
    removeClippedSubviews: PropTypes.bool,
    /**
     * The current scale of the scroll view content. The default value is 1.0.
     */
    zoomScale: nativePropType(PropTypes.number),
  },

  mixins: [ScrollResponder.Mixin],

  getInitialState: function() {
    return this.scrollResponderMixinGetInitialState();
  },

  setNativeProps: function(props) {
    this.refs[SCROLLVIEW].setNativeProps(props);
  },

  getInnerViewNode: function() {
    return this.refs[INNERVIEW].getNodeHandle();
  },

  scrollTo: function(destY, destX) {
    RKUIManager.scrollTo(ReactIOSTagHandles.rootNodeIDToTag[this._rootNodeID], destX, destY);
  },

  render: function() {
    var contentContainerStyle = [
      this.props.horizontal && styles.contentContainerHorizontal,
      this.props.contentContainerStyle,
    ];
    if (__DEV__ && this.props.style) {
      var style = flattenStyle(this.props.style);
      var childLayoutProps = ['alignItems', 'justifyContent']
        .filter((prop) => style[prop] !== undefined);
      invariant(
        childLayoutProps.length === 0,
        'ScrollView child layout (' + JSON.stringify(childLayoutProps) +
          ') must by applied through the contentContainerStyle prop.'
      );
    }
    if (__DEV__) {
      if (this.props.onScroll && !this.props.throttleScrollCallbackMS) {
        var onScroll = this.props.onScroll;
        this.props.onScroll = function() {
          console.log(
            'You specified `onScroll` on a <ScrollView> but not ' +
            '`throttleScrollCallbackMS`. You will only receive one event. ' +
            'Using `16` you get all the events but be aware that it may ' +
            'cause frame drops, use a bigger number if you don\'t need as ' +
            'much precision.'
          );
          onScroll.apply(this, arguments);
        };
      }
    }

    var contentContainer =
      <View
        ref={INNERVIEW}
        style={contentContainerStyle}
        removeClippedSubviews={this.props.removeClippedSubviews}>
        {this.props.children}
      </View>;

    var alwaysBounceHorizontal =
      this.props.alwaysBounceHorizontal !== undefined ?
        this.props.alwaysBounceHorizontal :
        this.props.horizontal;

    var alwaysBounceVertical =
      this.props.alwaysBounceVertical !== undefined ?
        this.props.alwaysBounceVertical :
        !this.props.horizontal;

    var props = merge(
      this.props, {
        alwaysBounceHorizontal,
        alwaysBounceVertical,
        keyboardDismissMode: this.props.keyboardDismissMode ?
          keyboardDismissModeConstants[this.props.keyboardDismissMode] :
          undefined,
        style: [styles.base, this.props.style],
        onTouchStart: this.scrollResponderHandleTouchStart,
        onTouchMove: this.scrollResponderHandleTouchMove,
        onTouchEnd: this.scrollResponderHandleTouchEnd,
        onScrollBeginDrag: this.scrollResponderHandleScrollBeginDrag,
        onScrollEndDrag: this.scrollResponderHandleScrollEndDrag,
        onMomentumScrollBegin: this.scrollResponderHandleMomentumScrollBegin,
        onMomentumScrollEnd: this.scrollResponderHandleMomentumScrollEnd,
        onStartShouldSetResponder: this.scrollResponderHandleStartShouldSetResponder,
        onStartShouldSetResponderCapture: this.scrollResponderHandleStartShouldSetResponderCapture,
        onScrollShouldSetResponder: this.scrollResponderHandleScrollShouldSetResponder,
        onScroll: this.scrollResponderHandleScroll,
        onResponderGrant: this.scrollResponderHandleResponderGrant,
        onResponderTerminationRequest: this.scrollResponderHandleTerminationRequest,
        onResponderTerminate: this.scrollResponderHandleTerminate,
        onResponderRelease: this.scrollResponderHandleResponderRelease,
        onResponderReject: this.scrollResponderHandleResponderReject,
      }
    );
    return (
      <RKScrollView {...props} ref={SCROLLVIEW}>
        {contentContainer}
      </RKScrollView>
    );
  }
});

var styles = StyleSheet.create({
  base: {
    flex: 1,
  },
  contentContainerHorizontal: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
  },
});

var RKScrollView = createReactIOSNativeComponentClass({
  validAttributes: merge(
    ReactIOSViewAttributes.UIView,
    validAttributesFromPropTypes(ScrollView.propTypes)
  ),
  uiViewClassName: 'RCTScrollView',
});

module.exports = ScrollView;
