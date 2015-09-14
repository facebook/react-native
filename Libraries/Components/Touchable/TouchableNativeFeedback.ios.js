/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TouchableNativeFeedback
 */

'use strict';

var React = require('React');
var StyleSheet = require('StyleSheet');
var Text = require('Text');
var View = require('View');

var DummyTouchableNativeFeedback = React.createClass({
  render: function() {
    return (
      <View style={[styles.container, this.props.style]}>
        <Text style={styles.info}>TouchableNativeFeedback is not supported on this platform!</Text>
      </View>
    );
  },
});

var styles = StyleSheet.create({
  container: {
    height: 100,
    width: 300,
    backgroundColor: '#ffbcbc',
    borderWidth: 1,
    borderColor: 'red',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
  },
  info: {
    color: '#333333',
    margin: 20,
  }
});

module.exports = DummyTouchableNativeFeedback;
