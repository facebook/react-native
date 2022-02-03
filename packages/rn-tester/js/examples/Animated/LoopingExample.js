/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
import {useEffect} from 'react';
import ToggleNativeDriver from './utils/ToggleNativeDriver';
import RNTConfigurationBlock from '../../components/RNTConfigurationBlock';

export default ({
  title: 'Looping Example',
  name: 'loopingView',
  description: 'Native looping animation that shrinks and fades out a view.',
  render: () => <LoopingExample />,
}: RNTesterModuleExample);

function LoopingView({
  useNativeDriver,
  running,
}: {
  useNativeDriver: boolean,
  running: boolean,
}) {
  const opacity = React.useMemo(() => new Animated.Value(1), []);
  const scale = React.useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    if (!running) {
      return;
    }

    const options = {
      duration: 1000,
      toValue: 0,
      useNativeDriver,
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
  }, [opacity, scale, running, useNativeDriver]);

  return (
    <Animated.View style={[styles.view, {opacity, transform: [{scale}]}]}>
      <Text>Looping!</Text>
    </Animated.View>
  );
}

function LoopingExample(props: {}): React.Node {
  const [running, setRunning] = React.useState(false);
  const [useNativeDriver, setUseNativeDriver] = React.useState(false);

  return (
    <View>
      <RNTConfigurationBlock>
        <ToggleNativeDriver
          value={useNativeDriver}
          onValueChange={value => {
            setRunning(false);
            setUseNativeDriver(value);
          }}
        />
      </RNTConfigurationBlock>
      <RNTesterButton onPress={() => setRunning(!running)}>
        Press to {running ? 'Reset' : 'Start'}
      </RNTesterButton>
      <LoopingView
        key={`looping-view-${useNativeDriver ? 'native' : 'js'}-driver`}
        useNativeDriver={useNativeDriver}
        running={running}
      />
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
