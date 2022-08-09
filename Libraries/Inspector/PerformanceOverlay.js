/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const PerformanceLogger = require('../Utilities/GlobalPerformanceLogger');
const React = require('react');
const StyleSheet = require('../StyleSheet/StyleSheet');
const Text = require('../Text/Text');
const View = require('../Components/View/View');

class PerformanceOverlay extends React.Component<{...}> {
  render(): React.Node {
    const perfLogs = PerformanceLogger.getTimespans();
    const items = [];

    for (const key in perfLogs) {
      if (perfLogs[key]?.totalTime) {
        const unit = key === 'BundleSize' ? 'b' : 'ms';
        items.push(
          <View style={styles.row} key={key}>
            <Text style={[styles.text, styles.label]}>{key}</Text>
            <Text style={[styles.text, styles.totalTime]}>
              {perfLogs[key].totalTime + unit}
            </Text>
          </View>,
        );
      }
    }

    return <View style={styles.container}>{items}</View>;
  }
}

const styles = StyleSheet.create({
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
