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

const BoxInspector = require('BoxInspector');
const PropTypes = require('prop-types');
const React = require('React');
const StyleInspector = require('StyleInspector');
const StyleSheet = require('StyleSheet');
const Text = require('Text');
const TouchableHighlight = require('TouchableHighlight');
const TouchableWithoutFeedback = require('TouchableWithoutFeedback');
const View = require('View');

const flattenStyle = require('flattenStyle');
const mapWithSeparator = require('mapWithSeparator');
const openFileInEditor = require('openFileInEditor');

class ElementProperties extends React.Component<{
  hierarchy: Array<$FlowFixMe>,
  style?: Object | Array<$FlowFixMe> | number,
  source?: {
    fileName?: string,
    lineNumber?: number,
  },
}> {
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
    const style = flattenStyle(this.props.style);
    // $FlowFixMe found when converting React.createClass to ES6
    const selection = this.props.selection;
    let openFileButton;
    const source = this.props.source;
    const {fileName, lineNumber} = source || {};
    if (fileName && lineNumber) {
      const parts = fileName.split('/');
      const fileNameShort = parts[parts.length - 1];
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
              (hierarchyItem, i) => (
                <TouchableHighlight
                  key={'item-' + i}
                  style={[styles.breadItem, i === selection && styles.selected]}
                  // $FlowFixMe found when converting React.createClass to ES6
                  onPress={() => this.props.setSelection(i)}>
                  <Text style={styles.breadItemText}>
                    {hierarchyItem.name}
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

const styles = StyleSheet.create({
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
