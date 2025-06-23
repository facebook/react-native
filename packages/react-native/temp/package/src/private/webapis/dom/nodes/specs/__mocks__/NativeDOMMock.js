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
  Node,
} from '../../../../../../../Libraries/Renderer/shims/ReactNativeTypes';
import type {
  MeasureInWindowOnSuccessCallback,
  MeasureLayoutOnSuccessCallback,
  MeasureOnSuccessCallback,
} from '../NativeDOM';
import typeof NativeDOM from '../NativeDOM';

import {
  ensureHostNode,
  fromNode,
  getAncestorsInCurrentTree,
  getNodeInCurrentTree,
} from '../../../../../../../Libraries/ReactNative/__mocks__/FabricUIManager';

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

const NativeDOMMock: NativeDOM = {
  getBoundingClientRect: jest.fn(
    (
      node: Node,
      includeTransform: boolean,
    ): [
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
        return [0, 0, 0, 0];
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
        return [0, 0, 0, 0];
      }

      const {x, y, width, height} = boundingClientRectForTests;
      return [x, y, width, height];
    },
  ),

  hasPointerCapture: jest.fn((node: Node, pointerId: number): boolean => false),

  setPointerCapture: jest.fn((node: Node, pointerId: number): void => {}),

  releasePointerCapture: jest.fn((node: Node, pointerId: number): void => {}),

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
    const ReadOnlyNode = require('../../ReadOnlyNode').default;

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
    ): [
      /* offsetParent: */ ?InternalInstanceHandle,
      /* offsetTop: */ number,
      /* offsetLeft: */ number,
    ] => {
      const ancestors = getAncestorsInCurrentTree(node);
      if (ancestors == null) {
        return [null, 0, 0];
      }

      const [parent, position] = ancestors[ancestors.length - 1];
      const nodeInCurrentTree = fromNode(parent).children[position];

      const currentProps =
        nodeInCurrentTree != null ? fromNode(nodeInCurrentTree).props : null;
      if (currentProps == null || hasDisplayNone(nodeInCurrentTree)) {
        return [null, 0, 0];
      }

      const offsetForTests: ?{
        top: number,
        left: number,
      } =
        // $FlowExpectedError[prop-missing]
        currentProps.__offsetForTests;

      if (offsetForTests == null) {
        return [null, 0, 0];
      }

      let currentIndex = ancestors.length - 1;
      while (currentIndex >= 0 && !hasDisplayNone(ancestors[currentIndex][0])) {
        currentIndex--;
      }

      if (currentIndex >= 0) {
        // The node or one of its ancestors have display: none
        return [null, 0, 0];
      }

      return [
        fromNode(parent).instanceHandle,
        offsetForTests.top,
        offsetForTests.left,
      ];
    },
  ),

  getScrollPosition: jest.fn(
    (node: Node): [/* scrollLeft: */ number, /* scrollTop: */ number] => {
      ensureHostNode(node);

      const nodeInCurrentTree = getNodeInCurrentTree(node);
      const currentProps =
        nodeInCurrentTree != null ? fromNode(nodeInCurrentTree).props : null;
      if (currentProps == null) {
        return [0, 0];
      }

      const scrollForTests: ?{
        scrollLeft: number,
        scrollTop: number,
        ...
      } =
        // $FlowExpectedError[prop-missing]
        currentProps.__scrollForTests;

      if (scrollForTests == null) {
        return [0, 0];
      }

      const {scrollLeft, scrollTop} = scrollForTests;
      return [scrollLeft, scrollTop];
    },
  ),

  getScrollSize: jest.fn(
    (node: Node): [/* scrollLeft: */ number, /* scrollTop: */ number] => {
      ensureHostNode(node);

      const nodeInCurrentTree = getNodeInCurrentTree(node);
      const currentProps =
        nodeInCurrentTree != null ? fromNode(nodeInCurrentTree).props : null;
      if (currentProps == null) {
        return [0, 0];
      }

      const scrollForTests: ?{
        scrollWidth: number,
        scrollHeight: number,
        ...
      } =
        // $FlowExpectedError[prop-missing]
        currentProps.__scrollForTests;

      if (scrollForTests == null) {
        return [0, 0];
      }

      const {scrollWidth, scrollHeight} = scrollForTests;
      return [scrollWidth, scrollHeight];
    },
  ),

  getInnerSize: jest.fn(
    (node: Node): [/* width: */ number, /* height: */ number] => {
      ensureHostNode(node);

      const nodeInCurrentTree = getNodeInCurrentTree(node);
      const currentProps =
        nodeInCurrentTree != null ? fromNode(nodeInCurrentTree).props : null;
      if (currentProps == null) {
        return [0, 0];
      }

      const innerSizeForTests: ?{
        width: number,
        height: number,
        ...
      } =
        // $FlowExpectedError[prop-missing]
        currentProps.__innerSizeForTests;

      if (innerSizeForTests == null) {
        return [0, 0];
      }

      const {width, height} = innerSizeForTests;
      return [width, height];
    },
  ),

  getBorderWidth: jest.fn(
    (
      node: Node,
    ): [
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
        return [0, 0, 0, 0];
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
        return [0, 0, 0, 0];
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

  /**
   * Legacy layout APIs
   */

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
};

export default NativeDOMMock;
