/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  ActionSheetIOS,
  StyleSheet,
  Text,
  View,
} = ReactNative;

var BUTTONS = [
  'Option 0',
  'Option 1',
  'Option 2',
  'Delete',
  'Cancel',
];
var DESTRUCTIVE_INDEX = 3;
var CANCEL_INDEX = 4;

class ActionSheetExample extends React.Component<{}, $FlowFixMeState> {
  state = {
    clicked: 'none',
  };

  render() {
    return (
      <View>
        <Text onPress={this.showActionSheet} style={style.button}>
          Click to show the ActionSheet
        </Text>
        <Text>
          Clicked button: {this.state.clicked}
        </Text>
      </View>
    );
  }

  showActionSheet = () => {
    ActionSheetIOS.showActionSheetWithOptions({
      options: BUTTONS,
      cancelButtonIndex: CANCEL_INDEX,
      destructiveButtonIndex: DESTRUCTIVE_INDEX,
    },
    (buttonIndex) => {
      this.setState({ clicked: BUTTONS[buttonIndex] });
    });
  };
}

class ShareActionSheetExample extends React.Component<$FlowFixMeProps, $FlowFixMeState> {
  state = {
    text: '',
  };

  render() {
    return (
      <View>
        <Text onPress={this.showShareActionSheet} style={style.button}>
          Click to show the Share ActionSheet
        </Text>
        <Text>
          {this.state.text}
        </Text>
      </View>
    );
  }

  showShareActionSheet = () => {
    ActionSheetIOS.showShareActionSheetWithOptions({
      url: this.props.url,
      message: 'message to go with the shared url',
      subject: 'a subject to go in the email heading',
      excludedActivityTypes: [
        'com.apple.share.Twitter.post',
      ],
    },
    (error) => alert(error),
    (completed, method) => {
      var text;
      if (completed) {
        text = `Shared via ${method}`;
      } else {
        text = 'You didn\'t share';
      }
      this.setState({text});
    });
  };
}

var style = StyleSheet.create({
  button: {
    marginBottom: 10,
    fontWeight: '500',
  },
});

exports.title = 'ActionSheetIOS';
exports.description = 'Interface to show iOS\' action sheets';
exports.examples = [
  {
    title: 'Show Action Sheet',
    render(): React.Element<any> { return <ActionSheetExample />; },
  },
  {
    title: 'Show Share Action Sheet',
    render(): React.Element<any> {
      return <ShareActionSheetExample url="https://code.facebook.com" />;
    },
  },
  {
    title: 'Share Local Image',
    render(): React.Element<any> {
      return <ShareActionSheetExample url="bunny.png" />;
    },
  },
];
