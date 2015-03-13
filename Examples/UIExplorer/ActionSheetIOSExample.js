/**
*  * Copyright 2004-present Facebook. All Rights Reserved.
*   */
'use strict';

var React = require('react-native');
var {
  StyleSheet,
  Text,
  View,
} = React;
var ActionSheetIOS = require('ActionSheetIOS');
var BUTTONS = [
  'Button Index: 0',
  'Button Index: 1',
  'Button Index: 2',
  'Destruct',
  'Cancel',
];
var DESTRUCTIVE_INDEX = 3;
var CANCEL_INDEX = 4;

var ActionSheetExample = React.createClass({
  getInitialState() {
    return {
      clicked: 'none',
    };
  },

  render() {
    return (
      <View>
        <Text onPress={this.showActionSheet} style={style.button}>
          Click to show the ActionSheet
        </Text>
        <Text>
          Clicked button at index: "{this.state.clicked}"
        </Text>
      </View>
    );
  },

  showActionSheet() {
    ActionSheetIOS.showActionSheetWithOptions({
      options: BUTTONS,
      cancelButtonIndex: CANCEL_INDEX,
      destructiveButtonIndex: DESTRUCTIVE_INDEX,
    },
    (buttonIndex) => {
      this.setState({ clicked: BUTTONS[buttonIndex] });
    });
  }
});

var ShareActionSheetExample = React.createClass({
  getInitialState() {
    return {
      text: ''
    };
  },

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
  },

  showShareActionSheet() {
    ActionSheetIOS.showShareActionSheetWithOptions({
      url: 'https://code.facebook.com',
    },
    (error) => {
      console.error(error);
    },
    (success, method) => {
      var text;
      if (success) {
        text = `Shared via ${method}`;
      } else {
        text = 'You didn\'t share';
      }
      this.setState({text})
    });
  }
});

var style = StyleSheet.create({
  button: {
    marginBottom: 10,
    fontWeight: 'bold',
  }
});

exports.title = 'ActionSheetIOS';
exports.description = 'Interface to show iOS\' action sheets';
exports.examples = [
  {
    title: 'Show Action Sheet',
    render() { return <ActionSheetExample />; }
  },
  {
    title: 'Show Share Action Sheet',
    render() { return <ShareActionSheetExample />; }
  }
];
