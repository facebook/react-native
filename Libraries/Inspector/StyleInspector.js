/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule StyleInspector
 * @flow
 */
'use strict';

var React = require('../react-native/React');
var StyleSheet = require('../StyleSheet/StyleSheet');
var Text = require('../Text/Text');
var View = require('../Components/View/View');

class StyleInspector extends React.Component {
  render() {
    if (!this.props.style) {
      return <Text style={styles.noStyle}>No style</Text>;
    }
    var names = Object.keys(this.props.style);
    return (
      <View style={styles.container}>
        <View>
          {names.map(name => <Text key={name} style={styles.attr}>{name}:</Text>)}
        </View>

        <View>
          {names.map(name => {
            var value = typeof this.props.style[name] === 'object' ? JSON.stringify(this.props.style[name]) : this.props.style[name];
            return <Text key={name} style={styles.value}>{value}</Text>;
          } ) }
        </View>
      </View>
    );
  }
}

var styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
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

