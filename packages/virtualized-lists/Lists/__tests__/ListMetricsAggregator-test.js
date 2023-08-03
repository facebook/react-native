/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {CellMetricProps} from '../ListMetricsAggregator';

import ListMetricsAggregator from '../ListMetricsAggregator';

import nullthrows from 'nullthrows';

describe('ListMetricsAggregator', () => {
  it('keeps a running average length of measured cells', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: false, rtl: false};

    expect(listMetrics.getAverageCellLength()).toEqual(0);

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation,
      layout: {
        height: 10,
        width: 5,
        x: 0,
        y: 0,
      },
    });
    expect(listMetrics.getAverageCellLength()).toEqual(10);

    listMetrics.notifyCellLayout({
      cellIndex: 1,
      cellKey: '1',
      orientation,
      layout: {
        height: 20,
        width: 5,
        x: 0,
        y: 10,
      },
    });
    expect(listMetrics.getAverageCellLength()).toEqual(15);
  });

  it('adjusts the average cell length when layout changes', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: false, rtl: false};

    expect(listMetrics.getAverageCellLength()).toEqual(0);

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation,
      layout: {
        height: 10,
        width: 5,
        x: 0,
        y: 0,
      },
    });
    expect(listMetrics.getAverageCellLength()).toEqual(10);

    listMetrics.notifyCellLayout({
      cellIndex: 1,
      cellKey: '1',
      orientation,
      layout: {
        height: 20,
        width: 5,
        x: 0,
        y: 10,
      },
    });
    expect(listMetrics.getAverageCellLength()).toEqual(15);

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation,
      layout: {
        height: 20,
        width: 5,
        x: 0,
        y: 0,
      },
    });
    expect(listMetrics.getAverageCellLength()).toEqual(20);
  });

  it('keeps track of the highest measured cell index', () => {
    const listMetrics = new ListMetricsAggregator();
    const orientation = {horizontal: false, rtl: false};

    expect(listMetrics.getHighestMeasuredCellIndex()).toEqual(0);

    listMetrics.notifyCellLayout({
      cellIndex: 0,
      cellKey: '0',
      orientation,
      layout: {
        height: 10,
        width: 5,
        x: 0,
        y: 0,
      },
    });
    expect(listMetrics.getHighestMeasuredCellIndex()).toEqual(0);

    listMetrics.notifyCellLayout({
      cellIndex: 1,
      cellKey: '1',
      orientation,
      layout: {
        height: 20,
        width: 5,
        x: 0,
        y: 10,
      },
    });
    expect(listMetrics.getHighestMeasuredCellIndex()).toEqual(1);
  });
});
