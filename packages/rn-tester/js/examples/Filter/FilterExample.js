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
import {Image, StyleSheet, Text, View} from 'react-native';

const hotdog = require('../../assets/hotdog.jpg');

type Props = $ReadOnly<{
  style: ViewStyleProp,
  testID?: string,
}>;

function StaticViewAndImage(props: Props): React.Node {
  return (
    <>
      <View style={styles.container} testID={props.testID}>
        <View style={[props.style, styles.commonView]}>
          <View style={styles.subview}>
            <View style={styles.subsubview} />
            <Text>Hello world!</Text>
          </View>
        </View>
        <View style={styles.commonView}>
          <View style={styles.subview}>
            <View style={styles.subsubview} />
            <Text>Hello world!</Text>
          </View>
        </View>
      </View>
      <View style={styles.container}>
        <Image source={hotdog} style={[props.style, styles.commonImage]} />
        <Image source={hotdog} style={styles.commonImage} />
      </View>
    </>
  );
}

function StaticViewAndImageWithState(props: Props): React.Node {
  const [s, setS] = React.useState(true);
  setTimeout(() => setS(!s), 5000);

  return (
    <StaticViewAndImage
      style={s ? [props.style] : null}
      testID={props.testID}
    />
  );
}

const styles = StyleSheet.create({
  commonView: {
    width: 150,
    height: 150,
    backgroundColor: '#275752',
  },
  commonImage: {
    width: 150,
    height: 90,
  },
  subview: {
    width: 75,
    height: 75,
    backgroundColor: '#8d2b8f',
  },
  subsubview: {
    width: 38.5,
    height: 38.5,
    backgroundColor: '#32a840',
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

exports.title = 'Filter';
exports.category = 'UI';
exports.description =
  'A set of graphical effects that can be applied to a view.';
exports.examples = [
  {
    title: 'Brightness',
    description: 'brightness(1.5)',
    name: 'brightness',
    render(): React.Node {
      return (
        <StaticViewAndImage
          style={{experimental_filter: [{brightness: 1.5}]}}
          testID="filter-test-brightness"
        />
      );
    },
  },
  {
    title: 'Opacity',
    description: 'opacity(0.5)',
    name: 'opacity',
    render(): React.Node {
      return (
        <StaticViewAndImage style={{experimental_filter: [{opacity: 0.5}]}} />
      );
    },
  },
  {
    title: 'Contrast',
    description: 'contrast(0.5)',
    name: 'contrast',
    platform: 'android',
    render(): React.Node {
      return (
        <StaticViewAndImage style={{experimental_filter: [{contrast: 0.5}]}} />
      );
    },
  },
  {
    title: 'Sepia',
    description: 'sepia(0.5)',
    name: 'sepia',
    platform: 'android',
    render(): React.Node {
      return (
        <StaticViewAndImage style={{experimental_filter: [{sepia: 0.5}]}} />
      );
    },
  },
  {
    title: 'Grayscale',
    description: 'grayscale(0.5)',
    name: 'grayscale',
    platform: 'android',
    render(): React.Node {
      return (
        <StaticViewAndImage style={{experimental_filter: [{grayscale: 0.5}]}} />
      );
    },
  },
  {
    title: 'Saturate',
    description: 'saturate(4)',
    name: 'saturate',
    platform: 'android',
    render(): React.Node {
      return (
        <StaticViewAndImage style={{experimental_filter: [{saturate: 4}]}} />
      );
    },
  },
  {
    title: 'Hue Rotate',
    description: 'hueRotate(-90deg)',
    name: 'hueRotate',
    platform: 'android',
    render(): React.Node {
      return (
        <StaticViewAndImage
          style={{experimental_filter: [{hueRotate: '-90deg'}]}}
        />
      );
    },
  },
  {
    title: 'Invert',
    description: 'invert(0.7)',
    name: 'invert',
    platform: 'android',
    render(): React.Node {
      return (
        <StaticViewAndImage style={{experimental_filter: [{invert: 0.7}]}} />
      );
    },
  },
  {
    title: 'Blur',
    description: 'blur(10)',
    name: 'blur',
    platform: 'android',
    render(): React.Node {
      return (
        <StaticViewAndImage
          style={{experimental_filter: [{blur: 10}]}}
          testID="filter-test-blur"
        />
      );
    },
  },
  {
    title: 'Chained filters',
    description: 'brightness(1.5) opacity(0.5)',
    name: 'chained-filters',
    render(): React.Node {
      return (
        <StaticViewAndImageWithState
          style={{experimental_filter: [{brightness: 1.5}, {opacity: 0.5}]}}
          testID="filter-test-chain"
        />
      );
    },
  },
  {
    title: 'Filters with state updates',
    description: 'Turn brightness(1.5) on and off every 5 seconds',
    render(): React.Node {
      return (
        <StaticViewAndImageWithState
          style={{experimental_filter: [{brightness: 1.5}]}}
        />
      );
    },
  },
];
