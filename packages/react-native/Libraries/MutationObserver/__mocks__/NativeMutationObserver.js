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
 * This is a mock of `NativeMutationObserver` implementing the same logic as the
 * native module and integrating with the existing mock for `FabricUIManager`.
 * This allows us to test all the JavaScript code for IntersectionObserver in
 * JavaScript as an integration test using only public APIs.
 */

import type {NodeSet} from '../../ReactNative/FabricUIManager';
import type {RootTag} from '../../ReactNative/RootTag';
import type {
  InternalInstanceHandle,
  Node,
} from '../../Renderer/shims/ReactNativeTypes';
import type {
  MutationObserverId,
  NativeMutationObserverObserveOptions,
  NativeMutationRecord,
  Spec,
} from '../NativeMutationObserver';

import ReadOnlyNode from '../../DOM/Nodes/ReadOnlyNode';
import {
  type NodeMock,
  type UIManagerCommitHook,
  fromNode,
  getFabricUIManager,
  getNodeInChildSet,
} from '../../ReactNative/__mocks__/FabricUIManager';
import invariant from 'invariant';
import nullthrows from 'nullthrows';

let pendingRecords: Array<NativeMutationRecord> = [];
let callback: ?() => void;
let getPublicInstance: ?(instanceHandle: InternalInstanceHandle) => mixed;
let observersByRootTag: Map<
  RootTag,
  Map<MutationObserverId, {deep: Set<Node>, shallow: Set<Node>}>,
> = new Map();

const FabricUIManagerMock = nullthrows(getFabricUIManager());

function getMockDataFromShadowNode(node: mixed): NodeMock {
  // $FlowExpectedError[incompatible-call]
  return fromNode(node);
}

function castToNode(node: mixed): Node {
  // $FlowExpectedError[incompatible-return]
  return node;
}

const NativeMutationMock = {
  observe: (options: NativeMutationObserverObserveOptions): void => {
    const targetShadowNode = castToNode(options.targetShadowNode);
    const rootTag = getMockDataFromShadowNode(options.targetShadowNode).rootTag;

    let observers = observersByRootTag.get(rootTag);
    if (observers == null) {
      observers = new Map();
      observersByRootTag.set(rootTag, observers);
    }
    let observations = observers.get(options.mutationObserverId);
    if (observations == null) {
      observations = {deep: new Set(), shallow: new Set()};
      observers.set(options.mutationObserverId, observations);
    }

    const isTargetBeingObserved =
      observations.deep.has(targetShadowNode) ||
      observations.shallow.has(targetShadowNode);
    invariant(!isTargetBeingObserved, 'unexpected duplicate call to observe');

    if (options.subtree) {
      observations.deep.add(targetShadowNode);
    } else {
      observations.shallow.add(targetShadowNode);
    }
  },
  unobserve: (mutationObserverId: number, target: mixed): void => {
    const targetShadowNode = castToNode(target);

    const observers = observersByRootTag.get(
      getMockDataFromShadowNode(targetShadowNode).rootTag,
    );
    const observations = observers?.get(mutationObserverId);
    invariant(observations != null, 'unexpected call to unobserve');

    const isTargetBeingObserved =
      observations.deep.has(targetShadowNode) ||
      observations.shallow.has(targetShadowNode);
    invariant(isTargetBeingObserved, 'unexpected call to unobserve');

    observations.deep.delete(targetShadowNode);
    observations.shallow.delete(targetShadowNode);
  },
  connect: (
    notifyMutationObserversCallback: () => void,
    getPublicInstanceFromInstanceHandle: (
      instanceHandle: InternalInstanceHandle,
    ) => mixed,
  ): void => {
    invariant(callback == null, 'unexpected call to connect');
    callback = notifyMutationObserversCallback;
    getPublicInstance = getPublicInstanceFromInstanceHandle;
    FabricUIManagerMock.__addCommitHook(NativeMutationObserverCommitHook);
  },
  disconnect: (): void => {
    invariant(callback != null, 'unexpected call to disconnect');
    callback = null;
    FabricUIManagerMock.__removeCommitHook(NativeMutationObserverCommitHook);
  },
  takeRecords: (): $ReadOnlyArray<NativeMutationRecord> => {
    const currentRecords = pendingRecords;
    pendingRecords = [];
    return currentRecords;
  },
};

(NativeMutationMock: Spec);

export default NativeMutationMock;

const NativeMutationObserverCommitHook: UIManagerCommitHook = {
  shadowTreeWillCommit: (rootTag, oldChildSet, newChildSet) => {
    runMutationObservations(rootTag, oldChildSet, newChildSet);
  },
};

