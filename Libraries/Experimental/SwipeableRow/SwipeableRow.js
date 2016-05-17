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

const emptyFunction = require('emptyFunction');

// Position of the left of the swipable item when closed
const CLOSED_LEFT_POSITION = 0;
// Minimum swipe distance before we recognize it as such
const HORIZONTAL_SWIPE_DISTANCE_THRESHOLD = 15;

/**
 * Creates a swipable row that allows taps on the main item and a custom View
 * on the item hidden behind the row
 */
const SwipeableRow = React.createClass({
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
    onSwipeEnd: PropTypes.func.isRequired,
    onSwipeStart: PropTypes.func.isRequired,
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
      onSwipeEnd: emptyFunction,
      onSwipeStart: emptyFunction,
      swipeThreshold: 30,
    };
  },

  componentWillMount(): void {
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (event, gestureState) => true,
      // Don't capture child's start events
      onStartShouldSetPanResponderCapture: (event, gestureState) => false,
      onMoveShouldSetPanResponder: (event, gestureState) => false,
      onMoveShouldSetPanResponderCapture: this._handleMoveShouldSetPanResponderCapture,
      onPanResponderGrant: this._handlePanResponderGrant,
      onPanResponderMove: this._handlePanResponderMove,
      onPanResponderRelease: this._handlePanResponderEnd,
      onPanResponderTerminationRequest: this._onPanResponderTerminationRequest,
      onPanResponderTerminate: this._handlePanResponderEnd,
    });
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

  render(): ReactElement {
    const slideoutStyle = [
      styles.slideOutContainer,
      {
        right: -this.state.scrollViewWidth,
        width: this.state.scrollViewWidth,
      },
    ];
    if (Platform.OS === 'ios') {
      slideoutStyle.push({opacity: this.state.isSwipeableViewRendered ? 1 : 0});
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
          transform: [{translateX: this.state.currentLeft}],
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
    if (!this._isSwipeableViewRendered && this.state.scrollViewWidth !== 0) {
      this.setState({
        isSwipeableViewRendered: true,
      });
    }
  },

  _handleMoveShouldSetPanResponderCapture(
    event: Object,
    gestureState: Object,
  ): boolean {
    // Decides whether a swipe is responded to by this component or its child
    return  gestureState.dy < 10 && this._isValidSwipe(gestureState);
  },

  _handlePanResponderGrant(event: Object, gestureState: Object): void {

  },

  _handlePanResponderMove(event: Object, gestureState: Object): void {
    this.props.onSwipeStart();
    this.state.currentLeft.setValue(this._previousLeft + gestureState.dx);
  },

  _onPanResponderTerminationRequest(event: Object, gestureState: Object): boolean {
    return false;
  },

  _animateTo(toValue: number): void {
    Animated.timing(
      this.state.currentLeft,
      {
        toValue: toValue,
      },
    ).start(() => {
      this._previousLeft = toValue;
    });
  },

  _animateToOpenPosition(): void {
    const toValue = this.props.maxSwipeDistance
      ? -this.props.maxSwipeDistance
      : -this.state.scrollViewWidth;
    this._animateTo(toValue);
  },

  _animateToClosedPosition(): void {
    this._animateTo(CLOSED_LEFT_POSITION);
  },

  // Ignore swipes due to user's finger moving slightly when tapping
  _isValidSwipe(gestureState: Object): boolean {
    return Math.abs(gestureState.dx) > HORIZONTAL_SWIPE_DISTANCE_THRESHOLD;
  },

  _handlePanResponderEnd(event: Object, gestureState: Object): void {
    const horizontalDistance = gestureState.dx;

    if (Math.abs(horizontalDistance) > this.props.swipeThreshold) {
      if (horizontalDistance < 0) {
        // Swiped left
        this.props.onOpen && this.props.onOpen();
        this._animateToOpenPosition();
      } else {
        // Swiped right
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
