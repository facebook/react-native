/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const React = require('react');

const {
  StyleSheet,
  View,
  Text,
  TouchableHighlight,
  Vibration,
  Platform,
} = require('react-native');

exports.framework = 'React';
exports.title = 'Vibration';
exports.category = 'Basic';
exports.documentationURL = 'https://reactnative.dev/docs/vibration';
exports.description = 'Vibration API';

let pattern, patternLiteral, patternDescription;
if (Platform.OS === 'android') {
  pattern = [0, 500, 200, 500];
  patternLiteral = '[0, 500, 200, 500]';
  patternDescription = `${patternLiteral}
arg 0: duration to wait before turning the vibrator on.
arg with odd: vibration length.
arg with even: duration to wait before next vibration.
`;
} else {
  pattern = [0, 1000, 2000, 3000];
  patternLiteral = '[0, 1000, 2000, 3000]';
  patternDescription = `${patternLiteral}
vibration length on iOS is fixed.
pattern controls durations BETWEEN each vibration only.

arg 0: duration to wait before turning the vibrator on.
subsequent args: duration to wait before next vibration.
`;
}

exports.examples = [
  {
    title: 'Pattern Descriptions',
    render(): React.Node {
      return (
        <View style={styles.wrapper}>
          <Text>{patternDescription}</Text>
        </View>
      );
    },
  },
  {
    title: 'Vibration.vibrate()',
    render(): React.Node {
      return (
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => Vibration.vibrate()}>
          <View style={styles.button}>
            <Text>Vibrate</Text>
          </View>
        </TouchableHighlight>
      );
    },
  },
  {
    title: `Vibration.vibrate(${patternLiteral})`,
    render(): React.Node {
      return (
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => Vibration.vibrate(pattern)}>
          <View style={styles.button}>
            <Text>Vibrate once</Text>
          </View>
        </TouchableHighlight>
      );
    },
  },
  {
    title: `Vibration.vibrate(${patternLiteral}, true)`,
    render(): React.Node {
      return (
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => Vibration.vibrate(pattern, true)}>
          <View style={styles.button}>
            <Text>Vibrate until cancel</Text>
          </View>
        </TouchableHighlight>
      );
    },
  },
  {
    title: 'Vibration.cancel()',
    render(): React.Node {
      return (
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => Vibration.cancel()}>
          <View style={styles.button}>
            <Text>Cancel</Text>
          </View>
        </TouchableHighlight>
      );
    },
  },
];

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 5,
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#eeeeee',
    padding: 10,
  },
});
