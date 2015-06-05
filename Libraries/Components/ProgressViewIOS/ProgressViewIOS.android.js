
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ProgressViewIOS
 */

'use strict';

var React = require('React');
var StyleSheet = require('StyleSheet');
var Text = require('Text');
var View = require('View');

var DummyProgressViewIOS = React.createClass({
  render: function() {
    return (
      <View style={[styles.dummy, this.props.style]}>
        <Text style={styles.text}>
          ProgressViewIOS is not supported on this platform!
        </Text>
      </View>
    );
  },
});

var styles = StyleSheet.create({
  dummy: {
    width: 120,
    height: 20,
    backgroundColor: '#ffbcbc',
    borderWidth: 1,
    borderColor: 'red',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#333333',
    margin: 5,
    fontSize: 10,
  }
});

module.exports = DummyProgressViewIOS;
