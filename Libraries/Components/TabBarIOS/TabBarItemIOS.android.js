/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const React = require('React');
const View = require('View');
const StyleSheet = require('StyleSheet');

class DummyTab extends React.Component {
  render() {
    if (!this.props.selected) {
      return <View />;
    }
    return (
      <View style={[this.props.style, styles.tab]}>{this.props.children}</View>
    );
  }
}

const styles = StyleSheet.create({
  tab: {
    // TODO(5405356): Implement overflow: visible so position: absolute isn't useless
    // position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderColor: 'red',
    borderWidth: 1,
  },
});

module.exports = DummyTab;
