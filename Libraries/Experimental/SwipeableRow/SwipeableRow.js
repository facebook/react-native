/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SwipeableRow
 * @flow
 */
'use strict';

const Animated = require('Animated');
const I18nManager = require('I18nManager');
const PanResponder = require('PanResponder');
const React = require('React');
const PropTypes = require('prop-types');
const StyleSheet = require('StyleSheet');
const TimerMixin = require('react-timer-mixin');
const View = require('View');

const createReactClass = require('create-react-class');
const emptyFunction = require('fbjs/lib/emptyFunction');

const IS_RTL = I18nManager.isRTL;

// NOTE: Eventually convert these consts to an input object of configurations

// Position of the left of the swipable item when closed
const CLOSED_LEFT_POSITION = 0;
// Minimum swipe distance before we recognize it as such
const HORIZONTAL_SWIPE_DISTANCE_THRESHOLD = 10;
// Minimum swipe speed before we fully animate the user's action (open/close)
const HORIZONTAL_FULL_SWIPE_SPEED_THRESHOLD = 0.3;
// Factor to divide by to get slow speed; i.e. 4 means 1/4 of full speed
const SLOW_SPEED_SWIPE_FACTOR = 4;
// Time, in milliseconds, of how long the animated swipe should be
const SWIPE_DURATION = 300;

/**
 * On SwipeableListView mount, the 1st item will bounce to show users it's
 * possible to swipe
 */
const ON_MOUNT_BOUNCE_DELAY = 700;
const ON_MOUNT_BOUNCE_DURATION = 400;

// Distance left of closed position to bounce back when right-swiping from closed
const RIGHT_SWIPE_BOUNCE_BACK_DISTANCE = 30;
const RIGHT_SWIPE_BOUNCE_BACK_DURATION = 300;
/**
 * Max distance of right swipe to allow (right swipes do functionally nothing).
 * Must be multiplied by SLOW_SPEED_SWIPE_FACTOR because gestureState.dx tracks
 * how far the finger swipes, and not the actual animation distance.
*/
const RIGHT_SWIPE_THRESHOLD = 30 * SLOW_SPEED_SWIPE_FACTOR;

/**
 * Creates a swipable row that allows taps on the main item and a custom View
 * on the item hidden behind the row. Typically this should be used in
 * conjunction with SwipeableListView for additional functionality, but can be
 * used in a normal ListView. See the renderRow for SwipeableListView to see how
 * to use this component separately.
 */
