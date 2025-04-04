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
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
});

exports.title = 'Radial Gradient';
exports.category = 'UI';
exports.description = 'Examples of radial gradients applied to views.';
exports.examples = [
  {
    title: 'Basic Radial Gradient',
    description: 'Basic radial gradient with default settings',
    render(): React.Node {
      return (
        <GradientBox
          style={{
            experimental_backgroundImage: 'radial-gradient(#e66465, #9198e5)',
          }}
          testID="radial-gradient-basic">
          <RNTesterText style={styles.text}>Radial Gradient</RNTesterText>
        </GradientBox>
      );
    },
  },
  {
    title: 'Radial Gradient with position',
    description: 'Radial gradient at a specific position',
    render(): React.Node {
      return (
        <GradientBox
          style={{
            experimental_backgroundImage:
              'radial-gradient(at 70% 30%, red, blue)',
          }}
          testID="radial-gradient-position"
        />
      );
    },
  },
  {
    title: 'Radial Gradient with size',
    description: 'Radial gradient with different sizes',
    render(): React.Node {
      return (
        <GradientBox
          style={{
            experimental_backgroundImage:
              'radial-gradient(circle closest-side, yellow, green)',
          }}
          testID="radial-gradient-size"
        />
      );
    },
  },
  {
    title: 'Multiple Color Stops',
    render(): React.Node {
      return (
        <GradientBox
          testID="radial-gradient-color-stops"
          style={{
            experimental_backgroundImage:
              'radial-gradient(red 0%, yellow 30%, green 60%, blue 100%)',
          }}
        />
      );
    },
  },
  {
    title: 'Radial gradient with object style syntax',
    render(): React.Node {
      return (
        <GradientBox
          testID="radial-gradient-object-style-syntax"
          style={{
            experimental_backgroundImage: [
              {
                type: 'radial-gradient',
                shape: 'circle',
                position: {top: 0, right: 0},
                size: 'farthest-corner',
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
    title: 'Radial Gradient with uniform border style',
    render(): React.Node {
      return (
        <GradientBox
          testID="radial-gradient-with-uniform-borders"
          style={{
            experimental_backgroundImage:
              'radial-gradient(circle at center, yellow, green)',
            borderRadius: 16,
          }}
        />
      );
    },
  },
  {
    title: 'Radial Gradient with non uniform border style',
    render(): React.Node {
      return (
        <GradientBox
          testID="radial-gradient-with-non-uniform-borders"
          style={{
            experimental_backgroundImage: `radial-gradient(
              circle at 70% 30%,
              #8a2be2 0%,
              #4b0082 50%,
              #191970 100%
            )`,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 16,
          }}
        />
      );
    },
  },
  {
    title: 'Elliptical Radial Gradient',
    render(): React.Node {
      return (
        <GradientBox
          testID="radial-gradient-elliptical"
          style={{
            experimental_backgroundImage:
              'radial-gradient(ellipse farthest-corner at 30% 40%, red, blue)',
          }}
        />
      );
    },
  },
  {
    title: 'Radial Gradient with Platform colors',
    render(): React.Node {
      return (
        <GradientBox
          testID="radial-gradient-platform-colors"
          style={{
            experimental_backgroundImage: [
              {
                type: 'radial-gradient',
                shape: 'circle',
                position: {top: '50%', left: '50%'},
                size: 'farthest-corner',
                colorStops: [
                  {
                    color: Platform.select({
                      ios: PlatformColor('systemBlueColor'),
                      android: PlatformColor('@android:color/holo_blue_dark'),
                      default: 'blue',
                    }),
                  },
                  {color: 'green'},
                ],
              },
            ],
          }}
        />
      );
    },
  },
  {
    title: 'Transition hint with percentages',
    render(): React.Node {
      return (
        <GradientBox
          style={{
            experimental_backgroundImage: 'radial-gradient(red, 40%, blue)',
          }}
          testID="radial-gradient-transition-hint"
        />
      );
    },
  },
  {
    title: 'Multiple radial gradients',
    render(): React.Node {
      return (
        <GradientBox
          testID="radial-gradient-multiple"
          style={{
            experimental_backgroundImage: `
                  radial-gradient(circle at top 20% right 20%, rgba(238, 64, 53, 0.8), rgba(238, 64, 53, 0) 70%),
                  radial-gradient(circle at 50% 50%, rgba(243, 119, 54, 0.8), rgba(243, 119, 54, 0) 70%),
                  radial-gradient(circle at 80% 80%, rgba(123, 192, 67, 0.8), rgba(123, 192, 67, 0) 70%)
            `,
            borderRadius: 16,
          }}
        />
      );
    },
  },
];
