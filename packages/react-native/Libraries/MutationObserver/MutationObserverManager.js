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
 * and all the mutation observers that are currently observing any targets.
 *
 * In order to reduce the communication between native and JavaScript,
 * we register a single notication callback in native, and then we handle how
 * to notify each entry to the right mutation observer when we receive all
 * the notifications together.
 */

import type ReactNativeElement from '../DOM/Nodes/ReactNativeElement';
import type MutationObserver, {
  MutationObserverCallback,
} from './MutationObserver';
import type MutationRecord from './MutationRecord';

import {
  getPublicInstanceFromInternalInstanceHandle,
  getShadowNode,
} from '../DOM/Nodes/ReadOnlyNode';
import * as Systrace from '../Performance/Systrace';
import warnOnce from '../Utilities/warnOnce';
import {createMutationRecord} from './MutationRecord';
import NativeMutationObserver from './NativeMutationObserver';

export type MutationObserverId = number;

let nextMutationObserverId: MutationObserverId = 1;
let isConnected: boolean = false;

const registeredMutationObservers: Map<
  MutationObserverId,
  $ReadOnly<{observer: MutationObserver, callback: MutationObserverCallback}>,
> = new Map();

/**
 * Registers the given mutation observer and returns a unique ID for it,
 * which is required to start observing targets.
 */
export function registerObserver(
  observer: MutationObserver,
  callback: MutationObserverCallback,
): MutationObserverId {
  const mutationObserverId = nextMutationObserverId;
  nextMutationObserverId++;
  registeredMutationObservers.set(mutationObserverId, {
    observer,
    callback,
  });
  return mutationObserverId;
}

/**
 * Unregisters the given mutation observer.
 * This should only be called when an observer is no longer observing any
 * targets.
 */
export function unregisterObserver(
  mutationObserverId: MutationObserverId,
): void {
  const deleted = registeredMutationObservers.delete(mutationObserverId);
  if (deleted && registeredMutationObservers.size === 0) {
    // When there are no observers left, we can disconnect the native module
    // so we don't need to check commits for mutations.
    NativeMutationObserver?.disconnect();
    isConnected = false;
  }
}

export function observe({
  mutationObserverId,
  target,
  subtree,
}: {
  mutationObserverId: MutationObserverId,
  target: ReactNativeElement,
  subtree: boolean,
}): void {
  if (NativeMutationObserver == null) {
    warnNoNativeMutationObserver();
    return;
  }

  const registeredObserver =
    registeredMutationObservers.get(mutationObserverId);
  if (registeredObserver == null) {
    console.error(
      `MutationObserverManager: could not start observing target because MutationObserver with ID ${mutationObserverId} was not registered.`,
    );
    return;
  }

  const targetShadowNode = getShadowNode(target);
  if (targetShadowNode == null) {
    console.error(
      'MutationObserverManager: could not find reference to host node from target',
    );
    return;
  }

  if (!isConnected) {
    NativeMutationObserver.connect(
      notifyMutationObservers,
      // We need to do this operation from native to make sure we're retaining
      // the public instance immediately when mutations occur. Otherwise React
      // could dereference it in the instance handle and we wouldn't be able to
      // access it.
      // $FlowExpectedError[incompatible-call] This is typed as (mixed) => mixed in the native module because the codegen doesn't support the actual types.
      getPublicInstanceFromInternalInstanceHandle,
    );
    isConnected = true;
  }

  return NativeMutationObserver.observe({
    mutationObserverId,
    targetShadowNode,
    subtree,
  });
}

export function unobserve(
  mutationObserverId: number,
  target: ReactNativeElement,
): void {
  if (NativeMutationObserver == null) {
    warnNoNativeMutationObserver();
    return;
  }

  const registeredObserver =
    registeredMutationObservers.get(mutationObserverId);
  if (registeredObserver == null) {
    console.error(
      `MutationObserverManager: could not stop observing target because MutationObserver with ID ${mutationObserverId} was not registered.`,
    );
    return;
  }

  const targetShadowNode = getShadowNode(target);
  if (targetShadowNode == null) {
    console.error(
      'MutationObserverManager: could not find reference to host node from target',
    );
    return;
  }

  NativeMutationObserver.unobserve(mutationObserverId, targetShadowNode);
}

/**
 * This function is called from native when there are `MutationObserver`
 * entries to dispatch.
 */
function notifyMutationObservers(): void {
  Systrace.beginEvent('MutationObserverManager.notifyMutationObservers');
  try {
    doNotifyMutationObservers();
  } finally {
    Systrace.endEvent();
  }
}

function doNotifyMutationObservers(): void {
  if (NativeMutationObserver == null) {
    warnNoNativeMutationObserver();
    return;
  }

  const nativeRecords = NativeMutationObserver.takeRecords();

  const entriesByObserver: Map<
    MutationObserverId,
    Array<MutationRecord>,
  > = new Map();

  for (const nativeRecord of nativeRecords) {
    let list = entriesByObserver.get(nativeRecord.mutationObserverId);
    if (list == null) {
      list = [];
      entriesByObserver.set(nativeRecord.mutationObserverId, list);
    }
    list.push(createMutationRecord(nativeRecord));
  }

  for (const [mutationObserverId, entriesForObserver] of entriesByObserver) {
    const registeredObserver =
      registeredMutationObservers.get(mutationObserverId);
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

function warnNoNativeMutationObserver() {
  warnOnce(
    'missing-native-mutation-observer',
    'Missing native implementation of MutationObserver',
  );
}
