/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

// flowlint unsafe-getters-setters:off

import type NodeList from '../OldStyleCollections/NodeList';
import type ReadOnlyElement from './ReadOnlyElement';

export default class ReadOnlyNode {
  get childNodes(): NodeList<ReadOnlyNode> {
    throw new TypeError('Unimplemented');
  }

  get firstChild(): ReadOnlyNode | null {
    throw new TypeError('Unimplemented');
  }

  get isConnected(): boolean {
    throw new TypeError('Unimplemented');
  }

  get lastChild(): ReadOnlyNode | null {
    throw new TypeError('Unimplemented');
  }

  get nextSibling(): ReadOnlyNode | null {
    throw new TypeError('Unimplemented');
  }

  get nodeName(): string {
    throw new TypeError('Unimplemented');
  }

  get nodeType(): number {
    throw new TypeError('Unimplemented');
  }

  get nodeValue(): string | null {
    throw new TypeError('Unimplemented');
  }

  get parentElement(): ReadOnlyElement | null {
    throw new TypeError('Unimplemented');
  }

  get parentNode(): ReadOnlyNode | null {
    throw new TypeError('Unimplemented');
  }

  get previousSibling(): ReadOnlyNode | null {
    throw new TypeError('Unimplemented');
  }

  get textContent(): string | null {
    throw new TypeError('Unimplemented');
  }

  compareDocumentPosition(otherNode: ReadOnlyNode): number {
    throw new TypeError('Unimplemented');
  }

  contains(otherNode: ReadOnlyNode): boolean {
    throw new TypeError('Unimplemented');
  }

  getRootNode(): ReadOnlyNode {
    throw new TypeError('Unimplemented');
  }

  hasChildNodes(): boolean {
    throw new TypeError('Unimplemented');
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
