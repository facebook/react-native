/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as React from 'react';
import RNTesterButton from '../../components/RNTesterButton';
import {Text, StyleSheet, View, Animated} from 'react-native';
import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

const styles = StyleSheet.create({
  content: {
    backgroundColor: 'deepskyblue',
    borderWidth: 1,
    borderColor: 'dodgerblue',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
});

export default ({
  title: 'Transform Bounce',
  description: ('One `Animated.Value` is driven by a ' +
    'spring with custom constants and mapped to an ' +
    'ordered set of transforms.  Each transform has ' +
    'an interpolation to convert the value into the ' +
    'right range and units.': string),
  render: function(): React.Node {
    // $FlowFixMe[incompatible-use]
    // $FlowFixMe[incompatible-type]
    this.anim = this.anim || new Animated.Value(0);
    return (
      <View>
        <RNTesterButton
          onPress={() => {
            // $FlowFixMe[incompatible-use]
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
          Press to Fling it!
        </RNTesterButton>
        <Animated.View
          style={[
            styles.content,
            {
              transform: [
                // Array order matters
                {
                  scale: this.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 4],
                  }),
                },
                {
                  // $FlowFixMe[incompatible-use]
                  translateX: this.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 500],
                  }),
                },
                {
                  // $FlowFixMe[incompatible-use]
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
          ]}>
          <Text>Transforms!</Text>
        </Animated.View>
      </View>
    );
  },
}: RNTesterModuleExample);
