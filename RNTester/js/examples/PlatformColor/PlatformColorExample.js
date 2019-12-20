/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {PlatformColor, Text, View} = ReactNative;
import {IOSDynamicColor} from '../../../../Libraries/StyleSheet/NativeColorValueTypes';

type State = {};

class SemanticColorsExample extends React.Component<{}, State> {
  state: State;

  createTable() {
    let colors = [
      // https://developer.apple.com/documentation/uikit/uicolor/ui_element_colors
      // Label Colors
      'labelColor',
      'secondaryLabelColor',
      'tertiaryLabelColor',
      'quaternaryLabelColor',
      // Fill Colors
      'systemFillColor',
      'secondarySystemFillColor',
      'tertiarySystemFillColor',
      'quaternarySystemFillColor',
      // Text Colors
      'placeholderTextColor',
      // Standard Content Background Colors
      'systemBackgroundColor',
      'secondarySystemBackgroundColor',
      'tertiarySystemBackgroundColor',
      // Grouped Content Background Colors
      'systemGroupedBackgroundColor',
      'secondarySystemGroupedBackgroundColor',
      'tertiarySystemGroupedBackgroundColor',
      // Separator Colors
      'separatorColor',
      'opaqueSeparatorColor',
      // Link Color
      'linkColor',
      // Nonadaptable Colors
      'darkTextColor',
      'lightTextColor',
      // https://developer.apple.com/documentation/uikit/uicolor/standard_colors
      // Adaptable Colors
      'systemBlueColor',
      'systemBrownColor',
      'systemGreenColor',
      'systemIndigoColor',
      'systemOrangeColor',
      'systemPinkColor',
      'systemPurpleColor',
      'systemRedColor',
      'systemTealColor',
      'systemYellowColor',
      // Adaptable Gray Colors
      'systemGrayColor',
      'systemGray2Color',
      'systemGray3Color',
      'systemGray4Color',
      'systemGray5Color',
      'systemGray6Color',
    ];

    let table = [];
    for (let color of colors) {
      table.push(
        <View style={{flex: 0.75, flexDirection: 'row'}} key={color}>
          <Text
            style={{
              flex: 1,
              alignItems: 'stretch',
              color: PlatformColor('labelColor'),
            }}>
            {color}
          </Text>
          <View
            style={{
              flex: 0.25,
              alignItems: 'stretch',
              backgroundColor: PlatformColor(`${color}`),
            }}
          />
        </View>,
      );
    }
    return table;
  }

  render() {
    return (
      <View style={{flex: 1, flexDirection: 'column'}}>
        {this.createTable()}
      </View>
    );
  }
}

class FallbackColorsExample extends React.Component<{}, State> {
  state: State;
  render() {
    return (
      <View style={{flex: 1, flexDirection: 'column'}}>
        <View style={{flex: 0.75, flexDirection: 'row'}}>
          <Text
            style={{
              flex: 1,
              alignItems: 'stretch',
              color: PlatformColor('labelColor'),
            }}>
            First choice is 'bogus' so falls back to 'systemGreenColor'
          </Text>
          <View
            style={{
              flex: 0.25,
              alignItems: 'stretch',
              backgroundColor: PlatformColor('bogus', 'systemGreenColor'),
            }}
          />
        </View>
      </View>
    );
  }
}

class DynamicColorsExample extends React.Component<{}, State> {
  state: State;
  render() {
    return (
      <View style={{flex: 1, flexDirection: 'column'}}>
        <View style={{flex: 0.75, flexDirection: 'row'}}>
          <Text
            style={{
              flex: 1,
              alignItems: 'stretch',
              color: PlatformColor('labelColor'),
            }}>
            'red' or 'blue' depending on Light or Dark theme.
          </Text>
          <View
            style={{
              flex: 0.25,
              alignItems: 'stretch',
              backgroundColor: IOSDynamicColor({light: 'red', dark: 'blue'}),
            }}
          />
        </View>
        <View style={{flex: 0.75, flexDirection: 'row'}}>
          <Text
            style={{
              flex: 1,
              alignItems: 'stretch',
              color: PlatformColor('labelColor'),
            }}>
            'foo' with blue fallback or 'bar' with red fallback.
          </Text>
          <View
            style={{
              flex: 0.25,
              alignItems: 'stretch',
              backgroundColor: IOSDynamicColor({
                light: PlatformColor('foo', 'systemBlueColor'),
                dark: PlatformColor('bar', 'systemRedColor'),
              }),
            }}
          />
        </View>
      </View>
    );
  }
}

exports.title = 'PlatformColor';
exports.description =
  'Examples that show how PlatformColors may be used in an app.';
exports.examples = [
  {
    title: 'Semantic Colors',
    render: function(): React.Element<any> {
      return <SemanticColorsExample />;
    },
  },
  {
    title: 'Fallback Colors',
    render: function(): React.Element<any> {
      return <FallbackColorsExample />;
    },
  },
  {
    title: 'Dynamic Colors',
    render: function(): React.Element<any> {
      return <DynamicColorsExample />;
    },
  },
];
