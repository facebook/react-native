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
import ReadOnlyNode, {
  getChildNodes,
  getInstanceHandle,
  getShadowNode,
} from './ReadOnlyNode';
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
    const node = getShadowNode(this);

    if (node != null) {
      const innerSize = nullthrows(getFabricUIManager()).getInnerSize(node);
      if (innerSize != null) {
        return innerSize[1];
      }
    }

    return 0;
  }

  get clientLeft(): number {
    const node = getShadowNode(this);

    if (node != null) {
      const borderSize = nullthrows(getFabricUIManager()).getBorderSize(node);
      if (borderSize != null) {
        return borderSize[3];
      }
    }

    return 0;
  }

  get clientTop(): number {
    const node = getShadowNode(this);

    if (node != null) {
      const borderSize = nullthrows(getFabricUIManager()).getBorderSize(node);
      if (borderSize != null) {
        return borderSize[0];
      }
    }

    return 0;
  }

  get clientWidth(): number {
    const node = getShadowNode(this);

    if (node != null) {
      const innerSize = nullthrows(getFabricUIManager()).getInnerSize(node);
      if (innerSize != null) {
        return innerSize[0];
      }
    }

    return 0;
  }

  get firstElementChild(): ReadOnlyElement | null {
    const childElements = getChildElements(this);

    if (childElements.length === 0) {
      return null;
    }

    return childElements[0];
  }

  get id(): string {
    const instanceHandle = getInstanceHandle(this);
    // TODO: migrate off this private React API
    // $FlowExpectedError[incompatible-use]
    const props = instanceHandle?.stateNode?.canonical?.currentProps;
    return props?.id ?? props?.nativeID ?? '';
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
    const node = getShadowNode(this);

    if (node != null) {
      const scrollSize = nullthrows(getFabricUIManager()).getScrollSize(node);
      if (scrollSize != null) {
        return scrollSize[1];
      }
    }

    return 0;
  }

  get scrollLeft(): number {
    const node = getShadowNode(this);

    if (node != null) {
      const scrollPosition = nullthrows(getFabricUIManager()).getScrollPosition(
        node,
      );
      if (scrollPosition != null) {
        return scrollPosition[0];
      }
    }

    return 0;
  }

  get scrollTop(): number {
    const node = getShadowNode(this);

    if (node != null) {
      const scrollPosition = nullthrows(getFabricUIManager()).getScrollPosition(
        node,
      );
      if (scrollPosition != null) {
        return scrollPosition[1];
      }
    }

    return 0;
  }

  get scrollWidth(): number {
    const node = getShadowNode(this);

    if (node != null) {
      const scrollSize = nullthrows(getFabricUIManager()).getScrollSize(node);
      if (scrollSize != null) {
        return scrollSize[0];
      }
    }

    return 0;
  }

  get tagName(): string {
    const node = getShadowNode(this);

    if (node != null) {
      return nullthrows(getFabricUIManager()).getTagName(node);
    }

    return '';
  }

  get textContent(): string | null {
    const shadowNode = getShadowNode(this);

    if (shadowNode != null) {
      return nullthrows(getFabricUIManager()).getTextContent(shadowNode);
    }

    return '';
  }

  getBoundingClientRect(): DOMRect {
    return getBoundingClientRect(this, {includeTransform: true});
  }

  /**
   * Pointer Capture APIs
   */
  hasPointerCapture(pointerId: number): boolean {
    const node = getShadowNode(this);
    if (node != null) {
      return nullthrows(getFabricUIManager()).hasPointerCapture(
        node,
        pointerId,
      );
    }
    return false;
  }

  setPointerCapture(pointerId: number): void {
    const node = getShadowNode(this);
    if (node != null) {
      nullthrows(getFabricUIManager()).setPointerCapture(node, pointerId);
    }
  }

  releasePointerCapture(pointerId: number): void {
    const node = getShadowNode(this);
    if (node != null) {
      nullthrows(getFabricUIManager()).releasePointerCapture(node, pointerId);
    }
  }
}

function getChildElements(node: ReadOnlyNode): $ReadOnlyArray<ReadOnlyElement> {
  // $FlowIssue[incompatible-call]
  return getChildNodes(node).filter(
    childNode => childNode instanceof ReadOnlyElement,
  );
}

/**
 * The public API for `getBoundingClientRect` always includes transform,
 * so we use this internal version to get the data without transform to
 * implement methods like `offsetWidth` and `offsetHeight`.
 */
export function getBoundingClientRect(
  node: ReadOnlyElement,
  {includeTransform}: {includeTransform: boolean},
): DOMRect {
  const shadowNode = getShadowNode(node);

  if (shadowNode != null) {
    const rect = nullthrows(getFabricUIManager()).getBoundingClientRect(
      shadowNode,
      includeTransform,
    );

    if (rect) {
      return new DOMRect(rect[0], rect[1], rect[2], rect[3]);
    }
  }

  // Empty rect if any of the above failed
  return new DOMRect(0, 0, 0, 0);
}
