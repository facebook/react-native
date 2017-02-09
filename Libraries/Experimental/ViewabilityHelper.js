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

/**
* A row is said to be in a "viewable" state when either of the following
* is true:
* - Occupying >= viewablePercentThreshold of the viewport
* - Entirely visible on screen
*/
const ViewabilityHelper = {
  computeViewableItems(
    viewablePercentThreshold: number,
    itemCount: number,
    scrollOffset: number,
    viewportHeight: number,
    getFrameMetrics: (index: number) => ?{length: number, offset: number},
    renderRange?: {first: number, last: number}, // Optional optimization to reduce the scan size
  ): Array<number> {
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
          viewablePercentThreshold,
          top,
          bottom,
          viewportHeight
        )) {
          viewableIndices.push(idx);
        }
      } else if (firstVisible >= 0) {
        break;
      }
    }
    return viewableIndices;
  },
};


function _isViewable(
  viewablePercentThreshold: number,
  top: number,
  bottom: number,
  viewportHeight: number
): bool {
  return _isEntirelyVisible(top, bottom, viewportHeight) ||
      _getPercentOccupied(top, bottom, viewportHeight) >=
          viewablePercentThreshold;
}

function _getPercentOccupied(
  top: number,
  bottom: number,
  viewportHeight: number
): number {
  let visibleHeight = Math.min(bottom, viewportHeight) - Math.max(top, 0);
  visibleHeight = Math.max(0, visibleHeight);
  return Math.max(0, visibleHeight * 100 / viewportHeight);
}

function _isEntirelyVisible(
  top: number,
  bottom: number,
  viewportHeight: number
): bool {
  return top >= 0 && bottom <= viewportHeight && bottom > top;
}

module.exports = ViewabilityHelper;
