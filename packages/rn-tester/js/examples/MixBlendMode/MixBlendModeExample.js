/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';

import React from 'react';
import {Image, ImageBackground, StyleSheet, Text, View} from 'react-native';

type Props = $ReadOnly<{
  style: ViewStyleProp,
  testID?: string,
}>;

function LayeredView(props: Props) {
  return (
    <>
      <View style={styles.container}>
        <ImageBackground
          source={require('../../assets/rainbow.jpeg')}
          style={[styles.backdrop, {width: 110}]}>
          <View style={[styles.commonView, props.style]}>
            <View style={styles.nestedView} />
            <Text>Hello, World!</Text>
          </View>
        </ImageBackground>
      </View>
    </>
  );
}

function LayeredImage(props: Props) {
  return (
    <>
      <View style={styles.container}>
        <ImageBackground
          source={require('../../assets/rainbow.jpeg')}
          style={[styles.backdrop, {width: 200}]}>
          <Image
            source={require('../../assets/alpha-hotdog.png')}
            style={[styles.commonImage, props.style]}
          />
        </ImageBackground>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  commonImage: {
    width: 200,
    height: 100,
    marginLeft: 3,
    marginTop: 3,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  backdrop: {
    opacity: 0.99, // Creating stacking context
    height: 110,
  },
  commonView: {
    backgroundColor: 'cyan',
    height: 100,
    width: 100,
    marginTop: 5,
    marginLeft: 5,
  },
  nestedView: {
    backgroundColor: 'purple',
    height: 50,
    width: 50,
  },
});

const mixBlendModes = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
];

const examples: Array<RNTesterModuleExample> = mixBlendModes.map(mode => ({
  title: mode,
  description: `mix-blend-mode: ${mode}`,
  name: mode,
  render(): React.Node {
    return (
      <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
        <LayeredView style={{experimental_mixBlendMode: mode}} />
        <LayeredImage style={{experimental_mixBlendMode: mode}} />
      </View>
    );
  },
}));

exports.title = 'MixBlendMode';
exports.category = 'UI';
exports.description =
  'A set of graphical effects that can be applied to a view.';
exports.examples = examples;
