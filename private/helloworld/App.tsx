/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';

import Animated from 'react-native-reanimated';

function App(): React.ReactNode {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaView>
      <Animated.View
        style={{
          width: 100,
          height: 100,
          backgroundColor: 'red',
          animationName: {
            from: {opacity: 0},
            to: {opacity: 1},
          },
          animationDuration: 1000,
        }}
      />
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View>
          <Text style={styles.title}>Hello, World!</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
});

export default App;
