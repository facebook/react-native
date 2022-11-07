/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {FrameMetricProps} from './VirtualizedListProps';

const invariant = require('invariant');

export type ViewToken = {
  item: any,
  key: string,
  index: ?number,
  isViewable: boolean,
  section?: any,
  ...
};

export type ViewabilityConfigCallbackPair = {
  viewabilityConfig: ViewabilityConfig,
  onViewableItemsChanged: (info: {
    viewableItems: Array<ViewToken>,
    changed: Array<ViewToken>,
    ...
  }) => void,
  ...
};

export type ViewabilityConfig = {|
  /**
   * Minimum amount of time (in milliseconds) that an item must be physically viewable before the
   * viewability callback will be fired. A high number means that scrolling through content without
   * stopping will not mark the content as viewable.
   */
  minimumViewTime?: number,

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
   * Nothing is considered viewable until the user scrolls or `recordInteraction` is called after
   * render.
   */
  waitForInteraction?: boolean,
|};

/**
 * A Utility class for calculating viewable items based on current metrics like scroll position and
 * layout.
 *
 * An item is said to be in a "viewable" state when any of the following
 * is true for longer than `minimumViewTime` milliseconds (after an interaction if `waitForInteraction`
 * is true):
 *
 * - Occupying >= `viewAreaCoveragePercentThreshold` of the view area XOR fraction of the item
 *   visible in the view area >= `itemVisiblePercentThreshold`.
 * - Entirely visible on screen
 */
class ViewabilityHelper {
  _config: ViewabilityConfig;
  _hasInteracted: boolean = false;
  _timers: Set<number> = new Set();
  _viewableIndices: Array<number> = [];
  _viewableItems: Map<string, ViewToken> = new Map();
  _parentWasViewable: ?boolean = undefined;

  constructor(
    config: ViewabilityConfig = {viewAreaCoveragePercentThreshold: 0},
  ) {
    this._config = config;
  }

  /**
   * Cleanup, e.g. on unmount. Clears any pending timers.
   */
  dispose() {
    /* $FlowFixMe[incompatible-call] (>=0.63.0 site=react_native_fb) This
     * comment suppresses an error found when Flow v0.63 was deployed. To see
     * the error delete this comment and run Flow. */
    this._timers.forEach(clearTimeout);
  }

  /**
   * Determines which items are viewable based on the current metrics and config.
   */
  computeViewableItems(
    props: FrameMetricProps,
    isParentViewable: ?boolean,
    scrollOffset: number,
    viewportSize: number,
    getFrameMetrics: (
      index: number,
      props: FrameMetricProps,
    ) => ?{
      length: number,
      offset: number,
      ...
    },
    // Optional optimization to reduce the scan size
    renderRange?: {
      first: number,
      last: number,
      ...
    },
  ): Array<number> {
    const itemCount = props.getItemCount(props.data);
    const {itemVisiblePercentThreshold, viewAreaCoveragePercentThreshold} =
      this._config;
    const viewAreaMode = viewAreaCoveragePercentThreshold != null;
    const viewablePercentThreshold = viewAreaMode
      ? viewAreaCoveragePercentThreshold
      : itemVisiblePercentThreshold;
    invariant(
      viewablePercentThreshold != null &&
        (itemVisiblePercentThreshold != null) !==
          (viewAreaCoveragePercentThreshold != null),
      'Must set exactly one of itemVisiblePercentThreshold or viewAreaCoveragePercentThreshold',
    );
    const viewableIndices = [];
    if (itemCount === 0) {
      return viewableIndices;
    }
    let firstVisible = -1;
    const {first, last} = renderRange || {first: 0, last: itemCount - 1};
    if (last >= itemCount) {
      console.warn(
        'Invalid render range computing viewability ' +
          JSON.stringify({renderRange, itemCount}),
      );
      return [];
    }
    for (let idx = first; idx <= last; idx++) {
      const metrics = getFrameMetrics(idx, props);
      if (!metrics) {
        continue;
      }
      const start = metrics.offset - scrollOffset;
      const end = start + metrics.length;
      if (start < viewportSize && end > 0) {
        firstVisible = idx;
        if (
          _isViewable(
            viewAreaMode,
            isParentViewable,
            viewablePercentThreshold,
            start,
            end,
            viewportSize,
            metrics.length,
          )
        ) {
          viewableIndices.push(idx);
        }
      } else if (firstVisible >= 0) {
        break;
      }
    }
    return viewableIndices;
  }

