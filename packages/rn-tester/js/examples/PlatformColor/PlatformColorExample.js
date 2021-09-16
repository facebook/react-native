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
import Platform from '../../../../../Libraries/Utilities/Platform';
const {
  ColorWithSystemEffectMacOS, // TODO(macOS GH#750)
  DynamicColorIOS,
  DynamicColorMacOS,
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
        {label: 'label', color: PlatformColor('label')},
        {
          label: 'secondaryLabel',
          color: PlatformColor('secondaryLabel'),
        },
        {
          label: 'tertiaryLabel',
          color: PlatformColor('tertiaryLabel'),
        },
        {
          label: 'quaternaryLabel',
          color: PlatformColor('quaternaryLabel'),
        },
        // Fill Colors
        {label: 'systemFill', color: PlatformColor('systemFill')},
        {
          label: 'secondarySystemFill',
          color: PlatformColor('secondarySystemFill'),
        },
        {
          label: 'tertiarySystemFill',
          color: PlatformColor('tertiarySystemFill'),
        },
        {
          label: 'quaternarySystemFill',
          color: PlatformColor('quaternarySystemFill'),
        },
        // Text Colors
        {
          label: 'placeholderText',
          color: PlatformColor('placeholderText'),
        },
        // Standard Content Background Colors
        {
          label: 'systemBackground',
          color: PlatformColor('systemBackground'),
        },
        {
          label: 'secondarySystemBackground',
          color: PlatformColor('secondarySystemBackground'),
        },
        {
          label: 'tertiarySystemBackground',
          color: PlatformColor('tertiarySystemBackground'),
        },
        // Grouped Content Background Colors
        {
          label: 'systemGroupedBackground',
          color: PlatformColor('systemGroupedBackground'),
        },
        {
          label: 'secondarySystemGroupedBackground',
          color: PlatformColor('secondarySystemGroupedBackground'),
        },
        {
          label: 'tertiarySystemGroupedBackground',
          color: PlatformColor('tertiarySystemGroupedBackground'),
        },
        // Separator Colors
        {label: 'separator', color: PlatformColor('separator')},
        {
          label: 'opaqueSeparator',
          color: PlatformColor('opaqueSeparator'),
        },
        // Link Color
        {label: 'link', color: PlatformColor('link')},
        // Nonadaptable Colors
        {label: 'darkText', color: PlatformColor('darkText')},
        {label: 'lightText', color: PlatformColor('lightText')},
        // https://developer.apple.com/documentation/uikit/uicolor/standard_colors
        // Adaptable Colors
        {label: 'systemBlue', color: PlatformColor('systemBlue')},
        {label: 'systemBrown', color: PlatformColor('systemBrown')},
        {label: 'systemGreen', color: PlatformColor('systemGreen')},
        {label: 'systemIndigo', color: PlatformColor('systemIndigo')},
        {label: 'systemOrange', color: PlatformColor('systemOrange')},
        {label: 'systemPink', color: PlatformColor('systemPink')},
        {label: 'systemPurple', color: PlatformColor('systemPurple')},
        {label: 'systemRed', color: PlatformColor('systemRed')},
        {label: 'systemTeal', color: PlatformColor('systemTeal')},
        {label: 'systemYellow', color: PlatformColor('systemYellow')},
        // Adaptable Gray Colors
        {label: 'systemGray', color: PlatformColor('systemGray')},
        {label: 'systemGray2', color: PlatformColor('systemGray2')},
        {label: 'systemGray3', color: PlatformColor('systemGray3')},
        {label: 'systemGray4', color: PlatformColor('systemGray4')},
        {label: 'systemGray5', color: PlatformColor('systemGray5')},
        {label: 'systemGray6', color: PlatformColor('systemGray6')},
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
  if (
    Platform.OS === 'ios' ||
    Platform.OS === 'macos' // TODO(macOS GH#774)
  ) {
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
    color = {
      label: 'Unexpected Platform.OS: ' + Platform.OS,
      color: 'red',
    };
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
  // [TODO(macOS GH#774)
  return Platform.OS === 'macos' ? (
    <View style={styles.column}>
      <View style={styles.row}>
        <Text style={styles.labelCell}>
          DynamicColorMacOS({'{\n'}
          {'  '}light: 'red', dark: 'blue'{'\n'}
          {'}'})
        </Text>
        <View
          style={{
            ...styles.colorCell,
            backgroundColor: DynamicColorMacOS({light: 'red', dark: 'blue'}),
          }}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.labelCell}>
          DynamicColorMacOS({'{\n'}
          {'  '}light: PlatformColor('systemBlueColor'),{'\n'}
          {'  '}dark: PlatformColor('systemRedColor'),{'\n'}
          {'}'})
        </Text>
        <View
          style={{
            ...styles.colorCell,
            backgroundColor: DynamicColorMacOS({
              light: PlatformColor('systemBlueColor'),
              dark: PlatformColor('systemRedColor'),
            }),
          }}
        />
      </View>
    </View>
  ) : // ]TODO(macOS GH#774)
  Platform.OS === 'ios' ? (
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

function VariantColorsExample() {
  return (
    <View style={styles.column}>
      <View style={styles.row}>
        <Text style={styles.labelCell}>
          {// [TODO(OSS Candidate ISS#2710739)
          Platform.select({
            ios: "DynamicColorIOS({light: 'red', dark: 'blue'})",
            android: "PlatformColor('?attr/colorAccent')",
            macos: "DynamicColorMacOS({light: 'red', dark: 'blue'})",
            default: 'Unexpected Platform.OS: ' + Platform.OS,
          })
          // ]TODO(OSS Candidate ISS#2710739)
          }
        </Text>
        <View
          style={{
            ...styles.colorCell,
            backgroundColor:
              Platform.OS === 'ios'
                ? DynamicColorIOS({light: 'red', dark: 'blue'})
                : // [TODO(macOS GH#774)
                Platform.OS === 'macos'
                ? DynamicColorMacOS({light: 'red', dark: 'blue'})
                : // ]TODO(macOS GH#774)
                Platform.OS === 'android'
                ? PlatformColor('?attr/colorAccent')
                : 'red',
          }}
        />
      </View>
    </View>
  );
}

// [TODO(macOS GH#750)
function ColorWithSystemEffectMacOSExample() {
  function createTable() {
    let colors = [
      {label: 'gray', color: 'gray'},
      {
        label: "ColorWithSystemEffectMacOS('gray', 'none')",
        color: ColorWithSystemEffectMacOS('gray', 'none'),
      },
      {
        label: "ColorWithSystemEffectMacOS('gray', 'pressed')",
        color: ColorWithSystemEffectMacOS('gray', 'pressed'),
      },
      {
        label: "ColorWithSystemEffectMacOS('gray', 'deepPressed')",
        color: ColorWithSystemEffectMacOS('gray', 'deepPressed'),
      },
      {
        label: "ColorWithSystemEffectMacOS('gray', 'disabled')",
        color: ColorWithSystemEffectMacOS('gray', 'disabled'),
      },
      {
        label: "ColorWithSystemEffectMacOS('gray', 'rollover')",
        color: ColorWithSystemEffectMacOS('gray', 'rollover'),
      },
      {
        label: "PlatformColor('systemBlueColor')",
        color: PlatformColor('systemBlueColor'),
      },
      {
        label:
          "ColorWithSystemEffectMacOS(PlatformColor('systemBlueColor'), 'none')",
        color: ColorWithSystemEffectMacOS(
          PlatformColor('systemBlueColor'),
          'none',
        ),
      },
      {
        label:
          "ColorWithSystemEffectMacOS(PlatformColor('systemBlueColor'), 'pressed')",
        color: ColorWithSystemEffectMacOS(
          PlatformColor('systemBlueColor'),
          'pressed',
        ),
      },
      {
        label:
          "ColorWithSystemEffectMacOS(PlatformColor('systemBlueColor'), 'deepPressed')",
        color: ColorWithSystemEffectMacOS(
          PlatformColor('systemBlueColor'),
          'deepPressed',
        ),
      },
      {
        label:
          "ColorWithSystemEffectMacOS(PlatformColor('systemBlueColor'), 'disabled')",
        color: ColorWithSystemEffectMacOS(
          PlatformColor('systemBlueColor'),
          'disabled',
        ),
      },
      {
        label:
          "ColorWithSystemEffectMacOS(PlatformColor('systemBlueColor'), 'rollover')",
        color: ColorWithSystemEffectMacOS(
          PlatformColor('systemBlueColor'),
          'rollover',
        ),
      },
      {
        label: "DynamicColorMacOS({light: 'red', dark: 'blue'})",
        color: DynamicColorMacOS({light: 'red', dark: 'blue'}),
      },
      {
        label:
          "ColorWithSystemEffectMacOS(DynamicColorMacOS({light: 'red', dark: 'blue'}), 'none')",
        color: ColorWithSystemEffectMacOS(
          DynamicColorMacOS({light: 'red', dark: 'blue'}),
          'none',
        ),
      },
      {
        label:
          "ColorWithSystemEffectMacOS(DynamicColorMacOS({light: 'red', dark: 'blue'}), 'pressed')",
        color: ColorWithSystemEffectMacOS(
          DynamicColorMacOS({light: 'red', dark: 'blue'}),
          'pressed',
        ),
      },
      {
        label:
          "ColorWithSystemEffectMacOS(DynamicColorMacOS({light: 'red', dark: 'blue'}), 'deepPressed')",
        color: ColorWithSystemEffectMacOS(
          DynamicColorMacOS({light: 'red', dark: 'blue'}),
          'deepPressed',
        ),
      },
      {
        label:
          "ColorWithSystemEffectMacOS(DynamicColorMacOS({light: 'red', dark: 'blue'}), 'disabled')",
        color: ColorWithSystemEffectMacOS(
          DynamicColorMacOS({light: 'red', dark: 'blue'}),
          'disabled',
        ),
      },
      {
        label:
          "ColorWithSystemEffectMacOS(DynamicColorMacOS({light: 'red', dark: 'blue'}), 'rollover')",
        color: ColorWithSystemEffectMacOS(
          DynamicColorMacOS({light: 'red', dark: 'blue'}),
          'rollover',
        ),
      },
    ];

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
  return Platform.OS === 'macos' ? (
    <View style={styles.column}>{createTable()}</View>
  ) : (
    <Text style={styles.labelCell}>Not applicable on this platform</Text>
  );
} // ]TODO(macOS GH#750)

const styles = StyleSheet.create({
  column: {flex: 1, flexDirection: 'column'},
  row: {flex: 0.75, flexDirection: 'row'},
  labelCell: {
    flex: 1,
    alignItems: 'stretch',
    // TODO(macOS GH#774)
    // Remove need to specify label color
  },
  colorCell: {flex: 0.25, alignItems: 'stretch'},
});

exports.title = 'PlatformColor';
exports.category = 'Basic';
exports.documentationURL = 'https://reactnative.dev/docs/platformcolor';
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
    title: 'Dynamic Colors', // TODO(OSS Candidate ISS#2710739)
    render(): React.Element<any> {
      return <DynamicColorsExample />;
    },
  },
  {
    title: 'Variant Colors',
    render(): React.Element<any> {
      return <VariantColorsExample />;
    },
  },
  // [TODO(macOS GH#750)
  {
    title: 'Color With System Effect macOS',
    render(): React.Element<any> {
      return <ColorWithSystemEffectMacOSExample />;
    },
  }, // ]TODO(macOS GH#750)
];
