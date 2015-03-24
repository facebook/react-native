/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule JumpingNavSample
 */
'use strict';

var JSNavigationStack = require('JSNavigationStack');
var React = require('React');
var StyleSheet = require('StyleSheet');
var ScrollView = require('ScrollView');
var Text = require('Text');
var TouchableBounce = require('TouchableBounce');
var View = require('View');

var _getRandomRoute = function() {
  return {
    randNumber: Math.random(),
  };
};

var INIT_ROUTE = _getRandomRoute();
var ROUTE_STACK = [
  _getRandomRoute(),
  _getRandomRoute(),
  INIT_ROUTE,
  _getRandomRoute(),
  _getRandomRoute(),
];
var SampleRouteMapper = {

  navigationItemForRoute: function(route, navigationOperations) {
    return (
      <ScrollView style={styles.scene}>
        <View style={styles.scroll}>
        <Text>{route.randNumber}</Text>
        <TouchableBounce
          onPress={() => {
            navigationOperations.jumpBack();
          }}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>jumpBack</Text>
          </View>
        </TouchableBounce>
        <TouchableBounce
          onPress={() => {
            navigationOperations.jumpForward();
          }}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>jumpForward</Text>
          </View>
        </TouchableBounce>
        <TouchableBounce
          onPress={() => {
            navigationOperations.jumpTo(INIT_ROUTE);
          }}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>jumpTo initial route</Text>
          </View>
        </TouchableBounce>
        <TouchableBounce
          onPress={() => {
            navigationOperations.push(_getRandomRoute());
          }}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>destructive: push</Text>
          </View>
        </TouchableBounce>
        <TouchableBounce
          onPress={() => {
            navigationOperations.replace(_getRandomRoute());
          }}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>destructive: replace</Text>
          </View>
        </TouchableBounce>
        <TouchableBounce
          onPress={() => {
            navigationOperations.pop();
          }}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>destructive: pop</Text>
          </View>
        </TouchableBounce>
        <TouchableBounce
          onPress={() =>  {
            navigationOperations.immediatelyResetRouteStack([
              _getRandomRoute(),
              _getRandomRoute(),
            ]);
          }}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>destructive: Immediate set two routes</Text>
          </View>
        </TouchableBounce>
        <TouchableBounce
          onPress={() => {
            navigationOperations.popToTop();
          }}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>destructive: pop to top</Text>
          </View>
        </TouchableBounce>
      </View>
      </ScrollView>
    );
  },
};

class JumpingNavBar extends React.Component {
  render() {
    return (
      <View style={styles.navBar}>
        {this.props.routeStack.map((route, index) => (
          <TouchableBounce onPress={() => {
            this.props.navigationOperations.jumpTo(route);
          }}>
            <View style={styles.navButton}>
              <Text
                style={[
                  styles.navButtonText,
                  this.props.navState.toIndex === index && styles.navButtonActive
                ]}>
                  {index}
                </Text>
            </View>
          </TouchableBounce>
        ))}
      </View>
    );
  }
}

var JumpingNavSample = React.createClass({

  render: function() {
    return (
      <JSNavigationStack
        debugOverlay={false}
        style={[styles.appContainer]}
        initialRoute={INIT_ROUTE}
        initialRouteStack={ROUTE_STACK}
        routeMapper={SampleRouteMapper}
        navigationBar={<JumpingNavBar routeStack={ROUTE_STACK} />}
        shouldJumpOnBackstackPop={true}
      />
    );
  },

});

var styles = StyleSheet.create({
  scene: {
    backgroundColor: '#eeeeee',
  },
  scroll: {
    flex: 1,
  },
  button: {
    backgroundColor: '#cccccc',
    margin: 50,
    marginTop: 26,
    padding: 10,
  },
  buttonText: {
    fontSize: 12,
    textAlign: 'center',
  },
  appContainer: {
    overflow: 'hidden',
    backgroundColor: '#dddddd',
    flex: 1,
  },
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    flexDirection: 'row',
  },
  navButton: {
    flex: 1,
  },
  navButtonText: {
    textAlign: 'center',
    fontSize: 32,
    marginTop: 25,
  },
  navButtonActive: {
    color: 'green',
  },
});

module.exports = JumpingNavSample;
