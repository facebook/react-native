/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const AnimatedImplementation = require('AnimatedImplementation');
const Platform = require('Platform');
const React = require('React');
const ReactNative = require('ReactNative');
const ScrollResponder = require('ScrollResponder');
const ScrollViewStickyHeader = require('ScrollViewStickyHeader');
const StyleSheet = require('StyleSheet');
const View = require('View');
const InternalScrollViewType = require('InternalScrollViewType');

const createReactClass = require('create-react-class');
const dismissKeyboard = require('dismissKeyboard');
const flattenStyle = require('flattenStyle');
const invariant = require('fbjs/lib/invariant');
const processDecelerationRate = require('processDecelerationRate');
const requireNativeComponent = require('requireNativeComponent');
const resolveAssetSource = require('resolveAssetSource');

import type {PressEvent} from 'CoreEventTypes';
import type {EdgeInsetsProp} from 'EdgeInsetsPropType';
import type {NativeMethodsMixinType} from 'ReactNativeTypes';
import type {ViewStyleProp} from 'StyleSheet';
import type {ViewProps} from 'ViewPropTypes';
import type {PointProp} from 'PointPropType';

import type {ColorValue} from 'StyleSheetTypes';

let AndroidScrollView;
let AndroidHorizontalScrollContentView;
let AndroidHorizontalScrollView;
let RCTScrollView;
let RCTScrollContentView;

if (Platform.OS === 'android') {
  AndroidScrollView = requireNativeComponent('RCTScrollView');
  AndroidHorizontalScrollView = requireNativeComponent(
    'AndroidHorizontalScrollView',
  );
  AndroidHorizontalScrollContentView = requireNativeComponent(
    'AndroidHorizontalScrollContentView',
  );
} else if (Platform.OS === 'ios') {
  RCTScrollView = requireNativeComponent('RCTScrollView');
  RCTScrollContentView = requireNativeComponent('RCTScrollContentView');
} else {
  RCTScrollView = requireNativeComponent('RCTScrollView');
  RCTScrollContentView = requireNativeComponent('RCTScrollContentView');
}

type TouchableProps = $ReadOnly<{|
  onTouchStart?: (event: PressEvent) => void,
  onTouchMove?: (event: PressEvent) => void,
  onTouchEnd?: (event: PressEvent) => void,
  onTouchCancel?: (event: PressEvent) => void,
  onTouchEndCapture?: (event: PressEvent) => void,
|}>;

