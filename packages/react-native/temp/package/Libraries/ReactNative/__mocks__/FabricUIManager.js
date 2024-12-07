/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {
  InternalInstanceHandle,
  LayoutAnimationConfig,
  MeasureInWindowOnSuccessCallback,
  MeasureLayoutOnSuccessCallback,
  MeasureOnSuccessCallback,
  Node,
} from '../../Renderer/shims/ReactNativeTypes';
import type {RootTag} from '../../Types/RootTagTypes';
import type {
  NodeProps,
  NodeSet,
  Spec as FabricUIManager,
} from '../FabricUIManager';

import {createRootTag} from '../RootTag.js';

export type NodeMock = {
  children: NodeSet,
  instanceHandle: InternalInstanceHandle,
  props: NodeProps,
  reactTag: number,
  rootTag: RootTag,
  viewName: string,
};

export function fromNode(node: Node): NodeMock {
  // $FlowExpectedError[incompatible-return]
  return node;
}

export function toNode(node: NodeMock): Node {
  // $FlowExpectedError[incompatible-return]
  return node;
}

// Mock of the Native Hooks

const roots: Map<RootTag, NodeSet> = new Map();
const allocatedTags: Set<number> = new Set();

export function ensureHostNode(node: Node): void {
  if (node == null || typeof node !== 'object') {
    throw new Error(
      `Expected node to be an object. Got ${
        node === null ? 'null' : typeof node
      } value`,
    );
  }

  if (typeof node.viewName !== 'string') {
    throw new Error(
      `Expected node to be a host node. Got object with ${
        node.viewName === null ? 'null' : typeof node.viewName
      } viewName`,
    );
  }
}

function getAncestorsInChildSet(
  node: Node,
  childSet: NodeSet,
): ?$ReadOnlyArray<[Node, number]> {
  const rootNode = toNode({
    reactTag: 0,
    rootTag: fromNode(node).rootTag,
    viewName: 'RootNode',
    // $FlowExpectedError
    instanceHandle: null,
    props: {},
    children: childSet,
  });

  let position = 0;
  for (const child of childSet) {
    const ancestors = getAncestors(child, node);
    if (ancestors) {
      return [[rootNode, position]].concat(ancestors);
    }
    position++;
  }

  return null;
}

export function getAncestorsInCurrentTree(
  node: Node,
): ?$ReadOnlyArray<[Node, number]> {
  const childSet = roots.get(fromNode(node).rootTag);
  if (childSet == null) {
    return null;
  }

  return getAncestorsInChildSet(node, childSet);
}

function getAncestors(root: Node, node: Node): ?$ReadOnlyArray<[Node, number]> {
  if (fromNode(root).reactTag === fromNode(node).reactTag) {
    return [];
  }

  let position = 0;
  for (const child of fromNode(root).children) {
    const ancestors = getAncestors(child, node);
    if (ancestors != null) {
      return [[root, position]].concat(ancestors);
    }
    position++;
  }

  return null;
}

export function getNodeInChildSet(node: Node, childSet: NodeSet): ?Node {
  const ancestors = getAncestorsInChildSet(node, childSet);
  if (ancestors == null) {
    return null;
  }

  const [parent, position] = ancestors[ancestors.length - 1];
  const nodeInCurrentTree = fromNode(parent).children[position];
  return nodeInCurrentTree;
}

export function getNodeInCurrentTree(node: Node): ?Node {
  const childSet = roots.get(fromNode(node).rootTag);
  if (childSet == null) {
    return null;
  }

  return getNodeInChildSet(node, childSet);
}

interface IFabricUIManagerMock extends FabricUIManager {
  getRoot(rootTag: RootTag | number): NodeSet;
  __getInstanceHandleFromNode(node: Node): InternalInstanceHandle;
  __addCommitHook(commitHook: UIManagerCommitHook): void;
  __removeCommitHook(commitHook: UIManagerCommitHook): void;
}

export interface UIManagerCommitHook {
  shadowTreeWillCommit: (
    rootTag: RootTag,
    oldChildSet: ?NodeSet,
    newChildSet: NodeSet,
  ) => void;
}

const commitHooks: Set<UIManagerCommitHook> = new Set();

