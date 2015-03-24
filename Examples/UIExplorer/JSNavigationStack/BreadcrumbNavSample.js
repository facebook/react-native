/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule BreadcrumbNavSample
 */
'use strict';

var BreadcrumbNavigationBar = require('BreadcrumbNavigationBar');
var JSNavigationStack = require('JSNavigationStack');
var React = require('React');
var StyleSheet = require('StyleSheet');
var ScrollView = require('ScrollView');
var TabBarItemIOS = require('TabBarItemIOS');
var TabBarIOS = require('TabBarIOS');
var Text = require('Text');
var TouchableBounce = require('TouchableBounce');
var View = require('View');



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
  rightContentForRoute: function(route, navigationOperations) {
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
  titleContentForRoute: function(route, navigationOperations) {
    return (
      <TouchableBounce
        onPress={() => navigationOperations.push(_getRandomRoute())}>
        <View>
          <Text style={styles.titleText}>{route.title}</Text>
        </View>
      </TouchableBounce>
    );
  },
  iconForRoute: function(route, navigationOperations) {
    var onPress =
      navigationOperations.popToRoute.bind(navigationOperations, route);
    return (
      <TouchableBounce onPress={onPress}>
        <View style={styles.crumbIconPlaceholder} />
      </TouchableBounce>
    );
  },
  separatorForRoute: function(route, navigationOperations) {
    return (
      <TouchableBounce onPress={navigationOperations.pop}>
        <View style={styles.crumbSeparatorPlaceholder} />
      </TouchableBounce>
    );
  }
};

var _delay = 400; // Just to test for race conditions with native nav.

var renderScene = function(route, navigationOperations) {
  var content = route.content;
  return (
    <ScrollView>
      <View style={styles.scene}>
        <TouchableBounce
          onPress={_pushRouteLater(navigationOperations.push)}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>request push soon</Text>
          </View>
        </TouchableBounce>
        <TouchableBounce
          onPress={_pushRouteLater(navigationOperations.replace)}>
          <View style={styles.button}>
            <Text>{content}</Text>
          </View>
        </TouchableBounce>
        <TouchableBounce
          onPress={_pushRouteLater(navigationOperations.replace)}>
          <View style={styles.button}>
            <Text>{content}</Text>
          </View>
        </TouchableBounce>
        <TouchableBounce
          onPress={_pushRouteLater(navigationOperations.replace)}>
          <View style={styles.button}>
            <Text>{content}</Text>
          </View>
        </TouchableBounce>
        <TouchableBounce
          onPress={_pushRouteLater(navigationOperations.replace)}>
          <View style={styles.button}>
            <Text>{content}</Text>
          </View>
        </TouchableBounce>
        <TouchableBounce
          onPress={_pushRouteLater(navigationOperations.replace)}>
          <View style={styles.button}>
            <Text>{content}</Text>
          </View>
        </TouchableBounce>
        <TouchableBounce
          onPress={_popRouteLater(navigationOperations.pop)}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>request pop soon</Text>
          </View>
        </TouchableBounce>
        <TouchableBounce
          onPress={
            _immediatelySetTwoItemsLater(
              navigationOperations.immediatelyResetRouteStack
            )
          }>
          <View style={styles.button}>
            <Text style={styles.buttonText}>Immediate set two routes</Text>
          </View>
        </TouchableBounce>
        <TouchableBounce
          onPress={_popToTopLater(navigationOperations.popToTop)}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>pop to top soon</Text>
          </View>
        </TouchableBounce>
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
        <TabBarItemIOS
          selected={this.state.selectedTab === 0}
          onPress={this.onTabSelect.bind(this, 0)}
          icon={require('image!madman_tabnav_list')}
          title="One">
          <JSNavigationStack
            debugOverlay={false}
            style={[styles.appContainer]}
            initialRoute={initialRoute}
            renderScene={renderScene}
            navigationBar={
              <BreadcrumbNavigationBar
                navigationBarRouteMapper={SampleNavigationBarRouteMapper}
              />
            }
          />
        </TabBarItemIOS>
        <TabBarItemIOS
          selected={this.state.selectedTab === 1}
          onPress={this.onTabSelect.bind(this, 1)}
          icon={require('image!madman_tabnav_create')}
          title="Two">
          <JSNavigationStack
            animationConfigRouteMapper={() => JSNavigationStack.AnimationConfigs.FloatFromBottom}
            debugOverlay={false}
            style={[styles.appContainer]}
            initialRoute={initialRoute}
            renderScene={renderScene}
            navigationBar={
              <BreadcrumbNavigationBar
                navigationBarRouteMapper={SampleNavigationBarRouteMapper}
              />
            }
          />
        </TabBarItemIOS>
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
});

module.exports = BreadcrumbNavSample;
