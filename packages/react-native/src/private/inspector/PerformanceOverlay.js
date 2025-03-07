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

import React from 'react';

const View = require('../../../Libraries/Components/View/View').default;
const StyleSheet = require('../../../Libraries/StyleSheet/StyleSheet').default;
const Text = require('../../../Libraries/Text/Text').default;
const PerformanceLogger =
  require('../../../Libraries/Utilities/GlobalPerformanceLogger').default;

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

export default PerformanceOverlay;
