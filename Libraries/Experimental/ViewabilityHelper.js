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

/**
* A row is said to be in a "viewable" state when either of the following
* is true:
* - Occupying >= viewablePercentThreshold of the viewport
* - Entirely visible on screen
*/
const ViewabilityHelper = {
  computeViewableRows(
    viewablePercentThreshold: number,
    rowFrames: {[key: string]: Object},
    data: Array<{rowKey: string, rowData: any}>,
    scrollOffsetY: number,
    viewportHeight: number
  ): Array<number> {
    const viewableRows = [];
    let firstVisible = -1;
    for (let idx = 0; idx < data.length; idx++) {
      const frame = rowFrames[data[idx].rowKey];
      if (!frame) {
        continue;
      }
      const top = frame.y - scrollOffsetY;
      const bottom = top + frame.height;
      if ((top < viewportHeight) && (bottom > 0)) {
        firstVisible = idx;
        if (_isViewable(
          viewablePercentThreshold,
          top,
          bottom,
          viewportHeight
        )) {
          viewableRows.push(idx);
        }
      } else if (firstVisible >= 0) {
        break;
      }
    }
    return viewableRows;
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
