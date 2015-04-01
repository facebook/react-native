/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ScrollView
 * @flow
 */
'use strict';

var EdgeInsetsPropType = require('EdgeInsetsPropType');
var Platform = require('Platform');
var PointPropType = require('PointPropType');
var RCTScrollView = require('NativeModules').UIManager.RCTScrollView;
var RCTScrollViewConsts = RCTScrollView.Constants;
var React = require('React');
var ReactIOSTagHandles = require('ReactIOSTagHandles');
var ReactIOSViewAttributes = require('ReactIOSViewAttributes');
var RCTUIManager = require('NativeModules').UIManager;
var ScrollResponder = require('ScrollResponder');
var StyleSheet = require('StyleSheet');
var StyleSheetPropType = require('StyleSheetPropType');
var View = require('View');
var ViewStylePropTypes = require('ViewStylePropTypes');

var createReactIOSNativeComponentClass = require('createReactIOSNativeComponentClass');
var deepDiffer = require('deepDiffer');
var flattenStyle = require('flattenStyle');
var insetsDiffer = require('insetsDiffer');
var invariant = require('invariant');
var pointsDiffer = require('pointsDiffer');

var PropTypes = React.PropTypes;

var SCROLLVIEW = 'ScrollView';
var INNERVIEW = 'InnerScrollView';

var keyboardDismissModeConstants = {
  'none': RCTScrollViewConsts.KeyboardDismissMode.None, // default
  'interactive': RCTScrollViewConsts.KeyboardDismissMode.Interactive,
  'onDrag': RCTScrollViewConsts.KeyboardDismissMode.OnDrag,
};

/**
 * Component that wraps platform ScrollView while providing
 * integration with touch locking "responder" system.
 *
 * Doesn't yet support other contained responders from blocking this scroll
 * view from becoming the responder.
 */

