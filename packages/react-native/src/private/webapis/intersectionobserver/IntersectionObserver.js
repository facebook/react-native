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

import type IntersectionObserverEntry from './IntersectionObserverEntry';
import type {IntersectionObserverId} from './IntersectionObserverManager';

import ReactNativeElement from '../dom/nodes/ReactNativeElement';
import * as IntersectionObserverManager from './IntersectionObserverManager';

export type IntersectionObserverCallback = (
  entries: Array<IntersectionObserverEntry>,
  observer: IntersectionObserver,
) => mixed;

type IntersectionObserverInit = {
  // root?: ReactNativeElement, // This option exists on the Web but it's not currently supported in React Native.
  // rootMargin?: string, // This option exists on the Web but it's not currently supported in React Native.
  threshold?: number | $ReadOnlyArray<number>,

  /**
   * This is a React Native specific option (not spec compliant) that specifies
   * ratio threshold(s) of the intersection area to the total `root` area.
   *
   * If set, it will either be a singular ratio value between 0-1 (inclusive)
   * or an array of such ratios.
   *
   * Note: If `rnRootThreshold` is set, and `threshold` is not set,
   * `threshold` will not default to [0] (as per spec)
   */
  rnRootThreshold?: number | $ReadOnlyArray<number>,
};

/**
 * The [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
 * provides a way to asynchronously observe changes in the intersection of a
 * target element with an ancestor element or with a top-level document's
 * viewport.
 *
 * The ancestor element or viewport is referred to as the root.
 *
 * When an `IntersectionObserver` is created, it's configured to watch for given
 * ratios of visibility within the root.
 *
 * The configuration cannot be changed once the `IntersectionObserver` is
 * created, so a given observer object is only useful for watching for specific
 * changes in degree of visibility; however, you can watch multiple target
 * elements with the same observer.
 *
 * This implementation only supports the `threshold` option at the moment
 * (`root` and `rootMargin` are not supported) and provides a React Native specific
 * option `rnRootThreshold`.
 *
 */
export default class IntersectionObserver {
  _callback: IntersectionObserverCallback;
  _thresholds: $ReadOnlyArray<number>;
  _observationTargets: Set<ReactNativeElement> = new Set();
  _intersectionObserverId: ?IntersectionObserverId;
  _rootThresholds: $ReadOnlyArray<number> | null;

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ): void {
    if (callback == null) {
      throw new TypeError(
        "Failed to construct 'IntersectionObserver': 1 argument required, but only 0 present.",
      );
    }

    if (typeof callback !== 'function') {
      throw new TypeError(
        "Failed to construct 'IntersectionObserver': parameter 1 is not of type 'Function'.",
      );
    }

    // $FlowExpectedError[prop-missing] it's not typed in React Native but exists on Web.
    if (options?.root != null) {
      throw new TypeError(
        "Failed to construct 'IntersectionObserver': root is not supported",
      );
    }

    // $FlowExpectedError[prop-missing] it's not typed in React Native but exists on Web.
    if (options?.rootMargin != null) {
      throw new TypeError(
        "Failed to construct 'IntersectionObserver': rootMargin is not supported",
      );
    }

    this._callback = callback;

    this._rootThresholds = normalizeRootThreshold(options?.rnRootThreshold);
    this._thresholds = normalizeThreshold(
      options?.threshold,
      this._rootThresholds != null, // only provide default if no rootThreshold
    );
  }

  /**
   * The `ReactNativeElement` whose bounds are used as the bounding box when
   * testing for intersection.
   * If no `root` value was passed to the constructor or its value is `null`,
   * the root view is used.
   *
   * NOTE: This cannot currently be configured and `root` is always `null`.
   */
  get root(): ReactNativeElement | null {
    return null;
  }

  /**
   * String with syntax similar to that of the CSS `margin` property.
   * Each side of the rectangle represented by `rootMargin` is added to the
   * corresponding side in the root element's bounding box before the
   * intersection test is performed.
   *
   * NOTE: This cannot currently be configured and `rootMargin` is always
   * `null`.
   */
  get rootMargin(): string {
    return '0px 0px 0px 0px';
  }

  /**
   * A list of thresholds, sorted in increasing numeric order, where each
   * threshold is a ratio of intersection area to bounding box area of an
   * observed target.
   * Notifications for a target are generated when any of the thresholds specified
   * in `rnRootThreshold` or `threshold` are crossed for that target.
   *
   * If no value was passed to the constructor, and no `rnRootThreshold`
   * is set, `0` is used.
   */
  get thresholds(): $ReadOnlyArray<number> {
    return this._thresholds;
  }

  /**
   * A list of root thresholds, sorted in increasing numeric order, where each
   * threshold is a ratio of intersection area to bounding box area of the specified
   * root view, which defaults to the viewport.
   * Notifications for a target are generated when any of the thresholds specified
   * in `rnRootThreshold` or `threshold` are crossed for that target.
   */
  get rnRootThresholds(): $ReadOnlyArray<number> | null {
    return this._rootThresholds;
  }

  /**
   * Adds an element to the set of target elements being watched by the
   * `IntersectionObserver`.
   * One observer has one set of thresholds and one root, but can watch multiple
   * target elements for visibility changes.
   * To stop observing the element, call `IntersectionObserver.unobserve()`.
   */
  observe(target: ReactNativeElement): void {
    if (target == null) {
      throw new TypeError(
        "Failed to execute 'observe' on 'IntersectionObserver': parameter 1 is null or undefined.",
      );
    }

    if (!(target instanceof ReactNativeElement)) {
      throw new TypeError(
        "Failed to execute 'observe' on 'IntersectionObserver': parameter 1 is not of type 'ReactNativeElement'.",
      );
    }

    if (this._observationTargets.has(target)) {
      return;
    }

    const didStartObserving = IntersectionObserverManager.observe({
      intersectionObserverId: this._getOrCreateIntersectionObserverId(),
      target,
    });

    if (didStartObserving) {
      this._observationTargets.add(target);
    }
  }

  /**
   * Instructs the `IntersectionObserver` to stop observing the specified target
   * element.
   */
  unobserve(target: ReactNativeElement): void {
    if (!(target instanceof ReactNativeElement)) {
      throw new TypeError(
        "Failed to execute 'unobserve' on 'IntersectionObserver': parameter 1 is not of type 'ReactNativeElement'.",
      );
    }

    if (!this._observationTargets.has(target)) {
      return;
    }

    const intersectionObserverId = this._intersectionObserverId;
    if (intersectionObserverId == null) {
      // This is unexpected if the target is in `_observationTargets`.
      console.error(
        "Unexpected state in 'IntersectionObserver': could not find observer ID to unobserve target.",
      );
      return;
    }

    IntersectionObserverManager.unobserve(intersectionObserverId, target);
    this._observationTargets.delete(target);

    if (this._observationTargets.size === 0) {
      IntersectionObserverManager.unregisterObserver(intersectionObserverId);
      this._intersectionObserverId = null;
    }
  }

  /**
   * Stops watching all of its target elements for visibility changes.
   */
  disconnect(): void {
    for (const target of this._observationTargets.keys()) {
      this.unobserve(target);
    }
  }

  _getOrCreateIntersectionObserverId(): IntersectionObserverId {
    let intersectionObserverId = this._intersectionObserverId;
    if (intersectionObserverId == null) {
      intersectionObserverId = IntersectionObserverManager.registerObserver(
        this,
        this._callback,
      );
      this._intersectionObserverId = intersectionObserverId;
    }
    return intersectionObserverId;
  }

  // Only for tests
  __getObserverID(): ?IntersectionObserverId {
    return this._intersectionObserverId;
  }
}

