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
const {
  Alert,
  DeviceEventEmitter,
  PushNotificationIOS,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} = require('react-native');

class Button extends React.Component<$FlowFixMeProps> {
  render() {
    return (
      <TouchableHighlight
        underlayColor={'white'}
        style={styles.button}
        onPress={this.props.onPress}>
        <Text style={styles.buttonLabel}>{this.props.label}</Text>
      </TouchableHighlight>
    );
  }
}

class NotificationExample extends React.Component<{...}> {
  UNSAFE_componentWillMount() {
    PushNotificationIOS.addEventListener('register', this._onRegistered);
    PushNotificationIOS.addEventListener(
      'registrationError',
      this._onRegistrationError,
    );
    PushNotificationIOS.addEventListener(
      'notification',
      this._onRemoteNotification,
    );
    PushNotificationIOS.addEventListener(
      'localNotification',
      this._onLocalNotification,
    );
  }

  componentWillUnmount() {
    PushNotificationIOS.removeEventListener('register', this._onRegistered);
    PushNotificationIOS.removeEventListener(
      'registrationError',
      this._onRegistrationError,
    );
    PushNotificationIOS.removeEventListener(
      'notification',
      this._onRemoteNotification,
    );
    PushNotificationIOS.removeEventListener(
      'localNotification',
      this._onLocalNotification,
    );
  }

  render() {
    return (
      <View>
        <Button
          onPress={this._sendNotification}
          label="Send fake notification"
        />

        <Button
          onPress={this._sendLocalNotification}
          label="Send fake local notification"
        />
      </View>
    );
  }

  _sendNotification() {
    DeviceEventEmitter.emit('remoteNotificationReceived', {
      remote: true,
      aps: {
        alert: 'Sample notification',
        badge: '+1',
        sound: 'default',
        category: 'REACT_NATIVE',
        'content-available': 1,
      },
    });
  }

  _sendLocalNotification() {
    DeviceEventEmitter.emit('localNotificationReceived', {
      aps: {
        alert: 'Sample local notification',
        badge: '+1',
        sound: 'default',
        category: 'REACT_NATIVE',
      },
    });
  }

  _onRegistered(deviceToken) {
    Alert.alert('Registered For Remote Push', `Device Token: ${deviceToken}`, [
      {
        text: 'Dismiss',
        onPress: null,
      },
    ]);
  }

  _onRegistrationError(error) {
    Alert.alert(
      'Failed To Register For Remote Push',
      `Error (${error.code}): ${error.message}`,
      [
        {
          text: 'Dismiss',
          onPress: null,
        },
      ],
    );
  }

  _onRemoteNotification(notification) {
    const result = `Message: ${notification.getMessage()};\n
      badge: ${notification.getBadgeCount()};\n
      sound: ${notification.getSound()};\n
      category: ${notification.getCategory()};\n
      content-available: ${notification.getContentAvailable()}.`;

    Alert.alert('Push Notification Received', result, [
      {
        text: 'Dismiss',
        onPress: null,
      },
    ]);
  }

  _onLocalNotification(notification) {
    Alert.alert(
      'Local Notification Received',
      'Alert message: ' + notification.getMessage(),
      [
        {
          text: 'Dismiss',
          onPress: null,
        },
      ],
    );
  }
}

class NotificationPermissionExample extends React.Component<
  $FlowFixMeProps,
  any,
> {
  constructor(props) {
    super(props);
    this.state = {permissions: null};
  }

  render() {
    return (
      <View>
        <Button
          onPress={this._requestPermissions}
          label="Request Notifications (Should Display Alert)"
        />
        <Button onPress={this._checkPermissions} label="Check permissions" />
        <Text style={{textAlign: 'center'}}>
          {JSON.stringify(this.state.permissions)}
        </Text>
      </View>
    );
  }

  _requestPermissions = () => {
    PushNotificationIOS.requestPermissions().then(
      onFulfill => {
        this._showAlert(
          'Successfully requested permissions -- ' +
            'Alert: ' +
            onFulfill.alert.toString() +
            ', Badge: ' +
            onFulfill.badge.toString() +
            ', Sound: ' +
            onFulfill.sound.toString(),
        );
        this._checkPermissions();
      },
      () => {
        this._showAlert('Error requesting permissions');
        this._checkPermissions();
      },
    );
  };

  _checkPermissions = () => {
    PushNotificationIOS.checkPermissions(permissions => {
      this.setState({permissions});
    });
  };

  _showAlert(text) {
    Alert.alert('Notification Permission', text, [
      {
        text: 'Dismiss',
        onPress: null,
      },
    ]);
  }
}

const styles = StyleSheet.create({
  button: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    color: 'blue',
  },
});

exports.title = 'PushNotificationIOS';
exports.description = 'Apple PushNotification and badge value';
exports.examples = [
  {
    title: 'Notifications Permissions',
    render(): React.Element<any> {
      return <NotificationPermissionExample />;
    },
  },
  {
    title: 'Push Notifications',
    render(): React.Element<any> {
      return <NotificationExample />;
    },
  },
  {
    title: 'Badge Number',
    render(): React.Element<any> {
      return (
        <View>
          <Button
            onPress={() =>
              PushNotificationIOS.setApplicationIconBadgeNumber(42)
            }
            label="Set app's icon badge to 42"
          />
          <Button
            onPress={() => PushNotificationIOS.setApplicationIconBadgeNumber(0)}
            label="Clear app's icon badge"
          />
        </View>
      );
    },
  },
];
