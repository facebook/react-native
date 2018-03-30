/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule PerformanceOverlay
 * @flow
 */
'use strict';

var PerformanceLogger = require('PerformanceLogger');
var React = require('React');
var StyleSheet = require('StyleSheet');
var Text = require('Text');
var View = require('View');

class PerformanceOverlay extends React.Component<{}> {
  render() {
    var perfLogs = PerformanceLogger.getTimespans();
    var items = [];

    for (var key in perfLogs) {
      if (perfLogs[key].totalTime) {
        var unit = (key === 'BundleSize') ? 'b' : 'ms';
        items.push(
          <View style={styles.row} key={key}>
            <Text style={[styles.text, styles.label]}>{key}</Text>
            <Text style={[styles.text, styles.totalTime]}>
              {perfLogs[key].totalTime + unit}
            </Text>
          </View>
        );
      }
    }

    return (
      <View style={styles.container}>
        {items}
      </View>
    );
  }
}

var styles = StyleSheet.create({
  container: {
    height: 100,
    paddingTop: 10,
  },
  label: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  text: {
    color: 'white',
    fontSize: 12,
  },
  totalTime: {
    paddingRight: 100,
  },
});

module.exports = PerformanceOverlay;