  /**
   * Figures out which items are viewable and how that has changed from before and calls
   * `onViewableItemsChanged` as appropriate.
   */
  onUpdate(
    props: FrameMetricProps,
    isParentViewable: ?boolean,
    scrollOffset: number,
    viewportSize: number,
    getFrameMetrics: (
      index: number,
      props: FrameMetricProps,
    ) => ?{
      length: number,
      offset: number,
      ...
    },
    createViewToken: (
      index: number,
      isViewable: boolean,
      props: FrameMetricProps,
    ) => ViewToken,
    onViewableItemsChanged: ({
      viewableItems: Array<ViewToken>,
      changed: Array<ViewToken>,
      ...
    }) => void,
    // Optional optimization to reduce the scan size
    renderRange?: {
      first: number,
      last: number,
      ...
    },
  ): void {
    const itemCount = props.getItemCount(props.data);
    if (
      (this._config.waitForInteraction && !this._hasInteracted) ||
      itemCount === 0 ||
      !getFrameMetrics(0, props)
    ) {
      return;
    }
    let viewableIndices: Array<number> = [];
    if (itemCount) {
      viewableIndices = this.computeViewableItems(
        props,
        isParentViewable,
        scrollOffset,
        viewportSize,
        getFrameMetrics,
        renderRange,
      );
    }
    if (
      isParentViewable === this._parentWasViewable &&
      this._viewableIndices.length === viewableIndices.length &&
      this._viewableIndices.every((v, ii) => v === viewableIndices[ii])
    ) {
      // We might get a lot of scroll events where visibility doesn't change and we don't want to do
      // extra work in those cases.
      return;
    }
    this._viewableIndices = viewableIndices;
    if (this._config.minimumViewTime) {
      const handle: TimeoutID = setTimeout(() => {
        /* $FlowFixMe[incompatible-call] (>=0.63.0 site=react_native_fb) This
         * comment suppresses an error found when Flow v0.63 was deployed. To
         * see the error delete this comment and run Flow. */
        this._timers.delete(handle);
        this._onUpdateSync(
          props,
          viewableIndices,
          onViewableItemsChanged,
          createViewToken,
        );
      }, this._config.minimumViewTime);
      /* $FlowFixMe[incompatible-call] (>=0.63.0 site=react_native_fb) This
       * comment suppresses an error found when Flow v0.63 was deployed. To see
       * the error delete this comment and run Flow. */
      this._timers.add(handle);
    } else {
      this._onUpdateSync(
        props,
        viewableIndices,
        onViewableItemsChanged,
        createViewToken,
      );
    }
    this._parentWasViewable = isParentViewable;
  }

  /**
   * clean-up cached _viewableIndices to evaluate changed items on next update
   */
  resetViewableIndices() {
    this._viewableIndices = [];
  }

  /**
   * Records that an interaction has happened even if there has been no scroll.
   */
  recordInteraction() {
    this._hasInteracted = true;
  }

  _onUpdateSync(
    props: FrameMetricProps,
    viewableIndicesToCheck: Array<number>,
    onViewableItemsChanged: ({
      changed: Array<ViewToken>,
      viewableItems: Array<ViewToken>,
      ...
    }) => void,
    createViewToken: (
      index: number,
      isViewable: boolean,
      props: FrameMetricProps,
    ) => ViewToken,
  ) {
    // Filter out indices that have gone out of view since this call was scheduled.
    viewableIndicesToCheck = viewableIndicesToCheck.filter(ii =>
      this._viewableIndices.includes(ii),
    );
    const prevItems = this._viewableItems;
    const nextItems = new Map(
      viewableIndicesToCheck.map(ii => {
        const viewable = createViewToken(ii, true, props);
        return [viewable.key, viewable];
      }),
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
      this._viewableItems = nextItems;
      onViewableItemsChanged({
        viewableItems: Array.from(nextItems.values()),
        changed,
        viewabilityConfig: this._config,
      });
    }
  }
}

function _isViewable(
  viewAreaMode: boolean,
  isParentViewable: ?boolean,
  viewablePercentThreshold: number,
  start: number,
  end: number,
  viewportSize: number,
  itemLength: number,
): boolean {
  if (isParentViewable === false) {
    // If the parent is not viewable, then none of the children are.
    // Otherwise, we'll want to do the calculations for all children below
    // If undefined, we know there is no parent list
    return false;
  } else if (_isEntirelyVisible(start, end, viewportSize)) {
    return true;
  } else {
    const pixels = _getPixelsVisible(start, end, viewportSize);
    const percent =
      100 * (viewAreaMode ? pixels / viewportSize : pixels / itemLength);
    return percent >= viewablePercentThreshold;
  }
}

function _getPixelsVisible(
  start: number,
  end: number,
  viewportSize: number,
): number {
  const visibleSize = Math.min(end, viewportSize) - Math.max(start, 0);
  return Math.max(0, visibleSize);
}

function _isEntirelyVisible(
  start: number,
  end: number,
  viewportSize: number,
): boolean {
  return start >= 0 && end <= viewportSize && end > start;
}

module.exports = ViewabilityHelper;
