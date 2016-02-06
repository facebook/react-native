/**
 * Copyright (c) 2015, Facebook, Inc.  All rights reserved.
 *
 * Facebook, Inc. ("Facebook") owns all right, title and interest, including
 * all intellectual property and other proprietary rights, in and to the React
 * Native CustomComponents software (the "Software").  Subject to your
 * compliance with these terms, you are hereby granted a non-exclusive,
 * worldwide, royalty-free copyright license to (1) use and copy the Software;
 * and (2) reproduce and distribute the Software as part of your own software
 * ("Your Software").  Facebook reserves all rights not expressly granted to
 * you in this license agreement.
 *
 * THE SOFTWARE AND DOCUMENTATION, IF ANY, ARE PROVIDED "AS IS" AND ANY EXPRESS
 * OR IMPLIED WARRANTIES (INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE) ARE DISCLAIMED.
 * IN NO EVENT SHALL FACEBOOK OR ITS AFFILIATES, OFFICERS, DIRECTORS OR
 * EMPLOYEES BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THE SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @providesModule NavigationCard
 * @flow
 */
'use strict';

const Animated = require('Animated');
const NavigationReducer = require('NavigationReducer');
const NavigationContainer = require('NavigationContainer');
const PanResponder = require('PanResponder');
const React = require('React');
const StyleSheet = require('StyleSheet');
const View = require('View');

import type {
  NavigationParentState
} from 'NavigationState';

type Layout = {
  initWidth: number,
  initHeight: number,
  width: Animated.Value;
  height: Animated.Value;
};

type Props = {
  navigationState: NavigationParentState;
  index: number;
  position: Animated.Value;
  layout: Layout;
  onNavigate: Function;
  children: Object;
};

class NavigationCard extends React.Component {
  _responder: ?Object;
  _lastHeight: number;
  _lastWidth: number;
  _widthListener: string;
  _heightListener: string;
  props: Props;
  componentWillMount(props) {
    this._responder = PanResponder.create({
      onMoveShouldSetPanResponder: (e, {dx, dy, moveX, moveY, x0, y0}) => {
        if (this.props.navigationState.index === 0) {
          return false;
        }
        if (moveX > 30) {
          return false;
        }
        if (dx > 5 && Math.abs(dy) < 4) {
          return true;
        }
        return false;
      },
      onPanResponderGrant: (e, {dx, dy, moveX, moveY, x0, y0}) => {
      },
      onPanResponderMove: (e, {dx}) => {
        const a = (-dx / this._lastWidth) + this.props.navigationState.index;
        this.props.position.setValue(a);
      },
      onPanResponderRelease: (e, {vx, dx}) => {
        const xRatio = dx / this._lastWidth;
        const doesPop = (xRatio + vx) > 0.45;
        if (doesPop) {
          // todo: add an action which accepts velocity of the pop action/gesture, which is caught and used by NavigationAnimatedView
          this.props.onNavigate(NavigationReducer.StackReducer.PopAction());
          return;
        }
        Animated.spring(this.props.position, {
          toValue: this.props.navigationState.index,
        }).start();
      },
      onPanResponderTerminate: (e, {vx, dx}) => {
        Animated.spring(this.props.position, {
          toValue: this.props.navigationState.index,
        }).start();
      },
    });
  }
  componentDidMount() {
    this._lastHeight = this.props.layout.initHeight;
    this._lastWidth = this.props.layout.initWidth;
    this._widthListener = this.props.layout.width.addListener(({value}) => {
      this._lastWidth = value;
    });
    this._heightListener = this.props.layout.height.addListener(({value}) => {
      this._lastHeight = value;
    });
    // todo: fix listener and last layout dimentsions when props change. potential bugs here
  }
  componentWillUnmount() {
    this.props.layout.width.removeListener(this._widthListener);
    this.props.layout.height.removeListener(this._heightListener);
  }
  render() {
    const cardPosition = Animated.add(this.props.position, new Animated.Value(-this.props.index));
    const gestureValue = Animated.multiply(cardPosition, this.props.layout.width);
    return (
      <Animated.View
        {...this._responder.panHandlers}
        style={[
          styles.card,
          {
            right: gestureValue,
            left: gestureValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -1],
            }),
            opacity: cardPosition.interpolate({
              inputRange: [-1,0,1],
              outputRange: [0,1,1],
            }),
          }
        ]}>
        {this.props.children}
      </Animated.View>
    );
  }
}

NavigationCard = NavigationContainer.create(NavigationCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#E9E9EF',
    shadowColor: 'black',
    shadowOpacity: 0.4,
    shadowOffset: {width: 0, height: 0},
    shadowRadius: 10,
    top: 0,
    bottom: 0,
    position: 'absolute',
  },
});

module.exports = NavigationCard;
