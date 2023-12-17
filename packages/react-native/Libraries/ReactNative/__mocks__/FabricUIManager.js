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

function getAncestorsInCurrentTree(
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

function getNodeInCurrentTree(node: Node): ?Node {
  const childSet = roots.get(fromNode(node).rootTag);
  if (childSet == null) {
    return null;
  }

  return getNodeInChildSet(node, childSet);
}

function* dfs(node: ?Node): Iterator<Node> {
  if (node == null) {
    return;
  }

  yield node;

  for (const child of fromNode(node).children) {
    yield* dfs(child);
  }
}

function hasDisplayNone(node: Node): boolean {
  const props = fromNode(node).props;
  // Style is flattened when passed to native, so there's no style object.
  // $FlowFixMe[prop-missing]
  return props != null && props.display === 'none';
}

interface IFabricUIManagerMock extends FabricUIManager {
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

  getBoundingClientRect: jest.fn(
    (
      node: Node,
      includeTransform: boolean,
    ): ?[
      /* x:*/ number,
      /* y:*/ number,
      /* width:*/ number,
      /* height:*/ number,
    ] => {
      ensureHostNode(node);

      const nodeInCurrentTree = getNodeInCurrentTree(node);
      const currentProps =
        nodeInCurrentTree != null ? fromNode(nodeInCurrentTree).props : null;
      if (currentProps == null) {
        return null;
      }

      const boundingClientRectForTests: ?{
        x: number,
        y: number,
        width: number,
        height: number,
      } =
        // $FlowExpectedError[prop-missing]
        currentProps.__boundingClientRectForTests;

      if (boundingClientRectForTests == null) {
        return null;
      }

      const {x, y, width, height} = boundingClientRectForTests;
      return [x, y, width, height];
    },
  ),

  hasPointerCapture: jest.fn((node: Node, pointerId: number): boolean => false),

  setPointerCapture: jest.fn((node: Node, pointerId: number): void => {}),

  releasePointerCapture: jest.fn((node: Node, pointerId: number): void => {}),

  setNativeProps: jest.fn((node: Node, newProps: NodeProps): void => {}),

  dispatchCommand: jest.fn(
    (node: Node, commandName: string, args: Array<mixed>): void => {},
  ),

  getParentNode: jest.fn((node: Node): ?InternalInstanceHandle => {
    const ancestors = getAncestorsInCurrentTree(node);
    if (ancestors == null || ancestors.length - 2 < 0) {
      return null;
    }

    const [parentOfParent, position] = ancestors[ancestors.length - 2];
    const parentInCurrentTree = fromNode(parentOfParent).children[position];
    return fromNode(parentInCurrentTree).instanceHandle;
  }),

  getChildNodes: jest.fn(
    (node: Node): $ReadOnlyArray<InternalInstanceHandle> => {
      const nodeInCurrentTree = getNodeInCurrentTree(node);

      if (nodeInCurrentTree == null) {
        return [];
      }

      return fromNode(nodeInCurrentTree).children.map(
        child => fromNode(child).instanceHandle,
      );
    },
  ),

  isConnected: jest.fn((node: Node): boolean => {
    return getNodeInCurrentTree(node) != null;
  }),

  getTextContent: jest.fn((node: Node): string => {
    const nodeInCurrentTree = getNodeInCurrentTree(node);

    let result = '';

    if (nodeInCurrentTree == null) {
      return result;
    }

    for (const childNode of dfs(nodeInCurrentTree)) {
      if (fromNode(childNode).viewName === 'RCTRawText') {
        const props = fromNode(childNode).props;
        // $FlowExpectedError[prop-missing]
        const maybeString: ?string = props.text;
        if (typeof maybeString === 'string') {
          result += maybeString;
        }
      }
    }
    return result;
  }),

  compareDocumentPosition: jest.fn((node: Node, otherNode: Node): number => {
    /* eslint-disable no-bitwise */
    const ReadOnlyNode = require('../../DOM/Nodes/ReadOnlyNode').default;

    // Quick check for node vs. itself
    if (fromNode(node).reactTag === fromNode(otherNode).reactTag) {
      return 0;
    }

    if (fromNode(node).rootTag !== fromNode(otherNode).rootTag) {
      return ReadOnlyNode.DOCUMENT_POSITION_DISCONNECTED;
    }

    const ancestors = getAncestorsInCurrentTree(node);
    if (ancestors == null) {
      return ReadOnlyNode.DOCUMENT_POSITION_DISCONNECTED;
    }

    const otherAncestors = getAncestorsInCurrentTree(otherNode);
    if (otherAncestors == null) {
      return ReadOnlyNode.DOCUMENT_POSITION_DISCONNECTED;
    }

    // Consume all common ancestors
    let i = 0;
    while (
      i < ancestors.length &&
      i < otherAncestors.length &&
      ancestors[i][1] === otherAncestors[i][1]
    ) {
      i++;
    }

    if (i === ancestors.length) {
      return (
        ReadOnlyNode.DOCUMENT_POSITION_CONTAINED_BY |
        ReadOnlyNode.DOCUMENT_POSITION_FOLLOWING
      );
    }

    if (i === otherAncestors.length) {
      return (
        ReadOnlyNode.DOCUMENT_POSITION_CONTAINS |
        ReadOnlyNode.DOCUMENT_POSITION_PRECEDING
      );
    }

    if (ancestors[i][1] > otherAncestors[i][1]) {
      return ReadOnlyNode.DOCUMENT_POSITION_PRECEDING;
    }

    return ReadOnlyNode.DOCUMENT_POSITION_FOLLOWING;
  }),

  getOffset: jest.fn(
    (
      node: Node,
    ): ?[
      /* offsetParent: */ InternalInstanceHandle,
      /* offsetTop: */ number,
      /* offsetLeft: */ number,
    ] => {
      const ancestors = getAncestorsInCurrentTree(node);
      if (ancestors == null) {
        return null;
      }

      const [parent, position] = ancestors[ancestors.length - 1];
      const nodeInCurrentTree = fromNode(parent).children[position];

      const currentProps =
        nodeInCurrentTree != null ? fromNode(nodeInCurrentTree).props : null;
      if (currentProps == null || hasDisplayNone(nodeInCurrentTree)) {
        return null;
      }

      const offsetForTests: ?{
        top: number,
        left: number,
      } =
        // $FlowExpectedError[prop-missing]
        currentProps.__offsetForTests;

      if (offsetForTests == null) {
        return null;
      }

      let currentIndex = ancestors.length - 1;
      while (currentIndex >= 0 && !hasDisplayNone(ancestors[currentIndex][0])) {
        currentIndex--;
      }

      if (currentIndex >= 0) {
        // The node or one of its ancestors have display: none
        return null;
      }

      return [
        fromNode(parent).instanceHandle,
        offsetForTests.top,
        offsetForTests.left,
      ];
    },
  ),

  getScrollPosition: jest.fn(
    (node: Node): ?[/* scrollLeft: */ number, /* scrollTop: */ number] => {
      ensureHostNode(node);

      const nodeInCurrentTree = getNodeInCurrentTree(node);
      const currentProps =
        nodeInCurrentTree != null ? fromNode(nodeInCurrentTree).props : null;
      if (currentProps == null) {
        return null;
      }

      const scrollForTests: ?{
        scrollLeft: number,
        scrollTop: number,
        ...
      } =
        // $FlowExpectedError[prop-missing]
        currentProps.__scrollForTests;

      if (scrollForTests == null) {
        return null;
      }

      const {scrollLeft, scrollTop} = scrollForTests;
      return [scrollLeft, scrollTop];
    },
  ),

  getScrollSize: jest.fn(
    (node: Node): ?[/* scrollLeft: */ number, /* scrollTop: */ number] => {
      ensureHostNode(node);

      const nodeInCurrentTree = getNodeInCurrentTree(node);
      const currentProps =
        nodeInCurrentTree != null ? fromNode(nodeInCurrentTree).props : null;
      if (currentProps == null) {
        return null;
      }

      const scrollForTests: ?{
        scrollWidth: number,
        scrollHeight: number,
        ...
      } =
        // $FlowExpectedError[prop-missing]
        currentProps.__scrollForTests;

      if (scrollForTests == null) {
        return null;
      }

      const {scrollWidth, scrollHeight} = scrollForTests;
      return [scrollWidth, scrollHeight];
    },
  ),

  getInnerSize: jest.fn(
    (node: Node): ?[/* width: */ number, /* height: */ number] => {
      ensureHostNode(node);

      const nodeInCurrentTree = getNodeInCurrentTree(node);
      const currentProps =
        nodeInCurrentTree != null ? fromNode(nodeInCurrentTree).props : null;
      if (currentProps == null) {
        return null;
      }

      const innerSizeForTests: ?{
        width: number,
        height: number,
        ...
      } =
        // $FlowExpectedError[prop-missing]
        currentProps.__innerSizeForTests;

      if (innerSizeForTests == null) {
        return null;
      }

      const {width, height} = innerSizeForTests;
      return [width, height];
    },
  ),

  getBorderSize: jest.fn(
    (
      node: Node,
    ): ?[
      /* topWidth: */ number,
      /* rightWidth: */ number,
      /* bottomWidth: */ number,
      /* leftWidth: */ number,
    ] => {
      ensureHostNode(node);

      const nodeInCurrentTree = getNodeInCurrentTree(node);
      const currentProps =
        nodeInCurrentTree != null ? fromNode(nodeInCurrentTree).props : null;
      if (currentProps == null) {
        return null;
      }

      const borderSizeForTests: ?{
        topWidth?: number,
        rightWidth?: number,
        bottomWidth?: number,
        leftWidth?: number,
        ...
      } =
        // $FlowExpectedError[prop-missing]
        currentProps.__borderSizeForTests;

      if (borderSizeForTests == null) {
        return null;
      }

      const {
        topWidth = 0,
        rightWidth = 0,
        bottomWidth = 0,
        leftWidth = 0,
      } = borderSizeForTests;
      return [topWidth, rightWidth, bottomWidth, leftWidth];
    },
  ),

  getTagName: jest.fn((node: Node): string => {
    ensureHostNode(node);
    return 'RN:' + fromNode(node).viewName;
  }),

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
