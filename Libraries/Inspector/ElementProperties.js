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

var BoxInspector = require('BoxInspector');
var PropTypes = require('ReactPropTypes');
var React = require('React');
var StyleInspector = require('StyleInspector');
var StyleSheet = require('StyleSheet');
var Text = require('Text');
var TouchableHighlight = require('TouchableHighlight');
var TouchableWithoutFeedback = require('TouchableWithoutFeedback');
var View = require('View');

var flattenStyle = require('flattenStyle');
var mapWithSeparator = require('mapWithSeparator');

var ElementProperties = React.createClass({
  propTypes: {
    hierarchy: PropTypes.array.isRequired,
    style: PropTypes.array.isRequired,
  },

  render: function() {
    var style = flattenStyle(this.props.style);
    var selection = this.props.selection;
    // Without the `TouchableWithoutFeedback`, taps on this inspector pane
    // would change the inspected element to whatever is under the inspector
    return (
      <TouchableWithoutFeedback>
        <View style={styles.info}>
          <View style={styles.breadcrumb}>
            {mapWithSeparator(
              this.props.hierarchy,
              (item, i) => (
                <TouchableHighlight
                  style={[styles.breadItem, i === selection && styles.selected]}
                  onPress={() => this.props.setSelection(i)}>
                  <Text style={styles.breadItemText}>
                    {item.getName ? item.getName() : 'Unknown'}
                  </Text>
                </TouchableHighlight>
              ),
              () => <Text style={styles.breadSep}>&#9656;</Text>
            )}
          </View>
          <View style={styles.row}>
            <StyleInspector style={style} />
            <BoxInspector style={style} frame={this.props.frame} />
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }
});

var styles = StyleSheet.create({
  breadSep: {
    fontSize: 8,
    color: 'white',
  },
  breadcrumb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 5,
  },
  selected: {
    borderColor: 'white',
    borderRadius: 5,
  },
  breadItem: {
    borderWidth: 1,
    borderColor: 'transparent',
    marginHorizontal: 2,
  },
  breadItemText: {
    fontSize: 10,
    color: 'white',
    marginHorizontal: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    padding: 10,
  },
  path: {
    color: 'white',
    fontSize: 9,
  },
});

module.exports = ElementProperties;
