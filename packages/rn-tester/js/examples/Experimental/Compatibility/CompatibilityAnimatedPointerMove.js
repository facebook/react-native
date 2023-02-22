/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import * as React from 'react';
import {Text, Animated, StyleSheet} from 'react-native';
import type {RNTesterModuleExample} from '../../../types/RNTesterTypes';
import ToggleNativeDriver from '../../Animated/utils/ToggleNativeDriver';

const WIDTH = 200;
const HEIGHT = 250;

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    marginTop: 20,
    width: WIDTH,
    height: HEIGHT,
    alignSelf: 'center',
  },
  text: {
    color: 'white',
    position: 'absolute',
    top: HEIGHT / 2,
  },
  animatingBox: {
    backgroundColor: 'blue',
    width: 1,
    height: 1,
  },
});

function CompatibilityAnimatedPointerMove(): React.Node {
  const xCoord = React.useRef(new Animated.Value(0)).current;
  const yCoord = React.useRef(new Animated.Value(0)).current;
  const [useNativeDriver, setUseNativeDriver] = React.useState(true);

  return (
    <>
      <ToggleNativeDriver
        style={{paddingHorizontal: 30}}
        value={useNativeDriver}
        onValueChange={setUseNativeDriver}
      />
      <Animated.View
        onPointerMove={Animated.event(
          [{nativeEvent: {offsetX: xCoord, offsetY: yCoord}}],
          {useNativeDriver},
        )}
        pointerEvents="box-only"
        style={styles.container}>
        <Text style={styles.text}>Move pointer over me</Text>
        <Animated.View
          style={{
            backgroundColor: 'blue',
            width: 1,
            height: 1,
            transform: [
              {
                translateX: xCoord.interpolate({
                  inputRange: [0, WIDTH],
                  outputRange: ([0, WIDTH / 2]: number[]),
                }),
              },
              {
                translateY: yCoord.interpolate({
                  inputRange: [0, HEIGHT],
                  outputRange: ([0, HEIGHT / 2]: number[]),
                }),
              },
              {
                scaleX: xCoord.interpolate({
                  inputRange: [0, WIDTH],
                  outputRange: ([0, WIDTH]: number[]),
                }),
              },
              {
                scaleY: yCoord.interpolate({
                  inputRange: [0, HEIGHT],
                  outputRange: ([0, HEIGHT]: number[]),
                }),
              },
            ],
          }}
        />
      </Animated.View>
    </>
  );
}

export default ({
  name: 'compatibility_animatedevent_pointer_move',
  description:
    'An AnimatedEvent example on onPointerMove. The blue box should scale to pointer event offset values within black box',
  title: 'AnimatedEvent with pointermove',
  render(): React.Node {
    return <CompatibilityAnimatedPointerMove />;
  },
}: RNTesterModuleExample);
