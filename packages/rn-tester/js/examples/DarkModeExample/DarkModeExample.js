/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict'; // TODO(OSS Candidate ISS#2710739)

const React = require('react');
const ReactNative = require('react-native');
import {Platform} from 'react-native';
const {PlatformColor, Text, View} = ReactNative;

class SemanticColorsExample extends React.Component<{}> {
  createTable() {
    let colors = [];
    if (Platform.OS === 'macos') {
      colors = [
        // https://developer.apple.com/documentation/appkit/nscolor/ui_element_colors
        // Label Colors
        'labelColor',
        'secondaryLabelColor',
        'tertiaryLabelColor',
        'quaternaryLabelColor',
        // Text Colors
        'textColor',
        'placeholderTextColor',
        'selectedTextColor',
        'textBackgroundColor',
        'selectedTextBackgroundColor',
        'keyboardFocusIndicatorColor',
        'unemphasizedSelectedTextColor',
        'unemphasizedSelectedTextBackgroundColor',
        // Content Colors
        'linkColor',
        'separatorColor',
        'selectedContentBackgroundColor',
        'unemphasizedSelectedContentBackgroundColor',
        // Menu Colors
        'selectedMenuItemTextColor',
        // Table Colors
        'gridColor',
        'headerTextColor',
        'alternatingEvenContentBackgroundColor',
        'alternatingOddContentBackgroundColor',
        // Control Colors
        'controlAccentColor',
        'controlColor',
        'controlBackgroundColor',
        'controlTextColor',
        'disabledControlTextColor',
        'selectedControlColor',
        'selectedControlTextColor',
        'alternateSelectedControlTextColor',
        'scrubberTexturedBackgroundColor',
        // Window Colors
        'windowBackgroundColor',
        'windowFrameTextColor',
        'underPageBackgroundColor',
        // Highlights and Shadows
        'findHighlightColor',
        'highlightColor',
        'shadowColor',
        // https://developer.apple.com/documentation/appkit/nscolor/standard_colors
        // Standard Colors
        'systemBlueColor',
        'systemBrownColor',
        'systemGrayColor',
        'systemGreenColor',
        'systemOrangeColor',
        'systemPinkColor',
        'systemPurpleColor',
        'systemRedColor',
        'systemYellowColor',
      ];
    } else if (Platform.OS === 'ios') {
      colors = [
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
    }

    let table = [];
    for (let color of colors) {
      table.push(
        <View style={{flex: 0.75, flexDirection: 'row'}} key={color}>
          <Text
            style={{
              flex: 1,
              alignItems: 'stretch',
              color: PlatformColor('labelColor'),
            }}
          >
            {color}
          </Text>
          <View
            style={{
              flex: 0.25,
              alignItems: 'stretch',
              backgroundColor: PlatformColor(color),
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

exports.title = 'Dark Mode';
exports.description =
  'Examples that show how Dark Mode may be implemented in an app.';
exports.examples = [
  {
    title: 'Semantic Colors',
    render: function(): React.Element<any> {
      return <SemanticColorsExample />;
    },
  },
];
