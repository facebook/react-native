/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import React from 'react';
import {StyleSheet, TouchableHighlight, Vibration, View} from 'react-native';

exports.framework = 'React';
exports.title = 'Vibration';
exports.category = 'Basic';
exports.documentationURL = 'https://reactnative.dev/docs/vibration';
exports.description = 'Vibration API';

const pattern = [0, 500, 200, 500];
const patternLiteral = '[0, 500, 200, 500]';
const patternDescription = `${patternLiteral}
arg 0: duration to wait before turning the vibrator on.
arg with odd: vibration length.
arg with even: duration to wait before next vibration.
`;

exports.examples = [
  {
    title: 'Pattern Descriptions',
    render(): React.Node {
      return (
        <View style={styles.wrapper}>
          <RNTesterText>{patternDescription}</RNTesterText>
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
            <RNTesterText style={styles.buttonText}>
              Vibrate (default 400ms)
            </RNTesterText>
          </View>
        </TouchableHighlight>
      );
    },
  },
  {
    title: 'Vibration.vibrate(1000)',
    render(): React.Node {
      return (
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => Vibration.vibrate(1000)}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              Vibrate for 1 second
            </RNTesterText>
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
            <RNTesterText style={styles.buttonText}>Vibrate once</RNTesterText>
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
            <RNTesterText style={styles.buttonText}>
              Vibrate until cancel
            </RNTesterText>
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
            <RNTesterText style={styles.buttonText}>Cancel</RNTesterText>
          </View>
        </TouchableHighlight>
      );
    },
  },
] as Array<RNTesterModuleExample>;

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 5,
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#eeeeee',
    padding: 10,
  },
  buttonText: {
    color: 'black',
  },
});
