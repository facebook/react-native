/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Layout} from 'react-native/Libraries/Types/CoreEventTypes';
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
   * Distance between this cell and the start of the list along the scrolling
   * axis
   */
  offset: number,
  /**
   * Whether the cell is last known to be mounted
   */
  isMounted: boolean,
};

// TODO: `inverted` can be incorporated here if it is moved to an order
// based implementation instead of transform.
export type ListOrientation = {
  horizontal: boolean,
  rtl: boolean,
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

type UnresolvedCellMetrics = {
  index: number,
  layout: Layout,
  isMounted: boolean,

  // The length of list content at the time of layout is needed to correctly
  // resolve flow relative offset in RTL. We are lazily notified of this after
  // the layout of the cell, unless the cell relayout does not cause a length
  // change. To keep stability, we use content length at time of query, or
  // unmount if never queried.
  listContentLength?: ?number,
};

/**
 * Provides an interface to query information about the metrics of a list and its cells.
 */
export default class ListMetricsAggregator {
  _averageCellLength = 0;
  _cellMetrics: {[string]: UnresolvedCellMetrics} = {};
  _contentLength: ?number;
  _highestMeasuredCellIndex = 0;
  _measuredCellsLength = 0;
  _measuredCellsCount = 0;
  _orientation: ListOrientation = {
    horizontal: false,
    rtl: false,
  };

  /**
   * Notify the ListMetricsAggregator that a cell has been laid out.
   *
   * @returns whether the cell layout has changed since last notification
   */
  notifyCellLayout({
    cellIndex,
    cellKey,
    orientation,
    layout,
  }: {
    cellIndex: number,
    cellKey: string,
    orientation: ListOrientation,
    layout: Layout,
  }): boolean {
    this._invalidateIfOrientationChanged(orientation);

    const next: UnresolvedCellMetrics = {
      index: cellIndex,
      layout: layout,
      isMounted: true,
    };
    const curr = this._cellMetrics[cellKey];

    if (
      !curr ||
      this._selectOffset(next.layout) !== this._selectOffset(curr.layout) ||
      this._selectLength(next.layout) !== this._selectLength(curr.layout) ||
      (curr.listContentLength != null &&
        curr.listContentLength !== this._contentLength)
    ) {
      if (curr) {
        const dLength =
          this._selectLength(next.layout) - this._selectLength(curr.layout);
        this._measuredCellsLength += dLength;
      } else {
        this._measuredCellsLength += this._selectLength(next.layout);
        this._measuredCellsCount += 1;
      }

      this._averageCellLength =
        this._measuredCellsLength / this._measuredCellsCount;
      this._cellMetrics[cellKey] = next;
      this._highestMeasuredCellIndex = Math.max(
        this._highestMeasuredCellIndex,
        cellIndex,
      );
      return true;
    } else {
      this._cellMetrics[cellKey].isMounted = true;
      return false;
    }
  }

  /**
   * Notify ListMetricsAggregator that a cell has been unmounted.
   */
  notifyCellUnmounted(cellKey: string): void {
    const curr = this._cellMetrics[cellKey];
    if (curr) {
      this._cellMetrics[cellKey] = {
        ...curr,
        isMounted: false,
        listContentLength: curr.listContentLength ?? this._contentLength,
      };
    }
  }

  /**
   * Notify ListMetricsAggregator that the lists content container has been laid out.
   */
  notifyListContentLayout({
    orientation,
    layout,
  }: {
    orientation: ListOrientation,
    layout: $ReadOnly<{width: number, height: number}>,
  }): void {
    this._invalidateIfOrientationChanged(orientation);
    const newLength = this._selectLength(layout);
    this._contentLength = newLength;
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
      'Tried to get metrics for out of range cell index ' + index,
    );
    const keyExtractor = props.keyExtractor ?? defaultKeyExtractor;
    const frame = this._cellMetrics[keyExtractor(getItem(data, index), index)];
    if (frame && frame.index === index) {
      return this._resolveCellMetrics(frame);
    }

    if (getItemLayout) {
      const {length, offset} = getItemLayout(data, index);
      return {index, length, offset, isMounted: true};
    }

    return null;
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

  /**
   * Returns the length of all ScrollView content along the scrolling axis.
   */
  getContentLength(): number {
    return this._contentLength ?? 0;
  }

  /**
   * Whether a content length has been observed
   */
  hasContentLength(): boolean {
    return this._contentLength != null;
  }

  /**
   * Converts a cartesian offset along the x or y axis to a flow-relative
   * offset, (e.g. starting from the left in LTR, but right in RTL).
   */
  flowRelativeOffset(layout: Layout, referenceContentLength?: ?number): number {
    const {horizontal, rtl} = this._orientation;

    if (horizontal && rtl) {
      const contentLength = referenceContentLength ?? this._contentLength;
      invariant(
        contentLength != null,
        'ListMetricsAggregator must be notified of list content layout before resolving offsets',
      );
      return contentLength - this._selectOffset(layout);
    } else {
      return this._selectOffset(layout);
    }
  }

  /**
   * Converts a flow-relative offset to a cartesian offset
   */
  cartesianOffset(flowRelativeOffset: number): number {
    const {horizontal, rtl} = this._orientation;

    if (horizontal && rtl) {
      invariant(
        this._contentLength != null,
        'ListMetricsAggregator must be notified of list content layout before resolving offsets',
      );
      return this._contentLength - flowRelativeOffset;
    } else {
      return flowRelativeOffset;
    }
  }

  _invalidateIfOrientationChanged(orientation: ListOrientation): void {
    if (orientation.rtl !== this._orientation.rtl) {
      this._cellMetrics = {};
    }

    if (orientation.horizontal !== this._orientation.horizontal) {
      this._averageCellLength = 0;
      this._contentLength = 0;
      this._highestMeasuredCellIndex = 0;
      this._measuredCellsLength = 0;
      this._measuredCellsCount = 0;
    }

    this._orientation = orientation;
  }

  _selectLength({
    width,
    height,
  }: $ReadOnly<{width: number, height: number, ...}>): number {
    return this._orientation.horizontal ? width : height;
  }

  _selectOffset({x, y}: $ReadOnly<{x: number, y: number, ...}>): number {
    return this._orientation.horizontal ? x : y;
  }

  _resolveCellMetrics(metrics: UnresolvedCellMetrics): CellMetrics {
    metrics.listContentLength ??= this._contentLength;
    const {index, layout, isMounted, listContentLength} = metrics;

    return {
      index,
      length: this._selectLength(layout),
      isMounted,
      offset: this.flowRelativeOffset(layout, listContentLength),
    };
  }
}
