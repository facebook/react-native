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

import type {RNTesterModule} from '../../types/RNTesterTypes';
import * as React from 'react';

import {
  StyleSheet,
  View,
  PlatformColor,
  Platform,
  DynamicColorIOS,
} from 'react-native';

const styles = StyleSheet.create({
  box: {
    width: 100,
    height: 100,
  },
  wrapper: {
    flexDirection: 'row',
  },
  border1: {
    borderWidth: 10,
    borderColor: 'brown',
    borderStyle: 'dotted',
  },
  borderRadius: {
    borderWidth: 10,
    borderRadius: 10,
    borderColor: 'cyan',
  },
  border2: {
    borderWidth: 10,
    borderTopColor: 'red',
    borderRightColor: 'yellow',
    borderBottomColor: 'green',
    borderLeftColor: 'blue',
  },
  border3: {
    borderColor: 'purple',
    borderTopWidth: 7,
    borderRightWidth: 20,
    borderBottomWidth: 10,
    borderLeftWidth: 5,
  },
  border4: {
    borderTopWidth: 10,
    borderTopColor: 'red',
    borderRightWidth: 20,
    borderRightColor: 'yellow',
    borderBottomWidth: 30,
    borderBottomColor: 'green',
    borderLeftWidth: 40,
    borderLeftColor: 'blue',
  },
  border5: {
    borderRadius: 50,
    borderTopWidth: 10,
    borderTopColor: 'red',
    borderRightWidth: 20,
    borderRightColor: 'yellow',
    borderBottomWidth: 30,
    borderBottomColor: 'green',
    borderLeftWidth: 40,
    borderLeftColor: 'blue',
  },
  border6: {
    borderTopWidth: 10,
    borderTopColor: 'red',
    borderRightWidth: 20,
    borderRightColor: 'yellow',
    borderBottomWidth: 30,
    borderBottomColor: 'green',
    borderLeftWidth: 40,
    borderLeftColor: 'blue',

    borderTopLeftRadius: 100,
  },
  border7: {
    borderWidth: 10,
    borderColor: '#f007',
    borderRadius: 30,
    overflow: 'hidden',
  },
  border7_inner: {
    backgroundColor: 'blue',
    width: 100,
    height: 100,
  },
  border8: {
    width: 60,
    height: 60,
    borderColor: 'black',
    marginRight: 10,
    backgroundColor: 'lightgrey',
  },
  border8Top: {
    borderTopWidth: 5,
  },
  border8Left: {
    borderLeftWidth: 5,
    borderStyle: 'dotted',
  },
  border8Bottom: {
    borderBottomWidth: 5,
  },
  border8Right: {
    borderRightWidth: 5,
    borderStyle: 'dashed',
  },
  border9: {
    borderWidth: 10,
    borderTopLeftRadius: 10,
    borderBottomRightRadius: 20,
    borderColor: 'black',
  },
  border10: {
    borderWidth: 10,
    backgroundColor: 'white',
    borderTopLeftRadius: 10,
    borderBottomRightRadius: 20,
    borderColor: 'black',
    elevation: 10,
  },
  border11: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    overflow: 'hidden',
    borderTopWidth: 50,
    borderRightWidth: 0,
    borderBottomWidth: 50,
    borderLeftWidth: 100,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'red',
  },
  border12: {
    borderStyle: 'solid',
    overflow: 'hidden',
    borderTopWidth: 10,
    borderRightWidth: 20,
    borderBottomWidth: 30,
    borderLeftWidth: 40,
    borderRadius: 20,
  },
  border13: {
    borderStyle: 'solid',
    overflow: 'hidden',
    borderTopWidth: 10,
    borderRightWidth: 20,
    borderBottomWidth: 30,
    borderLeftWidth: 40,
    borderTopColor: 'red',
    borderRightColor: 'green',
    borderBottomColor: 'blue',
    borderLeftColor: 'magenta',
    borderRadius: 20,
  },
  border14: {
    borderStyle: 'solid',
    overflow: 'hidden',
    borderTopWidth: 10,
    borderRightWidth: 20,
    borderBottomWidth: 30,
    borderLeftWidth: 40,
    borderTopColor: 'red',
    borderRightColor: 'green',
    borderBottomColor: 'blue',
    borderLeftColor: 'magenta',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 40,
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 40,
  },
  border15: {
    borderWidth: 10,
    borderColor: Platform.select({
      ios: PlatformColor('systemGray4'),
      android: PlatformColor('@android:color/holo_orange_dark'),
      windows: PlatformColor('SystemAccentColorDark1'),
      default: 'black',
    }),
  },
  border16: {
    borderWidth: 10,
    borderColor:
      Platform.OS === 'ios'
        ? DynamicColorIOS({light: 'magenta', dark: 'cyan'})
        : 'black',
  },
});

