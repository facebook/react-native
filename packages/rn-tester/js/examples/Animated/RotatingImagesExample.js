/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import * as React from 'react';
import RNTesterButton from '../../components/RNTesterButton';
import {Animated, View, StyleSheet} from 'react-native';
import type {RNTesterExampleModuleItem} from '../../types/RNTesterTypes';

const styles = StyleSheet.create({
  rotatingImage: {
    width: 70,
    height: 70,
  },
});

function RotatingImagesExample(): React.Node {
  this.anim = this.anim || new Animated.Value(0);
  return (
    <View>
      <RNTesterButton
        onPress={() => {
          Animated.spring(this.anim, {
            // Returns to the start
            toValue: 0,

            // Velocity makes it move
            velocity: 3,

            // Slow
            tension: -10,

            // Oscillate a lot
            friction: 1,

            useNativeDriver: false,
          }).start();
        }}>
        Press to Spin it!
      </RNTesterButton>
      <Animated.Image
        source={require('../../assets/bunny.png')}
        style={[
          styles.rotatingImage,
          {
            transform: [
              {
                scale: this.anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 10],
                }),
              },
              {
                translateX: this.anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 100],
                }),
              },
              {
                rotate: this.anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [
                    '0deg',
                    '360deg', // 'deg' or 'rad'
                  ],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

export default ({
  title: 'Rotating Images',
  description: 'Simple Animated.Image rotation.',
  render: RotatingImagesExample,
}: RNTesterExampleModuleItem);
