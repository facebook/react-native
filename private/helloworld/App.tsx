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
import NativeCalculator from './specs/NativeCalculator';

function App(): React.ReactNode {
  const isDarkMode = useColorScheme() === 'dark';

  // Demo: Using the Swift TurboModule
  const a = 10;
  const b = 3;

  const sum = NativeCalculator.add(a, b);
  const difference = NativeCalculator.subtract(a, b);
  const product = NativeCalculator.multiply(a, b);
  const quotient = NativeCalculator.divide(a, b);

  return (
    <SafeAreaView>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View>
          <Text style={styles.title}>Hello, World!</Text>
          <Text style={styles.subtitle}>Swift TurboModule Demo</Text>
          <View style={styles.resultsContainer}>
            <Text style={styles.result}>
              {a} + {b} = {sum}
            </Text>
            <Text style={styles.result}>
              {a} - {b} = {difference}
            </Text>
            <Text style={styles.result}>
              {a} * {b} = {product}
            </Text>
            <Text style={styles.result}>
              {a} / {b} = {quotient.toFixed(2)}
            </Text>
          </View>
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
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    marginTop: 8,
    color: '#666',
  },
  resultsContainer: {
    marginTop: 20,
    padding: 16,
  },
  result: {
    fontSize: 18,
    marginVertical: 4,
  },
});

export default App;
