/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

// flowlint unsafe-getters-setters:off

import type {
  InternalInstanceHandle,
  Node as ShadowNode,
} from '../../../../../Libraries/Renderer/shims/ReactNativeTypes';
import type NodeList from '../oldstylecollections/NodeList';
import type ReadOnlyElement from './ReadOnlyElement';

import {createNodeList} from '../oldstylecollections/NodeList';
import NativeDOM from './specs/NativeDOM';

// We initialize this lazily to avoid a require cycle
// (`ReadOnlyElement` also depends on `ReadOnlyNode`).
let ReadOnlyElementClass: Class<ReadOnlyElement>;

export default class ReadOnlyNode {
  constructor(internalInstanceHandle: InternalInstanceHandle) {
    setInstanceHandle(this, internalInstanceHandle);
  }

  get childNodes(): NodeList<ReadOnlyNode> {
    const childNodes = getChildNodes(this);
    return createNodeList(childNodes);
  }

  get firstChild(): ReadOnlyNode | null {
    const childNodes = getChildNodes(this);

    if (childNodes.length === 0) {
      return null;
    }

    return childNodes[0];
  }

  get isConnected(): boolean {
    const shadowNode = getShadowNode(this);

    if (shadowNode == null) {
      return false;
    }

    return NativeDOM.isConnected(shadowNode);
  }

  get lastChild(): ReadOnlyNode | null {
    const childNodes = getChildNodes(this);

    if (childNodes.length === 0) {
      return null;
    }

    return childNodes[childNodes.length - 1];
  }

  get nextSibling(): ReadOnlyNode | null {
    const [siblings, position] = getNodeSiblingsAndPosition(this);

    if (position === siblings.length - 1) {
      // this node is the last child of its parent, so there is no next sibling.
      return null;
    }

    return siblings[position + 1];
  }

  /**
   * @abstract
   */
  get nodeName(): string {
    throw new TypeError(
      '`nodeName` is abstract and must be implemented in a subclass of `ReadOnlyNode`',
    );
  }

  /**
   * @abstract
   */
  get nodeType(): number {
    throw new TypeError(
      '`nodeType` is abstract and must be implemented in a subclass of `ReadOnlyNode`',
    );
  }

  /**
   * @abstract
   */
  get nodeValue(): string | null {
    throw new TypeError(
      '`nodeValue` is abstract and must be implemented in a subclass of `ReadOnlyNode`',
    );
  }

  get parentElement(): ReadOnlyElement | null {
    const parentNode = this.parentNode;

    if (ReadOnlyElementClass == null) {
      // We initialize this lazily to avoid a require cycle.
      ReadOnlyElementClass = require('./ReadOnlyElement').default;
    }

    if (parentNode instanceof ReadOnlyElementClass) {
      return parentNode;
    }

    return null;
  }

  get parentNode(): ReadOnlyNode | null {
    const shadowNode = getShadowNode(this);

    if (shadowNode == null) {
      return null;
    }

    const parentInstanceHandle = NativeDOM.getParentNode(shadowNode);

    if (parentInstanceHandle == null) {
      return null;
    }

    return (
      getPublicInstanceFromInternalInstanceHandle(parentInstanceHandle) ?? null
    );
  }

  get previousSibling(): ReadOnlyNode | null {
    const [siblings, position] = getNodeSiblingsAndPosition(this);

    if (position === 0) {
      // this node is the first child of its parent, so there is no previous sibling.
      return null;
    }

    return siblings[position - 1];
  }

  /**
   * @abstract
   */
  get textContent(): string | null {
    throw new TypeError(
      '`textContent` is abstract and must be implemented in a subclass of `ReadOnlyNode`',
    );
  }

  compareDocumentPosition(otherNode: ReadOnlyNode): number {
    // Quick check to avoid having to call into Fabric if the nodes are the same.
    if (otherNode === this) {
      return 0;
    }

    const shadowNode = getShadowNode(this);
    const otherShadowNode = getShadowNode(otherNode);

    if (shadowNode == null || otherShadowNode == null) {
      return ReadOnlyNode.DOCUMENT_POSITION_DISCONNECTED;
    }

    return NativeDOM.compareDocumentPosition(shadowNode, otherShadowNode);
  }

  contains(otherNode: ReadOnlyNode): boolean {
    if (otherNode === this) {
      return true;
    }

    const position = this.compareDocumentPosition(otherNode);
    // eslint-disable-next-line no-bitwise
    return (position & ReadOnlyNode.DOCUMENT_POSITION_CONTAINED_BY) !== 0;
  }

  getRootNode(): ReadOnlyNode {
    // eslint-disable-next-line consistent-this
    let lastKnownParent: ReadOnlyNode = this;
    let nextPossibleParent: ?ReadOnlyNode = this.parentNode;

    while (nextPossibleParent != null) {
      lastKnownParent = nextPossibleParent;
      nextPossibleParent = nextPossibleParent.parentNode;
    }

    return lastKnownParent;
  }

  hasChildNodes(): boolean {
    return getChildNodes(this).length > 0;
  }

  /*
   * Node types, as returned by the `nodeType` property.
   */

