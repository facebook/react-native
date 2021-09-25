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
const {Text, View, StyleSheet} = ReactNative;

class ViewFocusRingExample extends React.Component<{}> {
  render() {
    return (
      <View>
        {Platform.OS === 'macos' ? (
          <View>
            <View
              style={styles.keyView}
              focusable={true}
              enableFocusRing={true}>
              <Text>Enabled</Text>
            </View>
            <View
              style={styles.keyView}
              focusable={true}
              enableFocusRing={false}>
              <Text>Disabled</Text>
            </View>
            <View style={styles.keyView} focusable={true}>
              <Text>Default</Text>
            </View>
            <View style={styles.keyView} focusable={false}>
              <Text>Not focusable</Text>
            </View>
            <View
              style={styles.keyView}
              focusable={true}
              enableFocusRing={true}>
              <Text>Enabled</Text>
            </View>
          </View>
        ) : null}
      </View>
    );
  }
}

var styles = StyleSheet.create({
  keyView: {
    height: 20,
    width: 100,
    margin: 20,
  },
});

exports.title = 'Focus Ring';
exports.description = 'Examples of focus rings enabled and disabled.';
exports.examples = [
  {
    title: '<View> Example',
    render: function(): React.Element<any> {
      return <ViewFocusRingExample />;
    },
  },
];
