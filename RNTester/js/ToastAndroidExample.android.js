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
const {StyleSheet, Text, ToastAndroid, TouchableWithoutFeedback} = ReactNative;

const RNTesterBlock = require('RNTesterBlock');
const RNTesterPage = require('RNTesterPage');

type Props = $ReadOnly<{||}>;
class ToastExample extends React.Component<Props> {
  render() {
    return (
      <RNTesterPage title="ToastAndroid">
        <RNTesterBlock title="Simple toast">
          <TouchableWithoutFeedback
            onPress={() =>
              ToastAndroid.show(
                'This is a toast with short duration',
                ToastAndroid.SHORT,
              )
            }>
            <Text style={styles.text}>Click me.</Text>
          </TouchableWithoutFeedback>
        </RNTesterBlock>
        <RNTesterBlock title="Toast with long duration">
          <TouchableWithoutFeedback
            onPress={() =>
              ToastAndroid.show(
                'This is a toast with long duration',
                ToastAndroid.LONG,
              )
            }>
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

const styles = StyleSheet.create({
  text: {
    color: 'black',
  },
});

exports.title = 'Toast Example';
exports.description =
  'Example that demonstrates the use of an Android Toast to provide feedback.';
exports.examples = [
  {
    title: 'Basic toast',
    render: function(): React.Element<typeof ToastExample> {
      return <ToastExample />;
    },
  },
];
