/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// flowlint unsafe-getters-setters:off

import type ReactNativeElement from '../nodes/ReactNativeElement';

import {
  roundToDevicePixel,
  computeContentBoxSize,
  computeBorderBoxSize,
  computeDevicePixelContentBoxSize,
} from './ResizeObserverUtils';

export type ResizeObserverBoxOptions =
  | 'content-box'
  | 'border-box'
  | 'device-pixel-content-box';

export interface ResizeObserverOptions {
  +box?: ResizeObserverBoxOptions;
}

export type ResizeObserverCallback = (
  entries: $ReadOnlyArray<ResizeObserverEntry>,
  observer: ResizeObserver,
) => mixed;

type ResizeObserverSize = {
  +inlineSize: number,
  +blockSize: number,
};

/**
 * Represents a single size change observation for a target element.
 *
 * An array of `ResizeObserverEntry` objects is delivered to the
 * `ResizeObserver` callback as the first argument.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserverEntry
 */
export class ResizeObserverEntry {
  _target: ReactNativeElement;
  _contentRect: {x: number, y: number, width: number, height: number};
  _contentBoxSize: $ReadOnlyArray<ResizeObserverSize>;
  _borderBoxSize: $ReadOnlyArray<ResizeObserverSize>;
  _devicePixelContentBoxSize: $ReadOnlyArray<ResizeObserverSize>;

  constructor(target: ReactNativeElement): void {
    this._target = target;

    const layout = target._layout;
    const width = layout != null ? layout.width : 0;
    const height = layout != null ? layout.height : 0;

    const contentBox = computeContentBoxSize(width, height);
    const borderBox = computeBorderBoxSize(width, height);
    const devicePixelBox = computeDevicePixelContentBoxSize(width, height);

    this._contentRect = {
      x: 0,
      y: 0,
      width: contentBox.inlineSize,
      height: contentBox.blockSize,
    };

    this._contentBoxSize = [contentBox];
    this._borderBoxSize = [borderBox];
    this._devicePixelContentBoxSize = [devicePixelBox];
  }

  /**
   * The `ReactNativeElement` being observed.
   */
  get target(): ReactNativeElement {
    return this._target;
  }

  /**
   * A DOMRectReadOnly-like object containing the new size of the observed
   * element when the callback is run. This uses the content box dimensions.
   */
  get contentRect(): {x: number, y: number, width: number, height: number} {
    return this._contentRect;
  }

  /**
   * An array containing the new content box size of the observed element.
   */
  get contentBoxSize(): $ReadOnlyArray<ResizeObserverSize> {
    return this._contentBoxSize;
  }

  /**
   * An array containing the new border box size of the observed element.
   */
  get borderBoxSize(): $ReadOnlyArray<ResizeObserverSize> {
    return this._borderBoxSize;
  }

  /**
   * An array containing the new content box size of the observed element
   * in device pixel units.
   */
  get devicePixelContentBoxSize(): $ReadOnlyArray<ResizeObserverSize> {
    return this._devicePixelContentBoxSize;
  }
}

type ObservationRecord = {
  target: ReactNativeElement,
  box: ResizeObserverBoxOptions,
  lastReportedWidth: number,
  lastReportedHeight: number,
};

// Global list of all active ResizeObserver instances for scheduling
const activeObservers: Set<ResizeObserver> = new Set();

// Batch scheduling state
let scheduledFrameId: ?AnimationFrameID = null;

/**
 * Process all pending resize observations across all active observers.
 * Observations are batched and delivered in a single callback per observer
 * per frame to avoid layout thrashing.
 */
