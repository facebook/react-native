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
  reactTag: number,
  rootTag: RootTag,
  props: NodeProps,
  instanceHandle: InstanceHandle,
  children: NodeSet,
};

function fromNode(node: Node): NodeMock {
  // $FlowExpectedError[incompatible-return]
  return node;
}

function toNode(node: NodeMock): Node {
  // $FlowExpectedError[incompatible-return]
  return node;
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
      return toNode({
        reactTag,
        rootTag,
        props,
        instanceHandle,
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
    return toNode({...fromNode(node), props: newProps});
  }),
  cloneNodeWithNewChildrenAndProps: jest.fn(
    (node: Node, newProps: NodeProps): Node => {
      return toNode({...fromNode(node), children: [], props: newProps});
    },
  ),
  createChildSet: jest.fn((rootTag: RootTag): NodeSet => {
    return [];
  }),
  appendChild: jest.fn((parentNode: Node, child: Node): Node => {
    return toNode({
      ...fromNode(parentNode),
      children: fromNode(parentNode).children.concat(child),
    });
  }),
  appendChildToSet: jest.fn((childSet: NodeSet, child: Node): void => {
    childSet.push(child);
  }),
  completeRoot: jest.fn((rootTag: RootTag, childSet: NodeSet): void => {}),
  measure: jest.fn((node: Node, callback: MeasureOnSuccessCallback): void => {
    callback(10, 10, 100, 100, 0, 0);
  }),
  measureInWindow: jest.fn(
    (node: Node, callback: MeasureInWindowOnSuccessCallback): void => {
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
      return [1, 1, 100, 100];
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
