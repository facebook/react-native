/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
'use strict';

var React = require('React');
var Navigator = require('Navigator');
var StyleSheet = require('StyleSheet');
var Text = require('Text');
var ScrollView = require('ScrollView');
var TouchableHighlight = require('TouchableHighlight');
var BreadcrumbNavSample = require('./BreadcrumbNavSample');
var NavigationBarSample = require('./NavigationBarSample');
var JumpingNavSample = require('./JumpingNavSample');

class NavMenu extends React.Component {
  render() {
    return (
      <ScrollView style={styles.scene}>
        <TouchableHighlight style={styles.button} onPress={() => {
          this.props.navigator.push({ id: 'breadcrumbs' });
        }}>
          <Text style={styles.buttonText}>Breadcrumbs Example</Text>
        </TouchableHighlight>
        <TouchableHighlight style={styles.button} onPress={() => {
          this.props.navigator.push({ id: 'navbar' });
        }}>
          <Text style={styles.buttonText}>Navbar Example</Text>
        </TouchableHighlight>
        <TouchableHighlight style={styles.button} onPress={() => {
          this.props.navigator.push({ id: 'jumping' });
        }}>
          <Text style={styles.buttonText}>Jumping Example</Text>
        </TouchableHighlight>
        <TouchableHighlight style={styles.button} onPress={() => {
          this.props.onExampleExit();
        }}>
          <Text style={styles.buttonText}>Exit Navigator Example</Text>
        </TouchableHighlight>
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
      case 'menu':
        return (
          <NavMenu
            navigator={nav}
            onExampleExit={this.props.onExampleExit}
          />
        );
      case 'navbar':
        return <NavigationBarSample />;
      case 'breadcrumbs':
        return <BreadcrumbNavSample />;
      case 'jumping':
        return <JumpingNavSample />;
    }
  },

  render: function() {
    return (
      <Navigator
        style={styles.container}
        initialRoute={{ id: 'menu', }}
        renderScene={this.renderScene}
        configureScene={(route) => Navigator.SceneConfigs.FloatFromBottom}
      />
    );
  },

});

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  button: {
    backgroundColor: 'white',
    padding: 15,
  },
  buttonText: {
  },
  scene: {
    flex: 1,
    paddingTop: 64,
  }
});

module.exports = TabBarExample;
