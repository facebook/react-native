/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const React = require('React');
const Recording = require('NativeModules').Recording;
const StyleSheet = require('StyleSheet');
const View = require('View');

class CatalystRootViewTestApp extends React.Component {
  componentWillUnmount() {
    Recording.record('RootComponentWillUnmount');
  }

  render() {
    return <View collapsable={false} style={styles.container} />;
  }
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
});

module.exports = {
  CatalystRootViewTestApp: CatalystRootViewTestApp,
};
