/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import React, {useState} from 'react';
import {Alert, StyleSheet, Text, TouchableHighlight, View} from 'react-native';

// Shows log on the screen
const Log = ({message}) =>
  message ? (
    <View style={styles.logContainer}>
      <Text>
        <Text style={styles.bold}>Log</Text>: {message}
      </Text>
    </View>
  ) : null;

/**
 * Simple alert examples.
 */

const AlertWithDefaultButton = () => {
  const alertMessage = 'An external USB drive has been detected!';

  return (
    <View>
      <TouchableHighlight
        testID="alert-with-default-button"
        style={styles.wrapper}
        onPress={() => Alert.alert('Alert', alertMessage)}>
        <View style={styles.button}>
          <Text>Tap to view alert</Text>
        </View>
      </TouchableHighlight>
    </View>
  );
};

const AlertWithTwoButtons = () => {
  const [message, setMessage] = useState('');

  const alertMessage = 'Your subscription has expired!';

  return (
    <View>
      <TouchableHighlight
        style={styles.wrapper}
        onPress={() =>
          Alert.alert('Action Required!', alertMessage, [
            {text: 'Ignore', onPress: () => setMessage('Ignore Pressed!')},
            {text: 'Renew', onPress: () => setMessage('Renew Pressed!')},
          ])
        }>
        <View style={styles.button}>
          <Text>Tap to view alert</Text>
        </View>
      </TouchableHighlight>
      <Log message={message} />
    </View>
  );
};

const AlertWithThreeButtons = () => {
  const [message, setMessage] = useState('');

  const alertMessage = 'Do you want to save your changes?';

  return (
    <View>
      <TouchableHighlight
        testID="alert-with-three-buttons"
        style={styles.wrapper}
        onPress={() =>
          Alert.alert('Unsaved Changes!', alertMessage, [
            {text: 'Cancel', onPress: () => setMessage('Cancel Pressed!')},
            {text: 'No', onPress: () => setMessage('No Pressed!')},
            {text: 'Yes', onPress: () => setMessage('Yes Pressed!')},
          ])
        }>
        <View style={styles.button}>
          <Text>Tap to view alert</Text>
        </View>
      </TouchableHighlight>
      <Log message={message} />
    </View>
  );
};

const AlertWithManyButtons = () => {
  const [message, setMessage] = useState('');

  const alertMessage =
    'Credibly reintermediate next-generation potentialities after goal-oriented ' +
    'catalysts for change. Dynamically revolutionize.';

  return (
    <View>
      <TouchableHighlight
        style={styles.wrapper}
        onPress={() =>
          Alert.alert(
            'Foo Title',
            alertMessage,
            '..............'.split('').map((dot, index) => ({
              text: 'Button ' + index,
              onPress: () => setMessage(`Button ${index} Pressed!`),
            })),
          )
        }>
        <View style={styles.button}>
          <Text>Tap to view alert</Text>
        </View>
      </TouchableHighlight>
      <Log message={message} />
    </View>
  );
};

const AlertWithCancelableTrue = () => {
  const [message, setMessage] = useState('');

  const alertMessage = 'Tapping outside this dialog will dismiss this alert.';

  return (
    <View>
      <TouchableHighlight
        style={styles.wrapper}
        onPress={() =>
          Alert.alert(
            'Alert Title',
            alertMessage,
            [{text: 'OK', onPress: () => setMessage('OK Pressed!')}],
            {
              cancelable: true,
              onDismiss: () =>
                setMessage(
                  'This alert was dismissed by tapping outside of the alert dialog.',
                ),
            },
          )
        }>
        <View style={styles.button}>
          <Text>Tap to view alert</Text>
        </View>
      </TouchableHighlight>
      <Log message={message} />
    </View>
  );
};

const AlertWithStyles = () => {
  const [message, setMessage] = useState('');

  const alertMessage = 'Look at the button styles!';

  return (
    <View>
      <TouchableHighlight
        style={styles.wrapper}
        onPress={() =>
          Alert.alert('Styled Buttons!', alertMessage, [
            {
              text: 'Default',
              onPress: () => setMessage('Default Pressed!'),
              style: 'default',
            },
            {
              text: 'Cancel',
              onPress: () => setMessage('Cancel Pressed!'),
              style: 'cancel',
            },
            {
              text: 'Destructive',
              onPress: () => setMessage('Destructive Pressed!'),
              style: 'destructive',
            },
          ])
        }>
        <View style={styles.button}>
          <Text>Tap to view alert</Text>
        </View>
      </TouchableHighlight>
      <Log message={message} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 5,
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#eeeeee',
    padding: 10,
  },
  logContainer: {
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  bold: {
    fontWeight: 'bold',
  },
});

exports.title = 'Alerts';
exports.description =
  'Alerts display a concise and informative message ' +
  'and prompt the user to make a decision.';
exports.documentationURL = 'https://reactnative.dev/docs/alert';
exports.examples = [
  {
    title: 'Alert with default Button',
    description:
      "It can be used to show some information to user that doesn't require an action.",
    render(): React.Node {
      return <AlertWithDefaultButton />;
    },
  },
  {
    title: 'Alert with two Buttons',
    description: 'It can be used when an action is required from the user.',
    render(): React.Node {
      return <AlertWithTwoButtons />;
    },
  },
  {
    title: 'Alert with three Buttons',
    description: 'It can be used when there are three possible actions',
    render(): React.Node {
      return <AlertWithThreeButtons />;
    },
  },
  {
    title: 'Alert with many Buttons',
    platform: 'ios',
    description: 'It can be used when more than three actions are required.',
    render(): React.Node {
      return <AlertWithManyButtons />;
    },
  },
  {
    title: 'Alert with cancelable={true}',
    platform: 'android',
    description:
      'By passing cancelable={false} prop to alerts on Android, they can be dismissed by tapping outside of the alert box.',
    render(): React.Node {
      return <AlertWithCancelableTrue />;
    },
  },
  {
    title: 'Alert with styles',
    platform: 'ios',
    description:
      "Alert buttons can be styled. There are three button styles - 'default' | 'cancel' | 'destructive'.",
    render(): React.Node {
      return <AlertWithStyles />;
    },
  },
];