var ScrollView = React.createClass({
  propTypes: {
    automaticallyAdjustContentInsets: PropTypes.bool, // true
    contentInset: EdgeInsetsPropType, // zeros
    contentOffset: PointPropType, // zeros
    onScroll: PropTypes.func,
    onScrollAnimationEnd: PropTypes.func,
    scrollEnabled: PropTypes.bool, // true
    scrollIndicatorInsets: EdgeInsetsPropType, // zeros
    showsHorizontalScrollIndicator: PropTypes.bool,
    showsVerticalScrollIndicator: PropTypes.bool,
    style: StyleSheetPropType(ViewStylePropTypes),
    scrollEventThrottle: PropTypes.number, // null

    /**
     * When true, the scroll view bounces when it reaches the end of the
     * content if the content is larger then the scroll view along the axis of
     * the scroll direction. When false, it disables all bouncing even if
     * the `alwaysBounce*` props are true. The default value is true.
     */
    bounces: PropTypes.bool,
    /**
     * When true, the scroll view bounces horizontally when it reaches the end
     * even if the content is smaller than the scroll view itself. The default
     * value is true when `horizontal={true}` and false otherwise.
     */
    alwaysBounceHorizontal: PropTypes.bool,
    /**
     * When true, the scroll view bounces vertically when it reaches the end
     * even if the content is smaller than the scroll view itself. The default
     * value is false when `horizontal={true}` and true otherwise.
     */
    alwaysBounceVertical: PropTypes.bool,
    /**
     * When true, the scroll view automatically centers the content when the
     * content is smaller than the scroll view bounds; when the content is
     * larger than the scroll view, this property has no effect. The default
     * value is false.
     */
    centerContent: PropTypes.bool,
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
    decelerationRate: PropTypes.number,
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
    keyboardShouldPersistTaps: PropTypes.bool,
    /**
     * The maximum allowed zoom scale. The default value is 1.0.
     */
    maximumZoomScale: PropTypes.number,
    /**
     * The minimum allowed zoom scale. The default value is 1.0.
     */
    minimumZoomScale: PropTypes.number,
    /**
     * When true, the scroll view stops on multiples of the scroll view's size
     * when scrolling. This can be used for horizontal pagination. The default
     * value is false.
     */
    pagingEnabled: PropTypes.bool,
    /**
     * When true, the scroll view scrolls to top when the status bar is tapped.
     * The default value is true.
     */
    scrollsToTop: PropTypes.bool,
    /**
     * An array of child indices determining which children get docked to the
     * top of the screen when scrolling. For example, passing
     * `stickyHeaderIndices={[0]}` will cause the first child to be fixed to the
     * top of the scroll view. This property is not supported in conjunction
     * with `horizontal={true}`.
     */
    stickyHeaderIndices: PropTypes.arrayOf(PropTypes.number),
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
    zoomScale: PropTypes.number,
  },

  mixins: [ScrollResponder.Mixin],

  getInitialState: function() {
    return this.scrollResponderMixinGetInitialState();
  },

  setNativeProps: function(props: Object) {
    this.refs[SCROLLVIEW].setNativeProps(props);
  },

  getInnerViewNode: function(): any {
    return this.refs[INNERVIEW].getNodeHandle();
  },

  scrollTo: function(destY?: number, destX?: number) {
    RCTUIManager.scrollTo(
      this.getNodeHandle(),
      destX || 0,
      destY || 0
    );
  },

  scrollWithoutAnimationTo: function(destY?: number, destX?: number) {
    RCTUIManager.scrollWithoutAnimationTo(
      this.getNodeHandle(),
      destX || 0,
      destY || 0
    );
  },

  render: function() {
    var contentContainerStyle = [
      this.props.horizontal && styles.contentContainerHorizontal,
      this.props.contentContainerStyle,
    ];
    if (__DEV__ && this.props.style) {
      var style = flattenStyle(this.props.style);
      var childLayoutProps = ['alignItems', 'justifyContent']
        .filter((prop) => style && style[prop] !== undefined);
      invariant(
        childLayoutProps.length === 0,
        'ScrollView child layout (' + JSON.stringify(childLayoutProps) +
          ') must by applied through the contentContainerStyle prop.'
      );
    }
    if (__DEV__) {
      if (this.props.onScroll && !this.props.scrollEventThrottle) {
        var onScroll = this.props.onScroll;
        this.props.onScroll = function() {
          console.log(
            'You specified `onScroll` on a <ScrollView> but not ' +
            '`scrollEventThrottle`. You will only receive one event. ' +
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

    var props = {
      ...this.props,
      alwaysBounceHorizontal,
      alwaysBounceVertical,
      keyboardDismissMode: this.props.keyboardDismissMode ?
        keyboardDismissModeConstants[this.props.keyboardDismissMode] :
        undefined,
      style: ([styles.base, this.props.style]: ?Array<any>),
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
    };

    var ScrollViewClass;
    if (Platform.OS === 'ios') {
      ScrollViewClass = RCTScrollView;
    } else if (Platform.OS === 'android') {
      if (this.props.horizontal) {
        ScrollViewClass = AndroidHorizontalScrollView;
      } else {
        ScrollViewClass = AndroidScrollView;
      }
    }
    invariant(
      ScrollViewClass !== undefined,
      'ScrollViewClass must not be undefined'
    );

    return (
      <ScrollViewClass {...props} ref={SCROLLVIEW}>
        {contentContainer}
      </ScrollViewClass>
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

var validAttributes = {
  ...ReactIOSViewAttributes.UIView,
  alwaysBounceHorizontal: true,
  alwaysBounceVertical: true,
  automaticallyAdjustContentInsets: true,
  bounces: true,
  centerContent: true,
  contentInset: {diff: insetsDiffer},
  contentOffset: {diff: pointsDiffer},
  decelerationRate: true,
  horizontal: true,
  keyboardDismissMode: true,
  keyboardShouldPersistTaps: true,
  maximumZoomScale: true,
  minimumZoomScale: true,
  pagingEnabled: true,
  removeClippedSubviews: true,
  scrollEnabled: true,
  scrollIndicatorInsets: {diff: insetsDiffer},
  scrollsToTop: true,
  showsHorizontalScrollIndicator: true,
  showsVerticalScrollIndicator: true,
  stickyHeaderIndices: {diff: deepDiffer},
  scrollEventThrottle: true,
  zoomScale: true,
};

if (Platform.OS === 'android') {
  var AndroidScrollView = createReactIOSNativeComponentClass({
    validAttributes: validAttributes,
    uiViewClassName: 'AndroidScrollView',
  });
  var AndroidHorizontalScrollView = createReactIOSNativeComponentClass({
    validAttributes: validAttributes,
    uiViewClassName: 'AndroidHorizontalScrollView',
  });
} else if (Platform.OS === 'ios') {
  var RCTScrollView = createReactIOSNativeComponentClass({
    validAttributes: validAttributes,
    uiViewClassName: 'RCTScrollView',
  });
}

module.exports = ScrollView;
