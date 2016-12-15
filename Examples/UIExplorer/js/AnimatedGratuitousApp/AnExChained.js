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
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
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

class AnExChained extends React.Component {
  state: any;

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
              source={{uri: CHAIN_IMGS[j]}}
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
  'https://scontent-sea1-1.xx.fbcdn.net/hphotos-xpf1/t39.1997-6/p160x160/10574705_1529175770666007_724328156_n.png',
  'https://fbcdn-dragon-a.akamaihd.net/hphotos-ak-xfa1/t39.1997-6/p160x160/851575_392309884199657_1917957497_n.png',
  'https://fbcdn-dragon-a.akamaihd.net/hphotos-ak-xfa1/t39.1997-6/p160x160/851567_555288911225630_1628791128_n.png',
  'https://scontent-sea1-1.xx.fbcdn.net/hphotos-xfa1/t39.1997-6/p160x160/851583_531111513625557_903469595_n.png',
  'https://scontent-sea1-1.xx.fbcdn.net/hphotos-xpa1/t39.1997-6/p160x160/851577_510515972354399_2147096990_n.png',
];

module.exports = AnExChained;