export default ({
  title: 'Border',
  category: 'UI',
  description: 'Demonstrates some of the border styles available to Views.',
  examples: [
    {
      title: 'Equal-Width / Same-Color',
      name: 'equal-width-same-color',
      description: 'borderWidth & borderColor',
      render: function ({testID}): React.Node {
        return <View testID={testID} style={[styles.box, styles.border1]} />;
      },
    },
    {
      title: 'Equal-Width / Same-Color',
      name: 'equal-width-same-color-border-radius',
      description: 'borderWidth & borderColor & borderRadius',
      render: function ({testID}): React.Node {
        return (
          <View testID={testID} style={[styles.box, styles.borderRadius]} />
        );
      },
    },
    {
      title: 'Equal-Width Borders',
      name: 'equal-width-borders',
      description: 'borderWidth & border*Color',
      render: function ({testID}): React.Node {
        return <View testID={testID} style={[styles.box, styles.border2]} />;
      },
    },
    {
      title: 'Same-Color Borders',
      name: 'same-color-borders',
      description: 'border*Width & borderColor',
      render: function ({testID}): React.Node {
        return <View testID={testID} style={[styles.box, styles.border3]} />;
      },
    },
    {
      title: 'Custom Borders',
      name: 'custom-borders',
      description: 'border*Width & border*Color',
      render: function ({testID}): React.Node {
        return <View testID={testID} style={[styles.box, styles.border4]} />;
      },
    },
    {
      title: 'Custom Borders',
      name: 'custom-borders-ios-1',
      description: 'border*Width & border*Color',
      platform: 'ios',
      render: function ({testID}): React.Node {
        return <View testID={testID} style={[styles.box, styles.border5]} />;
      },
    },
    {
      title: 'Custom Borders',
      name: 'custom-borders-ios-2',
      description: 'border*Width & border*Color',
      platform: 'ios',
      render: function ({testID}): React.Node {
        return <View testID={testID} style={[styles.box, styles.border6]} />;
      },
    },
    {
      title: 'Custom Borders',
      name: 'custom-borders-ios-clipping',
      description: 'borderRadius & clipping',
      platform: 'ios',
      render: function ({testID}): React.Node {
        return (
          <View testID={testID} style={[styles.box, styles.border7]}>
            <View style={styles.border7_inner} />
          </View>
        );
      },
    },
    {
      title: 'Single Borders',
      name: 'single-borders',
      description: 'top, left, bottom right',
      render: function ({testID}): React.Node {
        return (
          <View testID={testID} style={styles.wrapper}>
            <View style={[styles.box, styles.border8, styles.border8Top]} />
            <View style={[styles.box, styles.border8, styles.border8Left]} />
            <View style={[styles.box, styles.border8, styles.border8Bottom]} />
            <View style={[styles.box, styles.border8, styles.border8Right]} />
          </View>
        );
      },
    },
    {
      title: 'Corner Radii',
      name: 'corner-radii',
      description: 'borderTopLeftRadius & borderBottomRightRadius',
      render: function ({testID}): React.Node {
        return <View testID={testID} style={[styles.box, styles.border9]} />;
      },
    },
    {
      title: 'Corner Radii / Elevation',
      name: 'corner-radii-elevation',
      description: 'borderTopLeftRadius & borderBottomRightRadius & elevation',
      platform: 'android',
      render: function ({testID}): React.Node {
        return <View testID={testID} style={[styles.box, styles.border10]} />;
      },
    },
    {
      title: 'CSS Trick - Triangle',
      name: 'css-trick-triangle',
      description: 'create a triangle by manipulating border colors and widths',
      render: function ({testID}): React.Node {
        return <View testID={testID} style={[styles.border11]} />;
      },
    },
    {
      title: 'Curved border(Left|Right|Bottom|Top)Width',
      name: 'curved-border-lrbt-width',
      description: 'Make a non-uniform width curved border',
      render: function ({testID}): React.Node {
        return <View testID={testID} style={[styles.box, styles.border12]} />;
      },
    },
    {
      title: 'Curved border(Left|Right|Bottom|Top)Color',
      name: 'curved-border-lrbt-color',
      description: 'Make a non-uniform color curved border',
      render: function ({testID}): React.Node {
        return <View testID={testID} style={[styles.box, styles.border13]} />;
      },
    },
    {
      title: 'Curved border(Top|Bottom)(Left|Right)Radius',
      name: 'curved-border-tb-lr-radius',
      description: 'Make a non-uniform radius curved border',
      render: function ({testID}): React.Node {
        return <View testID={testID} style={[styles.box, styles.border14]} />;
      },
    },
    {
      title: 'System color',
      name: 'system-color',
      description: 'Using a platform color',
      render: function ({testID}): React.Node {
        return <View testID={testID} style={[styles.box, styles.border15]} />;
      },
    },
    {
      title: 'Dynamic color',
      name: 'dynamic-color-ios',
      description: 'Using a custom dynamic color',
      platform: 'ios',
      render: function ({testID}): React.Node {
        return <View testID={testID} style={[styles.box, styles.border16]} />;
      },
    },
  ],
}: RNTesterModule);
