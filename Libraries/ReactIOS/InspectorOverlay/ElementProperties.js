/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ElementProperties
 * @flow
 */
'use strict';

var React = require('React');
var StyleSheet = require('StyleSheet');
var Text = require('Text');
var View = require('View');
var PropTypes = require('ReactPropTypes');
var BoxInspector = require('BoxInspector');
var StyleInspector = require('StyleInspector');

var flattenStyle = require('flattenStyle');

var ElementProperties = React.createClass({
  propTypes: {
    hierarchy: PropTypes.array.isRequired,
    style: PropTypes.array.isRequired,
  },
  render: function() {
    var style = flattenStyle(this.props.style);
    var path = this.props.hierarchy.map((instance) => {
      return instance.getName ? instance.getName() : 'Unknown';
    }).join(' > ');
    return (
      <View style={styles.info}>
        <Text style={styles.path}>
          {path}
        </Text>
        <View style={styles.row}>
          <StyleInspector style={style} />
          <BoxInspector style={style} frame={this.props.frame} />
        </View>
      </View>
    );
  }
});

var styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  info: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
  },
  path: {
    color: 'white',
    fontSize: 9,
  },
});

module.exports = ElementProperties;