type IOSProps = $ReadOnly<{|
  /**
   * Controls whether iOS should automatically adjust the content inset
   * for scroll views that are placed behind a navigation bar or
   * tab bar/ toolbar. The default value is true.
   * @platform ios
   */
  automaticallyAdjustContentInsets?: ?boolean,
  /**
   * The amount by which the scroll view content is inset from the edges
   * of the scroll view. Defaults to `{top: 0, left: 0, bottom: 0, right: 0}`.
   * @platform ios
   */
  contentInset?: ?EdgeInsetsProp,
  /**
   * Used to manually set the starting scroll offset.
   * The default value is `{x: 0, y: 0}`.
   * @platform ios
   */
  contentOffset?: ?PointProp,
  /**
   * When true, the scroll view bounces when it reaches the end of the
   * content if the content is larger then the scroll view along the axis of
   * the scroll direction. When false, it disables all bouncing even if
   * the `alwaysBounce*` props are true. The default value is true.
   * @platform ios
   */
  bounces?: ?boolean,
  /**
   * When true, gestures can drive zoom past min/max and the zoom will animate
   * to the min/max value at gesture end, otherwise the zoom will not exceed
   * the limits.
   * @platform ios
   */
  bouncesZoom?: ?boolean,
  /**
   * When true, the scroll view bounces horizontally when it reaches the end
   * even if the content is smaller than the scroll view itself. The default
   * value is true when `horizontal={true}` and false otherwise.
   * @platform ios
   */
  alwaysBounceHorizontal?: ?boolean,
  /**
   * When true, the scroll view bounces vertically when it reaches the end
   * even if the content is smaller than the scroll view itself. The default
   * value is false when `horizontal={true}` and true otherwise.
   * @platform ios
   */
  alwaysBounceVertical?: ?boolean,
  /**
   * When true, the scroll view automatically centers the content when the
   * content is smaller than the scroll view bounds; when the content is
   * larger than the scroll view, this property has no effect. The default
   * value is false.
   * @platform ios
   */
  centerContent?: ?boolean,
  /**
   * The style of the scroll indicators.
   *
   *   - `'default'` (the default), same as `black`.
   *   - `'black'`, scroll indicator is black. This style is good against a light background.
   *   - `'white'`, scroll indicator is white. This style is good against a dark background.
   *
   * @platform ios
   */
  indicatorStyle?: ?('default' | 'black' | 'white'),
  /**
   * When true, the ScrollView will try to lock to only vertical or horizontal
   * scrolling while dragging.  The default value is false.
   * @platform ios
   */
  directionalLockEnabled?: ?boolean,
  /**
   * When false, once tracking starts, won't try to drag if the touch moves.
   * The default value is true.
   * @platform ios
   */
  canCancelContentTouches?: ?boolean,
  /**
   * When set, the scroll view will adjust the scroll position so that the first child that is
   * currently visible and at or beyond `minIndexForVisible` will not change position. This is
   * useful for lists that are loading content in both directions, e.g. a chat thread, where new
   * messages coming in might otherwise cause the scroll position to jump. A value of 0 is common,
   * but other values such as 1 can be used to skip loading spinners or other content that should
   * not maintain position.
   *
   * The optional `autoscrollToTopThreshold` can be used to make the content automatically scroll
   * to the top after making the adjustment if the user was within the threshold of the top before
   * the adjustment was made. This is also useful for chat-like applications where you want to see
   * new messages scroll into place, but not if the user has scrolled up a ways and it would be
   * disruptive to scroll a bunch.
   *
   * Caveat 1: Reordering elements in the scrollview with this enabled will probably cause
   * jumpiness and jank. It can be fixed, but there are currently no plans to do so. For now,
   * don't re-order the content of any ScrollViews or Lists that use this feature.
   *
   * Caveat 2: This simply uses `contentOffset` and `frame.origin` in native code to compute
   * visibility. Occlusion, transforms, and other complexity won't be taken into account as to
   * whether content is "visible" or not.
   *
   * @platform ios
   */
  maintainVisibleContentPosition?: ?$ReadOnly<{|
    minIndexForVisible: number,
    autoscrollToTopThreshold?: ?number,
  |}>,
  /**
   * The maximum allowed zoom scale. The default value is 1.0.
   * @platform ios
   */
  maximumZoomScale?: ?number,
  /**
   * The minimum allowed zoom scale. The default value is 1.0.
   * @platform ios
   */
  minimumZoomScale?: ?number,
  /**
   * When true, ScrollView allows use of pinch gestures to zoom in and out.
   * The default value is true.
   * @platform ios
   */
  pinchGestureEnabled?: ?boolean,
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
  scrollEventThrottle?: ?number,
  /**
   * The amount by which the scroll view indicators are inset from the edges
   * of the scroll view. This should normally be set to the same value as
   * the `contentInset`. Defaults to `{0, 0, 0, 0}`.
   * @platform ios
   */
  scrollIndicatorInsets?: ?EdgeInsetsProp,
  /**
   * When true, the scroll view scrolls to top when the status bar is tapped.
   * The default value is true.
   * @platform ios
   */
  scrollsToTop?: ?boolean,
  /**
   * Fires when the scroll view scrolls to top after the status bar has been tapped
   * @platform ios
   */
  onScrollToTop?: ?Function,
  /**
   * When true, shows a horizontal scroll indicator.
   * The default value is true.
   */
  showsHorizontalScrollIndicator?: ?boolean,
  /**
   * When `snapToInterval` is set, `snapToAlignment` will define the relationship
   * of the snapping to the scroll view.
   *
   *   - `'start'` (the default) will align the snap at the left (horizontal) or top (vertical)
   *   - `'center'` will align the snap in the center
   *   - `'end'` will align the snap at the right (horizontal) or bottom (vertical)
   *
   * @platform ios
   */
  snapToAlignment?: ?('start' | 'center' | 'end'),
  /**
   * The current scale of the scroll view content. The default value is 1.0.
   * @platform ios
   */
  zoomScale?: ?number,
  /**
   * This property specifies how the safe area insets are used to modify the
   * content area of the scroll view. The default value of this property is
   * "never". Available on iOS 11 and later.
   * @platform ios
   */
  contentInsetAdjustmentBehavior?: ?(
    | 'automatic'
    | 'scrollableAxes'
    | 'never'
    | 'always'
  ),
  /**
   * When true, ScrollView will emit updateChildFrames data in scroll events,
   * otherwise will not compute or emit child frame data.  This only exists
   * to support legacy issues, `onLayout` should be used instead to retrieve
   * frame data.
   * The default value is false.
   * @platform ios
   */
  DEPRECATED_sendUpdatedChildFrames?: ?boolean,
|}>;

