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
import * as React from 'react';
import RNTesterButton from '../../components/RNTesterButton';
import ToggleNativeDriver from './utils/ToggleNativeDriver';
import {Text, StyleSheet, View, Animated} from 'react-native';
import RNTConfigurationBlock from '../../components/RNTConfigurationBlock';

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

function FadeInView({
  useNativeDriver,
  children,
}: {
  useNativeDriver: boolean,
  children: React.Node,
}) {
  //opacity 0
  const [fadeAnim] = React.useState(() => new Animated.Value(0));
  React.useEffect(() => {
    Animated.timing(
      // Uses easing functions
      fadeAnim, // The value to drive
      {
        // Target
        toValue: 1,

        // Configuration
        duration: 2000,

        useNativeDriver,
      },
    ).start(); // Don't forget start!
  }, [fadeAnim, useNativeDriver]);

  return (
    <Animated.View // Special animatable View
      style={{
        opacity: fadeAnim, // Binds
      }}>
      {children}
    </Animated.View>
  );
}

function FadeInExample(): React.Node {
  const [show, setShow] = React.useState(true);
  const [useNativeDriver, setUseNativeDriver] = React.useState(false);
  return (
    <View>
      <RNTConfigurationBlock>
        <ToggleNativeDriver
          value={useNativeDriver}
          onValueChange={setUseNativeDriver}
        />
      </RNTConfigurationBlock>
      <RNTesterButton testID="toggle-button" onPress={() => setShow(!show)}>
        Press to {show ? 'Hide' : 'Show'}
      </RNTesterButton>
      {show && (
        <FadeInView useNativeDriver={useNativeDriver}>
          <View testID="fade-in-view" style={styles.content}>
            <Text>FadeInView</Text>
          </View>
        </FadeInView>
      )}
    </View>
  );
}

export default ({
  title: 'FadeInView',
  name: 'fadeInView',
  description: ('Uses a simple timing animation to ' +
    'bring opacity from 0 to 1 when the component ' +
    'mounts.': string),
  expect:
    'FadeInView box should animate from opacity 0 to 1. \nExpect no animation when hiding.\nHiding the view mid-animation should not affect next animation.',
  render: (): React.Node => <FadeInExample />,
}: RNTesterModuleExample);