function runMutationObservations(
  rootTag: RootTag,
  oldChildSet: ?NodeSet,
  newChildSet: NodeSet,
): void {
  const observers = observersByRootTag.get(rootTag);
  if (!observers) {
    return;
  }

  const newRecords: Array<NativeMutationRecord> = [];

  for (const [mutationObserverId, observations] of observers) {
    const processedNodes: Set<Node> = new Set();
    for (const targetShadowNode of observations.deep) {
      runMutationObservation({
        mutationObserverId,
        targetShadowNode,
        subtree: true,
        oldChildSet,
        newChildSet,
        newRecords,
        processedNodes,
      });
    }
    for (const targetShadowNode of observations.shallow) {
      runMutationObservation({
        mutationObserverId,
        targetShadowNode,
        subtree: false,
        oldChildSet,
        newChildSet,
        newRecords,
        processedNodes,
      });
    }
  }

  for (const record of newRecords) {
    pendingRecords.push(record);
  }

  notifyObserversIfNecessary();
}

function findNodeOfSameFamily(list: NodeSet, node: Node): ?Node {
  for (const current of list) {
    if (fromNode(current).reactTag === fromNode(node).reactTag) {
      return current;
    }
  }
  return;
}

function recordMutations({
  mutationObserverId,
  targetShadowNode,
  subtree,
  oldNode,
  newNode,
  newRecords,
  processedNodes,
}: {
  mutationObserverId: MutationObserverId,
  targetShadowNode: Node,
  subtree: boolean,
  oldNode: Node,
  newNode: Node,
  newRecords: Array<NativeMutationRecord>,
  processedNodes: Set<Node>,
}): void {
  // If the nodes are referentially equal, their children are also the same.
  if (oldNode === newNode || processedNodes.has(newNode)) {
    return;
  }

  processedNodes.add(newNode);

  const oldChildren = fromNode(oldNode).children;
  const newChildren = fromNode(newNode).children;

  const addedNodes = [];
  const removedNodes = [];

  // Check for removed nodes (and equal nodes for further inspection later)
  for (const oldChild of oldChildren) {
    const newChild = findNodeOfSameFamily(newChildren, oldChild);
    if (newChild == null) {
      removedNodes.push(oldChild);
    } else if (subtree) {
      recordMutations({
        mutationObserverId,
        targetShadowNode,
        subtree,
        oldNode: oldChild,
        newNode: newChild,
        newRecords,
        processedNodes,
      });
    }
  }

  // Check for added nodes
  for (const newChild of newChildren) {
    const oldChild = findNodeOfSameFamily(oldChildren, newChild);
    if (oldChild == null) {
      addedNodes.push(newChild);
    }
  }

  if (addedNodes.length > 0 || removedNodes.length > 0) {
    newRecords.push({
      mutationObserverId: mutationObserverId,
      target: nullthrows(getPublicInstance)(
        getMockDataFromShadowNode(targetShadowNode).instanceHandle,
      ),
      addedNodes: addedNodes.map(node => {
        const readOnlyNode = nullthrows(getPublicInstance)(
          fromNode(node).instanceHandle,
        );
        invariant(
          readOnlyNode instanceof ReadOnlyNode,
          'expected instance of ReadOnlyNode',
        );
        return readOnlyNode;
      }),
      removedNodes: removedNodes.map(node => {
        const readOnlyNode = nullthrows(getPublicInstance)(
          fromNode(node).instanceHandle,
        );
        invariant(
          readOnlyNode instanceof ReadOnlyNode,
          'expected instance of ReadOnlyNode',
        );
        return readOnlyNode;
      }),
    });
  }
}

function runMutationObservation({
  mutationObserverId,
  targetShadowNode,
  subtree,
  oldChildSet,
  newChildSet,
  newRecords,
  processedNodes,
}: {
  mutationObserverId: MutationObserverId,
  targetShadowNode: Node,
  subtree: boolean,
  oldChildSet: ?NodeSet,
  newChildSet: NodeSet,
  newRecords: Array<NativeMutationRecord>,
  processedNodes: Set<Node>,
}): void {
  if (!oldChildSet) {
    return;
  }

  const oldTargetShadowNode = getNodeInChildSet(targetShadowNode, oldChildSet);
  if (oldTargetShadowNode == null) {
    return;
  }

  const newTargetShadowNode = getNodeInChildSet(targetShadowNode, newChildSet);
  if (newTargetShadowNode == null) {
    return;
  }

  recordMutations({
    mutationObserverId,
    targetShadowNode,
    subtree,
    oldNode: oldTargetShadowNode,
    newNode: newTargetShadowNode,
    newRecords,
    processedNodes,
  });
}

function notifyObserversIfNecessary(): void {
  if (pendingRecords.length > 0) {
    // We schedule these using regular tasks in native because microtasks are
    // still not properly supported.
    setTimeout(() => callback?.(), 0);
  }
}