/**
 * Converts the user defined `threshold` value into an array of sorted valid
 * threshold options for `IntersectionObserver` (double ∈ [0, 1]).
 *
 * If `defaultEmpty` is true, then defaults to empty array, otherwise [0].
 *
 * @example
 * normalizeThresholds(0.5);                // → [0.5]
 * normalizeThresholds([1, 0.5, 0]);        // → [0, 0.5, 1]
 * normalizeThresholds(['1', '0.5', '0']);  // → [0, 0.5, 1]
 * normalizeThresholds(null);               // → [0]
 * normalizeThresholds([null, null]);       // → [0, 0]
 *
 * normalizeThresholds([null], true);       // → [0]
 * normalizeThresholds(null, true);         // → []
 * normalizeThresholds([], true);           // → []
 */
function normalizeThreshold(
  threshold: mixed,
  defaultEmpty: boolean = false,
): $ReadOnlyArray<number> {
  if (Array.isArray(threshold)) {
    if (threshold.length > 0) {
      return threshold
        .map(t => normalizeThresholdValue(t, 'threshold'))
        .map(t => t ?? 0)
        .sort();
    } else if (defaultEmpty) {
      return [];
    } else {
      return [0];
    }
  }

  const normalized = normalizeThresholdValue(threshold, 'threshold');
  if (normalized == null) {
    return defaultEmpty ? [] : [0];
  }

  return [normalized];
}

/**
 * Converts the user defined `rnRootThreshold` value into an array of sorted valid
 * threshold options for `IntersectionObserver` (double ∈ [0, 1]).
 *
 * If invalid array or null, returns null.
 *
 * @example
 * normalizeRootThreshold(0.5);                 // → [0.5]
 * normalizeRootThresholds([1, 0.5, 0]);        // → [0, 0.5, 1]
 * normalizeRootThresholds([null, '0.5', '0']); // → [0, 0.5]
 * normalizeRootThresholds(null);               // → null
 * normalizeRootThresholds([null, null]);       // → null
 */
function normalizeRootThreshold(
  rootThreshold: mixed,
): null | $ReadOnlyArray<number> {
  if (Array.isArray(rootThreshold)) {
    const normalizedArr = rootThreshold
      .map(rt => normalizeThresholdValue(rt, 'rnRootThreshold'))
      .filter((rt): rt is number => rt != null)
      .sort();
    return normalizedArr.length === 0 ? null : normalizedArr;
  }

  const normalized = normalizeThresholdValue(rootThreshold, 'rnRootThreshold');
  return normalized == null ? null : [normalized];
}

function normalizeThresholdValue(
  threshold: mixed,
  property: string,
): null | number {
  if (threshold == null) {
    return null;
  }

  const thresholdAsNumber = Number(threshold);
  if (!Number.isFinite(thresholdAsNumber)) {
    throw new TypeError(
      `Failed to read the '${property}' property from 'IntersectionObserverInit': The provided double value is non-finite.`,
    );
  }

  if (thresholdAsNumber < 0 || thresholdAsNumber > 1) {
    throw new RangeError(
      "Failed to construct 'IntersectionObserver': Threshold values must be numbers between 0 and 1",
    );
  }

  return thresholdAsNumber;
}
