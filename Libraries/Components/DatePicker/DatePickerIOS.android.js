/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule DatePickerIOS
 */

'use strict';

var React = require('../../react-native/React');
var StyleSheet = require('../../StyleSheet/StyleSheet');
var Text = require('../../Text/Text');
var View = require('../View/View');

class DummyDatePickerIOS extends React.Component {
  render() {
    return (
      <View style={[styles.dummyDatePickerIOS, this.props.style]}>
        <Text style={styles.datePickerText}>DatePickerIOS is not supported on this platform!</Text>
      </View>
    );
  }
}

var styles = StyleSheet.create({
  dummyDatePickerIOS: {
    height: 100,
    width: 300,
    backgroundColor: '#ffbcbc',
    borderWidth: 1,
    borderColor: 'red',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
  },
  datePickerText: {
    color: '#333333',
    margin: 20,
  }
});

module.exports = DummyDatePickerIOS;
