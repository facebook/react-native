/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule VirtualizeUtils
 * @flow
 * @format
 */
'use strict';

const invariant = require('fbjs/lib/invariant');

/**
 * Used to find the indices of the frames that overlap the given offsets. Useful for finding the
 * items that bound different windows of content, such as the visible area or the buffered overscan
 * area.
 */
function elementsThatOverlapOffsets(
  offsets: Array<number>,
  itemCount: number,
  getFrameMetrics: (index: number) => {length: number, offset: number},
): Array<number> {
  const out = [];
  for (let ii = 0; ii < itemCount; ii++) {
    const frame = getFrameMetrics(ii);
    const trailingOffset = frame.offset + frame.length;
    for (let kk = 0; kk < offsets.length; kk++) {
      if (out[kk] == null && trailingOffset >= offsets[kk]) {
        out[kk] = ii;
        if (kk === offsets.length - 1) {
          invariant(
            out.length === offsets.length,
            'bad offsets input, should be in increasing order ' +
              JSON.stringify(offsets),
          );
          return out;
        }
      }
    }
  }
  return out;
}

/**
 * Computes the number of elements in the `next` range that are new compared to the `prev` range.
 * Handy for calculating how many new items will be rendered when the render window changes so we
 * can restrict the number of new items render at once so that content can appear on the screen
 * faster.
 */
function newRangeCount(
  prev: {first: number, last: number},
  next: {first: number, last: number},
): number {
  return (
    next.last -
    next.first +
    1 -
    Math.max(
      0,
      1 + Math.min(next.last, prev.last) - Math.max(next.first, prev.first),
    )
  );
}

/**
 * Custom logic for determining which items should be rendered given the current frame and scroll
 * metrics, as well as the previous render state. The algorithm may evolve over time, but generally
 * prioritizes the visible area first, then expands that with overscan regions ahead and behind,
 * biased in the direction of scroll.
 */
function computeWindowedRenderLimits(
  props: {
    data: any,
    getItemCount: (data: any) => number,
    maxToRenderPerBatch: number,
    windowSize: number,
  },
  prev: {first: number, last: number},
  getFrameMetricsApprox: (index: number) => {length: number, offset: number},
  scrollMetrics: {
    dt: number,
    offset: number,
    velocity: number,
    visibleLength: number,
  },
): {first: number, last: number} {
  const {data, getItemCount, maxToRenderPerBatch, windowSize} = props;
  const itemCount = getItemCount(data);
  if (itemCount === 0) {
    return prev;
  }
  const {offset, velocity, visibleLength} = scrollMetrics;

  // Start with visible area, then compute maximum overscan region by expanding from there, biased
  // in the direction of scroll. Total overscan area is capped, which should cap memory consumption
  // too.
  const visibleBegin = Math.max(0, offset);
  const visibleEnd = visibleBegin + visibleLength;
  const overscanLength = (windowSize - 1) * visibleLength;

  // Considering velocity seems to introduce more churn than it's worth.
  const leadFactor = 0.5; // Math.max(0, Math.min(1, velocity / 25 + 0.5));

  const fillPreference =
    velocity > 1 ? 'after' : velocity < -1 ? 'before' : 'none';

  const overscanBegin = Math.max(
    0,
    visibleBegin - (1 - leadFactor) * overscanLength,
  );
  const overscanEnd = Math.max(0, visibleEnd + leadFactor * overscanLength);

  // Find the indices that correspond to the items at the render boundaries we're targetting.
  let [overscanFirst, first, last, overscanLast] = elementsThatOverlapOffsets(
    [overscanBegin, visibleBegin, visibleEnd, overscanEnd],
    props.getItemCount(props.data),
    getFrameMetricsApprox,
  );
  overscanFirst = overscanFirst == null ? 0 : overscanFirst;
  first = first == null ? Math.max(0, overscanFirst) : first;
  overscanLast = overscanLast == null ? itemCount - 1 : overscanLast;
  last =
    last == null
      ? Math.min(overscanLast, first + maxToRenderPerBatch - 1)
      : last;
  const visible = {first, last};

  // We want to limit the number of new cells we're rendering per batch so that we can fill the
  // content on the screen quickly. If we rendered the entire overscan window at once, the user
  // could be staring at white space for a long time waiting for a bunch of offscreen content to
  // render.
  let newCellCount = newRangeCount(prev, visible);

  while (true) {
    if (first <= overscanFirst && last >= overscanLast) {
      // If we fill the entire overscan range, we're done.
      break;
    }
    const maxNewCells = newCellCount >= maxToRenderPerBatch;
    const firstWillAddMore = first <= prev.first || first > prev.last;
    const firstShouldIncrement =
      first > overscanFirst && (!maxNewCells || !firstWillAddMore);
    const lastWillAddMore = last >= prev.last || last < prev.first;
    const lastShouldIncrement =
      last < overscanLast && (!maxNewCells || !lastWillAddMore);
    if (maxNewCells && !firstShouldIncrement && !lastShouldIncrement) {
      // We only want to stop if we've hit maxNewCells AND we cannot increment first or last
      // without rendering new items. This let's us preserve as many already rendered items as
      // possible, reducing render churn and keeping the rendered overscan range as large as
      // possible.
      break;
    }
    if (
      firstShouldIncrement &&
      !(fillPreference === 'after' && lastShouldIncrement && lastWillAddMore)
    ) {
      if (firstWillAddMore) {
        newCellCount++;
      }
      first--;
    }
    if (
      lastShouldIncrement &&
      !(fillPreference === 'before' && firstShouldIncrement && firstWillAddMore)
    ) {
      if (lastWillAddMore) {
        newCellCount++;
      }
      last++;
    }
  }
  if (
    !(
      last >= first &&
      first >= 0 &&
      last < itemCount &&
      first >= overscanFirst &&
      last <= overscanLast &&
      first <= visible.first &&
      last >= visible.last
    )
  ) {
    throw new Error(
      'Bad window calculation ' +
        JSON.stringify({
          first,
          last,
          itemCount,
          overscanFirst,
          overscanLast,
          visible,
        }),
    );
  }
  return {first, last};
}

const VirtualizeUtils = {
  computeWindowedRenderLimits,
  elementsThatOverlapOffsets,
  newRangeCount,
};

module.exports = VirtualizeUtils;