type AndroidProps = $ReadOnly<{|
  /**
   * Enables nested scrolling for Android API level 21+.
   * Nested scrolling is supported by default on iOS
   * @platform android
   */
  nestedScrollEnabled?: ?boolean,
  /**
   * Sometimes a scrollview takes up more space than its content fills. When this is
   * the case, this prop will fill the rest of the scrollview with a color to avoid setting
   * a background and creating unnecessary overdraw. This is an advanced optimization
   * that is not needed in the general case.
   * @platform android
   */
  endFillColor?: ?ColorValue,
  /**
   * Tag used to log scroll performance on this scroll view. Will force
   * momentum events to be turned on (see sendMomentumEvents). This doesn't do
   * anything out of the box and you need to implement a custom native
   * FpsListener for it to be useful.
   * @platform android
   */
  scrollPerfTag?: ?string,
  /**
   * Used to override default value of overScroll mode.
   *
   * Possible values:
   *
   *  - `'auto'` - Default value, allow a user to over-scroll
   *    this view only if the content is large enough to meaningfully scroll.
   *  - `'always'` - Always allow a user to over-scroll this view.
   *  - `'never'` - Never allow a user to over-scroll this view.
   *
   * @platform android
   */
  overScrollMode?: ?('auto' | 'always' | 'never'),
|}>;

type VRProps = $ReadOnly<{|
  /**
   * Optionally an image can be used for the scroll bar thumb. This will
   * override the color. While the image is loading or the image fails to
   * load the color will be used instead. Use an alpha of 0 in the color
   * to avoid seeing it while the image is loading.
   *
   * - `uri` - a string representing the resource identifier for the image, which
   * should be either a local file path or the name of a static image resource
   * - `number` - Opaque type returned by something like
   * `import IMAGE from './image.jpg'`.
   * @platform vr
   */
  scrollBarThumbImage?: ?($ReadOnly<{||}> | number), // Opaque type returned by import IMAGE from './image.jpg'
|}>;

