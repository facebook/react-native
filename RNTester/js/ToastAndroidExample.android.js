/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule ToastAndroidExample
 */

'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableWithoutFeedback,
} = ReactNative;

var RNTesterBlock = require('RNTesterBlock');
var RNTesterPage = require('RNTesterPage');

class ToastExample extends React.Component<{}, $FlowFixMeState> {
  static title = 'Toast Example';
  static description = 'Example that demonstrates the use of an Android Toast to provide feedback.';
  state = {};

  render() {
    return (
      <RNTesterPage title="ToastAndroid">
        <RNTesterBlock title="Simple toast">
          <TouchableWithoutFeedback
            onPress={() =>
              ToastAndroid.show('This is a toast with short duration', ToastAndroid.SHORT)}>
            <Text style={styles.text}>Click me.</Text>
          </TouchableWithoutFeedback>
        </RNTesterBlock>
        <RNTesterBlock title="Toast with long duration">
          <TouchableWithoutFeedback
            onPress={() =>
              ToastAndroid.show('This is a toast with long duration', ToastAndroid.LONG)}>
            <Text style={styles.text}>Click me.</Text>
          </TouchableWithoutFeedback>
        </RNTesterBlock>
        <RNTesterBlock title="Toast with top gravity">
          <TouchableWithoutFeedback
            onPress={() =>
              ToastAndroid.showWithGravity(
                'This is a toast with top gravity',
                ToastAndroid.SHORT,
                ToastAndroid.TOP,
              )
            }>
            <Text style={styles.text}>Click me.</Text>
          </TouchableWithoutFeedback>
        </RNTesterBlock>
        <RNTesterBlock title="Toast with center gravity">
          <TouchableWithoutFeedback
            onPress={() =>
              ToastAndroid.showWithGravity(
                'This is a toast with center gravity',
                ToastAndroid.SHORT,
                ToastAndroid.CENTER,
              )
            }>
            <Text style={styles.text}>Click me.</Text>
          </TouchableWithoutFeedback>
        </RNTesterBlock>
        <RNTesterBlock title="Toast with bottom gravity">
          <TouchableWithoutFeedback
            onPress={() =>
              ToastAndroid.showWithGravity(
                'This is a toast with bottom gravity',
                ToastAndroid.SHORT,
                ToastAndroid.BOTTOM,
              )
            }>
            <Text style={styles.text}>Click me.</Text>
          </TouchableWithoutFeedback>
        </RNTesterBlock>
        <RNTesterBlock title="Toast with x offset">
          <TouchableWithoutFeedback
            onPress={() =>
              ToastAndroid.showWithGravityAndOffset(
                'This is a toast with x offset',
                ToastAndroid.SHORT,
                ToastAndroid.CENTER,
                50,
                0,
              )
            }>
            <Text style={styles.text}>Click me.</Text>
          </TouchableWithoutFeedback>
        </RNTesterBlock>
        <RNTesterBlock title="Toast with y offset">
          <TouchableWithoutFeedback
            onPress={() =>
              ToastAndroid.showWithGravityAndOffset(
                'This is a toast with y offset',
                ToastAndroid.SHORT,
                ToastAndroid.BOTTOM,
                0,
                50,
              )
            }>
            <Text style={styles.text}>Click me.</Text>
          </TouchableWithoutFeedback>
        </RNTesterBlock>
      </RNTesterPage>
    );
  }
}

var styles = StyleSheet.create({
  text: {
    color: 'black',
  },
});

module.exports = ToastExample;
