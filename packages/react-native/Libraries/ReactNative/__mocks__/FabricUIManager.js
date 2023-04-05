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
  LayoutAnimationConfig,
  MeasureInWindowOnSuccessCallback,
  MeasureLayoutOnSuccessCallback,
  MeasureOnSuccessCallback,
  Node,
} from '../../Renderer/shims/ReactNativeTypes';
import type {RootTag} from '../../Types/RootTagTypes';
import type {
  InstanceHandle,
  NodeProps,
  NodeSet,
  Spec as FabricUIManager,
} from '../FabricUIManager';

type NodeMock = {
  children: NodeSet,
  instanceHandle: InstanceHandle,
  props: NodeProps,
  reactTag: number,
  rootTag: RootTag,
  viewName: string,
};

function fromNode(node: Node): NodeMock {
  // $FlowExpectedError[incompatible-return]
  return node;
}

function toNode(node: NodeMock): Node {
  // $FlowExpectedError[incompatible-return]
  return node;
}

// Mock of the Native Hooks

const roots: Map<RootTag, NodeSet> = new Map();
const allocatedTags: Set<number> = new Set();

function ensureHostNode(node: Node): void {
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

const FabricUIManagerMock: FabricUIManager = {
  createNode: jest.fn(
    (
      reactTag: number,
      viewName: string,
      rootTag: RootTag,
      props: NodeProps,
      instanceHandle: InstanceHandle,
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
  getBoundingClientRect: jest.fn(
    (
      node: Node,
    ): [
      /* x:*/ number,
      /* y:*/ number,
      /* width:*/ number,
      /* height:*/ number,
    ] => {
      ensureHostNode(node);

      return [10, 10, 100, 100];
    },
  ),
  setNativeProps: jest.fn((node: Node, newProps: NodeProps): void => {}),
  dispatchCommand: jest.fn(
    (node: Node, commandName: string, args: Array<mixed>): void => {},
  ),
};

global.nativeFabricUIManager = FabricUIManagerMock;

export function getFabricUIManager(): ?FabricUIManager {
  return FabricUIManagerMock;
}
