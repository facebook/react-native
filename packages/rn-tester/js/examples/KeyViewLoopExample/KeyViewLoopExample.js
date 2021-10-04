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
const {Text, View, Button, TextInput, StyleSheet, findNodeHandle} = ReactNative;

class KeyViewLoopExample extends React.Component<{}> {
  firstViewRef = React.createRef();
  secondViewRef = React.createRef();
  thirdViewRef = React.createRef();
  fourthViewRef = React.createRef();

  render() {
    return (
      <View>
        <Text>
          Key-view loops allow custom control of keyboard accessibility to
          navigate between controls.
        </Text>
        <View>
          {Platform.OS === 'macos' ? (
            <View>
              <View
                style={styles.keyView}
                focusable={true}
                ref={this.firstViewRef}
                onFocus={() => {
                  this.firstViewRef.current?.setNativeProps({
                    nextKeyViewTag: findNodeHandle(this.secondViewRef.current),
                  });
                }}>
                <Text>First View</Text>
              </View>
              <View
                style={styles.keyView}
                focusable={true}
                ref={this.thirdViewRef}
                onFocus={() => {
                  this.thirdViewRef.current?.setNativeProps({
                    nextKeyViewTag: findNodeHandle(this.fourthViewRef.current),
                  });
                }}>
                <Text>Third View</Text>
              </View>
              <View
                style={styles.keyView}
                focusable={true}
                ref={this.secondViewRef}
                onFocus={() => {
                  this.secondViewRef.current?.setNativeProps({
                    nextKeyViewTag: findNodeHandle(this.thirdViewRef.current),
                  });
                }}>
                <Text>Second View</Text>
              </View>
              <Button
                title={'Button cannot set nextKeyViewTag'}
                ref={this.fourthViewRef}
                onPress={() => {}}
              />
            </View>
          ) : null}
        </View>
      </View>
    );
  }
}
class FocusTrapExample extends React.Component<{}> {
  trapZoneBeginRef = React.createRef();
  trapZoneEndRef = React.createRef();
  render() {
    return (
      <View>
        <Text>Focus trap example.</Text>
        <TextInput placeholder={'Focusable 1'} style={styles.textInput} />
        <TextInput placeholder={'Focusable 2'} style={styles.textInput} />
        <TextInput placeholder={'Focusable 3'} style={styles.textInput} />
        <Text>Begin focus trap:</Text>
        <TextInput
          ref={this.trapZoneBeginRef}
          placeholder={'Focusable 4'}
          style={styles.textInput}
        />
        <TextInput placeholder={'Focusable 5'} style={styles.textInput} />
        <TextInput
          ref={this.trapZoneEndRef}
          onFocus={() => {
            this.trapZoneEndRef.current?.setNativeProps({
              nextKeyViewTag: findNodeHandle(this.trapZoneBeginRef.current),
            });
          }}
          placeholder={'Focusable 6'}
          style={styles.textInput}
        />
        <Text>End focus trap:</Text>
        <TextInput placeholder={'Focusable 7'} style={styles.textInput} />
        <TextInput placeholder={'Focusable 8'} style={styles.textInput} />
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

exports.title = 'Key View Loop';
exports.description = 'Examples that show how key-view loops can be used.';
exports.examples = [
  {
    title: 'Key View Loop Example',
    render: function(): React.Element<any> {
      return <KeyViewLoopExample />;
    },
  },
  {
    title: 'Focus Trap Example',
    render: function(): React.Element<any> {
      return <FocusTrapExample />;
    },
  },
];
