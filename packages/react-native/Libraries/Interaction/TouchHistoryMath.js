/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

// $FlowFixMe[definition-cycle]
// $FlowFixMe[recursive-definition]
const TouchHistoryMath = {
  /**
   * This code is optimized and not intended to look beautiful. This allows
   * computing of touch centroids that have moved after `touchesChangedAfter`
   * timeStamp. You can compute the current centroid involving all touches
   * moves after `touchesChangedAfter`, or you can compute the previous
   * centroid of all touches that were moved after `touchesChangedAfter`.
   *
   * @param {TouchHistoryMath} touchHistory Standard Responder touch track
   * data.
   * @param {number} touchesChangedAfter timeStamp after which moved touches
   * are considered "actively moving" - not just "active".
   * @param {boolean} isXAxis Consider `x` dimension vs. `y` dimension.
   * @param {boolean} ofCurrent Compute current centroid for actively moving
   * touches vs. previous centroid of now actively moving touches.
   * @return {number} value of centroid in specified dimension.
   */
  centroidDimension: function (
    touchHistory: TouchHistoryMath,
    touchesChangedAfter: number,
    isXAxis: boolean,
    ofCurrent: boolean,
  ): number {
    const touchBank = touchHistory.touchBank;
    let total = 0;
    let count = 0;

    const oneTouchData =
      touchHistory.numberActiveTouches === 1
        ? touchHistory.touchBank[touchHistory.indexOfSingleActiveTouch]
        : null;

    if (oneTouchData !== null) {
      if (
        oneTouchData.touchActive &&
        oneTouchData.currentTimeStamp > touchesChangedAfter
      ) {
        total +=
          ofCurrent && isXAxis
            ? oneTouchData.currentPageX
            : ofCurrent && !isXAxis
              ? oneTouchData.currentPageY
              : !ofCurrent && isXAxis
                ? oneTouchData.previousPageX
                : oneTouchData.previousPageY;
        count = 1;
      }
    } else {
      for (let i = 0; i < touchBank.length; i++) {
        const touchTrack = touchBank[i];
        if (
          touchTrack !== null &&
          touchTrack !== undefined &&
          touchTrack.touchActive &&
          touchTrack.currentTimeStamp >= touchesChangedAfter
        ) {
          let toAdd; // Yuck, program temporarily in invalid state.
          if (ofCurrent && isXAxis) {
            toAdd = touchTrack.currentPageX;
          } else if (ofCurrent && !isXAxis) {
            toAdd = touchTrack.currentPageY;
          } else if (!ofCurrent && isXAxis) {
            toAdd = touchTrack.previousPageX;
          } else {
            toAdd = touchTrack.previousPageY;
          }
          total += toAdd;
          count++;
        }
      }
    }
    return count > 0 ? total / count : TouchHistoryMath.noCentroid;
  },

  currentCentroidXOfTouchesChangedAfter: function (
    touchHistory: TouchHistoryMath,
    touchesChangedAfter: number,
  ): number {
    return TouchHistoryMath.centroidDimension(
      touchHistory,
      touchesChangedAfter,
      true, // isXAxis
      true, // ofCurrent
    );
  },

  currentCentroidYOfTouchesChangedAfter: function (
    touchHistory: TouchHistoryMath,
    touchesChangedAfter: number,
  ): number {
    return TouchHistoryMath.centroidDimension(
      touchHistory,
      touchesChangedAfter,
      false, // isXAxis
      true, // ofCurrent
    );
  },

  previousCentroidXOfTouchesChangedAfter: function (
    touchHistory: TouchHistoryMath,
    touchesChangedAfter: number,
  ): number {
    return TouchHistoryMath.centroidDimension(
      touchHistory,
      touchesChangedAfter,
      true, // isXAxis
      false, // ofCurrent
    );
  },

  previousCentroidYOfTouchesChangedAfter: function (
    touchHistory: TouchHistoryMath,
    touchesChangedAfter: number,
  ): number {
    return TouchHistoryMath.centroidDimension(
      touchHistory,
      touchesChangedAfter,
      false, // isXAxis
      false, // ofCurrent
    );
  },

  currentCentroidX: function (touchHistory: TouchHistoryMath): number {
    return TouchHistoryMath.centroidDimension(
      touchHistory,
      0, // touchesChangedAfter
      true, // isXAxis
      true, // ofCurrent
    );
  },

  currentCentroidY: function (touchHistory: TouchHistoryMath): number {
    return TouchHistoryMath.centroidDimension(
      touchHistory,
      0, // touchesChangedAfter
      false, // isXAxis
      true, // ofCurrent
    );
  },

  noCentroid: -1,
};

module.exports = TouchHistoryMath;
