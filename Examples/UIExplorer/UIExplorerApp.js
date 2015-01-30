/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule UIExplorerApp
 */
'use strict';

var React = require('react-native/addons');
var UIExplorerList = require('./UIExplorerList');

var {
  Bundler,
  NavigatorIOS,
  StyleSheet,
} = React;


var UIExplorerApp = React.createClass({
  render: function() {
    return (
      <NavigatorIOS
        style={styles.container}
        initialRoute={{
          title: 'UIExplorer',
          component: UIExplorerList,
        }}
        itemWrapperStyle={styles.itemWrapper}
        tintColor='#008888'/>
    );
  }
});

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemWrapper: {
    backgroundColor: '#eaeaea',
  },
});

Bundler.registerComponent('UIExplorerApp', () => UIExplorerApp);

module.exports = UIExplorerApp;
