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
  ScrollView,
  StyleSheet,
  TabBarIOS,
  Text,
  View,
  TouchableHighlight,
} = React;

var SAMPLE_TEXT = 'Top Pushes. Middle Replaces. Bottom Pops.';

var _getRandomRoute = function() {
  return {
    backButtonTitle: 'Back' + ('' + 10 * Math.random()).substr(0, 1),
    content:
      SAMPLE_TEXT + '\nHere\'s a random number ' + Math.random(),
    title: Math.random() > 0.5 ? 'Hello' : 'There',
    rightButtonTitle: Math.random() > 0.5 ? 'Right' : 'Button',
  };
};


var SampleNavigationBarRouteMapper = {
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
      <TouchableHighlight
        onPress={() => navigator.push(_getRandomRoute())}>
        <View>
          <Text style={styles.titleText}>{route.title}</Text>
        </View>
      </TouchableHighlight>
    );
  },
  iconForRoute: function(route, navigator) {
    var onPress =
      navigator.popToRoute.bind(navigator, route);
    return (
      <TouchableHighlight onPress={onPress}>
        <View style={styles.crumbIconPlaceholder} />
      </TouchableHighlight>
    );
  },
  separatorForRoute: function(route, navigator) {
    return (
      <TouchableHighlight onPress={navigator.pop}>
        <View style={styles.crumbSeparatorPlaceholder} />
      </TouchableHighlight>
    );
  }
};

var _delay = 400; // Just to test for race conditions with native nav.

var renderScene = function(route, navigator) {
  var content = route.content;
  return (
    <ScrollView>
      <View style={styles.scene}>
        <TouchableHighlight
          onPress={_pushRouteLater(navigator.push)}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>request push soon</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          onPress={_pushRouteLater(navigator.replace)}>
          <View style={styles.button}>
            <Text>{content}</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          onPress={_pushRouteLater(navigator.replace)}>
          <View style={styles.button}>
            <Text>{content}</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          onPress={_pushRouteLater(navigator.replace)}>
          <View style={styles.button}>
            <Text>{content}</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          onPress={_pushRouteLater(navigator.replace)}>
          <View style={styles.button}>
            <Text>{content}</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          onPress={_pushRouteLater(navigator.replace)}>
          <View style={styles.button}>
            <Text>{content}</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          onPress={_popRouteLater(navigator.pop)}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>request pop soon</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          onPress={
            _immediatelySetTwoItemsLater(
              navigator.immediatelyResetRouteStack
            )
          }>
          <View style={styles.button}>
            <Text style={styles.buttonText}>Immediate set two routes</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          onPress={_popToTopLater(navigator.popToTop)}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>pop to top soon</Text>
          </View>
        </TouchableHighlight>
      </View>
    </ScrollView>
  );
};

var _popToTopLater = function(popToTop) {
  return () => setTimeout(popToTop, _delay);
};

var _pushRouteLater = function(push) {
  return () => setTimeout(
    () => push(_getRandomRoute()),
    _delay
  );
};

var _immediatelySetTwoItemsLater = function(immediatelyResetRouteStack) {
  return () => setTimeout(
    () => immediatelyResetRouteStack([
      _getRandomRoute(),
      _getRandomRoute(),
    ])
  );
};

var _popRouteLater = function(pop) {
  return () => setTimeout(pop, _delay);
};

var BreadcrumbNavSample = React.createClass({

  getInitialState: function() {
    return {
      selectedTab: 0,
    };
  },

  render: function() {
    var initialRoute = {
      backButtonTitle: 'Start', // no back button for initial scene
      content: SAMPLE_TEXT,
      title: 'Campaigns',
      rightButtonTitle: 'Filter',
    };
    return (
      <TabBarIOS>
        <TabBarIOS.Item
          selected={this.state.selectedTab === 0}
          onPress={this.onTabSelect.bind(this, 0)}
          icon={require('image!tabnav_list')}
          title="One">
          <Navigator
            debugOverlay={false}
            style={[styles.appContainer]}
            initialRoute={initialRoute}
            renderScene={renderScene}
            navigationBar={
              <Navigator.BreadcrumbNavigationBar
                navigationBarRouteMapper={SampleNavigationBarRouteMapper}
              />
            }
          />
        </TabBarIOS.Item>
        <TabBarIOS.Item
          selected={this.state.selectedTab === 1}
          onPress={this.onTabSelect.bind(this, 1)}
          icon={require('image!tabnav_notification')}
          title="Two">
          <Navigator
            configureScene={() => Navigator.SceneConfigs.FloatFromBottom}
            debugOverlay={false}
            style={[styles.appContainer]}
            initialRoute={initialRoute}
            renderScene={renderScene}
            navigationBar={
              <Navigator.BreadcrumbNavigationBar
                navigationBarRouteMapper={SampleNavigationBarRouteMapper}
              />
            }
          />
        </TabBarIOS.Item>
      </TabBarIOS>
    );
  },

  onTabSelect: function(tab, event) {
    if (this.state.selectedTab !== tab) {
      this.setState({selectedTab: tab});
    }
  },

});

var styles = StyleSheet.create({
  navigationItem: {
    backgroundColor: '#eeeeee',
  },
  scene: {
    paddingTop: 50,
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
  titleText: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '500',
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
});

module.exports = BreadcrumbNavSample;
