/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule UIExplorerApp
 * @flow
 */
'use strict';

var React = require('react-native');
var UIExplorerList = require('./UIExplorerList');
var {
  AppRegistry,
  NavigatorIOS,
  StyleSheet,
} = React;

var UIExplorerApp = React.createClass({

  getInitialState: function() {
    return {
      openExternalExample: (null: ?React.Component),
    };
  },

  render: function() {
    if (this.state.openExternalExample) {
      var Example = this.state.openExternalExample;
      return (
        <Example
          onExampleExit={() => {
            this.setState({ openExternalExample: null, });
          }}
        />
      );
    }
    return (
      <NavigatorIOS
        style={styles.container}
        initialRoute={{
          title: 'UIExplorer',
          component: UIExplorerList,
          passProps: {
            onExternalExampleRequested: (example) => {
              this.setState({ openExternalExample: example, });
            },
          }
        }}
        itemWrapperStyle={styles.itemWrapper}
        tintColor='#008888'
      />
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

AppRegistry.registerComponent('UIExplorerApp', () => UIExplorerApp);

module.exports = UIExplorerApp;
