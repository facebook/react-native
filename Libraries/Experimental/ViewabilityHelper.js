/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ViewabilityHelper
 * @flow
 */
'use strict';

const invariant = require('invariant');

export type Viewable = {item: any, key: string, index: ?number, isViewable: boolean, section?: any};

export type ViewabilityConfig = {
  /**
   * Minimum amount of time (in milliseconds) that an item must be physically viewable before the
   * viewability callback will be fired. A high number means that scrolling through content without
   * stopping will not mark the content as viewable.
   */
  minViewTime?: number,

  /**
   * Percent of viewport that must be covered for a partially occluded item to count as
   * "viewable", 0-100. Fully visible items are always considered viewable. A value of 0 means
   * that a single pixel in the viewport makes the item viewable, and a value of 100 means that
   * an item must be either entirely visible or cover the entire viewport to count as viewable.
   */
  viewAreaCoveragePercentThreshold?: number,

  /**
   * Similar to `viewAreaPercentThreshold`, but considers the percent of the item that is visible,
   * rather than the fraction of the viewable area it covers.
   */
  itemVisiblePercentThreshold?: number,

  /**
   * Nothing is considered viewable until the user scrolls (tbd: or taps) the screen after render.
   */
  waitForInteraction?: boolean,
}

/**
* A row is said to be in a "viewable" state when either of the following
* is true:
* - Occupying >= viewablePercentThreshold of the viewport
* - Entirely visible on screen
*/
class ViewabilityHelper {
  _config: ViewabilityConfig;
  _viewableItems: Map<string, Viewable> = new Map();

  constructor(config: ViewabilityConfig = {viewAreaCoveragePercentThreshold: 0}) {
    this._config = config;
  }

  remove() {
    // clear all timeouts...
  }

  computeViewableItems(
    itemCount: number,
    scrollOffset: number,
    viewportHeight: number,
    getFrameMetrics: (index: number) => ?{length: number, offset: number},
    renderRange?: {first: number, last: number}, // Optional optimization to reduce the scan size
  ): Array<number> {
    const {itemVisiblePercentThreshold, viewAreaCoveragePercentThreshold} = this._config;
    const viewAreaMode = viewAreaCoveragePercentThreshold != null;
    const viewablePercentThreshold = viewAreaMode ?
      viewAreaCoveragePercentThreshold :
      itemVisiblePercentThreshold;
    invariant(
      viewablePercentThreshold != null &&
      (itemVisiblePercentThreshold != null) !== (viewAreaCoveragePercentThreshold != null),
      'Must set exactly one of itemVisiblePercentThreshold or viewAreaCoveragePercentThreshold',
    );
    const viewableIndices = [];
    if (itemCount === 0) {
      return viewableIndices;
    }
    let firstVisible = -1;
    const {first, last} = renderRange || {first: 0, last: itemCount - 1};
    invariant(
      last < itemCount,
      'Invalid render range ' + JSON.stringify({renderRange, itemCount})
    );
    for (let idx = first; idx <= last; idx++) {
      const metrics = getFrameMetrics(idx);
      if (!metrics) {
        continue;
      }
      const top = metrics.offset - scrollOffset;
      const bottom = top + metrics.length;
      if ((top < viewportHeight) && (bottom > 0)) {
        firstVisible = idx;
        if (_isViewable(
          viewAreaMode,
          viewablePercentThreshold,
          top,
          bottom,
          viewportHeight,
          metrics.length,
        )) {
          viewableIndices.push(idx);
        }
      } else if (firstVisible >= 0) {
        break;
      }
    }
    return viewableIndices;
  }

  onUpdate(
    itemCount: number,
    scrollOffset: number,
    viewportHeight: number,
    getFrameMetrics: (index: number) => ?{length: number, offset: number},
    createViewable: (index: number, isViewable: boolean) => Viewable,
    onViewableItemsChanged: ({viewableItems: Array<Viewable>, changed: Array<Viewable>}) => void,
    renderRange?: {first: number, last: number}, // Optional optimization to reduce the scan size
  ): void {
    let viewableIndices = [];
    if (itemCount) {
      viewableIndices = this.computeViewableItems(
        itemCount,
        scrollOffset,
        viewportHeight,
        getFrameMetrics,
        renderRange,
      );
    }
    const prevItems = this._viewableItems;
    const nextItems = new Map(
      viewableIndices.map(ii => {
        const viewable = createViewable(ii, true);
        return [viewable.key, viewable];
      })
    );

    const changed = [];
    for (const [key, viewable] of nextItems) {
      if (!prevItems.has(key)) {
        changed.push(viewable);
      }
    }
    for (const [key, viewable] of prevItems) {
      if (!nextItems.has(key)) {
        changed.push({...viewable, isViewable: false});
      }
    }
    if (changed.length > 0) {
      onViewableItemsChanged({viewableItems: Array.from(nextItems.values()), changed});
      this._viewableItems = nextItems;
    }
  }
}


function _isViewable(
  viewAreaMode: boolean,
  viewablePercentThreshold: number,
  top: number,
  bottom: number,
  viewportHeight: number,
  itemLength: number,
): bool {
  if (_isEntirelyVisible(top, bottom, viewportHeight)) {
    return true;
  } else {
    const pixels = _getPixelsVisible(top, bottom, viewportHeight);
    const percent = 100 * (viewAreaMode ? pixels / viewportHeight : pixels / itemLength);
    return percent >= viewablePercentThreshold;
  }
}

function _getPixelsVisible(
  top: number,
  bottom: number,
  viewportHeight: number
): number {
  const visibleHeight = Math.min(bottom, viewportHeight) - Math.max(top, 0);
  return Math.max(0, visibleHeight);
}

function _isEntirelyVisible(
  top: number,
  bottom: number,
  viewportHeight: number
): bool {
  return top >= 0 && bottom <= viewportHeight && bottom > top;
}

module.exports = ViewabilityHelper;
