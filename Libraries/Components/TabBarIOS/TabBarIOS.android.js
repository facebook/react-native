/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TabBarIOS
 */

'use strict';

var React = require('React');
var View = require('View');
var StyleSheet = require('StyleSheet');

class DummyTabBarIOS extends React.Component {
  render() {
    return (
      <View style={[this.props.style, styles.tabGroup]}>
        {this.props.children}
      </View>
    );
  }
}

var styles = StyleSheet.create({
  tabGroup: {
    flex: 1,
  }
});

module.exports = DummyTabBarIOS;