const FabricUIManagerMock: IFabricUIManagerMock = {
  createNode: jest.fn(
    (
      reactTag: number,
      viewName: string,
      rootTag: RootTag,
      props: NodeProps,
      instanceHandle: InternalInstanceHandle,
    ): Node => {
      if (allocatedTags.has(reactTag)) {
        throw new Error(`Created two native views with tag ${reactTag}`);
      }

      allocatedTags.add(reactTag);
      return toNode({
        reactTag,
        rootTag,
        viewName,
        instanceHandle,
        props: props,
        children: [],
      });
    },
  ),

  cloneNode: jest.fn((node: Node): Node => {
    return toNode({...fromNode(node)});
  }),

  cloneNodeWithNewChildren: jest.fn((node: Node): Node => {
    return toNode({...fromNode(node), children: []});
  }),

  cloneNodeWithNewProps: jest.fn((node: Node, newProps: NodeProps): Node => {
    return toNode({
      ...fromNode(node),
      props: {
        ...fromNode(node).props,
        ...newProps,
      },
    });
  }),

  cloneNodeWithNewChildrenAndProps: jest.fn(
    (node: Node, newProps: NodeProps): Node => {
      return toNode({
        ...fromNode(node),
        children: [],
        props: {
          ...fromNode(node).props,
          ...newProps,
        },
      });
    },
  ),

  createChildSet: jest.fn((rootTag: RootTag): NodeSet => {
    return [];
  }),

  appendChild: jest.fn((parentNode: Node, child: Node): Node => {
    // Although the signature returns a Node, React expects this to be mutating.
    fromNode(parentNode).children.push(child);
    return parentNode;
  }),

  appendChildToSet: jest.fn((childSet: NodeSet, child: Node): void => {
    childSet.push(child);
  }),

  completeRoot: jest.fn((rootTag: RootTag, childSet: NodeSet): void => {
    commitHooks.forEach(hook =>
      hook.shadowTreeWillCommit(rootTag, roots.get(rootTag), childSet),
    );
    roots.set(rootTag, childSet);
  }),

  measure: jest.fn((node: Node, callback: MeasureOnSuccessCallback): void => {
    ensureHostNode(node);

    callback(10, 10, 100, 100, 0, 0);
  }),

  measureInWindow: jest.fn(
    (node: Node, callback: MeasureInWindowOnSuccessCallback): void => {
      ensureHostNode(node);

      callback(10, 10, 100, 100);
    },
  ),

  measureLayout: jest.fn(
    (
      node: Node,
      relativeNode: Node,
      onFail: () => void,
      onSuccess: MeasureLayoutOnSuccessCallback,
    ): void => {
      ensureHostNode(node);
      ensureHostNode(relativeNode);

      onSuccess(1, 1, 100, 100);
    },
  ),

  configureNextLayoutAnimation: jest.fn(
    (
      config: LayoutAnimationConfig,
      callback: () => void, // check what is returned here
      errorCallback: () => void,
    ): void => {},
  ),

  sendAccessibilityEvent: jest.fn((node: Node, eventType: string): void => {}),

  findShadowNodeByTag_DEPRECATED: jest.fn((reactTag: number): ?Node => {}),

  findNodeAtPoint: jest.fn(
    (
      node: Node,
      locationX: number,
      locationY: number,
      callback: (instanceHandle: ?InternalInstanceHandle) => void,
    ): void => {},
  ),

  getBoundingClientRect: jest.fn(
    (
      node: Node,
      includeTransform: boolean,
    ): ?[
      /* x:*/ number,
      /* y:*/ number,
      /* width:*/ number,
      /* height:*/ number,
    ] => {},
  ),

  setNativeProps: jest.fn((node: Node, newProps: NodeProps): void => {}),

  dispatchCommand: jest.fn(
    (node: Node, commandName: string, args: Array<mixed>): void => {},
  ),

  compareDocumentPosition: jest.fn((node: Node, otherNode: Node): number => 0),

  getRoot(containerTag: RootTag | number): NodeSet {
    const tag = createRootTag(containerTag);
    const root = roots.get(tag);
    if (!root) {
      throw new Error('No root found for containerTag ' + Number(tag));
    }
    return root;
  },

  __getInstanceHandleFromNode(node: Node): InternalInstanceHandle {
    return fromNode(node).instanceHandle;
  },

  __addCommitHook(commitHook: UIManagerCommitHook): void {
    commitHooks.add(commitHook);
  },

  __removeCommitHook(commitHook: UIManagerCommitHook): void {
    commitHooks.delete(commitHook);
  },
};

global.nativeFabricUIManager = FabricUIManagerMock;

export function getFabricUIManager(): ?IFabricUIManagerMock {
  return FabricUIManagerMock;
}
