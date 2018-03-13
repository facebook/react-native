/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule NavigatorIOSColorsExample
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  NavigatorIOS,
  StatusBar,
  StyleSheet,
  Text,
  View
} = ReactNative;

class EmptyPage extends React.Component {
  render() {
    return (
      <View style={styles.emptyPage}>
        <Text style={styles.emptyPageText}>
          {this.props.text}
        </Text>
      </View>
    );
  }
}

class NavigatorIOSColors extends React.Component {
  static title = '<NavigatorIOS> - Custom Colors';
  static description = 'iOS navigation with custom nav bar colors';

  render() {
    // Set StatusBar with light contents to get better contrast
    StatusBar.setBarStyle('light-content');

    return (
      <NavigatorIOS
        style={styles.container}
        initialRoute={{
          component: EmptyPage,
          title: '<NavigatorIOS>',
          rightButtonTitle: 'Done',
          onRightButtonPress: () => {
            StatusBar.setBarStyle('default');
            this.props.onExampleExit();
          },
          passProps: {
            text: 'The nav bar has custom colors with tintColor, ' +
              'barTintColor and titleTextColor props.',
          },
        }}
        tintColor="#FFFFFF"
        barTintColor="#183E63"
        titleTextColor="#FFFFFF"
        translucent={true}
      />
    );
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyPage: {
    flex: 1,
    paddingTop: 64,
  },
  emptyPageText: {
    margin: 10,
  },
});

NavigatorIOSColors.external = true;

module.exports = NavigatorIOSColors;
