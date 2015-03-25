/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule NestedBreadcrumbNavSample
 */
'use strict';

var BreadcrumbNavigationBar = require('BreadcrumbNavigationBar');
var ReactNavigator = require('ReactNavigator');
var React = require('React');
var ScrollView = require('ScrollView');
var StyleSheet = require('StyleSheet');
var Text = require('Text');
var TouchableBounce = require('TouchableBounce');
var View = require('View');

var SAMPLE_TEXT = 'Top Pushes. Middle Replaces. Bottom Pops.';

var _getRandomRoute = function() {
  return {
    backButtonTitle: 'Back' + ('' + 10 * Math.random()).substr(0, 1),
    content:
      SAMPLE_TEXT + '\nHere\'s a random number ' + Math.random(),
    title: 'Pushed!',
    rightButtonTitle: Math.random() > 0.5 ? 'Right' : 'Button',
  };
};


var HorizontalNavigationBarRouteMapper = {
  rightContentForRoute: function(route, navigator) {
    if (route.rightButtonTitle) {
      return (
        <Text style={[styles.titleText, styles.filterText]}>
          {route.rightButtonTitle}
        </Text>
      );
    } else {
      return null;
    }
  },
  titleContentForRoute: function(route, navigator) {
    return (
      <TouchableBounce
        onPress={() => () => { navigator.push(_getRandomRoute()); }}>
        <View>
          <Text style={styles.titleText}>{route.title}</Text>
        </View>
      </TouchableBounce>
    );
  },
  iconForRoute: function(route, navigator) {
    var onPress =
      navigator.popToRoute.bind(navigator, route);
    return (
      <TouchableBounce onPress={onPress}>
        <View style={styles.crumbIconPlaceholder} />
      </TouchableBounce>
    );
  },
  separatorForRoute: function(route, navigator) {
    return (
      <TouchableBounce onPress={navigator.pop}>
        <View style={styles.crumbSeparatorPlaceholder} />
      </TouchableBounce>
    );
  }
};

var ThirdDeepRouteMapper = (route, navigator) => (
  <View style={styles.navigationItem}>
    <ScrollView>
      <View style={styles.thirdDeepScrollContent}>
        <TouchableBounce
          onPress={() => { navigator.push(_getRandomRoute()); }}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>request push soon</Text>
          </View>
        </TouchableBounce>
      </View>
    </ScrollView>
  </View>
);

var SecondDeepRouteMapper = (route, navigator) => (
  <View style={styles.navigationItem}>
    <TouchableBounce
      onPress={() => { navigator.push(_getRandomRoute()); }}>
      <View style={styles.button}>
        <Text style={styles.buttonText}>Push Horizontal</Text>
      </View>
    </TouchableBounce>
    <ReactNavigator
      style={styles.thirdDeepNavigator}
      initialRoute={{title: '3x Nested Horizontal'}}
      renderScene={ThirdDeepRouteMapper}
      navigationBar={
        <BreadcrumbNavigationBar
          navigationBarRouteMapper={HorizontalNavigationBarRouteMapper}
        />
      }
    />
  </View>
);

var FirstDeepRouteMapper = (route, navigator) => (
  <View style={styles.navigationItem}>
    <TouchableBounce
      onPress={() => { navigator.push(_getRandomRoute()); }}>
      <View style={styles.button}>
        <Text style={styles.buttonText}>Push Outer Vertical Stack</Text>
      </View>
    </TouchableBounce>
    <ReactNavigator
      style={styles.secondDeepNavigator}
      initialRoute={{title: '2x Nested Horizontal Nav'}}
      renderScene={SecondDeepRouteMapper}
      navigationBar={
        <BreadcrumbNavigationBar
          navigationBarRouteMapper={HorizontalNavigationBarRouteMapper}
        />
      }
    />
  </View>
);

/**
 * The outer component.
 */
var NestedBreadcrumbNavSample = React.createClass({
  render: function() {
    var initialRoute = {title: 'Vertical'};
    // No navigation bar.
    return (
      <ReactNavigator
        style={[styles.appContainer]}
        configureScene={() => ReactNavigator.SceneConfigs.FloatFromBottom}
        initialRoute={initialRoute}
        renderScene={FirstDeepRouteMapper}
      />
    );
  }
});

var styles = StyleSheet.create({
  navigationItem: {
    backgroundColor: '#eeeeee',
    shadowColor: 'black',
    shadowRadius: 20,
    shadowOffset: {w: 0, h: -10},
  },
  paddingForNavBar: {
    paddingTop: 60,
  },
  paddingForMenuBar: {
    paddingTop: 10,
  },
  button: {
    backgroundColor: '#888888',
    margin: 10,
    marginTop: 10,
    padding: 10,
    marginRight: 20,
  },
  buttonText: {
    fontSize: 12,
    textAlign: 'center',
    color: 'white',
  },
  appContainer: {
    overflow: 'hidden',
    backgroundColor: '#dddddd',
    flex: 1,
  },
  titleText: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    fontWeight: 'bold',
    lineHeight: 32,
  },
  filterText: {
    color: '#5577ff',
  },
  // TODO: Accept icons from route.
  crumbIconPlaceholder: {
    flex: 1,
    backgroundColor: '#666666',
  },
  crumbSeparatorPlaceholder: {
    flex: 1,
    backgroundColor: '#aaaaaa',
  },
  secondDeepNavigator: {
    margin: 0,
    borderColor: '#666666',
    borderWidth: 0.5,
    height: 400,
  },
  thirdDeepNavigator: {
    margin: 0,
    borderColor: '#aaaaaa',
    borderWidth: 0.5,
    height: 400,
  },
  thirdDeepScrollContent: {
    height: 1000,
  }
});

module.exports = NestedBreadcrumbNavSample;
