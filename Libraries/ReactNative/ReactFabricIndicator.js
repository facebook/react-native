/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('React');
const StyleSheet = require('StyleSheet');
const Text = require('Text');
const View = require('View');

function ReactFabricIndicator(): React.Node {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>FABRIC</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0, 0.25)',
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 2,
  },
  text: {
    fontSize: 6,
    color: '#ffffff',
  },
});

module.exports = ReactFabricIndicator;
