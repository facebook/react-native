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
  StyleSheet,
  ScrollView,
  Text,
  TouchableHighlight,
  View,
} = React;

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
var renderScene = function(route, navigator) {
  return (
    <ScrollView style={styles.scene}>
      <View style={styles.scroll}>
      <Text>{route.randNumber}</Text>
      <TouchableHighlight
        onPress={() => {
          navigator.jumpBack();
        }}>
        <View style={styles.button}>
          <Text style={styles.buttonText}>jumpBack</Text>
        </View>
      </TouchableHighlight>
      <TouchableHighlight
        onPress={() => {
          navigator.jumpForward();
        }}>
        <View style={styles.button}>
          <Text style={styles.buttonText}>jumpForward</Text>
        </View>
      </TouchableHighlight>
      <TouchableHighlight
        onPress={() => {
          navigator.jumpTo(INIT_ROUTE);
        }}>
        <View style={styles.button}>
          <Text style={styles.buttonText}>jumpTo initial route</Text>
        </View>
      </TouchableHighlight>
      <TouchableHighlight
        onPress={() => {
          navigator.push(_getRandomRoute());
        }}>
        <View style={styles.button}>
          <Text style={styles.buttonText}>destructive: push</Text>
        </View>
      </TouchableHighlight>
      <TouchableHighlight
        onPress={() => {
          navigator.replace(_getRandomRoute());
        }}>
        <View style={styles.button}>
          <Text style={styles.buttonText}>destructive: replace</Text>
        </View>
      </TouchableHighlight>
      <TouchableHighlight
        onPress={() => {
          navigator.pop();
        }}>
        <View style={styles.button}>
          <Text style={styles.buttonText}>destructive: pop</Text>
        </View>
      </TouchableHighlight>
      <TouchableHighlight
        onPress={() =>  {
          navigator.immediatelyResetRouteStack([
            _getRandomRoute(),
            _getRandomRoute(),
          ]);
        }}>
        <View style={styles.button}>
          <Text style={styles.buttonText}>destructive: Immediate set two routes</Text>
        </View>
      </TouchableHighlight>
      <TouchableHighlight
        onPress={() => {
          navigator.popToTop();
        }}>
        <View style={styles.button}>
          <Text style={styles.buttonText}>destructive: pop to top</Text>
        </View>
      </TouchableHighlight>
    </View>
    </ScrollView>
  );
};

class JumpingNavBar extends React.Component {
  render() {
    return (
      <View style={styles.navBar}>
        {this.props.routeStack.map((route, index) => (
          <TouchableHighlight onPress={() => {
            this.props.navigator.jumpTo(route);
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
          </TouchableHighlight>
        ))}
      </View>
    );
  }
}

var JumpingNavSample = React.createClass({

  render: function() {
    return (
      <Navigator
        debugOverlay={false}
        style={[styles.appContainer]}
        initialRoute={INIT_ROUTE}
        initialRouteStack={ROUTE_STACK}
        renderScene={renderScene}
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
