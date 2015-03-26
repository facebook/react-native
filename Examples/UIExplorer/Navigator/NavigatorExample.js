/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var React = require('react-native');
var {
  Navigator,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
} = React;
var BreadcrumbNavSample = require('./BreadcrumbNavSample');
var NavigationBarSample = require('./NavigationBarSample');
var JumpingNavSample = require('./JumpingNavSample');

class NavButton extends React.Component {
  render() {
    return (
      <TouchableHighlight
        style={styles.button}
        underlayColor="#B5B5B5"
        onPress={this.props.onPress}>
        <Text style={styles.buttonText}>{this.props.text}</Text>
      </TouchableHighlight>
    );
  }
}

class NavMenu extends React.Component {
  render() {
    return (
      <ScrollView style={styles.scene}>
        <Text style={styles.messageText}>{this.props.message}</Text>
        <NavButton
          onPress={() => {
            this.props.navigator.push({
              message: 'Swipe right to dismiss',
              sceneConfig: Navigator.SceneConfigs.FloatFromRight,
            });
          }}
          text="Float in from right"
        />
        <NavButton
          onPress={() => {
            this.props.navigator.push({
              message: 'Swipe down to dismiss',
              sceneConfig: Navigator.SceneConfigs.FloatFromBottom,
            });
          }}
          text="Float in from bottom"
        />
        <NavButton
          onPress={() => {
            this.props.navigator.pop();
          }}
          text="Pop"
        />
        <NavButton
          onPress={() => {
            this.props.navigator.popToTop();
          }}
          text="Pop to top"
        />
        <NavButton
          onPress={() => {
            this.props.navigator.push({ id: 'navbar' });
          }}
          text="Navbar Example"
        />
        <NavButton
          onPress={() => {
            this.props.navigator.push({ id: 'jumping' });
          }}
          text="Jumping Example"
        />
        <NavButton
          onPress={() => {
            this.props.navigator.push({ id: 'breadcrumbs' });
          }}
          text="Breadcrumbs Example"
        />
        <NavButton
          onPress={() => {
            this.props.onExampleExit();
          }}
          text="Exit <Navigator> Example"
        />
      </ScrollView>
    );
  }
}

var TabBarExample = React.createClass({

  statics: {
    title: '<Navigator>',
    description: 'JS-implemented navigation',
  },

  renderScene: function(route, nav) {
    switch (route.id) {
      case 'navbar':
        return <NavigationBarSample navigator={nav} />;
      case 'breadcrumbs':
        return <BreadcrumbNavSample navigator={nav} />;
      case 'jumping':
        return <JumpingNavSample navigator={nav} />;
      default:
        return (
          <NavMenu
            message={route.message}
            navigator={nav}
            onExampleExit={this.props.onExampleExit}
          />
        );
    }
  },

  render: function() {
    return (
      <Navigator
        style={styles.container}
        initialRoute={{ message: "First Scene", }}
        renderScene={this.renderScene}
        configureScene={(route) => {
          if (route.sceneConfig) {
            return route.sceneConfig;
          }
          return Navigator.SceneConfigs.FloatFromBottom;
        }}
      />
    );
  },

});

var styles = StyleSheet.create({
  messageText: {
    fontSize: 17,
    fontWeight: '500',
    padding: 15,
    marginTop: 50,
    marginLeft: 15,
  },
  container: {
    flex: 1,
  },
  button: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1 / PixelRatio.get(),
    borderBottomColor: '#CDCDCD',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '500',
  },
  scene: {
    flex: 1,
    paddingTop: 20,
    backgroundColor: '#EAEAEA',
  }
});

module.exports = TabBarExample;
