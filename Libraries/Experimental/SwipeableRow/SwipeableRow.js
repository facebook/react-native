/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.  *
 *
 * @providesModule SwipeableRow
 * @flow
 */
'use strict';

const Animated = require('Animated');
const PanResponder = require('PanResponder');
const Platform = require('Platform');
const React = require('React');
const StyleSheet = require('StyleSheet');
const View = require('View');

const {PropTypes} = React;

// Position of the left of the swipable item when closed
const CLOSED_LEFT_POSITION = 0;
// Minimum swipe distance before we recognize it as such
const HORIZONTAL_SWIPE_DISTANCE_THRESHOLD = 15;

/**
 * Creates a swipable row that allows taps on the main item and a custom View
 * on the item hidden behind the row
 */
const SwipeableRow = React.createClass({
  /**
   * In order to render component A beneath component B, A must be rendered
   * before B. However, this will cause "flickering", aka we see A briefly then
   * B. To counter this, _isSwipeableViewRendered flag is used to set component
   * A to be transparent until component B is loaded.
   */
  _isSwipeableViewRendered: false,
  _panResponder: {},
  _previousLeft: CLOSED_LEFT_POSITION,

  propTypes: {
    isOpen: PropTypes.bool,
    /**
     * Left position of the maximum open swipe. If unspecified, swipe will open
     * fully to the left
     */
    maxSwipeDistance: PropTypes.number,
    onOpen: PropTypes.func,
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
       * scrollViewWidth can change based on orientation, thus it's stored as a
       * state variable. This means all styles depending on it will be inline
       */
      scrollViewWidth: 0,
    };
  },

  getDefaultProps(): Object {
    return {
      isOpen: false,
      swipeThreshold: 50,
    };
  },

  componentWillMount(): void {
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: this._handleStartShouldSetPanResponder,
      onStartShouldSetPanResponderCapture: this._handleStartShouldSetPanResponderCapture,
      onMoveShouldSetPanResponder: this._handleMoveShouldSetPanResponder,
      onMoveShouldSetPanResponderCapture: this._handleMoveShouldSetPanResponderCapture,
      onPanResponderGrant: (event, gesture) => {},
      onPanResponderMove: this._handlePanResponderMove,
      onPanResponderRelease: this._handlePanResponderEnd,
      onPanResponderTerminationRequest: this._handlePanResponderTerminationRequest,
      onPanResponderTerminate: this._handlePanResponderEnd,
    });
  },

  componentWillReceiveProps(nextProps: Object): void {
    /**
     * We do not need an "animateOpen(noCallback)" because this animation is
     * handled internally by this component.
     */
    if (this.props.isOpen && !nextProps.isOpen) {
      this._animateClose();
    }
  },

  render(): ReactElement {
    const slideoutStyle = [
      styles.slideOutContainer,
      {
        right: -this.state.scrollViewWidth,
        width: this.state.scrollViewWidth,
      },
    ];
    if (Platform.OS === 'ios') {
      slideoutStyle.push({opacity: this._isSwipeableViewRendered ? 1 : 0});
    }

    // The view hidden behind the main view
    const slideOutView = (
      <View style={slideoutStyle}>
        {this.props.slideoutView}
      </View>
    );

    // The swipable item
    const swipeableView = (
      <Animated.View
        onLayout={this._onSwipeableViewLayout}
        style={{
          left: this.state.currentLeft,
          width: this.state.scrollViewWidth,
        }}>
        {this.props.children}
      </Animated.View>
    );

    return (
      <View
        {...this._panResponder.panHandlers}
        style={styles.container}
        onLayout={this._onLayoutChange}>
        {slideOutView}
        {swipeableView}
      </View>
    );
  },

  _onSwipeableViewLayout(event: Object): void {
    if (!this._isSwipeableViewRendered) {
      this._isSwipeableViewRendered = true;
    }
  },

  _handlePanResponderTerminationRequest(
    event: Object,
    gestureState: Object,
  ): boolean {
    return false;
  },

  _handleStartShouldSetPanResponder(
    event: Object,
    gestureState: Object,
  ): boolean {
    return false;
  },

  _handleStartShouldSetPanResponderCapture(
    event: Object,
    gestureState: Object,
  ): boolean {
    return false;
  },

  _handleMoveShouldSetPanResponder(
    event: Object,
    gestureState: Object,
  ): boolean {
    return false;
  },

  _handleMoveShouldSetPanResponderCapture(
    event: Object,
    gestureState: Object,
  ): boolean {
    return this._isValidSwipe(gestureState);
  },

  /**
   * User might move their finger slightly when tapping; let's ignore that
   * unless we are sure they are swiping.
   */
  _isValidSwipe(gestureState: Object): boolean {
    return Math.abs(gestureState.dx) > HORIZONTAL_SWIPE_DISTANCE_THRESHOLD;
  },

  _shouldAllowSwipe(gestureState: Object): boolean {
    return (
      this._isSwipeWithinOpenLimit(this._previousLeft + gestureState.dx) &&
      (
        this._isSwipingLeftFromClosed(gestureState) ||
        this._isSwipingFromSemiOpened(gestureState)
      )
    );
  },

  _isSwipingLeftFromClosed(gestureState: Object): boolean {
    return this._previousLeft === CLOSED_LEFT_POSITION && gestureState.vx < 0;
  },

  // User is swiping left/right from a state between fully open and fully closed
  _isSwipingFromSemiOpened(gestureState: Object): boolean {
    return (
      this._isSwipeableSomewhatOpen() &&
      this._isBoundedSwipe(gestureState)
    );
  },

  _isSwipeableSomewhatOpen(): boolean {
    return this._previousLeft < CLOSED_LEFT_POSITION;
  },

  _isBoundedSwipe(gestureState: Object): boolean {
    return (
      this._isBoundedLeftSwipe(gestureState) ||
      this._isBoundedRightSwipe(gestureState)
    );
  },

  _isBoundedLeftSwipe(gestureState: Object): boolean {
    return (
      gestureState.dx < 0 && -this._previousLeft < this.state.scrollViewWidth
    );
  },

  _isBoundedRightSwipe(gestureState: Object): boolean {
    const horizontalDistance = gestureState.dx;

    return (
      horizontalDistance > 0 &&
      this._previousLeft + horizontalDistance <= CLOSED_LEFT_POSITION
    );
  },

  _isSwipeWithinOpenLimit(distance: number): boolean {
    const maxSwipeDistance = this.props.maxSwipeDistance;

    return maxSwipeDistance
      ? Math.abs(distance) <= maxSwipeDistance
      : true;
  },

  _handlePanResponderMove(event: Object, gestureState: Object): void {
    if (this._shouldAllowSwipe(gestureState)) {
      this.setState({
        currentLeft: new Animated.Value(this._previousLeft + gestureState.dx),
      });
    }
  },

  // Animation for after a user lifts their finger after swiping
  _postReleaseAnimate(horizontalDistance: number): void {
    if (horizontalDistance < 0) {
      if (horizontalDistance < -this.props.swipeThreshold) {
        // Swiped left far enough, animate to fully opened state
        this._animateOpen();
        return;
      }
      // Did not swipe left enough, animate to closed
      this._animateClose();
    } else if (horizontalDistance > 0) {
      if (horizontalDistance > this.props.swipeThreshold) {
        // Swiped right far enough, animate to closed state
        this._animateClose();
        return;
      }
      // Did not swipe right enough, animate to opened
      this._animateOpen();
    }
  },

  _animateTo(toValue: number): void {
    Animated.timing(this.state.currentLeft, {toValue: toValue}).start(() => {
      this._previousLeft = toValue;
    });
  },

  _animateOpen(): void {
    this.props.onOpen && this.props.onOpen();

    const toValue = this.props.maxSwipeDistance
      ? -this.props.maxSwipeDistance
      : -this.state.scrollViewWidth;
    this._animateTo(toValue);
  },

  _animateClose(): void {
    this._animateTo(CLOSED_LEFT_POSITION);
  },

  _handlePanResponderEnd(event: Object, gestureState: Object): void {
    const horizontalDistance = gestureState.dx;
    this._postReleaseAnimate(horizontalDistance);

    if (this._shouldAllowSwipe(gestureState)) {
      this._previousLeft += horizontalDistance;
      return;
    }

    if (this._previousLeft + horizontalDistance >= 0) {
      // We are swiping back to close or somehow swiped past close
      this._previousLeft = 0;
    } else if (
      this.props.maxSwipeDistance &&
      !this._isSwipeWithinOpenLimit(this._previousLeft + horizontalDistance)
    ) {
      // We are swiping past the max swipe distance?
      this._previousLeft = -this.props.maxSwipeDistance;
    }

    this.setState({
      currentLeft: new Animated.Value(this._previousLeft),
    });
  },

  _onLayoutChange(event: Object): void {
    const width = event.nativeEvent.layout.width;

    if (width !== this.state.scrollViewWidth) {
      this.setState({
        scrollViewWidth: width,
      });
    }
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  slideOutContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
});

module.exports = SwipeableRow;