  /**
   * Type of Element, HTMLElement and ReactNativeElement instances.
   */
  static ELEMENT_NODE: number = 1;
  /**
   * Currently Unused in React Native.
   */
  static ATTRIBUTE_NODE: number = 2;
  /**
   * Text nodes.
   */
  static TEXT_NODE: number = 3;
  /**
   * @deprecated Unused in React Native.
   */
  static CDATA_SECTION_NODE: number = 4;
  /**
   * @deprecated
   */
  static ENTITY_REFERENCE_NODE: number = 5;
  /**
   * @deprecated
   */
  static ENTITY_NODE: number = 6;
  /**
   * @deprecated Unused in React Native.
   */
  static PROCESSING_INSTRUCTION_NODE: number = 7;
  /**
   * @deprecated Unused in React Native.
   */
  static COMMENT_NODE: number = 8;
  /**
   * @deprecated Unused in React Native.
   */
  static DOCUMENT_NODE: number = 9;
  /**
   * @deprecated Unused in React Native.
   */
  static DOCUMENT_TYPE_NODE: number = 10;
  /**
   * @deprecated Unused in React Native.
   */
  static DOCUMENT_FRAGMENT_NODE: number = 11;
  /**
   * @deprecated
   */
  static NOTATION_NODE: number = 12;

  /*
   * Document position flags. Used to check the return value of
   * `compareDocumentPosition()`.
   */

  /**
   * Both nodes are in different documents.
   */
  static DOCUMENT_POSITION_DISCONNECTED: number = 1;
  /**
   * `otherNode` precedes the node in either a pre-order depth-first traversal of a tree containing both
   * (e.g., as an ancestor or previous sibling or a descendant of a previous sibling or previous sibling of an ancestor)
   * or (if they are disconnected) in an arbitrary but consistent ordering.
   */
  static DOCUMENT_POSITION_PRECEDING: number = 2;
  /**
   * `otherNode` follows the node in either a pre-order depth-first traversal of a tree containing both
   * (e.g., as a descendant or following sibling or a descendant of a following sibling or following sibling of an ancestor)
   * or (if they are disconnected) in an arbitrary but consistent ordering.
   */
  static DOCUMENT_POSITION_FOLLOWING: number = 4;
  /**
   * `otherNode` is an ancestor of the node.
   */
  static DOCUMENT_POSITION_CONTAINS: number = 8;
  /**
   * `otherNode` is a descendant of the node.
   */
  static DOCUMENT_POSITION_CONTAINED_BY: number = 16;
  /**
   * @deprecated Unused in React Native.
   */
  static DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: number = 32;
}

const INSTANCE_HANDLE_KEY = Symbol('internalInstanceHandle');

export function getInstanceHandle(node: ReadOnlyNode): InternalInstanceHandle {
  // $FlowExpectedError[prop-missing]
  return node[INSTANCE_HANDLE_KEY];
}

function setInstanceHandle(
  node: ReadOnlyNode,
  instanceHandle: InternalInstanceHandle,
): void {
  // $FlowExpectedError[prop-missing]
  node[INSTANCE_HANDLE_KEY] = instanceHandle;
}

export function getShadowNode(node: ReadOnlyNode): ?ShadowNode {
  // Lazy import Fabric here to avoid DOM Node APIs classes from having side-effects.
  // With a static import we can't use these classes for Paper-only variants.
  const ReactFabric = require('../../../../../Libraries/Renderer/shims/ReactFabric');
  return ReactFabric.getNodeFromInternalInstanceHandle(getInstanceHandle(node));
}

export function getChildNodes(
  node: ReadOnlyNode,
): $ReadOnlyArray<ReadOnlyNode> {
  const shadowNode = getShadowNode(node);

  if (shadowNode == null) {
    return [];
  }

  const childNodeInstanceHandles = NativeDOM.getChildNodes(shadowNode);
  return childNodeInstanceHandles
    .map(instanceHandle =>
      getPublicInstanceFromInternalInstanceHandle(instanceHandle),
    )
    .filter(Boolean);
}

function getNodeSiblingsAndPosition(
  node: ReadOnlyNode,
): [$ReadOnlyArray<ReadOnlyNode>, number] {
  const parent = node.parentNode;
  if (parent == null) {
    // This node is the root or it's disconnected.
    return [[node], 0];
  }

  const siblings = getChildNodes(parent);
  const position = siblings.indexOf(node);

  if (position === -1) {
    throw new TypeError("Missing node in parent's child node list");
  }

  return [siblings, position];
}

export function getPublicInstanceFromInternalInstanceHandle(
  instanceHandle: InternalInstanceHandle,
): ?ReadOnlyNode {
  // Lazy import Fabric here to avoid DOM Node APIs classes from having side-effects.
  // With a static import we can't use these classes for Paper-only variants.
  const ReactFabric = require('../../../../../Libraries/Renderer/shims/ReactFabric');
  const mixedPublicInstance =
    ReactFabric.getPublicInstanceFromInternalInstanceHandle(instanceHandle);
  // $FlowExpectedError[incompatible-return] React defines public instances as "mixed" because it can't access the definition from React Native.
  return mixedPublicInstance;
}
