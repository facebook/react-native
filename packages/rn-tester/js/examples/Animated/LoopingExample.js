/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import RNTesterButton from '../../components/RNTesterButton';
import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import {Animated, StyleSheet, Text, View} from 'react-native';
import * as React from 'react';
import {useEffect, useState} from 'react';

export default ({
  title: 'Looping Example',
  name: 'loopingView',
  description: 'Native looping animation that shrinks and fades out a view.',
  render: () => <LoopingExample />,
}: RNTesterModuleExample);

function LoopingExample(props: {}): React.Node {
  const [running, setRunning] = useState(false);
  const [opacity] = useState(() => new Animated.Value(1));
  const [scale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!running) {
      return;
    }
    const options = {
      duration: 1000,
      toValue: 0,
      useNativeDriver: true,
    };
    const animation = Animated.loop(
      Animated.parallel([
        Animated.timing(opacity, options),
        Animated.timing(scale, options),
      ]),
    );
    animation.start();
    return () => {
      animation.reset();
    };
  }, [opacity, running, scale]);

  return (
    <View>
      <RNTesterButton onPress={() => setRunning(!running)}>
        Press to {running ? 'Reset' : 'Start'}
      </RNTesterButton>
      <Animated.View style={[styles.view, {opacity, transform: [{scale}]}]}>
        <Text>Looping!</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  view: {
    backgroundColor: 'deepskyblue',
    borderWidth: 1,
    borderColor: 'dodgerblue',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    margin: 20,
  },
});
