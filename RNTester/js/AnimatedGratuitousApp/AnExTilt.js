/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AnExTilt
 * @flow
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  Animated,
  PanResponder,
  StyleSheet,
} = ReactNative;

class AnExTilt extends React.Component<Object, any> {
  constructor(props: Object) {
    super(props);
    this.state = {
      panX: new Animated.Value(0),
      opacity: new Animated.Value(1),
      burns: new Animated.Value(1.15),
    };
    this.state.tiltPanResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        Animated.timing(this.state.opacity, {
          toValue: this.state.panX.interpolate({
            inputRange: [-300, 0, 300],            // pan is in pixels
            outputRange: [0, 1, 0],                // goes to zero at both edges
          }),
          duration: 0,                             // direct tracking
        }).start();
      },
      onPanResponderMove: Animated.event(
        [null, {dx: this.state.panX}]              // panX is linked to the gesture
      ),
      onPanResponderRelease: (e, gestureState) => {
        var toValue = 0;
        if (gestureState.dx > 100) {
          toValue = 500;
        } else if (gestureState.dx < -100) {
          toValue = -500;
        }
        Animated.spring(this.state.panX, {
          toValue,                         // animate back to center or off screen
          velocity: gestureState.vx,       // maintain gesture velocity
          tension: 10,
          friction: 3,
        }).start();
        this.state.panX.removeAllListeners();
        var id = this.state.panX.addListener(({value}) => { // listen until offscreen
          if (Math.abs(value) > 400) {
            this.state.panX.removeListener(id);             // offscreen, so stop listening
            Animated.timing(this.state.opacity, {
              toValue: 1,   // Fade back in.  This unlinks it from tracking this.state.panX
            }).start();
            this.state.panX.setValue(0);                    // Note: stops the spring animation
            toValue !== 0 && this._startBurnsZoom();
          }
        });
      },
    });
  }

  _startBurnsZoom() {
    this.state.burns.setValue(1);     // reset to beginning
    Animated.decay(this.state.burns, {
      velocity: 1,                    // sublte zoom
      deceleration: 0.9999,           // slow decay
    }).start();
  }

  componentWillMount() {
    this._startBurnsZoom();
  }

  render(): React.Node {
    return (
      <Animated.View
        {...this.state.tiltPanResponder.panHandlers}
        style={[styles.tilt, {
          opacity: this.state.opacity,
          transform: [
            {rotate: this.state.panX.interpolate({
              inputRange: [-320, 320],
              outputRange: ['-15deg', '15deg']})},  // interpolate string "shapes"
            {translateX: this.state.panX},
          ],
        }]}>
        <Animated.Image
          pointerEvents="none"
          style={{
            flex: 1,
            transform: [
              {translateX: this.state.panX.interpolate({
                inputRange: [-3, 3],     // small range is extended by default
                outputRange: [2, -2]})   // parallax
              },
              {scale: this.state.burns.interpolate({
                inputRange: [1, 3000],
                outputRange: [1, 1.25]}) // simple multiplier
              },
            ],
          }}
          source={require('./trees.jpg')}
        />
      </Animated.View>
    );
  }
}

var styles = StyleSheet.create({
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
