/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';

import RNTesterText from '../../components/RNTesterText';
import React from 'react';
import {Platform, PlatformColor, StyleSheet, View} from 'react-native';

type Props = $ReadOnly<{
  style: ViewStyleProp,
  testID?: string,
  children?: React.Node,
}>;

function GradientBox(props: Props): React.Node {
  return (
    <View style={[styles.box, props.style]} testID={props.testID}>
      {props.children}
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
          testID="linear-gradient-basic">
          <RNTesterText style={styles.text}>Linear Gradient</RNTesterText>
        </GradientBox>
      );
    },
  },
  {
    title: 'Linear Gradient with corner angle',
    description: 'Rectangular Linear gradient with corner angle',
    render(): React.Node {
      return (
        <GradientBox
          style={{
            experimental_backgroundImage: 'linear-gradient(45deg, red, blue);',
            height: 300,
            width: 140,
          }}
          testID="linear-gradient-rectangular-with-corner-angle"
        />
      );
    },
  },
  {
    title: 'Multiple linear gradients',
    render(): React.Node {
      return (
        <GradientBox
          testID="linear-gradient-multiple"
          style={{
            experimental_backgroundImage: `
                  linear-gradient(0deg, white, rgba(238, 64, 53, 0.8), rgba(238, 64, 53, 0) 70%), 
    linear-gradient(45deg, white, rgba(243, 119, 54, 0.8), rgba(243, 119, 54, 0) 70%), 
    linear-gradient(90deg, white, rgba(253, 244, 152, 0.8), rgba(253, 244, 152, 0) 70%), 
    linear-gradient(135deg, white, rgba(123, 192, 67, 0.8), rgba(123, 192, 67, 0) 70%), 
    linear-gradient(180deg, white, rgba(3, 146, 207, 0.8), rgba(3, 146, 207, 0) 70%);

            `,
            borderRadius: 16,
          }}
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
                type: 'linear-gradient',
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
  {
    title: 'Gradient with Platform colors',
    render(): React.Node {
      return (
        <GradientBox
          testID="linear-gradient-with-non-uniform-borders"
          style={{
            experimental_backgroundImage: [
              {
                type: 'linear-gradient',
                direction: 'to bottom',
                colorStops: [
                  {
                    color: Platform.select({
                      ios: PlatformColor('systemTealColor'),
                      android: PlatformColor('@android:color/holo_purple'),
                      default: 'blue',
                    }),
                    positions: ['0%'],
                  },
                  {color: 'green', positions: ['100%']},
                ],
              },
            ],
          }}
        />
      );
    },
  },
  {
    title: 'Transition hint',
    render(): React.Node {
      return (
        <GradientBox
          style={{
            experimental_backgroundImage: 'linear-gradient(red, 40%, blue)',
          }}
          testID="linear-gradient-transition-hint"
        />
      );
    },
  },
  {
    title: 'with px and % combination',
    render(): React.Node {
      return (
        <GradientBox
          style={{
            experimental_backgroundImage: `linear-gradient(
              to right,
              #f15a24 0%,
              #f15a24 50px,
              #fbb03b 50px,
              35%,
              #29abe2 65%,
              180px,
              #2e3192 100%
            );`,
          }}
          testID="linear-gradient-transition-hint"
        />
      );
    },
  },
  {
    title: 'Non square multiple color stops',
    render(): React.Node {
      return (
        <GradientBox
          testID="linear-gradient-non-square-multiple-color-stops"
          style={{
            experimental_backgroundImage:
              'linear-gradient(45deg, black 9%, red 20%, blue 30%, green 50%, black 90%, transparent)',
            width: 100,
            height: 200,
          }}
        />
      );
    },
  },
];
