/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import RNTesterText from '../../components/RNTesterText';
import {RNTesterThemeContext} from '../../components/RNTesterTheme';
import React, {useState} from 'react';
import {Button, PixelRatio, StyleSheet, TextInput, View} from 'react-native';

function LayoutSizeToPixel() {
  const theme = React.useContext(RNTesterThemeContext);
  const [layoutDPSize, setLayoutDPSize] = useState<number>(0);
  const pixelSize = PixelRatio.getPixelSizeForLayoutSize(
    layoutDPSize ? layoutDPSize : 0,
  );

  const handleDPInputChange = (changedText: string) => {
    const layoutSize = parseInt(changedText, 10);
    setLayoutDPSize(layoutSize);
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.row}>
          <RNTesterText style={styles.inputLabel}>
            Layout Size(dp):{' '}
          </RNTesterText>
          <TextInput
            style={[
              styles.input,
              {color: theme.LabelColor, borderColor: theme.SeparatorColor},
            ]}
            value={layoutDPSize ? layoutDPSize.toString() : ''}
            keyboardType={'numeric'}
            onChangeText={handleDPInputChange}
          />
        </View>
        <View style={[styles.row, styles.outputContainer]}>
          <RNTesterText style={styles.inputLabel}>Pixel Size: </RNTesterText>
          <RNTesterText>{pixelSize}px</RNTesterText>
        </View>
      </View>
    </View>
  );
}

function RoundToNearestPixel() {
  const theme = React.useContext(RNTesterThemeContext);
  const [layoutDPSizeText, setLayoutDPSizeText] = useState('');
  const layoutDPSize = parseFloat(layoutDPSizeText);

  const pixelSize = PixelRatio.roundToNearestPixel(
    layoutDPSize ? layoutDPSize : 0,
  );

  const handleDPInputChange = (changedText: string) => {
    setLayoutDPSizeText(changedText);
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.row}>
          <RNTesterText style={styles.inputLabel}>
            Layout Size(dp):{' '}
          </RNTesterText>
          <TextInput
            style={[
              styles.input,
              {color: theme.LabelColor, borderColor: theme.SeparatorColor},
            ]}
            value={layoutDPSizeText ? layoutDPSizeText.toString() : ''}
            keyboardType={'numeric'}
            onChangeText={handleDPInputChange}
          />
        </View>
        <View style={[styles.row, styles.outputContainer]}>
          <RNTesterText style={styles.inputLabel}>
            Nearest Layout Size:{' '}
          </RNTesterText>
          <RNTesterText>{pixelSize}dp</RNTesterText>
        </View>
      </View>
    </View>
  );
}

function GetPixelRatio() {
  const [pixelDensity, setPixelDensity] = useState(0);

  const getPixelDensityCallback = () => {
    setPixelDensity(PixelRatio.get());
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <Button onPress={getPixelDensityCallback} title={'Get Pixel Density'} />
        {pixelDensity ? (
          <View style={[styles.row, styles.outputContainer]}>
            <RNTesterText style={styles.inputLabel}>
              Pixel Density:{' '}
            </RNTesterText>
            <RNTesterText>{pixelDensity}</RNTesterText>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function GetFontScale() {
  const [fontScale, setFontScale] = useState(0);

  const getPixelDensityCallback = () => {
    setFontScale(PixelRatio.getFontScale());
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <Button onPress={getPixelDensityCallback} title={'Get Font Scale'} />
        {fontScale ? (
          <View style={[styles.row, styles.outputContainer]}>
            <RNTesterText style={styles.inputLabel}>Font scale: </RNTesterText>
            <RNTesterText>{fontScale}</RNTesterText>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: 40,
    flex: 1,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  outputContainer: {
    marginTop: 16,
  },
  inputLabel: {
    fontWeight: 'bold',
  },
  input: {
    borderRadius: 6,
    borderWidth: 1,
    paddingVertical: 0,
    height: 30,
    width: 200,
    alignSelf: 'center',
    marginLeft: 14,
    paddingHorizontal: 8,
  },
  card: {
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
});

exports.title = 'PixelRatio';
exports.category = 'UI';
exports.documentationURL = 'https://reactnative.dev/docs/pixelratio';
exports.description = "Gives access to device's pixel density and font scale";
exports.examples = [
  {
    title: 'Get pixel density',
    description: 'Get pixel density of the device.',
    render(): React$Node {
      return <GetPixelRatio />;
    },
  },
  {
    title: 'Get font scale',
    description: 'Get  the scaling factor for font sizes.',
    render(): React$Node {
      return <GetFontScale />;
    },
  },
  {
    title: 'Get pixel size from layout size',
    description: 'layout size (dp) -> pixel size (px)',
    render(): React$Node {
      return <LayoutSizeToPixel />;
    },
  },
  {
    title: 'Rounds a layout size to the nearest pixel',
    description:
      'Rounds a layout size (dp) to the nearest layout size that corresponds to an integer number of pixels',
    render(): React$Node {
      return <RoundToNearestPixel />;
    },
  },
];
