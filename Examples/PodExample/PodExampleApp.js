/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule PodExampleApp
 * @flow
 */
'use strict';

var React = require('react-native');
var {
  AppRegistry,
  NavigatorIOS,
  StyleSheet,
  Text,
  View,
} = React;

var styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: 'white',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'HelveticaNeue-UltraLight',
    fontSize: 32,
    textAlign: 'center',
  }
});

var PodExampleApp = React.createClass({
  render: function() {
    console.log('REDNERING');
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          Running React Native as a CocoaPod
        </Text>
      </View>
    );
  }
});

AppRegistry.registerComponent('PodExampleApp', () => PodExampleApp);

module.exports = PodExampleApp;
