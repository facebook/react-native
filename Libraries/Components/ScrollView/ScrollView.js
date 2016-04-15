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

var ColorPropType = require('ColorPropType');
var EdgeInsetsPropType = require('EdgeInsetsPropType');
var Platform = require('Platform');
var PointPropType = require('PointPropType');
var RCTScrollView = require('NativeModules').UIManager.RCTScrollView;
var RCTScrollViewManager = require('NativeModules').ScrollViewManager;
var React = require('React');
var ReactNative = require('ReactNative');
var ScrollResponder = require('ScrollResponder');
var StyleSheet = require('StyleSheet');
var StyleSheetPropType = require('StyleSheetPropType');
var View = require('View');
var ViewStylePropTypes = require('ViewStylePropTypes');

var deprecatedPropType = require('deprecatedPropType');
var dismissKeyboard = require('dismissKeyboard');
var flattenStyle = require('flattenStyle');
var invariant = require('fbjs/lib/invariant');
var requireNativeComponent = require('requireNativeComponent');
var processDecelerationRate = require('processDecelerationRate');
var PropTypes = React.PropTypes;

var SCROLLVIEW = 'ScrollView';
var INNERVIEW = 'InnerScrollView';

/**
 * Component that wraps platform ScrollView while providing
 * integration with touch locking "responder" system.
 *
 * Keep in mind that ScrollViews must have a bounded height in order to work,
 * since they contain unbounded-height children into a bounded container (via
 * a scroll interaction). In order to bound the height of a ScrollView, either
 * set the height of the view directly (discouraged) or make sure all parent
 * views have bounded height. Forgetting to transfer `{flex: 1}` down the
 * view stack can lead to errors here, which the element inspector makes
 * easy to debug.
 *
 * Doesn't yet support other contained responders from blocking this scroll
 * view from becoming the responder.
 */
