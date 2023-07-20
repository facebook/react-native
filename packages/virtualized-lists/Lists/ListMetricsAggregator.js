/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Props as VirtualizedListProps} from './VirtualizedListProps';
import {keyExtractor as defaultKeyExtractor} from './VirtualizeUtils';

import invariant from 'invariant';

export type CellMetrics = {
  /**
   * Index of the item in the list
   */
  index: number,
  /**
   * Length of the cell along the scrolling axis
   */
  length: number,
  /**
   * Offset to the cell along the scrolling axis
   */
  offset: number,
  /**
   * Whether the cell is last known to be mounted
   */
  isMounted: boolean,
};

/**
 * Subset of VirtualizedList props needed to calculate cell metrics
 */
export type CellMetricProps = {
  data: VirtualizedListProps['data'],
  getItemCount: VirtualizedListProps['getItemCount'],
  getItem: VirtualizedListProps['getItem'],
  getItemLayout?: VirtualizedListProps['getItemLayout'],
  keyExtractor?: VirtualizedListProps['keyExtractor'],
  ...
};

/**
 * Provides an interface to query information about the metrics of a list and its cells.
 */
export default class ListMetricsAggregator {
  _averageCellLength = 0;
  _frames: {[string]: CellMetrics} = {};
  _highestMeasuredCellIndex = 0;
  _totalCellLength = 0;
  _totalCellsMeasured = 0;

  /**
   * Notify the ListMetricsAggregator that a cell has been laid out.
   *
   * @returns whether the cell layout has changed since last notification
   */
  notifyCellLayout(
    cellKey: string,
    index: number,
    length: number,
    offset: number,
  ): boolean {
    const next: CellMetrics = {
      offset,
      length,
      index,
      isMounted: true,
    };
    const curr = this._frames[cellKey];
    if (
      !curr ||
      next.offset !== curr.offset ||
      next.length !== curr.length ||
      index !== curr.index
    ) {
      this._totalCellLength += next.length - (curr ? curr.length : 0);
      this._totalCellsMeasured += curr ? 0 : 1;
      this._averageCellLength =
        this._totalCellLength / this._totalCellsMeasured;
      this._frames[cellKey] = next;
      this._highestMeasuredCellIndex = Math.max(
        this._highestMeasuredCellIndex,
        index,
      );
      return true;
    } else {
      this._frames[cellKey].isMounted = true;
      return false;
    }
  }

  /**
   * Notify ListMetricsAggregator that a cell has been unmounted.
   */
  notifyCellUnmounted(cellKey: string): void {
    const curr = this._frames[cellKey];
    if (curr) {
      this._frames[cellKey] = {...curr, isMounted: false};
    }
  }

  /**
   * Return the average length of the cells which have been measured
   */
  getAverageCellLength(): number {
    return this._averageCellLength;
  }

  /**
   * Return the highest measured cell index
   */
  getHighestMeasuredCellIndex(): number {
    return this._highestMeasuredCellIndex;
  }

  /**
   * Returns the exact metrics of a cell if it has already been laid out,
   * otherwise an estimate based on the average length of previously measured
   * cells
   */
  getCellMetricsApprox(index: number, props: CellMetricProps): CellMetrics {
    const frame = this.getCellMetrics(index, props);
    if (frame && frame.index === index) {
      // check for invalid frames due to row re-ordering
      return frame;
    } else {
      const {data, getItemCount} = props;
      invariant(
        index >= 0 && index < getItemCount(data),
        'Tried to get frame for out of range index ' + index,
      );
      return {
        length: this._averageCellLength,
        offset: this._averageCellLength * index,
        index,
        isMounted: false,
      };
    }
  }

  /**
   * Returns the exact metrics of a cell if it has already been laid out
   */
  getCellMetrics(index: number, props: CellMetricProps): ?CellMetrics {
    const {data, getItem, getItemCount, getItemLayout} = props;
    invariant(
      index >= 0 && index < getItemCount(data),
      'Tried to get frame for out of range index ' + index,
    );
    const keyExtractor = props.keyExtractor ?? defaultKeyExtractor;
    const frame = this._frames[keyExtractor(getItem(data, index), index)];
    if (!frame || frame.index !== index) {
      if (getItemLayout) {
        const {length, offset} = getItemLayout(data, index);
        return {index, length, offset, isMounted: true};
      }
    }
    return frame;
  }

  /**
   * Gets an approximate offset to an item at a given index. Supports
   * fractional indices.
   */
  getCellOffsetApprox(index: number, props: CellMetricProps): number {
    if (Number.isInteger(index)) {
      return this.getCellMetricsApprox(index, props).offset;
    } else {
      const frameMetrics = this.getCellMetricsApprox(Math.floor(index), props);
      const remainder = index - Math.floor(index);
      return frameMetrics.offset + remainder * frameMetrics.length;
    }
  }
}
