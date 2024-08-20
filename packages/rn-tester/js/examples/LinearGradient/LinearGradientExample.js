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

import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';

import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

type Props = $ReadOnly<{
  style: ViewStyleProp,
  testID?: string,
}>;

function GradientBox(props: Props): React.Node {
  return (
    <View style={[styles.box, props.style]} testID={props.testID}>
      <Text style={styles.text}>Linear Gradient</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 200,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
});

exports.title = 'Linear Gradient';
exports.category = 'UI';
exports.description = 'Examples of linear gradients applied to views.';
exports.examples = [
  {
    title: 'Basic Linear Gradient',
    description: 'Linear gradient from top to bottom',
    render(): React.Node {
      return (
        <GradientBox
          style={{
            experimental_backgroundImage: 'linear-gradient(#e66465, #9198e5);',
          }}
          testID="linear-gradient-basic"
        />
      );
    },
  },
  {
    title: 'Diagonal Gradient',
    description: 'Linear gradient from top-left to bottom-right',
    render(): React.Node {
      return (
        <GradientBox
          testID="linear-gradient-diagonal"
          style={{
            experimental_backgroundImage:
              'linear-gradient(to bottom right, yellow, green)',
          }}
        />
      );
    },
  },
  {
    title: 'Gradient with angle',
    description: 'Linear gradient with angle',
    render(): React.Node {
      return (
        <GradientBox
          testID="linear-gradient-angle"
          style={{
            experimental_backgroundImage:
              'linear-gradient(135deg, gray, brown)',
          }}
        />
      );
    },
  },
  {
    title: 'Multiple Color Stops',
    render(): React.Node {
      return (
        <GradientBox
          testID="linear-gradient-color-stops"
          style={{
            experimental_backgroundImage:
              'linear-gradient(to right, red 0%, yellow 30%, green 60%, blue 100%)',
          }}
        />
      );
    },
  },
  {
    title: 'Linear gradient with object style syntax',
    render(): React.Node {
      return (
        <GradientBox
          testID="linear-gradient-object-style-syntax"
          style={{
            experimental_backgroundImage: [
              {
                type: 'linearGradient',
                direction: 'to bottom',
                colorStops: [
                  {color: 'purple', positions: ['0%']},
                  {color: 'orange', positions: ['100%']},
                ],
              },
            ],
          }}
        />
      );
    },
  },
  {
    title: 'Gradient with uniform border style',
    render(): React.Node {
      return (
        <GradientBox
          testID="linear-gradient-with-uniform-borders"
          style={{
            experimental_backgroundImage:
              'linear-gradient(to bottom right, yellow, green);',
            borderRadius: 16,
          }}
        />
      );
    },
  },
  {
    title: 'Gradient with non-uniform border style',
    render(): React.Node {
      return (
        <GradientBox
          testID="linear-gradient-with-non-uniform-borders"
          style={{
            experimental_backgroundImage:
              'linear-gradient(to bottom right, yellow, green);',
            borderTopRightRadius: 8,
            borderTopLeftRadius: 80,
          }}
        />
      );
    },
  },
];
