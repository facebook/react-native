/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');
const {Animated, PanResponder, StyleSheet} = require('react-native');

class AnExTilt extends React.Component<Object, any> {
  constructor(props: Object) {
    super(props);
    this.state = {
      panX: new Animated.Value(0),
      opacity: new Animated.Value(1),
      burns: new Animated.Value(1.15),
    };
    // $FlowFixMe[prop-missing]
    this.state.tiltPanResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        Animated.timing(this.state.opacity, {
          toValue: this.state.panX.interpolate({
            inputRange: [-300, 0, 300], // pan is in pixels
            outputRange: [0, 1, 0], // goes to zero at both edges
          }),

          // direct tracking
          duration: 0,

          useNativeDriver: false,
        }).start();
      },
      onPanResponderMove: Animated.event(
        [null, {dx: this.state.panX}], // panX is linked to the gesture
        {useNativeDriver: false},
      ),
      onPanResponderRelease: (e, gestureState) => {
        let toValue = 0;
        if (gestureState.dx > 100) {
          toValue = 500;
        } else if (gestureState.dx < -100) {
          toValue = -500;
        }
        Animated.spring(this.state.panX, {
          // animate back to center or off screen
          toValue,

          // maintain gesture velocity
          velocity: gestureState.vx,

          tension: 10,
          friction: 3,
          useNativeDriver: false,
        }).start();
        this.state.panX.removeAllListeners();
        const id: any = this.state.panX.addListener(({value}) => {
          // listen until offscreen
          if (Math.abs(value) > 400) {
            this.state.panX.removeListener(id); // offscreen, so stop listening
            Animated.timing(this.state.opacity, {
              // Fade back in.  This unlinks it from tracking this.state.panX
              toValue: 1,

              useNativeDriver: false,
            }).start();
            this.state.panX.setValue(0); // Note: stops the spring animation
            toValue !== 0 && this._startBurnsZoom();
          }
        });
      },
    });
  }

  _startBurnsZoom() {
    this.state.burns.setValue(1); // reset to beginning
    Animated.decay(this.state.burns, {
      // subtle zoom
      velocity: 1,

      // slow decay
      deceleration: 0.9999,

      useNativeDriver: false,
    }).start();
  }

  UNSAFE_componentWillMount() {
    this._startBurnsZoom();
  }

  render(): React.Node {
    return (
      <Animated.View
        {...this.state.tiltPanResponder.panHandlers}
        style={[
          styles.tilt,
          {
            opacity: this.state.opacity,
            transform: [
              {
                rotate: this.state.panX.interpolate({
                  inputRange: [-320, 320],
                  outputRange: ['-15deg', '15deg'],
                }),
              }, // interpolate string "shapes"
              {translateX: this.state.panX},
            ],
          },
        ]}>
        <Animated.Image
          pointerEvents="none"
          style={{
            flex: 1,
            transform: [
              {
                translateX: this.state.panX.interpolate({
                  inputRange: [-3, 3], // small range is extended by default
                  outputRange: [2, -2],
                }), // parallax
              },
              {
                scale: this.state.burns.interpolate({
                  inputRange: [1, 3000],
                  outputRange: [1, 1.25],
                }), // simple multiplier
              },
            ],
          }}
          source={require('../../assets/trees.jpg')}
        />
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  tilt: {
    overflow: 'hidden',
    height: 200,
    marginBottom: 4,
    backgroundColor: 'rgb(130, 130, 255)',
    borderColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderRadius: 20,
  },
});

module.exports = AnExTilt;
