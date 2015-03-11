/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
'use strict';

var React = require('react-native');
var {
  AppState,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} = React;

var Button = React.createClass({
  render: function() {
    return (
      <TouchableHighlight
        underlayColor={'white'}
        style={styles.button}
        onPress={this.props.onPress}>
        <Text style={styles.buttonLabel}>
          {this.props.label}
        </Text>
      </TouchableHighlight>
    );
  }
});

var styles = StyleSheet.create({
  button: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    color: 'blue',
  },
});

exports.title = 'AppState';
exports.description = 'App background status and badge value';
exports.examples = [
{
  title: 'Set Badge Number',
  render: function() {
    return (
      <View>
        <Button
          onPress={() => AppState.setApplicationIconBadgeNumber(42)}
          label="Set app's icon badge to 42"
        />
        <Button
          onPress={() => AppState.setApplicationIconBadgeNumber(0)}
          label="Clear app's icon badge"
        />
      </View>
    );
  },
}];
