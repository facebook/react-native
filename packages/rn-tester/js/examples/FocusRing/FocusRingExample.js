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
const {Text, View, Button, TextInput, StyleSheet} = ReactNative;

class ViewFocusRingExample extends React.Component {
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

class ButtonFocusRingExample extends React.Component {
  render() {
    return (
      <View>
        {Platform.OS === 'macos' ? (
          <View>
            <Button
              title={'Focus ring enabled'}
              onPress={() => {}}
              enableFocusRing={true}
            />
            <Button
              title={'Focus ring disabled'}
              onPress={() => {}}
              enableFocusRing={false}
            />
            <Button title={'Default'} onPress={() => {}} />
            <Button title={'Control disabled'} onPress={() => {}} disabled />
            <Button
              title={'Focus ring enabled'}
              onPress={() => {}}
              enableFocusRing={true}
            />
          </View>
        ) : null}
      </View>
    );
  }
}

class TextInputFocusRingExample extends React.Component {
  render() {
    return (
      <View>
        {Platform.OS === 'macos' ? (
          <View>
            <TextInput
              placeholder={'Focus ring enabled'}
              enableFocusRing={true}
              style={styles.textInput}
            />
            <TextInput
              placeholder={'Focus ring disabled'}
              enableFocusRing={false}
              style={styles.textInput}
            />
            <TextInput placeholder={'Default'} style={styles.textInput} />
            <TextInput
              placeholder={'Control disabled'}
              style={styles.textInput}
            />
            <TextInput
              placeholder={'Focus ring enabled'}
              enableFocusRing={true}
              style={styles.textInput}
            />
          </View>
        ) : null}
      </View>
    );
  }
}

var styles = StyleSheet.create({
  textInput: {
    ...Platform.select({
      macos: {
        color: {semantic: 'textColor'},
        backgroundColor: {semantic: 'textBackgroundColor'},
        borderColor: {semantic: 'gridColor'},
      },
      default: {
        borderColor: '#0f0f0f',
      },
    }),
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    fontSize: 13,
    padding: 4,
  },
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
    render: function() {
      return <ViewFocusRingExample />;
    },
  },
  {
    title: '<Button> Example',
    render: function() {
      return <ButtonFocusRingExample />;
    },
  },
  {
    title: '<TextInput> Example',
    render: function() {
      return <TextInputFocusRingExample />;
    },
  },
];
