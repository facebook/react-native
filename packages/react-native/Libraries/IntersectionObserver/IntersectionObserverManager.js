/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

/**
 * This module handles the communication between the React Native renderer
 * and all the intersection observers that are currently observing any targets.
 *
 * In order to reduce the communication between native and JavaScript,
 * we register a single notication callback in native, and then we handle how
 * to notify each entry to the right intersection observer when we receive all
 * the notifications together.
 */

import type ReactNativeElement from '../DOM/Nodes/ReactNativeElement';
import type IntersectionObserver, {
  IntersectionObserverCallback,
} from './IntersectionObserver';
import type IntersectionObserverEntry from './IntersectionObserverEntry';

import {getShadowNode} from '../DOM/Nodes/ReadOnlyNode';
import * as Systrace from '../Performance/Systrace';
import warnOnce from '../Utilities/warnOnce';
import {createIntersectionObserverEntry} from './IntersectionObserverEntry';
import NativeIntersectionObserver from './NativeIntersectionObserver';

export type IntersectionObserverId = number;

let nextIntersectionObserverId: IntersectionObserverId = 1;
let isConnected: boolean = false;

const registeredIntersectionObservers: Map<
  IntersectionObserverId,
  {observer: IntersectionObserver, callback: IntersectionObserverCallback},
> = new Map();

/**
 * Registers the given intersection observer and returns a unique ID for it,
 * which is required to start observing targets.
 */
export function registerObserver(
  observer: IntersectionObserver,
  callback: IntersectionObserverCallback,
): IntersectionObserverId {
  const intersectionObserverId = nextIntersectionObserverId;
  nextIntersectionObserverId++;
  registeredIntersectionObservers.set(intersectionObserverId, {
    observer,
    callback,
  });
  return intersectionObserverId;
}

/**
 * Unregisters the given intersection observer.
 * This should only be called when an observer is no longer observing any
 * targets.
 */
export function unregisterObserver(
  intersectionObserverId: IntersectionObserverId,
): void {
  const deleted = registeredIntersectionObservers.delete(
    intersectionObserverId,
  );
  if (deleted && registeredIntersectionObservers.size === 0) {
    NativeIntersectionObserver?.disconnect();
    isConnected = false;
  }
}

/**
 * Starts observing a target on a specific intersection observer.
 * If this is the first target being observed, this also sets up the centralized
 * notification callback in native.
 */
export function observe({
  intersectionObserverId,
  target,
}: {
  intersectionObserverId: IntersectionObserverId,
  target: ReactNativeElement,
}): void {
  if (NativeIntersectionObserver == null) {
    warnNoNativeIntersectionObserver();
    return;
  }

  const registeredObserver = registeredIntersectionObservers.get(
    intersectionObserverId,
  );
  if (registeredObserver == null) {
    console.error(
      `IntersectionObserverManager: could not start observing target because IntersectionObserver with ID ${intersectionObserverId} was not registered.`,
    );
    return;
  }

  const targetShadowNode = getShadowNode(target);
  if (targetShadowNode == null) {
    console.error(
      'IntersectionObserverManager: could not find reference to host node from target',
    );
    return;
  }

  if (!isConnected) {
    NativeIntersectionObserver.connect(notifyIntersectionObservers);
    isConnected = true;
  }

  return NativeIntersectionObserver.observe({
    intersectionObserverId,
    targetShadowNode,
    thresholds: registeredObserver.observer.thresholds,
  });
}

export function unobserve(
  intersectionObserverId: number,
  target: ReactNativeElement,
): void {
  if (NativeIntersectionObserver == null) {
    warnNoNativeIntersectionObserver();
    return;
  }

  const registeredObserver = registeredIntersectionObservers.get(
    intersectionObserverId,
  );
  if (registeredObserver == null) {
    console.error(
      `IntersectionObserverManager: could not stop observing target because IntersectionObserver with ID ${intersectionObserverId} was not registered.`,
    );
    return;
  }

  const targetShadowNode = getShadowNode(target);
  if (targetShadowNode == null) {
    console.error(
      'IntersectionObserverManager: could not find reference to host node from target',
    );
    return;
  }

  NativeIntersectionObserver.unobserve(
    intersectionObserverId,
    targetShadowNode,
  );
}

/**
 * This function is called from native when there are `IntersectionObserver`
 * entries to dispatch.
 */
function notifyIntersectionObservers(): void {
  Systrace.beginEvent(
    'IntersectionObserverManager.notifyIntersectionObservers',
  );
  try {
    doNotifyIntersectionObservers();
  } finally {
    Systrace.endEvent();
  }
}

function doNotifyIntersectionObservers(): void {
  if (NativeIntersectionObserver == null) {
    warnNoNativeIntersectionObserver();
    return;
  }

  const nativeEntries = NativeIntersectionObserver.takeRecords();

  const entriesByObserver: Map<
    IntersectionObserverId,
    Array<IntersectionObserverEntry>,
  > = new Map();

  for (const nativeEntry of nativeEntries) {
    let list = entriesByObserver.get(nativeEntry.intersectionObserverId);
    if (list == null) {
      list = [];
      entriesByObserver.set(nativeEntry.intersectionObserverId, list);
    }
    list.push(createIntersectionObserverEntry(nativeEntry));
  }

  for (const [
    intersectionObserverId,
    entriesForObserver,
  ] of entriesByObserver) {
    const registeredObserver = registeredIntersectionObservers.get(
      intersectionObserverId,
    );
    if (!registeredObserver) {
      // This could happen if the observer is disconnected between commit
      // and mount. In this case, we can just ignore the entries.
      return;
    }

    const {observer, callback} = registeredObserver;
    try {
      callback.call(observer, entriesForObserver, observer);
    } catch (error) {
      console.error(error);
    }
  }
}

function warnNoNativeIntersectionObserver() {
  warnOnce(
    'missing-native-intersection-observer',
    'Missing native implementation of IntersectionObserver',
  );
}
