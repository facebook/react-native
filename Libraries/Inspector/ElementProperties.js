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
var React = require('React');
var StyleInspector = require('StyleInspector');
var StyleSheet = require('StyleSheet');
var Text = require('Text');
var TouchableHighlight = require('TouchableHighlight');
var TouchableWithoutFeedback = require('TouchableWithoutFeedback');
var View = require('View');

var flattenStyle = require('flattenStyle');
var mapWithSeparator = require('mapWithSeparator');
var openFileInEditor = require('openFileInEditor');

var PropTypes = React.PropTypes;

class ElementProperties extends React.Component {
  props: {
    hierarchy: Array<$FlowFixMe>,
    style?: Object | Array<$FlowFixMe> | number,
    source?: {
      fileName?: string,
      lineNumber?: number,
    },
  };

  static propTypes = {
    hierarchy: PropTypes.array.isRequired,
    style: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.array,
      PropTypes.number,
    ]),
    source: PropTypes.shape({
      fileName: PropTypes.string,
      lineNumber: PropTypes.number,
    }),
  };

  render() {
    var style = flattenStyle(this.props.style);
    // $FlowFixMe found when converting React.createClass to ES6
    var selection = this.props.selection;
    var openFileButton;
    var source = this.props.source;
    var {fileName, lineNumber} = source || {};
    if (fileName && lineNumber) {
      var parts = fileName.split('/');
      var fileNameShort = parts[parts.length - 1];
      openFileButton = (
        <TouchableHighlight
          style={styles.openButton}
          onPress={openFileInEditor.bind(null, fileName, lineNumber)}>
          <Text style={styles.openButtonTitle} numberOfLines={1}>
            {fileNameShort}:{lineNumber}
          </Text>
        </TouchableHighlight>
      );
    }
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
                  key={'item-' + i}
                  style={[styles.breadItem, i === selection && styles.selected]}
                  // $FlowFixMe found when converting React.createClass to ES6
                  onPress={() => this.props.setSelection(i)}>
                  <Text style={styles.breadItemText}>
                    {getInstanceName(item)}
                  </Text>
                </TouchableHighlight>
              ),
              (i) => (
                <Text key={'sep-' + i} style={styles.breadSep}>
                  &#9656;
                </Text>
              )
            )}
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <StyleInspector style={style} />
              {openFileButton}
            </View>
            {
              // $FlowFixMe found when converting React.createClass to ES6
            <BoxInspector style={style} frame={this.props.frame} />}
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

function getInstanceName(instance) {
  if (instance.getName) {
    return instance.getName();
  }
  if (instance.constructor && instance.constructor.displayName) {
    return instance.constructor.displayName;
  }
  return 'Unknown';
}

var styles = StyleSheet.create({
  breadSep: {
    fontSize: 8,
    color: 'white',
  },
  breadcrumb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
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
  col: {
    flex: 1,
  },
  info: {
    padding: 10,
  },
  path: {
    color: 'white',
    fontSize: 9,
  },
  openButton: {
    padding: 10,
    backgroundColor: '#000',
    marginVertical: 5,
    marginRight: 5,
    borderRadius: 2,
  },
  openButtonTitle: {
    color: 'white',
    fontSize: 8,
  }
});

module.exports = ElementProperties;
