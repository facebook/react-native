/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type ReactNativeElement from '../../DOM/Nodes/ReactNativeElement';
import type IntersectionObserver from '../IntersectionObserver';
import type {
  NativeIntersectionObserverEntry,
  NativeIntersectionObserverObserveOptions,
  Spec,
} from '../NativeIntersectionObserver';

import {getShadowNode} from '../../DOM/Nodes/ReadOnlyNode';
import {getFabricUIManager} from '../../ReactNative/__mocks__/FabricUIManager';
import invariant from 'invariant';
import nullthrows from 'nullthrows';

type ObserverState = {
  thresholds: $ReadOnlyArray<number>,
  intersecting: boolean,
  currentThreshold: ?number,
};

type Observation = {
  ...NativeIntersectionObserverObserveOptions,
  state: ObserverState,
};

let pendingRecords: Array<NativeIntersectionObserverEntry> = [];
let callback: ?() => void;
let observations: Array<Observation> = [];

const FabricUIManagerMock = nullthrows(getFabricUIManager());

function createRecordFromObservation(
  observation: Observation,
): NativeIntersectionObserverEntry {
  return {
    intersectionObserverId: observation.intersectionObserverId,
    targetInstanceHandle: FabricUIManagerMock.__getInstanceHandleFromNode(
      // $FlowExpectedError[incompatible-call]
      observation.targetShadowNode,
    ),
    targetRect: observation.state.intersecting ? [0, 0, 1, 1] : [20, 20, 1, 1],
    rootRect: [0, 0, 10, 10],
    intersectionRect: observation.state.intersecting ? [0, 0, 1, 1] : null,
    isIntersectingAboveThresholds: observation.state.intersecting,
    time: performance.now(),
  };
}

function notifyIntersectionObservers(): void {
  callback?.();
}

const NativeIntersectionObserverMock = {
  observe: (options: NativeIntersectionObserverObserveOptions): void => {
    invariant(
      observations.find(
        observation =>
          observation.intersectionObserverId ===
            options.intersectionObserverId &&
          observation.targetShadowNode === options.targetShadowNode,
      ) == null,
      'unexpected duplicate call to observe',
    );
    const observation = {
      ...options,
      state: {
        thresholds: options.thresholds,
        intersecting: false,
        currentThreshold: null,
      },
    };
    observations.push(observation);
    pendingRecords.push(createRecordFromObservation(observation));
    setImmediate(notifyIntersectionObservers);
  },
  unobserve: (
    intersectionObserverId: number,
    targetShadowNode: mixed,
  ): void => {
    const observationIndex = observations.findIndex(
      observation =>
        observation.intersectionObserverId === intersectionObserverId &&
        observation.targetShadowNode === targetShadowNode,
    );
    invariant(
      observationIndex !== -1,
      'unexpected duplicate call to unobserve',
    );
    observations.splice(observationIndex, 1);
  },
  connect: (notifyIntersectionObserversCallback: () => void): void => {
    invariant(callback == null, 'unexpected call to connect');
    invariant(
      notifyIntersectionObserversCallback != null,
      'unexpected null notify intersection observers callback',
    );
    callback = notifyIntersectionObserversCallback;
  },
  disconnect: (): void => {
    invariant(callback != null, 'unexpected call to disconnect');
    callback = null;
  },
  takeRecords: (): $ReadOnlyArray<NativeIntersectionObserverEntry> => {
    const currentRecords = pendingRecords;
    pendingRecords = [];
    return currentRecords;
  },
  __forceTransitionForTests: (
    observer: IntersectionObserver,
    target: ReactNativeElement,
  ) => {
    const targetShadowNode = getShadowNode(target);
    const observation = observations.find(
      obs =>
        obs.intersectionObserverId === observer.__getObserverID() &&
        obs.targetShadowNode === targetShadowNode,
    );
    invariant(
      observation != null,
      'cannot force transition on an unobserved target',
    );
    if (observation.state.intersecting) {
      observation.state.intersecting = false;
      observation.state.currentThreshold = null;
    } else {
      observation.state.intersecting = true;
      observation.state.currentThreshold = observation.thresholds[0];
    }
    pendingRecords.push(createRecordFromObservation(observation));
    setImmediate(notifyIntersectionObservers);
  },
  __getObservationsForTests: (
    observer: IntersectionObserver,
  ): Array<{targetShadowNode: mixed, thresholds: $ReadOnlyArray<number>}> => {
    const intersectionObserverId = observer.__getObserverID();
    return observations
      .filter(
        observation =>
          observation.intersectionObserverId === intersectionObserverId,
      )
      .map(observation => ({
        targetShadowNode: observation.targetShadowNode,
        thresholds: observation.thresholds,
      }));
  },
  __isConnected: (): boolean => {
    return callback != null;
  },
};

(NativeIntersectionObserverMock: Spec);

export default NativeIntersectionObserverMock;