const SwipeableRow = createReactClass({
  displayName: 'SwipeableRow',
  _panResponder: {},
  _previousLeft: CLOSED_LEFT_POSITION,

  mixins: [TimerMixin],

  propTypes: {
    children: PropTypes.any,
    isOpen: PropTypes.bool,
    preventSwipeRight: PropTypes.bool,
    maxSwipeDistance: PropTypes.number.isRequired,
    onOpen: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    onSwipeEnd: PropTypes.func.isRequired,
    onSwipeStart: PropTypes.func.isRequired,
    // Should bounce the row on mount
    shouldBounceOnMount: PropTypes.bool,
    /**
     * A ReactElement that is unveiled when the user swipes
     */
    slideoutView: PropTypes.node.isRequired,
    /**
     * The minimum swipe distance required before fully animating the swipe. If
     * the user swipes less than this distance, the item will return to its
     * previous (open/close) position.
     */
    swipeThreshold: PropTypes.number.isRequired,
  },

  getInitialState(): Object {
    return {
      currentLeft: new Animated.Value(this._previousLeft),
      /**
       * In order to render component A beneath component B, A must be rendered
       * before B. However, this will cause "flickering", aka we see A briefly
       * then B. To counter this, _isSwipeableViewRendered flag is used to set
       * component A to be transparent until component B is loaded.
       */
      isSwipeableViewRendered: false,
      rowHeight: (null: ?number),
    };
  },

  getDefaultProps(): Object {
    return {
      isOpen: false,
      preventSwipeRight: false,
      maxSwipeDistance: 0,
      onOpen: emptyFunction,
      onClose: emptyFunction,
      onSwipeEnd: emptyFunction,
      onSwipeStart: emptyFunction,
      swipeThreshold: 30,
    };
  },

  componentWillMount(): void {
    this._panResponder = PanResponder.create({
      onMoveShouldSetPanResponderCapture: this._handleMoveShouldSetPanResponderCapture,
      onPanResponderGrant: this._handlePanResponderGrant,
      onPanResponderMove: this._handlePanResponderMove,
      onPanResponderRelease: this._handlePanResponderEnd,
      onPanResponderTerminationRequest: this._onPanResponderTerminationRequest,
      onPanResponderTerminate: this._handlePanResponderEnd,
      onShouldBlockNativeResponder: (event, gestureState) => false,
    });
  },

  componentDidMount(): void {
    if (this.props.shouldBounceOnMount) {
      /**
       * Do the on mount bounce after a delay because if we animate when other
       * components are loading, the animation will be laggy
       */
      this.setTimeout(() => {
        this._animateBounceBack(ON_MOUNT_BOUNCE_DURATION);
      }, ON_MOUNT_BOUNCE_DELAY);
    }
  },

  componentWillReceiveProps(nextProps: Object): void {
    /**
     * We do not need an "animateOpen(noCallback)" because this animation is
     * handled internally by this component.
     */
    if (this.props.isOpen && !nextProps.isOpen) {
      this._animateToClosedPosition();
    }
  },

  shouldComponentUpdate(nextProps: Object, nextState: Object): boolean {
    if (this.props.shouldBounceOnMount && !nextProps.shouldBounceOnMount) {
      // No need to rerender if SwipeableListView is disabling the bounce flag
      return false;
    }

    return true;
  },

  render(): React.Element<any> {
    // The view hidden behind the main view
    let slideOutView;
    if (this.state.isSwipeableViewRendered && this.state.rowHeight) {
      slideOutView = (
        <View style={[
          styles.slideOutContainer,
          {height: this.state.rowHeight},
          ]}>
          {this.props.slideoutView}
        </View>
      );
    }

    // The swipeable item
    const swipeableView = (
      <Animated.View
        onLayout={this._onSwipeableViewLayout}
        style={{transform: [{translateX: this.state.currentLeft}]}}>
        {this.props.children}
      </Animated.View>
    );

    return (
      <View
        {...this._panResponder.panHandlers}>
        {slideOutView}
        {swipeableView}
      </View>
    );
  },

  close(): void {
    this.props.onClose();
    this._animateToClosedPosition();
  },

  _onSwipeableViewLayout(event: Object): void {
    this.setState({
      isSwipeableViewRendered: true,
      rowHeight: event.nativeEvent.layout.height,
    });
  },

  _handleMoveShouldSetPanResponderCapture(
    event: Object,
    gestureState: Object,
  ): boolean {
    // Decides whether a swipe is responded to by this component or its child
    return gestureState.dy < 10 && this._isValidSwipe(gestureState);
  },

  _handlePanResponderGrant(event: Object, gestureState: Object): void {

  },

  _handlePanResponderMove(event: Object, gestureState: Object): void {
    if (this._isSwipingExcessivelyRightFromClosedPosition(gestureState)) {
      return;
    }

    this.props.onSwipeStart();

    if (this._isSwipingRightFromClosed(gestureState)) {
      this._swipeSlowSpeed(gestureState);
    } else {
      this._swipeFullSpeed(gestureState);
    }
  },

  _isSwipingRightFromClosed(gestureState: Object): boolean {
    const gestureStateDx = IS_RTL ? -gestureState.dx : gestureState.dx;
    return this._previousLeft === CLOSED_LEFT_POSITION && gestureStateDx > 0;
  },

  _swipeFullSpeed(gestureState: Object): void {
    this.state.currentLeft.setValue(this._previousLeft + gestureState.dx);
  },

  _swipeSlowSpeed(gestureState: Object): void {
    this.state.currentLeft.setValue(
      this._previousLeft + gestureState.dx / SLOW_SPEED_SWIPE_FACTOR,
    );
  },

  _isSwipingExcessivelyRightFromClosedPosition(gestureState: Object): boolean {
    /**
     * We want to allow a BIT of right swipe, to allow users to know that
     * swiping is available, but swiping right does not do anything
     * functionally.
     */
    const gestureStateDx = IS_RTL ? -gestureState.dx : gestureState.dx;
    return (
      this._isSwipingRightFromClosed(gestureState) &&
      gestureStateDx > RIGHT_SWIPE_THRESHOLD
    );
  },

  _onPanResponderTerminationRequest(
    event: Object,
    gestureState: Object,
  ): boolean {
    return false;
  },

  _animateTo(
    toValue: number,
    duration: number = SWIPE_DURATION,
    callback: Function = emptyFunction,
  ): void {
    Animated.timing(
      this.state.currentLeft,
      {
        duration,
        toValue,
        useNativeDriver: true,
      },
    ).start(() => {
      this._previousLeft = toValue;
      callback();
    });
  },

  _animateToOpenPosition(): void {
    const maxSwipeDistance = IS_RTL ? -this.props.maxSwipeDistance : this.props.maxSwipeDistance;
    this._animateTo(-maxSwipeDistance);
  },

  _animateToOpenPositionWith(
    speed: number,
    distMoved: number,
  ): void {
    /**
     * Ensure the speed is at least the set speed threshold to prevent a slow
     * swiping animation
     */
    speed = (
      speed > HORIZONTAL_FULL_SWIPE_SPEED_THRESHOLD ?
      speed :
      HORIZONTAL_FULL_SWIPE_SPEED_THRESHOLD
    );
    /**
     * Calculate the duration the row should take to swipe the remaining distance
     * at the same speed the user swiped (or the speed threshold)
     */
    const duration = Math.abs((this.props.maxSwipeDistance - Math.abs(distMoved)) / speed);
    const maxSwipeDistance = IS_RTL ? -this.props.maxSwipeDistance : this.props.maxSwipeDistance;
    this._animateTo(-maxSwipeDistance, duration);
  },

  _animateToClosedPosition(duration: number = SWIPE_DURATION): void {
    this._animateTo(CLOSED_LEFT_POSITION, duration);
  },

  _animateToClosedPositionDuringBounce(): void {
    this._animateToClosedPosition(RIGHT_SWIPE_BOUNCE_BACK_DURATION);
  },

  _animateBounceBack(duration: number): void {
    /**
     * When swiping right, we want to bounce back past closed position on release
     * so users know they should swipe right to get content.
     */
    const swipeBounceBackDistance = IS_RTL ?
      -RIGHT_SWIPE_BOUNCE_BACK_DISTANCE :
      RIGHT_SWIPE_BOUNCE_BACK_DISTANCE;
    this._animateTo(
      -swipeBounceBackDistance,
      duration,
      this._animateToClosedPositionDuringBounce,
    );
  },

  // Ignore swipes due to user's finger moving slightly when tapping
  _isValidSwipe(gestureState: Object): boolean {
    if (this.props.preventSwipeRight && this._previousLeft === CLOSED_LEFT_POSITION && gestureState.dx > 0) {
      return false;
    }

    return Math.abs(gestureState.dx) > HORIZONTAL_SWIPE_DISTANCE_THRESHOLD;
  },

  _shouldAnimateRemainder(gestureState: Object): boolean {
    /**
     * If user has swiped past a certain distance, animate the rest of the way
     * if they let go
     */
    return (
      Math.abs(gestureState.dx) > this.props.swipeThreshold ||
      gestureState.vx > HORIZONTAL_FULL_SWIPE_SPEED_THRESHOLD
    );
  },

  _handlePanResponderEnd(event: Object, gestureState: Object): void {
    const horizontalDistance = IS_RTL ? -gestureState.dx : gestureState.dx;
    if (this._isSwipingRightFromClosed(gestureState)) {
      this.props.onOpen();
      this._animateBounceBack(RIGHT_SWIPE_BOUNCE_BACK_DURATION);
    } else if (this._shouldAnimateRemainder(gestureState)) {
      if (horizontalDistance < 0) {
        // Swiped left
        this.props.onOpen();
        this._animateToOpenPositionWith(gestureState.vx, horizontalDistance);
      } else {
        // Swiped right
        this.props.onClose();
        this._animateToClosedPosition();
      }
    } else {
      if (this._previousLeft === CLOSED_LEFT_POSITION) {
        this._animateToClosedPosition();
      } else {
        this._animateToOpenPosition();
      }
    }

    this.props.onSwipeEnd();
  },
});

const styles = StyleSheet.create({
  slideOutContainer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});

module.exports = SwipeableRow;
