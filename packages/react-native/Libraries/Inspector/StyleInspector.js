/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {ViewStyleProp} from '../StyleSheet/StyleSheet';
import type {____FlattenStyleProp_Internal} from '../StyleSheet/StyleSheetTypes';

import React from 'react';

const View = require('../Components/View/View');
const StyleSheet = require('../StyleSheet/StyleSheet');
const Text = require('../Text/Text');

type Props = $ReadOnly<{
  style?: ?____FlattenStyleProp_Internal<ViewStyleProp>,
}>;

function StyleInspector({style}: Props): React.Node {
  if (!style) {
    return <Text style={styles.noStyle}>No style</Text>;
  }
  const names = Object.keys(style);
  return (
    <View style={styles.container}>
      <View>
        {names.map(name => (
          <Text key={name} style={styles.attr}>
            {name}:
          </Text>
        ))}
      </View>

      <View>
        {names.map(name => {
          const value = style?.[name];
          return (
            <Text key={name} style={styles.value}>
              {typeof value !== 'string' && typeof value !== 'number'
                ? JSON.stringify(value)
                : value}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  attr: {
    fontSize: 10,
    color: '#ccc',
  },
  value: {
    fontSize: 10,
    color: 'white',
    marginLeft: 10,
  },
  noStyle: {
    color: 'white',
    fontSize: 10,
  },
});

module.exports = StyleInspector;
