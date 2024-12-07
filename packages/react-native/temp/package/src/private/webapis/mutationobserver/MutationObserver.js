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

import type {MutationObserverId} from './MutationObserverManager';
import type MutationRecord from './MutationRecord';

import ReactNativeElement from '../dom/nodes/ReactNativeElement';
import * as MutationObserverManager from './MutationObserverManager';

export type MutationObserverCallback = (
  mutationRecords: $ReadOnlyArray<MutationRecord>,
  observer: MutationObserver,
) => mixed;

type MutationObserverInit = $ReadOnly<{
  subtree?: boolean,
  // This is the only supported option so it's required to be `true`.
  childList: true,

  // Unsupported:
  attributes?: boolean,
  attributeFilter?: $ReadOnlyArray<string>,
  attributeOldValue?: boolean,
  characterData?: boolean,
  characterDataOldValue?: boolean,
}>;

/**
 * This is a React Native implementation for the `MutationObserver` API
 * (https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver).
 *
 * It only supports the `subtree` and `childList` options at the moment.
 */
export default class MutationObserver {
  _callback: MutationObserverCallback;
  _observationTargets: Set<ReactNativeElement> = new Set();
  _mutationObserverId: ?MutationObserverId;

  constructor(callback: MutationObserverCallback): void {
    if (callback == null) {
      throw new TypeError(
        "Failed to construct 'MutationObserver': 1 argument required, but only 0 present.",
      );
    }

    if (typeof callback !== 'function') {
      throw new TypeError(
        "Failed to construct 'MutationObserver': parameter 1 is not of type 'Function'.",
      );
    }

    this._callback = callback;
  }

  /**
   * Configures the `MutationObserver` callback to begin receiving notifications
   * of changes to the UI tree that match the given options.
   * Depending on the configuration, the observer may watch a single node in the
   * UI tree, or that node and some or all of its descendant nodes.
   * To stop the `MutationObserver` (so that none of its callbacks will be
   * triggered any longer), call `MutationObserver.disconnect()`.
   */
  observe(target: ReactNativeElement, options?: MutationObserverInit): void {
    if (!(target instanceof ReactNativeElement)) {
      throw new TypeError(
        "Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'ReactNativeElement'.",
      );
    }

    // Browsers force a cast of this value to boolean
    if (Boolean(options?.childList) !== true) {
      throw new TypeError(
        "Failed to execute 'observe' on 'MutationObserver': The options object must set 'childList' to true.",
      );
    }

    if (options?.attributes != null) {
      throw new Error(
        "Failed to execute 'observe' on 'MutationObserver': attributes is not supported",
      );
    }

    if (options?.attributeFilter != null) {
      throw new Error(
        "Failed to execute 'observe' on 'MutationObserver': attributeFilter is not supported",
      );
    }

    if (options?.attributeOldValue != null) {
      throw new Error(
        "Failed to execute 'observe' on 'MutationObserver': attributeOldValue is not supported",
      );
    }

    if (options?.characterData != null) {
      throw new Error(
        "Failed to execute 'observe' on 'MutationObserver': characterData is not supported",
      );
    }

    if (options?.characterDataOldValue != null) {
      throw new Error(
        "Failed to execute 'observe' on 'MutationObserver': characterDataOldValue is not supported",
      );
    }

    const mutationObserverId = this._getOrCreateMutationObserverId();

    // As per the spec, if the target is already being observed, we "reset"
    // the observation and only use the last options used.
    if (this._observationTargets.has(target)) {
      MutationObserverManager.unobserve(mutationObserverId, target);
    }

    const didStartObserving = MutationObserverManager.observe({
      mutationObserverId,
      target,
      subtree: Boolean(options?.subtree),
    });

    if (didStartObserving) {
      this._observationTargets.add(target);
    }
  }

  _unobserve(target: ReactNativeElement): void {
    if (!(target instanceof ReactNativeElement)) {
      throw new TypeError(
        "Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'ReactNativeElement'.",
      );
    }

    if (!this._observationTargets.has(target)) {
      return;
    }

    const mutationObserverId = this._mutationObserverId;
    if (mutationObserverId == null) {
      return;
    }

    MutationObserverManager.unobserve(mutationObserverId, target);
    this._observationTargets.delete(target);

    if (this._observationTargets.size === 0) {
      MutationObserverManager.unregisterObserver(mutationObserverId);
      this._mutationObserverId = null;
    }
  }

  /**
   * Tells the observer to stop watching for mutations.
   * The observer can be reused by calling its `observe()` method again.
   */
  disconnect(): void {
    for (const target of this._observationTargets.keys()) {
      this._unobserve(target);
    }
  }

  _getOrCreateMutationObserverId(): MutationObserverId {
    let mutationObserverId = this._mutationObserverId;
    if (mutationObserverId == null) {
      mutationObserverId = MutationObserverManager.registerObserver(
        this,
        this._callback,
      );
      this._mutationObserverId = mutationObserverId;
    }
    return mutationObserverId;
  }

  // Only for tests
  __getObserverID(): ?MutationObserverId {
    return this._mutationObserverId;
  }
}
