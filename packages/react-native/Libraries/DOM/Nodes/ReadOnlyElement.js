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

import {getFabricUIManager} from '../../ReactNative/FabricUIManager';
import DOMRect from '../Geometry/DOMRect';
import {createHTMLCollection} from '../OldStyleCollections/HTMLCollection';
import ReadOnlyNode, {getChildNodes, getShadowNode} from './ReadOnlyNode';
import {getElementSibling} from './Utilities/Traversal';
import nullthrows from 'nullthrows';

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
    return getElementSibling(this, 'next');
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
    return getElementSibling(this, 'previous');
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
    const shadowNode = getShadowNode(this);

    if (shadowNode != null) {
      return nullthrows(getFabricUIManager()).getTextContent(shadowNode);
    }

    return '';
  }

  getBoundingClientRect(): DOMRect {
    const shadowNode = getShadowNode(this);

    if (shadowNode != null) {
      const rect = nullthrows(getFabricUIManager()).getBoundingClientRect(
        shadowNode,
      );

      if (rect) {
        return new DOMRect(rect[0], rect[1], rect[2], rect[3]);
      }
    }

    // Empty rect if any of the above failed
    return new DOMRect(0, 0, 0, 0);
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
