/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const {XR} = require('@callstack/react-native-visionos');
const React = require('react');
const {Button, StyleSheet, Text, View} = require('react-native');

const SecondWindow = () => {
  const [counter, setCounter] = React.useState(0);
  return (
    <View style={[styles.center]}>
      <Text style={styles.text}>{counter}</Text>
      <Button title="Increment" onPress={() => setCounter(counter + 1)} />
      <Button title="Close window" onPress={() => XR.closeWindow('')} />
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 30,
    color: 'white',
    fontWeight: 'bold',
  },
});

module.exports = SecondWindow;
