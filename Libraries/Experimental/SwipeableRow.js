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
const React = require('React');
const StyleSheet = require('StyleSheet');
const View = require('View');

const {PropTypes} = React;

// Position of the left of the swipable item when closed
const CLOSED_LEFT_POSITION = 0;

/**
 * Creates a swipable row that allows taps on the main item and a custom View
 * on the item hidden behind the row
 */
const SwipeableRow = React.createClass({
  _panResponder: {},
  _previousLeft: CLOSED_LEFT_POSITION,

  propTypes: {
    /**
     * Left position of the maximum open swipe. If unspecified, swipe will open
     * fully to the left
     */
    maxSwipeDistance: PropTypes.number,
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
      swipeThreshold: 50,
    };
  },

  componentWillMount(): void {
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: this._handleStartShouldSetPanResponder,
      onMoveShouldSetPanResponder: this._handleMoveShouldSetPanResponder,
      onPanResponderGrant: (event, gesture) => {},
      onPanResponderMove: this._handlePanResponderMove,
      onPanResponderRelease: this._handlePanResponderEnd,
      onPanResponderTerminate: this._handlePanResponderEnd,
    });
  },

  render(): ReactElement {
    // The view hidden behind the main view
    const slideOutView = (
      <View style={[
        styles.slideOutContainer,
        {
          right: -this.state.scrollViewWidth,
          width: this.state.scrollViewWidth,
        },
        ]}>
        {this.props.slideoutView}
      </View>
    );

    // The swipable item
    const mainView = (
      <Animated.View
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
        {mainView}
      </View>
    );
  },

  _handleStartShouldSetPanResponder(event: Object, gesture: Object): boolean {
    return true;
  },

  // Return true to allow swipes to happen even if children contain touchables
  _handleMoveShouldSetPanResponder(event: Object, gesture: Object): boolean {
    return true;
  },

  _shouldAllowSwipe(gestureState: Object): boolean {
    const horizontalDistance = gestureState.dx;

    return (
      this._isSwipeWithinOpenLimit(this._previousLeft + horizontalDistance) &&
      (
        this._isSwipingLeftFromClosed(gestureState.vx) ||
        this._isSwipingFromSemiOpened(horizontalDistance)
      )
    );
  },

  _isSwipingLeftFromClosed(velocity: number): boolean {
    return this._previousLeft === CLOSED_LEFT_POSITION && velocity < 0;
  },

  // User is swiping left/right from a state between fully open and fully closed
  _isSwipingFromSemiOpened(horizontalDistance: number): boolean {
    return (
      this._isSwipeableSomewhatOpen() &&
      this._isBoundedSwipe(horizontalDistance)
    );
  },

  _isSwipeableSomewhatOpen(): boolean {
    return this._previousLeft < CLOSED_LEFT_POSITION;
  },

  _isBoundedSwipe(horizontalDistance: number): boolean {
    return (
      this._isBoundedLeftSwipe(horizontalDistance) ||
      this._isBoundedRightSwipe(horizontalDistance)
    );
  },

  _isBoundedLeftSwipe(horizontalDistance: number): boolean {
    return (
      horizontalDistance < 0 && -this._previousLeft < this.state.scrollViewWidth
    );
  },

  _isBoundedRightSwipe(horizontalDistance: number): boolean {
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

      this.setState({
        currentLeft: new Animated.Value(this._previousLeft),
      });
    });
  },

  _animateOpen(): void {
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
