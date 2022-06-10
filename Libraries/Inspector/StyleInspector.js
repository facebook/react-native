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

const React = require('react');
const StyleSheet = require('../StyleSheet/StyleSheet');
const Text = require('../Text/Text');
const View = require('../Components/View/View');

class StyleInspector extends React.Component<$FlowFixMeProps> {
  render(): React.Node {
    if (!this.props.style) {
      return <Text style={styles.noStyle}>No style</Text>;
    }
    const names = Object.keys(this.props.style);
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
            const value = this.props.style[name];
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
