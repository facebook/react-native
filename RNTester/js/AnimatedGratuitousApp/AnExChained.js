/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule AnExChained
 * @flow
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  Animated,
  PanResponder,
  StyleSheet,
  View,
} = ReactNative;

class AnExChained extends React.Component<Object, any> {
  constructor(props: Object) {
    super(props);
    this.state = {
      stickers: [new Animated.ValueXY()],                    // 1 leader
    };
    var stickerConfig = {tension: 2, friction: 3};           // soft spring
    for (var i = 0; i < 4; i++) {                            // 4 followers
      var sticker = new Animated.ValueXY();
      Animated.spring(sticker, {
        ...stickerConfig,
        toValue: this.state.stickers[i],               // Animated toValue's are tracked
      }).start();
      this.state.stickers.push(sticker);               // push on the followers
    }
    var releaseChain = (e, gestureState) => {
      this.state.stickers[0].flattenOffset();          // merges offset into value and resets
      Animated.sequence([                              // spring to start after decay finishes
        Animated.decay(this.state.stickers[0], {       // coast to a stop
          velocity: {x: gestureState.vx, y: gestureState.vy},
          deceleration: 0.997,
        }),
        Animated.spring(this.state.stickers[0], {
          toValue: {x: 0, y: 0}                        // return to start
        }),
      ]).start();
    };
    this.state.chainResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        this.state.stickers[0].stopAnimation((value) => {
          this.state.stickers[0].setOffset(value);           // start where sticker animated to
          this.state.stickers[0].setValue({x: 0, y: 0});     // avoid flicker before next event
        });
      },
      onPanResponderMove: Animated.event(
        [null, {dx: this.state.stickers[0].x, dy: this.state.stickers[0].y}] // map gesture to leader
      ),
      onPanResponderRelease: releaseChain,
      onPanResponderTerminate: releaseChain,
    });
  }

  render() {
    return (
      <View style={styles.chained}>
        {this.state.stickers.map((_, i) => {
          var j = this.state.stickers.length - i - 1; // reverse so leader is on top
          var handlers = (j === 0) ? this.state.chainResponder.panHandlers : {};
          return (
            <Animated.Image
              {...handlers}
              key={i}
              source={CHAIN_IMGS[j]}
              style={[styles.sticker, {
                transform: this.state.stickers[j].getTranslateTransform(), // simple conversion
              }]}
            />
          );
        })}
      </View>
    );
  }
}

var styles = StyleSheet.create({
  chained: {
    alignSelf: 'flex-end',
    top: -160,
    right: 126
  },
  sticker: {
    position: 'absolute',
    height: 120,
    width: 120,
    backgroundColor: 'transparent',
  },
});

var CHAIN_IMGS = [
  require('../hawk.png'),
  require('../bunny.png'),
  require('../relay.png'),
  require('../hawk.png'),
  require('../bunny.png')
];

module.exports = AnExChained;
