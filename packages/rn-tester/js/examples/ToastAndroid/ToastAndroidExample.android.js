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

const {StyleSheet, Text, ToastAndroid, Pressable} = require('react-native');

const ToastWithShortDuration = () => {
  return (
    <TouchableWithoutFeedback
      onPress={() =>
        ToastAndroid.show('Copied to clipboard!', ToastAndroid.SHORT)
      }>
      <Text style={styles.text}>Tap to view toast</Text>
    </TouchableWithoutFeedback>
  );
};

const ToastWithLongDuration = () => {
  return (
    <TouchableWithoutFeedback
      onPress={() => ToastAndroid.show('Sending message..', ToastAndroid.LONG)}>
      <Text style={styles.text}>Tap to view toast</Text>
    </TouchableWithoutFeedback>
  );
};

const ToastWithTopGravity = () => {
  return (
    <TouchableWithoutFeedback
      onPress={() =>
        ToastAndroid.showWithGravity(
          'Download Started..',
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
        )
      }>
      <Text style={styles.text}>Tap to view toast</Text>
    </TouchableWithoutFeedback>
  );
};

const ToastWithCenterGravity = () => {
  return (
    <TouchableWithoutFeedback
      onPress={() =>
        ToastAndroid.showWithGravity(
          'A problem has been occured while submitting your data.',
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        )
      }>
      <Text style={styles.text}>Tap to view toast</Text>
    </TouchableWithoutFeedback>
  );
};

const ToastWithBottomGravity = () => {
  return (
    <TouchableWithoutFeedback
      onPress={() =>
        ToastAndroid.showWithGravity(
          'Please read the contents carefully.',
          ToastAndroid.SHORT,
          ToastAndroid.BOTTOM,
        )
      }>
      <Text style={styles.text}>Tap to view toast</Text>
    </TouchableWithoutFeedback>
  );
};

const ToastWithXOffset = () => {
  return (
    <TouchableWithoutFeedback
      onPress={() =>
        ToastAndroid.showWithGravityAndOffset(
          'Alex sent you a friend request',
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
          250,
          0,
        )
      }>
      <Text style={styles.text}>Tap to view toast</Text>
    </TouchableWithoutFeedback>
  );
};

const ToastWithYOffset = () => {
  return (
    <TouchableWithoutFeedback
      onPress={() =>
        ToastAndroid.showWithGravityAndOffset(
          'There was a problem with your internet connection',
          ToastAndroid.SHORT,
          ToastAndroid.BOTTOM,
          0,
          100,
        )
      }>
      <Text style={styles.text}>Tap to view toast</Text>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  text: {
    color: 'black',
  },
});

exports.title = 'Toast Example';
exports.category = 'Android';
exports.description =
  'Example that demonstrates the use of an Android Toast to provide feedback.';
exports.examples = [
  {
    title: 'Toast with Short Duration',
    render(): React.Node {
      return <ToastWithShortDuration />;
    },
  },
  {
    title: 'Toast with Long Duration',
    render(): React.Node {
      return <ToastWithLongDuration />;
    },
  },
  {
    title: 'Toast with Top Gravity',
    render(): React.Node {
      return <ToastWithTopGravity />;
    },
  },
  {
    title: 'Toast with Center Gravity',
    render(): React.Node {
      return <ToastWithCenterGravity />;
    },
  },
  {
    title: 'Toast with Bottom Gravity',
    render(): React.Node {
      return <ToastWithBottomGravity />;
    },
  },
  {
    title: 'Toast with X Offset',
    render(): React.Node {
      return <ToastWithXOffset />;
    },
  },
  {
    title: 'Toast with Y Offset',
    render(): React.Node {
      return <ToastWithYOffset />;
    },
  },
];
