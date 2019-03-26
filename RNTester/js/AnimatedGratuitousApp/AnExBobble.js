/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {Animated, PanResponder, StyleSheet, View} = ReactNative;

var NUM_BOBBLES = 5;
var RAD_EACH = Math.PI / 2 / (NUM_BOBBLES - 2);
var RADIUS = 160;
var BOBBLE_SPOTS = [...Array(NUM_BOBBLES)].map((_, i) => {
  // static positions
  return i === 0
    ? {x: 0, y: 0}
    : {
        // first bobble is the selector
        x: -Math.cos(RAD_EACH * (i - 1)) * RADIUS,
        y: -Math.sin(RAD_EACH * (i - 1)) * RADIUS,
      };
});

class AnExBobble extends React.Component<Object, any> {
  constructor(props: Object) {
    super(props);
    this.state = {};
    this.state.bobbles = BOBBLE_SPOTS.map((_, i) => {
      return new Animated.ValueXY();
    });
    this.state.selectedBobble = null;
    var bobblePanListener = (e, gestureState) => {
      // async events => change selection
      var newSelected = computeNewSelected(gestureState);
      if (this.state.selectedBobble !== newSelected) {
        if (this.state.selectedBobble !== null) {
          var restSpot = BOBBLE_SPOTS[this.state.selectedBobble];
          Animated.spring(this.state.bobbles[this.state.selectedBobble], {
            toValue: restSpot, // return previously selected bobble to rest position
          }).start();
        }
        if (newSelected !== null && newSelected !== 0) {
          Animated.spring(this.state.bobbles[newSelected], {
            toValue: this.state.bobbles[0], // newly selected should track the selector
          }).start();
        }
        this.state.selectedBobble = newSelected;
      }
    };
    var releaseBobble = () => {
      this.state.bobbles.forEach((bobble, i) => {
        Animated.spring(bobble, {
          toValue: {x: 0, y: 0}, // all bobbles return to zero
        }).start();
      });
    };
    this.state.bobbleResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        BOBBLE_SPOTS.forEach((spot, idx) => {
          Animated.spring(this.state.bobbles[idx], {
            toValue: spot, // spring each bobble to its spot
            friction: 3, // less friction => bouncier
          }).start();
        });
      },
      onPanResponderMove: Animated.event(
        [null, {dx: this.state.bobbles[0].x, dy: this.state.bobbles[0].y}],
        {listener: bobblePanListener}, // async state changes with arbitrary logic
      ),
      onPanResponderRelease: releaseBobble,
      onPanResponderTerminate: releaseBobble,
    });
  }

  render(): React.Node {
    return (
      <View style={styles.bobbleContainer}>
        {this.state.bobbles.map((_, i) => {
          var j = this.state.bobbles.length - i - 1; // reverse so lead on top
          var handlers = j > 0 ? {} : this.state.bobbleResponder.panHandlers;
          return (
            <Animated.Image
              {...handlers}
              key={i}
              source={{uri: BOBBLE_IMGS[j]}}
              style={[
                styles.circle,
                {
                  backgroundColor: randColor(), // re-renders are obvious
                  transform: this.state.bobbles[j].getTranslateTransform(), // simple conversion
                },
              ]}
            />
          );
        })}
      </View>
    );
  }
}

var styles = StyleSheet.create({
  circle: {
    position: 'absolute',
    height: 60,
    width: 60,
    borderRadius: 30,
    borderWidth: 0.5,
  },
  bobbleContainer: {
    top: -68,
    paddingRight: 66,
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
});

function computeNewSelected(gestureState: Object): ?number {
  var {dx, dy} = gestureState;
  var minDist = Infinity;
  var newSelected = null;
  var pointRadius = Math.sqrt(dx * dx + dy * dy);
  if (Math.abs(RADIUS - pointRadius) < 80) {
    BOBBLE_SPOTS.forEach((spot, idx) => {
      var delta = {x: spot.x - dx, y: spot.y - dy};
      var dist = delta.x * delta.x + delta.y * delta.y;
      if (dist < minDist) {
        minDist = dist;
        newSelected = idx;
      }
    });
  }
  return newSelected;
}

function randColor(): string {
  var colors = [0, 1, 2].map(() => Math.floor(Math.random() * 150 + 100));
  return 'rgb(' + colors.join(',') + ')';
}

var BOBBLE_IMGS = [
  'https://scontent-sea1-1.xx.fbcdn.net/hphotos-xpf1/t39.1997-6/10173489_272703316237267_1025826781_n.png',
  'https://scontent-sea1-1.xx.fbcdn.net/hphotos-xaf1/l/t39.1997-6/p240x240/851578_631487400212668_2087073502_n.png',
  'https://scontent-sea1-1.xx.fbcdn.net/hphotos-xaf1/t39.1997-6/p240x240/851583_654446917903722_178118452_n.png',
  'https://scontent-sea1-1.xx.fbcdn.net/hphotos-xaf1/t39.1997-6/p240x240/851565_641023175913294_875343096_n.png',
  'https://scontent-sea1-1.xx.fbcdn.net/hphotos-xaf1/t39.1997-6/851562_575284782557566_1188781517_n.png',
];

module.exports = AnExBobble;
