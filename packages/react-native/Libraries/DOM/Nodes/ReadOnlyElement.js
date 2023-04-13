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

import type HTMLCollection from '../OldStyleCollections/HTMLCollection';

import {createHTMLCollection} from '../OldStyleCollections/HTMLCollection';
import ReadOnlyNode, {getChildNodes} from './ReadOnlyNode';

export default class ReadOnlyElement extends ReadOnlyNode {
  get childElementCount(): number {
    return getChildElements(this).length;
  }

  get children(): HTMLCollection<ReadOnlyElement> {
    return createHTMLCollection(getChildElements(this));
  }

  get clientHeight(): number {
    throw new TypeError('Unimplemented');
  }

  get clientLeft(): number {
    throw new TypeError('Unimplemented');
  }

  get clientTop(): number {
    throw new TypeError('Unimplemented');
  }

  get clientWidth(): number {
    throw new TypeError('Unimplemented');
  }

  get firstElementChild(): ReadOnlyElement | null {
    const childElements = getChildElements(this);

    if (childElements.length === 0) {
      return null;
    }

    return childElements[0];
  }

  get id(): string {
    throw new TypeError('Unimplemented');
  }

  get lastElementChild(): ReadOnlyElement | null {
    const childElements = getChildElements(this);

    if (childElements.length === 0) {
      return null;
    }

    return childElements[childElements.length - 1];
  }

  get nextElementSibling(): ReadOnlyElement | null {
    const [siblings, position] = getElementSiblingsAndPosition(this);

    if (position === siblings.length - 1) {
      // this node is the last child of its parent, so there is no next sibling.
      return null;
    }

    return siblings[position + 1];
  }

  get nodeName(): string {
    return this.tagName;
  }

  get nodeType(): number {
    return ReadOnlyNode.ELEMENT_NODE;
  }

  get nodeValue(): string | null {
    return null;
  }

  set nodeValue(value: string): void {}

  get previousElementSibling(): ReadOnlyElement | null {
    const [siblings, position] = getElementSiblingsAndPosition(this);

    if (position === 0) {
      // this node is the last child of its parent, so there is no next sibling.
      return null;
    }

    return siblings[position - 1];
  }

  get scrollHeight(): number {
    throw new TypeError('Unimplemented');
  }

  get scrollLeft(): number {
    throw new TypeError('Unimplemented');
  }

  get scrollTop(): number {
    throw new TypeError('Unimplemented');
  }

  get scrollWidth(): number {
    throw new TypeError('Unimplemented');
  }

  get tagName(): string {
    throw new TypeError('Unimplemented');
  }

  get textContent(): string | null {
    throw new TypeError('Unimplemented');
  }

  getClientRects(): DOMRectList {
    throw new TypeError('Unimplemented');
  }
}

function getChildElements(node: ReadOnlyNode): $ReadOnlyArray<ReadOnlyElement> {
  // $FlowIssue[incompatible-call]
  return getChildNodes(node).filter(
    childNode => childNode instanceof ReadOnlyElement,
  );
}

export function getElementSiblingsAndPosition(
  element: ReadOnlyElement,
): [$ReadOnlyArray<ReadOnlyElement>, number] {
  const parent = element.parentNode;
  if (parent == null) {
    // This node is the root or it's disconnected.
    return [[element], 0];
  }

  const siblings = getChildElements(parent);
  const position = siblings.indexOf(element);

  if (position === -1) {
    throw new TypeError("Missing node in parent's child node list");
  }

  return [siblings, position];
}