export type Props = $ReadOnly<{|
  ...ViewProps,
  ...TouchableProps,
  ...IOSProps,
  ...AndroidProps,
  ...VRProps,

  /**
   * These styles will be applied to the scroll view content container which
   * wraps all of the child views. Example:
   *
   * ```
   * return (
   *   <ScrollView contentContainerStyle={styles.contentContainer}>
   *   </ScrollView>
   * );
   * ...
   * const styles = StyleSheet.create({
   *   contentContainer: {
   *     paddingVertical: 20
   *   }
   * });
   * ```
   */
  contentContainerStyle?: ?ViewStyleProp,
  /**
   * A floating-point number that determines how quickly the scroll view
   * decelerates after the user lifts their finger. You may also use string
   * shortcuts `"normal"` and `"fast"` which match the underlying iOS settings
   * for `UIScrollViewDecelerationRateNormal` and
   * `UIScrollViewDecelerationRateFast` respectively.
   *
   *   - `'normal'`: 0.998 on iOS, 0.985 on Android (the default)
   *   - `'fast'`: 0.99 on iOS, 0.9 on Android
   */
  decelerationRate?: ?('fast' | 'normal' | number),
  /**
   * When true, the scroll view's children are arranged horizontally in a row
   * instead of vertically in a column. The default value is false.
   */
  horizontal?: ?boolean,
  /**
   * If sticky headers should stick at the bottom instead of the top of the
   * ScrollView. This is usually used with inverted ScrollViews.
   */
  invertStickyHeaders?: ?boolean,
  /**
   * Determines whether the keyboard gets dismissed in response to a drag.
   *
   * *Cross platform*
   *
   *   - `'none'` (the default), drags do not dismiss the keyboard.
   *   - `'on-drag'`, the keyboard is dismissed when a drag begins.
   *
   * *iOS Only*
   *
   *   - `'interactive'`, the keyboard is dismissed interactively with the drag and moves in
   *     synchrony with the touch; dragging upwards cancels the dismissal.
   *     On android this is not supported and it will have the same behavior as 'none'.
   */
  keyboardDismissMode?: ?(
    | 'none' // default
    | 'on-drag' // cross-platform
    | 'interactive'
  ), // ios only
  /**
   * Determines when the keyboard should stay visible after a tap.
   *
   *   - `'never'` (the default), tapping outside of the focused text input when the keyboard
   *     is up dismisses the keyboard. When this happens, children won't receive the tap.
   *   - `'always'`, the keyboard will not dismiss automatically, and the scroll view will not
   *     catch taps, but children of the scroll view can catch taps.
   *   - `'handled'`, the keyboard will not dismiss automatically when the tap was handled by
   *     a children, (or captured by an ancestor).
   *   - `false`, deprecated, use 'never' instead
   *   - `true`, deprecated, use 'always' instead
   */
  /* $FlowFixMe(>=0.86.0 site=react_native_fb) This comment suppresses an error
   * found when Flow v0.86 was deployed. To see the error, delete this comment
   * and run Flow. */
  keyboardShouldPersistTaps?: ?('always' | 'never' | 'handled' | false | true),
  /**
   * Called when the momentum scroll starts (scroll which occurs as the ScrollView glides to a stop).
   */
  onMomentumScrollBegin?: ?Function,
  /**
   * Called when the momentum scroll ends (scroll which occurs as the ScrollView glides to a stop).
   */
  onMomentumScrollEnd?: ?Function,

  /**
   * Fires at most once per frame during scrolling. The frequency of the
   * events can be controlled using the `scrollEventThrottle` prop.
   */
  onScroll?: ?Function,
  /**
   * Called when the user begins to drag the scroll view.
   */
  onScrollBeginDrag?: ?Function,
  /**
   * Called when the user stops dragging the scroll view and it either stops
   * or begins to glide.
   */
  onScrollEndDrag?: ?Function,
  /**
   * Called when scrollable content view of the ScrollView changes.
   *
   * Handler function is passed the content width and content height as parameters:
   * `(contentWidth, contentHeight)`
   *
   * It's implemented using onLayout handler attached to the content container
   * which this ScrollView renders.
   */
  onContentSizeChange?: ?Function,
  onKeyboardDidShow?: (event: PressEvent) => void,
  /**
   * When true, the scroll view stops on multiples of the scroll view's size
   * when scrolling. This can be used for horizontal pagination. The default
   * value is false.
   *
   * Note: Vertical pagination is not supported on Android.
   */
  pagingEnabled?: ?boolean,
  /**
   * When false, the view cannot be scrolled via touch interaction.
   * The default value is true.
   *
   * Note that the view can always be scrolled by calling `scrollTo`.
   */
  scrollEnabled?: ?boolean,
  /**
   * When true, shows a vertical scroll indicator.
   * The default value is true.
   */
  showsVerticalScrollIndicator?: ?boolean,
  /**
   * An array of child indices determining which children get docked to the
   * top of the screen when scrolling. For example, passing
   * `stickyHeaderIndices={[0]}` will cause the first child to be fixed to the
   * top of the scroll view. This property is not supported in conjunction
   * with `horizontal={true}`.
   */
  stickyHeaderIndices?: ?$ReadOnlyArray<number>,
  /**
   * When set, causes the scroll view to stop at multiples of the value of
   * `snapToInterval`. This can be used for paginating through children
   * that have lengths smaller than the scroll view. Typically used in
   * combination with `snapToAlignment` and `decelerationRate="fast"`.
   *
   * Overrides less configurable `pagingEnabled` prop.
   */
  snapToInterval?: ?number,
  /**
   * When set, causes the scroll view to stop at the defined offsets.
   * This can be used for paginating through variously sized children
   * that have lengths smaller than the scroll view. Typically used in
   * combination with `decelerationRate="fast"`.
   *
   * Overrides less configurable `pagingEnabled` and `snapToInterval` props.
   */
  snapToOffsets?: ?$ReadOnlyArray<number>,
  /**
   * Use in conjuction with `snapToOffsets`. By default, the beginning
   * of the list counts as a snap offset. Set `snapToStart` to false to disable
   * this behavior and allow the list to scroll freely between its start and
   * the first `snapToOffsets` offset.
   * The default value is true.
   */
  snapToStart?: ?boolean,
  /**
   * Use in conjuction with `snapToOffsets`. By default, the end
   * of the list counts as a snap offset. Set `snapToEnd` to false to disable
   * this behavior and allow the list to scroll freely between its end and
   * the last `snapToOffsets` offset.
   * The default value is true.
   */
  snapToEnd?: ?boolean,
  /**
   * Experimental: When true, offscreen child views (whose `overflow` value is
   * `hidden`) are removed from their native backing superview when offscreen.
   * This can improve scrolling performance on long lists. The default value is
   * true.
   */
  removeClippedSubviews?: ?boolean,
  /**
   * A RefreshControl component, used to provide pull-to-refresh
   * functionality for the ScrollView. Only works for vertical ScrollViews
   * (`horizontal` prop must be `false`).
   *
   * See [RefreshControl](docs/refreshcontrol.html).
   */
  refreshControl?: ?React.Element<any>,
  children?: React.Node,
|}>;

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
 *
 *
 * `<ScrollView>` vs [`<FlatList>`](/react-native/docs/flatlist.html) - which one to use?
 *
 * `ScrollView` simply renders all its react child components at once. That
 * makes it very easy to understand and use.
 *
 * On the other hand, this has a performance downside. Imagine you have a very
 * long list of items you want to display, maybe several screens worth of
 * content. Creating JS components and native views for everything all at once,
 * much of which may not even be shown, will contribute to slow rendering and
 * increased memory usage.
 *
 * This is where `FlatList` comes into play. `FlatList` renders items lazily,
 * just when they are about to appear, and removes items that scroll way off
 * screen to save memory and processing time.
 *
 * `FlatList` is also handy if you want to render separators between your items,
 * multiple columns, infinite scroll loading, or any number of other features it
 * supports out of the box.
 */
