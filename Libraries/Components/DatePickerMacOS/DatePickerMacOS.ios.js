/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO(macOS ISS#2323203)

'use strict';

var React = require('React');
var StyleSheet = require('StyleSheet');
var Text = require('Text');
var View = require('View');

class DummyDatePickerMacOS extends React.Component {
  render() {
    return (
      <View style={[styles.dummyDatePickerMacOS, this.props.style]}>
        <Text style={styles.datePickerText}>DatePickerMacOS is not supported on this platform!</Text>
      </View>
    );
  }
}

var styles = StyleSheet.create({
  dummyDatePickerMacOS: {
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

module.exports = DummyDatePickerMacOS;
