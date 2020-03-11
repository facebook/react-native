/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
import Platform from '../../../../Libraries/Utilities/Platform';
const {
  ColorAndroid,
  DynamicColorIOS,
  PlatformColor,
  StyleSheet,
  Text,
  View,
} = ReactNative;

function PlatformColorsExample() {
  function createTable() {
    let colors = [];
    if (Platform.OS === 'ios') {
      colors = [
        // https://developer.apple.com/documentation/uikit/uicolor/ui_element_colors
        // Label Colors
        {label: 'labelColor', color: PlatformColor('labelColor')},
        {
          label: 'secondaryLabelColor',
          color: PlatformColor('secondaryLabelColor'),
        },
        {
          label: 'tertiaryLabelColor',
          color: PlatformColor('tertiaryLabelColor'),
        },
        {
          label: 'quaternaryLabelColor',
          color: PlatformColor('quaternaryLabelColor'),
        },
        // Fill Colors
        {label: 'systemFillColor', color: PlatformColor('systemFillColor')},
        {
          label: 'secondarySystemFillColor',
          color: PlatformColor('secondarySystemFillColor'),
        },
        {
          label: 'tertiarySystemFillColor',
          color: PlatformColor('tertiarySystemFillColor'),
        },
        {
          label: 'quaternarySystemFillColor',
          color: PlatformColor('quaternarySystemFillColor'),
        },
        // Text Colors
        {
          label: 'placeholderTextColor',
          color: PlatformColor('placeholderTextColor'),
        },
        // Standard Content Background Colors
        {
          label: 'systemBackgroundColor',
          color: PlatformColor('systemBackgroundColor'),
        },
        {
          label: 'secondarySystemBackgroundColor',
          color: PlatformColor('secondarySystemBackgroundColor'),
        },
        {
          label: 'tertiarySystemBackgroundColor',
          color: PlatformColor('tertiarySystemBackgroundColor'),
        },
        // Grouped Content Background Colors
        {
          label: 'systemGroupedBackgroundColor',
          color: PlatformColor('systemGroupedBackgroundColor'),
        },
        {
          label: 'secondarySystemGroupedBackgroundColor',
          color: PlatformColor('secondarySystemGroupedBackgroundColor'),
        },
        {
          label: 'tertiarySystemGroupedBackgroundColor',
          color: PlatformColor('tertiarySystemGroupedBackgroundColor'),
        },
        // Separator Colors
        {label: 'separatorColor', color: PlatformColor('separatorColor')},
        {
          label: 'opaqueSeparatorColor',
          color: PlatformColor('opaqueSeparatorColor'),
        },
        // Link Color
        {label: 'linkColor', color: PlatformColor('linkColor')},
        // Nonadaptable Colors
        {label: 'darkTextColor', color: PlatformColor('darkTextColor')},
        {label: 'lightTextColor', color: PlatformColor('lightTextColor')},
        // https://developer.apple.com/documentation/uikit/uicolor/standard_colors
        // Adaptable Colors
        {label: 'systemBlueColor', color: PlatformColor('systemBlueColor')},
        {label: 'systemBrownColor', color: PlatformColor('systemBrownColor')},
        {label: 'systemGreenColor', color: PlatformColor('systemGreenColor')},
        {label: 'systemIndigoColor', color: PlatformColor('systemIndigoColor')},
        {label: 'systemOrangeColor', color: PlatformColor('systemOrangeColor')},
        {label: 'systemPinkColor', color: PlatformColor('systemPinkColor')},
        {label: 'systemPurpleColor', color: PlatformColor('systemPurpleColor')},
        {label: 'systemRedColor', color: PlatformColor('systemRedColor')},
        {label: 'systemTealColor', color: PlatformColor('systemTealColor')},
        {label: 'systemYellowColor', color: PlatformColor('systemYellowColor')},
        // Adaptable Gray Colors
        {label: 'systemGrayColor', color: PlatformColor('systemGrayColor')},
        {label: 'systemGray2Color', color: PlatformColor('systemGray2Color')},
        {label: 'systemGray3Color', color: PlatformColor('systemGray3Color')},
        {label: 'systemGray4Color', color: PlatformColor('systemGray4Color')},
        {label: 'systemGray5Color', color: PlatformColor('systemGray5Color')},
        {label: 'systemGray6Color', color: PlatformColor('systemGray6Color')},
      ];
    } else if (Platform.OS === 'android') {
      colors = [
        {label: '?attr/colorAccent', color: PlatformColor('?attr/colorAccent')},
        {
          label: '?attr/colorBackgroundFloating',
          color: PlatformColor('?attr/colorBackgroundFloating'),
        },
        {
          label: '?attr/colorButtonNormal',
          color: PlatformColor('?attr/colorButtonNormal'),
        },
        {
          label: '?attr/colorControlActivated',
          color: PlatformColor('?attr/colorControlActivated'),
        },
        {
          label: '?attr/colorControlHighlight',
          color: PlatformColor('?attr/colorControlHighlight'),
        },
        {
          label: '?attr/colorControlNormal',
          color: PlatformColor('?attr/colorControlNormal'),
        },
        {
          label: '?android:colorError',
          color: PlatformColor('?android:colorError'),
        },
        {
          label: '?android:attr/colorError',
          color: PlatformColor('?android:attr/colorError'),
        },
        {
          label: '?attr/colorPrimary',
          color: PlatformColor('?attr/colorPrimary'),
        },
        {label: '?colorPrimaryDark', color: PlatformColor('?colorPrimaryDark')},
        {
          label: '@android:color/holo_purple',
          color: PlatformColor('@android:color/holo_purple'),
        },
        {
          label: '@android:color/holo_green_light',
          color: PlatformColor('@android:color/holo_green_light'),
        },
        {
          label: '@color/catalyst_redbox_background',
          color: PlatformColor('@color/catalyst_redbox_background'),
        },
        {
          label: '@color/catalyst_logbox_background',
          color: PlatformColor('@color/catalyst_logbox_background'),
        },
      ];
    }

    let table = [];
    for (let color of colors) {
      table.push(
        <View style={styles.row} key={color.label}>
          <Text style={styles.labelCell}>{color.label}</Text>
          <View
            style={{
              ...styles.colorCell,
              backgroundColor: color.color,
            }}
          />
        </View>,
      );
    }
    return table;
  }

  return <View style={styles.column}>{createTable()}</View>;
}