var ScrollView = React.createClass({
  propTypes: {
    ...View.propTypes,
    /**
     * Controls whether iOS should automatically adjust the content inset
     * for scroll views that are placed behind a navigation bar or
     * tab bar/ toolbar. The default value is true.
     * @platform ios
     */
    automaticallyAdjustContentInsets: PropTypes.bool,
    /**
     * The amount by which the scroll view content is inset from the edges
     * of the scroll view. Defaults to `{0, 0, 0, 0}`.
     * @platform ios
     */
    contentInset: EdgeInsetsPropType,
    /**
     * Used to manually set the starting scroll offset.
     * The default value is `{x: 0, y: 0}`.
     * @platform ios
     */
    contentOffset: PointPropType,
    /**
     * When true, the scroll view bounces when it reaches the end of the
     * content if the content is larger then the scroll view along the axis of
     * the scroll direction. When false, it disables all bouncing even if
     * the `alwaysBounce*` props are true. The default value is true.
     * @platform ios
     */
    bounces: PropTypes.bool,
    /**
     * When true, gestures can drive zoom past min/max and the zoom will animate
     * to the min/max value at gesture end, otherwise the zoom will not exceed
     * the limits.
     * @platform ios
     */
    bouncesZoom: PropTypes.bool,
    /**
     * When true, the scroll view bounces horizontally when it reaches the end
     * even if the content is smaller than the scroll view itself. The default
     * value is true when `horizontal={true}` and false otherwise.
     * @platform ios
     */
    alwaysBounceHorizontal: PropTypes.bool,
    /**
     * When true, the scroll view bounces vertically when it reaches the end
     * even if the content is smaller than the scroll view itself. The default
     * value is false when `horizontal={true}` and true otherwise.
     * @platform ios
     */
    alwaysBounceVertical: PropTypes.bool,
    /**
     * When true, the scroll view automatically centers the content when the
     * content is smaller than the scroll view bounds; when the content is
     * larger than the scroll view, this property has no effect. The default
     * value is false.
     * @platform ios
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
     * decelerates after the user lifts their finger. You may also use string
     * shortcuts `"normal"` and `"fast"` which match the underlying iOS settings
     * for `UIScrollViewDecelerationRateNormal` and
     * `UIScrollViewDecelerationRateFast` respectively.
     *   - normal: 0.998 (the default)
     *   - fast: 0.99
     * @platform ios
     */
    decelerationRate: PropTypes.oneOfType([
      PropTypes.oneOf(['fast', 'normal']),
      PropTypes.number,
    ]),
    /**
     * When true, the scroll view's children are arranged horizontally in a row
     * instead of vertically in a column. The default value is false.
     */
    horizontal: PropTypes.bool,
    /**
     * The style of the scroll indicators.
     *   - `default` (the default), same as `black`.
     *   - `black`, scroll indicator is black. This style is good against a white content background.
     *   - `white`, scroll indicator is white. This style is good against a black content background.
     * @platform ios
     */
    indicatorStyle: PropTypes.oneOf([
      'default', // default
      'black',
      'white',
    ]),
    /**
     * When true, the ScrollView will try to lock to only vertical or horizontal
     * scrolling while dragging.  The default value is false.
     * @platform ios
     */
    directionalLockEnabled: PropTypes.bool,
    /**
     * When false, once tracking starts, won't try to drag if the touch moves.
     * The default value is true.
     * @platform ios
     */
    canCancelContentTouches: PropTypes.bool,
    /**
     * Determines whether the keyboard gets dismissed in response to a drag.
     *   - 'none' (the default), drags do not dismiss the keyboard.
     *   - 'on-drag', the keyboard is dismissed when a drag begins.
     *   - 'interactive', the keyboard is dismissed interactively with the drag and moves in
     *     synchrony with the touch; dragging upwards cancels the dismissal.
     *     On android this is not supported and it will have the same behavior as 'none'.
     */
    keyboardDismissMode: PropTypes.oneOf([
      'none', // default
      'interactive',
      'on-drag',
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
     * @platform ios
     */
    maximumZoomScale: PropTypes.number,
    /**
     * The minimum allowed zoom scale. The default value is 1.0.
     * @platform ios
     */
    minimumZoomScale: PropTypes.number,
    /**
     * Fires at most once per frame during scrolling. The frequency of the
     * events can be controlled using the `scrollEventThrottle` prop.
     */
    onScroll: PropTypes.func,
    /**
     * Called when a scrolling animation ends.
     * @platform ios
     */
    onScrollAnimationEnd: PropTypes.func,
    /**
     * Called when scrollable content view of the ScrollView changes. It's
     * implemented using onLayout handler attached to the content container
     * which this ScrollView renders.
     */
    onContentSizeChange: PropTypes.func,
    /**
     * When true, the scroll view stops on multiples of the scroll view's size
     * when scrolling. This can be used for horizontal pagination. The default
     * value is false.
     * @platform ios
     */
    pagingEnabled: PropTypes.bool,
    /**
     * When false, the content does not scroll.
     * The default value is true.
     */
    scrollEnabled: PropTypes.bool,
    /**
     * This controls how often the scroll event will be fired while scrolling
     * (as a time interval in ms). A lower number yields better accuracy for code
     * that is tracking the scroll position, but can lead to scroll performance
     * problems due to the volume of information being send over the bridge.
     * You will not notice a difference between values set between 1-16 as the
     * JS run loop is synced to the screen refresh rate. If you do not need precise
     * scroll position tracking, set this value higher to limit the information
     * being sent across the bridge. The default value is zero, which results in
     * the scroll event being sent only once each time the view is scrolled.
     * @platform ios
     */
    scrollEventThrottle: PropTypes.number,
    /**
     * The amount by which the scroll view indicators are inset from the edges
     * of the scroll view. This should normally be set to the same value as
     * the `contentInset`. Defaults to `{0, 0, 0, 0}`.
     * @platform ios
     */
    scrollIndicatorInsets: EdgeInsetsPropType,
    /**
     * When true, the scroll view scrolls to top when the status bar is tapped.
     * The default value is true.
     * @platform ios
     */
    scrollsToTop: PropTypes.bool,
    /**
     * When true, shows a horizontal scroll indicator.
     */
    showsHorizontalScrollIndicator: PropTypes.bool,
    /**
     * When true, shows a vertical scroll indicator.
     */
    showsVerticalScrollIndicator: PropTypes.bool,
    /**
     * An array of child indices determining which children get docked to the
     * top of the screen when scrolling. For example, passing
     * `stickyHeaderIndices={[0]}` will cause the first child to be fixed to the
     * top of the scroll view. This property is not supported in conjunction
     * with `horizontal={true}`.
     * @platform ios
     */
    stickyHeaderIndices: PropTypes.arrayOf(PropTypes.number),
    style: StyleSheetPropType(ViewStylePropTypes),
    /**
     * When set, causes the scroll view to stop at multiples of the value of
     * `snapToInterval`. This can be used for paginating through children
     * that have lengths smaller than the scroll view. Used in combination
     * with `snapToAlignment`.
     * @platform ios
     */
    snapToInterval: PropTypes.number,
    /**
     * When `snapToInterval` is set, `snapToAlignment` will define the relationship
     * of the snapping to the scroll view.
     *   - `start` (the default) will align the snap at the left (horizontal) or top (vertical)
     *   - `center` will align the snap in the center
     *   - `end` will align the snap at the right (horizontal) or bottom (vertical)
     * @platform ios
     */
    snapToAlignment: PropTypes.oneOf([
      'start', // default
      'center',
      'end',
    ]),
    /**
     * Experimental: When true, offscreen child views (whose `overflow` value is
     * `hidden`) are removed from their native backing superview when offscreen.
     * This can improve scrolling performance on long lists. The default value is
     * true.
     */
    removeClippedSubviews: PropTypes.bool,
    /**
     * The current scale of the scroll view content. The default value is 1.0.
     * @platform ios
     */
    zoomScale: PropTypes.number,

    /**
     * A RefreshControl component, used to provide pull-to-refresh
     * functionality for the ScrollView.
     *
     * See [RefreshControl](docs/refreshcontrol.html).
     */
    refreshControl: PropTypes.element,

    /**
     * @platform ios
     */
    onRefreshStart: deprecatedPropType(
      PropTypes.func,
      'Use the `refreshControl` prop instead.'
    ),

    /**
     * Sometimes a scrollview takes up more space than its content fills. When this is
     * the case, this prop will fill the rest of the scrollview with a color to avoid setting
     * a background and creating unnecessary overdraw. This is an advanced optimization
     * that is not needed in the general case.
     * @platform android
     */
    endFillColor: ColorPropType,
  },

  mixins: [ScrollResponder.Mixin],

  getInitialState: function() {
    return this.scrollResponderMixinGetInitialState();
  },

  setNativeProps: function(props: Object) {
    this.refs[SCROLLVIEW].setNativeProps(props);
  },

  /**
   * Deprecated. Use `RefreshControl` instead.
   */
  endRefreshing: function() {
    RCTScrollViewManager.endRefreshing(
      ReactNative.findNodeHandle(this)
    );
  },

  /**
   * Returns a reference to the underlying scroll responder, which supports
   * operations like `scrollTo`. All ScrollView-like components should
   * implement this method so that they can be composed while providing access
   * to the underlying scroll responder's methods.
   */
  getScrollResponder: function(): ReactComponent {
    return this;
  },

  getScrollableNode: function(): any {
    return ReactNative.findNodeHandle(this.refs[SCROLLVIEW]);
  },

  getInnerViewNode: function(): any {
    return ReactNative.findNodeHandle(this.refs[INNERVIEW]);
  },

  /**
   * Scrolls to a given x, y offset, either immediately or with a smooth animation.
   *
   * Syntax:
   *
   * `scrollTo(options: {x: number = 0; y: number = 0; animated: boolean = true})`
   *
   * Note: The weird argument signature is due to the fact that, for historical reasons,
   * the function also accepts separate arguments as as alternative to the options object.
   * This is deprecated due to ambiguity (y before x), and SHOULD NOT BE USED.
   */
  scrollTo: function(
    y?: number | { x?: number, y?: number, animated?: boolean },
    x?: number,
    animated?: boolean
  ) {
    if (typeof y === 'number') {
      console.warn('`scrollTo(y, x, animated)` is deprecated. Use `scrollTo({x: 5, y: 5, animated: true})` instead.');
    } else {
      ({x, y, animated} = y || {});
    }
    // $FlowFixMe - Don't know how to pass Mixin correctly. Postpone for now
    this.getScrollResponder().scrollResponderScrollTo({x: x || 0, y: y || 0, animated: animated !== false});
  },

  /**
   * Deprecated, do not use.
   */
  scrollWithoutAnimationTo: function(y: number = 0, x: number = 0) {
    console.warn('`scrollWithoutAnimationTo` is deprecated. Use `scrollTo` instead');
    this.scrollTo({x, y, animated: false});
  },

  _handleScroll: function(e: Object) {
    if (__DEV__) {
      if (this.props.onScroll && !this.props.scrollEventThrottle && Platform.OS === 'ios') {
        console.log(
          'You specified `onScroll` on a <ScrollView> but not ' +
          '`scrollEventThrottle`. You will only receive one event. ' +
          'Using `16` you get all the events but be aware that it may ' +
          'cause frame drops, use a bigger number if you don\'t need as ' +
          'much precision.'
        );
      }
    }
    if (Platform.OS === 'android') {
      if (this.props.keyboardDismissMode === 'on-drag') {
        dismissKeyboard();
      }
    }
    this.scrollResponderHandleScroll(e);
  },

  _handleContentOnLayout: function(e: Object) {
    var {width, height} = e.nativeEvent.layout;
    this.props.onContentSizeChange && this.props.onContentSizeChange(width, height);
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
          ') must be applied through the contentContainerStyle prop.'
      );
    }

    var contentSizeChangeProps = {};
    if (this.props.onContentSizeChange) {
      contentSizeChangeProps = {
        onLayout: this._handleContentOnLayout,
      };
    }

    var contentContainer =
      <View
        {...contentSizeChangeProps}
        ref={INNERVIEW}
        style={contentContainerStyle}
        removeClippedSubviews={this.props.removeClippedSubviews}
        collapsable={false}>
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
      onScroll: this._handleScroll,
      onResponderGrant: this.scrollResponderHandleResponderGrant,
      onResponderTerminationRequest: this.scrollResponderHandleTerminationRequest,
      onResponderTerminate: this.scrollResponderHandleTerminate,
      onResponderRelease: this.scrollResponderHandleResponderRelease,
      onResponderReject: this.scrollResponderHandleResponderReject,
      sendMomentumEvents: (this.props.onMomentumScrollBegin || this.props.onMomentumScrollEnd) ? true : false,
    };

    var onRefreshStart = this.props.onRefreshStart;
    if (onRefreshStart) {
      // this is necessary because if we set it on props, even when empty,
      // it'll trigger the default pull-to-refresh behavior on native.
      props.onRefreshStart =
        function() { onRefreshStart && onRefreshStart(this.endRefreshing); }.bind(this);
    }

    var { decelerationRate } = this.props;
    if (decelerationRate) {
      props.decelerationRate = processDecelerationRate(decelerationRate);
    }

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

    var refreshControl = this.props.refreshControl;
    if (refreshControl) {
      if (Platform.OS === 'ios') {
        // On iOS the RefreshControl is a child of the ScrollView.
        return (
          <ScrollViewClass {...props} ref={SCROLLVIEW}>
            {refreshControl}
            {contentContainer}
          </ScrollViewClass>
        );
      } else if (Platform.OS === 'android') {
        // On Android wrap the ScrollView with a AndroidSwipeRefreshLayout.
        // Since the ScrollView is wrapped add the style props to the
        // AndroidSwipeRefreshLayout and use flex: 1 for the ScrollView.
        return React.cloneElement(
          refreshControl,
          {style: props.style},
          <ScrollViewClass {...props} style={styles.base} ref={SCROLLVIEW}>
            {contentContainer}
          </ScrollViewClass>
        );
      }
    }
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

if (Platform.OS === 'android') {
  var nativeOnlyProps = { nativeOnly : { 'sendMomentumEvents' : true } };
  var AndroidScrollView = requireNativeComponent('RCTScrollView', ScrollView, nativeOnlyProps);
  var AndroidHorizontalScrollView = requireNativeComponent(
    'AndroidHorizontalScrollView',
    ScrollView,
    nativeOnlyProps
  );
} else if (Platform.OS === 'ios') {
  var RCTScrollView = requireNativeComponent('RCTScrollView', ScrollView);
}

module.exports = ScrollView;