const ScrollView = createReactClass({
  displayName: 'ScrollView',
  mixins: [ScrollResponder.Mixin],

  _scrollAnimatedValue: (new AnimatedImplementation.Value(
    0,
  ): AnimatedImplementation.Value),
  _scrollAnimatedValueAttachment: (null: ?{detach: () => void}),
  _stickyHeaderRefs: (new Map(): Map<number, ScrollViewStickyHeader>),
  _headerLayoutYs: (new Map(): Map<string, number>),
  getInitialState: function() {
    return {
      ...this.scrollResponderMixinGetInitialState(),
      layoutHeight: null,
    };
  },

  UNSAFE_componentWillMount: function() {
    this._scrollAnimatedValue = new AnimatedImplementation.Value(
      this.props.contentOffset ? this.props.contentOffset.y : 0,
    );
    this._scrollAnimatedValue.setOffset(
      this.props.contentInset ? this.props.contentInset.top : 0,
    );
    this._stickyHeaderRefs = new Map();
    this._headerLayoutYs = new Map();
  },

  componentDidMount: function() {
    this._updateAnimatedNodeAttachment();
  },

  componentDidUpdate: function() {
    this._updateAnimatedNodeAttachment();
  },

  componentWillUnmount: function() {
    if (this._scrollAnimatedValueAttachment) {
      this._scrollAnimatedValueAttachment.detach();
    }
  },

  setNativeProps: function(props: Object) {
    this._scrollViewRef && this._scrollViewRef.setNativeProps(props);
  },

  /**
   * Returns a reference to the underlying scroll responder, which supports
   * operations like `scrollTo`. All ScrollView-like components should
   * implement this method so that they can be composed while providing access
   * to the underlying scroll responder's methods.
   */
  getScrollResponder: function(): ScrollView {
    return this;
  },

  getScrollableNode: function(): any {
    return ReactNative.findNodeHandle(this._scrollViewRef);
  },

  getInnerViewNode: function(): any {
    return ReactNative.findNodeHandle(this._innerViewRef);
  },

  /**
   * Scrolls to a given x, y offset, either immediately or with a smooth animation.
   *
   * Example:
   *
   * `scrollTo({x: 0, y: 0, animated: true})`
   *
   * Note: The weird function signature is due to the fact that, for historical reasons,
   * the function also accepts separate arguments as an alternative to the options object.
   * This is deprecated due to ambiguity (y before x), and SHOULD NOT BE USED.
   */
  scrollTo: function(
    y?: number | {x?: number, y?: number, animated?: boolean},
    x?: number,
    animated?: boolean,
  ) {
    if (typeof y === 'number') {
      console.warn(
        '`scrollTo(y, x, animated)` is deprecated. Use `scrollTo({x: 5, y: 5, ' +
          'animated: true})` instead.',
      );
    } else {
      ({x, y, animated} = y || {});
    }
    this.getScrollResponder().scrollResponderScrollTo({
      x: x || 0,
      y: y || 0,
      animated: animated !== false,
    });
  },

  /**
   * If this is a vertical ScrollView scrolls to the bottom.
   * If this is a horizontal ScrollView scrolls to the right.
   *
   * Use `scrollToEnd({animated: true})` for smooth animated scrolling,
   * `scrollToEnd({animated: false})` for immediate scrolling.
   * If no options are passed, `animated` defaults to true.
   */
  scrollToEnd: function(options?: {animated?: boolean}) {
    // Default to true
    const animated = (options && options.animated) !== false;
    this.getScrollResponder().scrollResponderScrollToEnd({
      animated: animated,
    });
  },

  /**
   * Deprecated, use `scrollTo` instead.
   */
  scrollWithoutAnimationTo: function(y: number = 0, x: number = 0) {
    console.warn(
      '`scrollWithoutAnimationTo` is deprecated. Use `scrollTo` instead',
    );
    this.scrollTo({x, y, animated: false});
  },

  /**
   * Displays the scroll indicators momentarily.
   *
   * @platform ios
   */
  flashScrollIndicators: function() {
    this.getScrollResponder().scrollResponderFlashScrollIndicators();
  },

  _getKeyForIndex: function(index, childArray) {
    // $FlowFixMe Invalid prop usage
    const child = childArray[index];
    return child && child.key;
  },

  _updateAnimatedNodeAttachment: function() {
    if (this._scrollAnimatedValueAttachment) {
      this._scrollAnimatedValueAttachment.detach();
    }
    if (
      this.props.stickyHeaderIndices &&
      this.props.stickyHeaderIndices.length > 0
    ) {
      this._scrollAnimatedValueAttachment = AnimatedImplementation.attachNativeEvent(
        this._scrollViewRef,
        'onScroll',
        [{nativeEvent: {contentOffset: {y: this._scrollAnimatedValue}}}],
      );
    }
  },

  _setStickyHeaderRef: function(key, ref) {
    if (ref) {
      this._stickyHeaderRefs.set(key, ref);
    } else {
      this._stickyHeaderRefs.delete(key);
    }
  },

  _onStickyHeaderLayout: function(index, event, key) {
    if (!this.props.stickyHeaderIndices) {
      return;
    }
    const childArray = React.Children.toArray(this.props.children);
    if (key !== this._getKeyForIndex(index, childArray)) {
      // ignore stale layout update
      return;
    }

    const layoutY = event.nativeEvent.layout.y;
    this._headerLayoutYs.set(key, layoutY);

    const indexOfIndex = this.props.stickyHeaderIndices.indexOf(index);
    const previousHeaderIndex = this.props.stickyHeaderIndices[
      indexOfIndex - 1
    ];
    if (previousHeaderIndex != null) {
      const previousHeader = this._stickyHeaderRefs.get(
        this._getKeyForIndex(previousHeaderIndex, childArray),
      );
      previousHeader && previousHeader.setNextHeaderY(layoutY);
    }
  },

  _handleScroll: function(e: Object) {
    if (__DEV__) {
      if (
        this.props.onScroll &&
        this.props.scrollEventThrottle == null &&
        Platform.OS === 'ios'
      ) {
        console.log(
          'You specified `onScroll` on a <ScrollView> but not ' +
            '`scrollEventThrottle`. You will only receive one event. ' +
            'Using `16` you get all the events but be aware that it may ' +
            "cause frame drops, use a bigger number if you don't need as " +
            'much precision.',
        );
      }
    }
    if (Platform.OS === 'android') {
      if (
        this.props.keyboardDismissMode === 'on-drag' &&
        this.state.isTouching
      ) {
        dismissKeyboard();
      }
    }
    this.scrollResponderHandleScroll(e);
  },

  _handleLayout: function(e: Object) {
    if (this.props.invertStickyHeaders) {
      this.setState({layoutHeight: e.nativeEvent.layout.height});
    }
    if (this.props.onLayout) {
      this.props.onLayout(e);
    }
  },

  _handleContentOnLayout: function(e: Object) {
    const {width, height} = e.nativeEvent.layout;
    this.props.onContentSizeChange &&
      this.props.onContentSizeChange(width, height);
  },

  _scrollViewRef: (null: ?ScrollView),
  _setScrollViewRef: function(ref: ?ScrollView) {
    this._scrollViewRef = ref;
  },

  _innerViewRef: (null: ?NativeMethodsMixinType),
  _setInnerViewRef: function(ref: ?NativeMethodsMixinType) {
    this._innerViewRef = ref;
  },

  render: function() {
    let ScrollViewClass;
    let ScrollContentContainerViewClass;
    if (Platform.OS === 'android') {
      if (this.props.horizontal) {
        ScrollViewClass = AndroidHorizontalScrollView;
        ScrollContentContainerViewClass = AndroidHorizontalScrollContentView;
      } else {
        ScrollViewClass = AndroidScrollView;
        ScrollContentContainerViewClass = View;
      }
    } else {
      ScrollViewClass = RCTScrollView;
      ScrollContentContainerViewClass = RCTScrollContentView;
    }

    invariant(
      ScrollViewClass !== undefined,
      'ScrollViewClass must not be undefined',
    );

    invariant(
      ScrollContentContainerViewClass !== undefined,
      'ScrollContentContainerViewClass must not be undefined',
    );

    const contentContainerStyle = [
      this.props.horizontal && styles.contentContainerHorizontal,
      this.props.contentContainerStyle,
    ];
    if (__DEV__ && this.props.style) {
      const style = flattenStyle(this.props.style);
      const childLayoutProps = ['alignItems', 'justifyContent'].filter(
        prop => style && style[prop] !== undefined,
      );
      invariant(
        childLayoutProps.length === 0,
        'ScrollView child layout (' +
          JSON.stringify(childLayoutProps) +
          ') must be applied through the contentContainerStyle prop.',
      );
    }

    let contentSizeChangeProps = {};
    if (this.props.onContentSizeChange) {
      contentSizeChangeProps = {
        onLayout: this._handleContentOnLayout,
      };
    }

    const {stickyHeaderIndices} = this.props;
    const hasStickyHeaders =
      stickyHeaderIndices && stickyHeaderIndices.length > 0;
    const childArray =
      hasStickyHeaders && React.Children.toArray(this.props.children);
    const children = hasStickyHeaders
      ? // $FlowFixMe Invalid prop usage
        childArray.map((child, index) => {
          const indexOfIndex = child ? stickyHeaderIndices.indexOf(index) : -1;
          if (indexOfIndex > -1) {
            const key = child.key;
            const nextIndex = stickyHeaderIndices[indexOfIndex + 1];
            return (
              <ScrollViewStickyHeader
                key={key}
                ref={ref => this._setStickyHeaderRef(key, ref)}
                nextHeaderLayoutY={this._headerLayoutYs.get(
                  this._getKeyForIndex(nextIndex, childArray),
                )}
                onLayout={event =>
                  this._onStickyHeaderLayout(index, event, key)
                }
                scrollAnimatedValue={this._scrollAnimatedValue}
                inverted={this.props.invertStickyHeaders}
                scrollViewHeight={this.state.layoutHeight}>
                {child}
              </ScrollViewStickyHeader>
            );
          } else {
            return child;
          }
        })
      : this.props.children;
    const contentContainer = (
      <ScrollContentContainerViewClass
        {...contentSizeChangeProps}
        // $FlowFixMe Invalid prop usage
        ref={this._setInnerViewRef}
        style={contentContainerStyle}
        removeClippedSubviews={
          // Subview clipping causes issues with sticky headers on Android and
          // would be hard to fix properly in a performant way.
          Platform.OS === 'android' && hasStickyHeaders
            ? false
            : this.props.removeClippedSubviews
        }
        collapsable={false}>
        {children}
      </ScrollContentContainerViewClass>
    );

    const alwaysBounceHorizontal =
      this.props.alwaysBounceHorizontal !== undefined
        ? this.props.alwaysBounceHorizontal
        : this.props.horizontal;

    const alwaysBounceVertical =
      this.props.alwaysBounceVertical !== undefined
        ? this.props.alwaysBounceVertical
        : !this.props.horizontal;

    const DEPRECATED_sendUpdatedChildFrames = !!this.props
      .DEPRECATED_sendUpdatedChildFrames;

    const baseStyle = this.props.horizontal
      ? styles.baseHorizontal
      : styles.baseVertical;
    const props = {
      ...this.props,
      alwaysBounceHorizontal,
      alwaysBounceVertical,
      style: ([baseStyle, this.props.style]: ?Array<any>),
      // Override the onContentSizeChange from props, since this event can
      // bubble up from TextInputs
      onContentSizeChange: null,
      onLayout: this._handleLayout,
      onMomentumScrollBegin: this.scrollResponderHandleMomentumScrollBegin,
      onMomentumScrollEnd: this.scrollResponderHandleMomentumScrollEnd,
      onResponderGrant: this.scrollResponderHandleResponderGrant,
      onResponderReject: this.scrollResponderHandleResponderReject,
      onResponderRelease: this.scrollResponderHandleResponderRelease,
      // $FlowFixMe
      onResponderTerminate: this.scrollResponderHandleTerminate,
      onResponderTerminationRequest: this
        .scrollResponderHandleTerminationRequest,
      onScroll: this._handleScroll,
      onScrollBeginDrag: this.scrollResponderHandleScrollBeginDrag,
      onScrollEndDrag: this.scrollResponderHandleScrollEndDrag,
      onScrollShouldSetResponder: this
        .scrollResponderHandleScrollShouldSetResponder,
      onStartShouldSetResponder: this
        .scrollResponderHandleStartShouldSetResponder,
      onStartShouldSetResponderCapture: this
        .scrollResponderHandleStartShouldSetResponderCapture,
      onTouchEnd: this.scrollResponderHandleTouchEnd,
      onTouchMove: this.scrollResponderHandleTouchMove,
      onTouchStart: this.scrollResponderHandleTouchStart,
      onTouchCancel: this.scrollResponderHandleTouchCancel,
      scrollBarThumbImage: resolveAssetSource(this.props.scrollBarThumbImage),
      scrollEventThrottle: hasStickyHeaders
        ? 1
        : this.props.scrollEventThrottle,
      sendMomentumEvents:
        this.props.onMomentumScrollBegin || this.props.onMomentumScrollEnd
          ? true
          : false,
      DEPRECATED_sendUpdatedChildFrames,
      // default to true
      snapToStart: this.props.snapToStart !== false,
      // default to true
      snapToEnd: this.props.snapToEnd !== false,
      // pagingEnabled is overridden by snapToInterval / snapToOffsets
      pagingEnabled: Platform.select({
        // on iOS, pagingEnabled must be set to false to have snapToInterval / snapToOffsets work
        ios:
          this.props.pagingEnabled &&
          this.props.snapToInterval == null &&
          this.props.snapToOffsets == null,
        // on Android, pagingEnabled must be set to true to have snapToInterval / snapToOffsets work
        android:
          this.props.pagingEnabled ||
          this.props.snapToInterval != null ||
          this.props.snapToOffsets != null,
      }),
    };

    const {decelerationRate} = this.props;
    if (decelerationRate != null) {
      props.decelerationRate = processDecelerationRate(decelerationRate);
    }

    const refreshControl = this.props.refreshControl;

    if (refreshControl) {
      if (Platform.OS === 'ios') {
        // On iOS the RefreshControl is a child of the ScrollView.
        // tvOS lacks native support for RefreshControl, so don't include it in that case
        return (
          <ScrollViewClass {...props} ref={this._setScrollViewRef}>
            {Platform.isTV ? null : refreshControl}
            {contentContainer}
          </ScrollViewClass>
        );
      } else if (Platform.OS === 'android') {
        // On Android wrap the ScrollView with a AndroidSwipeRefreshLayout.
        // Since the ScrollView is wrapped add the style props to the
        // AndroidSwipeRefreshLayout and use flex: 1 for the ScrollView.
        // Note: we should only apply props.style on the wrapper
        // however, the ScrollView still needs the baseStyle to be scrollable

        return React.cloneElement(
          refreshControl,
          {style: props.style},
          <ScrollViewClass
            {...props}
            style={baseStyle}
            ref={this._setScrollViewRef}>
            {contentContainer}
          </ScrollViewClass>,
        );
      }
    }
    return (
      <ScrollViewClass {...props} ref={this._setScrollViewRef}>
        {contentContainer}
      </ScrollViewClass>
    );
  },
});

const TypedScrollView = ((ScrollView: any): Class<
  InternalScrollViewType<Props>,
>);

const styles = StyleSheet.create({
  baseVertical: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'column',
    overflow: 'scroll',
  },
  baseHorizontal: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    overflow: 'scroll',
  },
  contentContainerHorizontal: {
    flexDirection: 'row',
  },
});

module.exports = TypedScrollView;