function FallbackColorsExample() {
  let color = {};
  if (Platform.OS === 'ios') {
    color = {
      label: "PlatformColor('bogus', 'systemGreenColor')",
      color: PlatformColor('bogus', 'systemGreenColor'),
    };
  } else if (Platform.OS === 'android') {
    color = {
      label: "PlatformColor('bogus', '@color/catalyst_redbox_background')",
      color: PlatformColor('bogus', '@color/catalyst_redbox_background'),
    };
  } else {
    throw 'Unexpected Platform.OS: ' + Platform.OS;
  }

  return (
    <View style={styles.column}>
      <View style={styles.row}>
        <Text style={styles.labelCell}>{color.label}</Text>
        <View
          style={{
            ...styles.colorCell,
            backgroundColor: color.color,
          }}
        />
      </View>
    </View>
  );
}

function DynamicColorsExample() {
  return Platform.OS === 'ios' ? (
    <View style={styles.column}>
      <View style={styles.row}>
        <Text style={styles.labelCell}>
          DynamicColorIOS({'{\n'}
          {'  '}light: 'red', dark: 'blue'{'\n'}
          {'}'})
        </Text>
        <View
          style={{
            ...styles.colorCell,
            backgroundColor: DynamicColorIOS({light: 'red', dark: 'blue'}),
          }}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.labelCell}>
          DynamicColorIOS({'{\n'}
          {'  '}light: PlatformColor('systemBlueColor'),{'\n'}
          {'  '}dark: PlatformColor('systemRedColor'),{'\n'}
          {'}'})
        </Text>
        <View
          style={{
            ...styles.colorCell,
            backgroundColor: DynamicColorIOS({
              light: PlatformColor('systemBlueColor'),
              dark: PlatformColor('systemRedColor'),
            }),
          }}
        />
      </View>
    </View>
  ) : (
    <Text style={styles.labelCell}>Not applicable on this platform</Text>
  );
}

function AndroidColorsExample() {
  return Platform.OS === 'android' ? (
    <View style={styles.column}>
      <View style={styles.row}>
        <Text style={styles.labelCell}>ColorAndroid('?attr/colorAccent')</Text>
        <View
          style={{
            ...styles.colorCell,
            backgroundColor: ColorAndroid('?attr/colorAccent'),
          }}
        />
      </View>
    </View>
  ) : (
    <Text style={styles.labelCell}>Not applicable on this platform</Text>
  );
}

function VariantColorsExample() {
  return (
    <View style={styles.column}>
      <View style={styles.row}>
        <Text style={styles.labelCell}>
          {Platform.OS === 'ios'
            ? "DynamicColorIOS({light: 'red', dark: 'blue'})"
            : "ColorAndroid('?attr/colorAccent')"}
        </Text>
        <View
          style={{
            ...styles.colorCell,
            backgroundColor:
              Platform.OS === 'ios'
                ? DynamicColorIOS({light: 'red', dark: 'blue'})
                : ColorAndroid('?attr/colorAccent'),
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {flex: 1, flexDirection: 'column'},
  row: {flex: 0.75, flexDirection: 'row'},
  labelCell: {
    flex: 1,
    alignItems: 'stretch',
    ...Platform.select({
      ios: {color: PlatformColor('labelColor')},
      default: {color: 'black'},
    }),
  },
  colorCell: {flex: 0.25, alignItems: 'stretch'},
});

exports.title = 'PlatformColor';
exports.description =
  'Examples that show how PlatformColors may be used in an app.';
exports.examples = [
  {
    title: 'Platform Colors',
    render(): React.Element<any> {
      return <PlatformColorsExample />;
    },
  },
  {
    title: 'Fallback Colors',
    render(): React.Element<any> {
      return <FallbackColorsExample />;
    },
  },
  {
    title: 'iOS Dynamic Colors',
    render(): React.Element<any> {
      return <DynamicColorsExample />;
    },
  },
  {
    title: 'Android Colors',
    render(): React.Element<any> {
      return <AndroidColorsExample />;
    },
  },
  {
    title: 'Variant Colors',
    render(): React.Element<any> {
      return <VariantColorsExample />;
    },
  },
];