function processObservations(): void {
  scheduledFrameId = null;

  for (const observer of activeObservers) {
    const entries: Array<ResizeObserverEntry> = [];

    for (const record of observer._observations) {
      const target = record.target;

      // Skip disconnected elements — null-check prevents crashes
      // when an element has been removed from the tree between frames.
      const layout = target._layout;
      if (layout == null) {
        continue;
      }

      const currentWidth = roundToDevicePixel(layout.width);
      const currentHeight = roundToDevicePixel(layout.height);

      // Only report if dimensions actually changed since last report
      if (
        currentWidth !== record.lastReportedWidth ||
        currentHeight !== record.lastReportedHeight
      ) {
        record.lastReportedWidth = currentWidth;
        record.lastReportedHeight = currentHeight;
        entries.push(new ResizeObserverEntry(target));
      }
    }

    if (entries.length > 0) {
      try {
        observer._callback(entries, observer);
      } catch (error) {
        // Matches browser behavior: errors in callbacks are reported
        // but do not prevent other observers from being notified.
        console.error(
          "Error in ResizeObserver callback: '%s'",
          error.message,
        );
      }
    }
  }

  // Reschedule if there are still active observers
  if (activeObservers.size > 0) {
    scheduleObservationProcessing();
  }
}

/**
 * Schedule a batched processing of all resize observations on the next
 * animation frame. Multiple calls within the same frame are coalesced.
 */
function scheduleObservationProcessing(): void {
  if (scheduledFrameId == null) {
    scheduledFrameId = requestAnimationFrame(processObservations);
  }
}

/**
 * React Native implementation of the `ResizeObserver` API.
 *
 * Reports changes to the dimensions of an element's content or border box.
 * Observations are batched and delivered via `requestAnimationFrame` to
 * avoid layout thrashing and provide consistent timing.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
 */
export default class ResizeObserver {
  _callback: ResizeObserverCallback;
  _observations: Array<ObservationRecord>;

  constructor(callback: ResizeObserverCallback): void {
    if (callback == null) {
      throw new TypeError(
        "Failed to construct 'ResizeObserver': 1 argument required, but only 0 present.",
      );
    }

    if (typeof callback !== 'function') {
      throw new TypeError(
        "Failed to construct 'ResizeObserver': parameter 1 is not of type 'Function'.",
      );
    }

    this._callback = callback;
    this._observations = [];
  }

  /**
   * Starts observing the specified `ReactNativeElement`.
   *
   * If the element is already being observed, the existing observation is
   * updated with the new box option. Calling observe with no options
   * defaults to `content-box`.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver/observe
   */
  observe(target: ReactNativeElement, options?: ResizeObserverOptions): void {
    if (target == null) {
      throw new TypeError(
        "Failed to execute 'observe' on 'ResizeObserver': parameter 1 is null or undefined.",
      );
    }

    const box: ResizeObserverBoxOptions = options?.box ?? 'content-box';

    if (
      box !== 'content-box' &&
      box !== 'border-box' &&
      box !== 'device-pixel-content-box'
    ) {
      throw new TypeError(
        `Failed to execute 'observe' on 'ResizeObserver': '${box}' is not a valid enum value of type ResizeObserverBoxOptions.`,
      );
    }

    // If already observing this target, update the box option per spec
    const existingIndex = this._observations.findIndex(
      record => record.target === target,
    );

    if (existingIndex !== -1) {
      this._observations[existingIndex].box = box;
      return;
    }

    const layout = target._layout;
    const initialWidth =
      layout != null ? roundToDevicePixel(layout.width) : -1;
    const initialHeight =
      layout != null ? roundToDevicePixel(layout.height) : -1;

    this._observations.push({
      target,
      box,
      // Use -1 to force an initial callback delivery
      lastReportedWidth: initialWidth === 0 ? -1 : initialWidth,
      lastReportedHeight: initialHeight === 0 ? -1 : initialHeight,
    });

    activeObservers.add(this);
    scheduleObservationProcessing();
  }

  /**
   * Ends the observing of a specified `ReactNativeElement`.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver/unobserve
   */
  unobserve(target: ReactNativeElement): void {
    if (target == null) {
      throw new TypeError(
        "Failed to execute 'unobserve' on 'ResizeObserver': parameter 1 is null or undefined.",
      );
    }

    const index = this._observations.findIndex(
      record => record.target === target,
    );

    if (index === -1) {
      return;
    }

    this._observations.splice(index, 1);

    if (this._observations.length === 0) {
      activeObservers.delete(this);
    }
  }

  /**
   * Unobserves all observed elements and deactivates the observer.
   * The observer can be reused by calling `observe()` again.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver/disconnect
   */
  disconnect(): void {
    this._observations = [];
    activeObservers.delete(this);
  }
}
