/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterButton from '../../components/RNTesterButton';
import * as React from 'react';
import {Animated, Text, View, StyleSheet} from 'react-native';
import {
  add,
  subtract,
  divide,
  multiply,
  modulo,
} from 'react-native/Libraries/Animated/AnimatedImplementation';
export default ({
  title: 'Combine Example',
  name: 'Combine View',
  description:
    'Change the opacity of the view by combining different Animated.Values.',
  render: () => <CombineExample />,
}: RNTesterModuleExample);

const CombineExample = () => {
  const a = new Animated.Value(0.4);
  const b = new Animated.Value(0.5);
  const addition = Animated.add(a, b);
  const subtraction = Animated.subtract(b, a);
  const multiplication = Animated.multiply(a, b);
  const division = Animated.divide(b, a);
  const mod = Animated.modulo(b, 0.4);

  const [animation, setAnimation] = React.useState<
    add | subtract | multiply | divide | modulo,
  >(add);

  return (
    <View>
      <Animated.View style={[styles.content, {opacity: animation}]}>
        <Text>Change Opacity</Text>
      </Animated.View>
      <RNTesterButton onPress={() => setAnimation(addition)}>
        Add
      </RNTesterButton>
      <RNTesterButton onPress={() => setAnimation(subtraction)}>
        Subtract
      </RNTesterButton>
      <RNTesterButton onPress={() => setAnimation(multiplication)}>
        Multiply
      </RNTesterButton>
      <RNTesterButton onPress={() => setAnimation(division)}>
        Divide
      </RNTesterButton>
      <RNTesterButton onPress={() => setAnimation(mod)}>Modulo</RNTesterButton>
    </View>
  );
};

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
