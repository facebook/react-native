/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const React = require('react');
const {
  Button,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  ToastAndroid,
  View,
} = require('react-native');

const RNTesterBlock = require('../../components/RNTesterBlock');

type Props = $ReadOnly<{|
  url?: ?string,
|}>;

class OpenURLButton extends React.Component<Props> {
  handleClick = () => {
    Linking.canOpenURL(this.props.url).then(supported => {
      if (supported) {
        Linking.openURL(this.props.url);
      } else {
        console.log(
          `Don't know how to open URI: ${
            this.props.url
          }, ensure you have an app installed that handles the "${
            this.props.url.split(':')?.[0]
          }" scheme`,
        );
      }
    });
  };

  render() {
    return (
      <TouchableOpacity onPress={this.handleClick}>
        <View style={styles.button}>
          <Text style={styles.text}>Open {this.props.url}</Text>
        </View>
      </TouchableOpacity>
    );
  }
}

class OpenSettingsExample extends React.Component<Props, any> {
  openSettings() {
    Linking.openSettings();
  }

  render() {
    return <Button onPress={this.openSettings} title={'Open Settings'} />;
  }
}

class SendIntentButton extends React.Component<Props> {
  handleIntent = async () => {
    try {
      await Linking.sendIntent(this.props.action, this.props.extras);
    } catch (e) {
      ToastAndroid.show(e.message, ToastAndroid.LONG);
    }
  };

  render() {
    return (
      <TouchableOpacity onPress={this.handleIntent}>
        <View style={[styles.button, styles.buttonIntent]}>
          <Text style={styles.text}>{this.props.action}</Text>
        </View>
      </TouchableOpacity>
    );
  }
}

class IntentAndroidExample extends React.Component {
  render() {
    return (
      <View>
        <View>
          <OpenURLButton url={'https://www.facebook.com'} />
          <OpenURLButton url={'http://www.facebook.com'} />
          <OpenURLButton url={'http://facebook.com'} />
          <OpenURLButton url={'fb://notifications'} />
          <OpenURLButton url={'geo:37.484847,-122.148386'} />
          <OpenURLButton url={'tel:9876543210'} />
        </View>
        {Platform.OS === 'android' && (
          <RNTesterBlock title="Send intents">
            <SendIntentButton action="android.intent.action.POWER_USAGE_SUMMARY" />
            <Text style={styles.textSeparator}>
              Next one will crash if Facebook app is not installed.
            </Text>
            <SendIntentButton
              action="android.settings.APP_NOTIFICATION_SETTINGS"
              extras={[
                {'android.provider.extra.APP_PACKAGE': 'com.facebook.katana'},
              ]}
            />
          </RNTesterBlock>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    padding: 10,
    backgroundColor: '#3B5998',
    marginBottom: 10,
  },
  buttonIntent: {
    backgroundColor: '#009688',
  },
  text: {
    color: 'white',
  },
  textSeparator: {
    paddingBottom: 8,
  },
});

exports.title = 'Linking';
exports.category = 'Basic';
exports.documentationURL = 'https://reactnative.dev/docs/linking';
exports.description = 'Shows how to use Linking to open URLs.';
exports.examples = [
  {
    title: 'Open external URLs',
    description:
      'Custom schemes may require specific apps to be installed on the device. Note: Phone app is not supported in the simulator.',
    render: function (): React.Element<typeof IntentAndroidExample> {
      return <IntentAndroidExample />;
    },
  },
  {
    title: 'Open settings app',
    render: function (): React.Element<typeof LinkingChangesListenerExample> {
      return <OpenSettingsExample />;
    },
  },
];
