/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {
  InternalInstanceHandle as InstanceHandle,
  Node as ShadowNode,
} from '../../../../../../Libraries/Renderer/shims/ReactNativeTypes';
import type {TurboModule} from '../../../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../../../Libraries/TurboModule/TurboModuleRegistry';
import nullthrows from 'nullthrows';

export type MeasureInWindowOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
) => void;

export type MeasureOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
  pageX: number,
  pageY: number,
) => void;

export type MeasureLayoutOnSuccessCallback = (
  left: number,
  top: number,
  width: number,
  height: number,
) => void;

export interface Spec extends TurboModule {
  +getParentNode: (
    shadowNode: mixed /* ShadowNode */,
  ) => mixed /* ?InstanceHandle */;

  +getChildNodes: (
    shadowNode: mixed /* ShadowNode */,
  ) => $ReadOnlyArray<mixed> /* $ReadOnlyArray<InstanceHandle> */;

  +isConnected: (shadowNode: mixed /* ShadowNode */) => boolean;

  +compareDocumentPosition: (
    shadowNode: mixed /* ShadowNode */,
    otherShadowNode: mixed /* ShadowNode */,
  ) => number;

  +getTextContent: (shadowNode: mixed /* ShadowNode */) => string;

  +getBoundingClientRect: (
    shadowNode: mixed /* ShadowNode */,
    includeTransform: boolean,
  ) => $ReadOnlyArray<number> /* [x: number, y: number, width: number, height: number] */;

  +getOffset: (
    shadowNode: mixed /* ShadowNode */,
  ) => $ReadOnlyArray<mixed> /* [offsetParent: ?InstanceHandle, top: number, left: number] */;

  +getScrollPosition: (
    shadowNode: mixed /* ShadowNode */,
  ) => $ReadOnlyArray<number> /* [scrollLeft: number, scrollTop: number] */;

  +getScrollSize: (
    shadowNode: mixed /* ShadowNode */,
  ) => $ReadOnlyArray<number> /* [scrollWidth: number, scrollHeight: number] */;

  +getInnerSize: (
    shadowNode: mixed /* ShadowNode */,
  ) => $ReadOnlyArray<number> /* [width: number, height: number] */;

  +getBorderWidth: (
    shadowNode: mixed /* ShadowNode */,
  ) => $ReadOnlyArray<number> /* [topWidth: number, rightWidth: number, bottomWidth: number, leftWidth: number] */;

  +getTagName: (shadowNode: mixed /* ShadowNode */) => string;

  +hasPointerCapture: (
    shadowNode: mixed /* ShadowNode */,
    pointerId: number,
  ) => boolean;

  +setPointerCapture: (
    shadowNode: mixed /* ShadowNode */,
    pointerId: number,
  ) => void;

  +releasePointerCapture: (
    shadowNode: mixed /* ShadowNode */,
    pointerId: number,
  ) => void;

  /**
   * Legacy layout APIs
   */

  +measure: (shadowNode: mixed, callback: MeasureOnSuccessCallback) => void;

  +measureInWindow: (
    shadowNode: mixed,
    callback: MeasureInWindowOnSuccessCallback,
  ) => void;

  +measureLayout: (
    shadowNode: mixed,
    relativeNode: mixed,
    onFail: () => void,
    onSuccess: MeasureLayoutOnSuccessCallback,
  ) => void;
}

const RawNativeDOM = (TurboModuleRegistry.get<Spec>('NativeDOMCxx'): ?Spec);

// This is the actual interface of this module, but the native module codegen
// isn't expressive enough yet.
export interface RefinedSpec {
  /**
   * This is a React Native implementation of `Node.prototype.parentNode`
   * (see https://developer.mozilla.org/en-US/docs/Web/API/Node/parentNode).
   *
   * If a version of the given shadow node is present in the current revision of
   * an active shadow tree, it returns the instance handle of its parent.
   * Otherwise, it returns `null`.
   */
  +getParentNode: (shadowNode: ShadowNode) => ?InstanceHandle;

  /**
   * This is a React Native implementation of `Node.prototype.childNodes`
   * (see https://developer.mozilla.org/en-US/docs/Web/API/Node/childNodes).
   *
   * If a version of the given shadow node is present in the current revision
   * of an active shadow tree, it returns an array of instance handles of its
   * children. Otherwise, it returns an empty array.
   */
  +getChildNodes: (shadowNode: ShadowNode) => $ReadOnlyArray<InstanceHandle>;

  /**
   * This is a React Native implementation of `Node.prototype.isConnected`
   * (see https://developer.mozilla.org/en-US/docs/Web/API/Node/isConnected).
   *
   * Indicates whether a version of the given shadow node is present in the
   * current revision of an active shadow tree.
   */
  +isConnected: (shadowNode: ShadowNode) => boolean;

  /**
   * This is a React Native implementation of `Node.prototype.compareDocumentPosition`
   * (see https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition).
   *
   * It uses the version of the shadow nodes that are present in the current
   * revision of the shadow tree (if any). If any of the nodes is not present,
   * it just indicates they are disconnected.
   */
  +compareDocumentPosition: (
    shadowNode: ShadowNode,
    otherShadowNode: ShadowNode,
  ) => number;

  /**
   * This is a React Native implementation of `Element.prototype.textContent`
   * (see https://developer.mozilla.org/en-US/docs/Web/API/Element/textContent).
   *
   * It uses the version of the shadow node that is present in the current
   * revision of the shadow tree.
   * If the version is present, is traverses all its children in DFS and
   * concatenates all the text contents. Otherwise, it returns an empty string.
   *
   * This is also used to access the text content of text nodes, which does not
   * need any traversal.
   */
  +getTextContent: (shadowNode: ShadowNode) => string;

  /**
   * This is a React Native implementation of `Element.prototype.getBoundingClientRect`
   * (see https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect).
   *
   * This is similar to `measureInWindow`, except it's explicitly synchronous
   * (returns the result instead of passing it to a callback).
   *
   * It allows indicating whether to include transforms so it can also be used
   * to implement methods like [`offsetWidth`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetWidth)
   * and [`offsetHeight`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetHeight).
   */
  +getBoundingClientRect: (
    shadowNode: ShadowNode,
    includeTransform: boolean,
  ) => $ReadOnly<
    [
      /* x: */ number,
      /* y: */ number,
      /* width: */ number,
      /* height: */ number,
    ],
  >;

  /**
   * This is a method to access the offset information for a shadow node, to
   * implement these methods:
   *   - `HTMLElement.prototype.offsetParent`: see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent.
   *   - `HTMLElement.prototype.offsetTop`: see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetTop.
   *   - `HTMLElement.prototype.offsetLeft`: see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetLeft.
   *
   * It uses the version of the shadow node that is present in the current
   * revision of the shadow tree. If the node is not present or is not
   * displayed (because any of its ancestors or itself have 'display: none'),
   * it returns `undefined`. Otherwise, it returns its parent (as all nodes in
   * React Native are currently "positioned") and its offset relative to its
   * parent.
   */
  +getOffset: (
    shadowNode: ShadowNode,
  ) => $ReadOnly<
    [
      /* offsetParent: */ ?InstanceHandle,
      /* top: */ number,
      /* left: */ number,
    ],
  >;

  /**
   * This is a method to access scroll information for a shadow node, to
   * implement these methods:
   *   - `Element.prototype.scrollLeft`: see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollLeft.
   *   - `Element.prototype.scrollTop`: see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTop.
   *
   * It uses the version of the shadow node that is present in the current
   * revision of the shadow tree. If the node is not present or is not displayed
   * (because any of its ancestors or itself have 'display: none'), it returns
   * `undefined`. Otherwise, it returns the scroll position.
   */
  +getScrollPosition: (
    shadowNode: ShadowNode,
  ) => $ReadOnly<[/* scrollLeft: */ number, /* scrollTop: */ number]>;

  /**
   *
   * This is a method to access the scroll information of a shadow node, to
   * implement these methods:
   *   - `Element.prototype.scrollWidth`: see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollWidth.
   *   - `Element.prototype.scrollHeight`: see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight.
   *
   * It uses the version of the shadow node that is present in the current
   * revision of the shadow tree. If the node is not present or is not displayed
   * (because any of its ancestors or itself have 'display: none'), it returns
   * `undefined`. Otherwise, it returns the scroll size.
   */
  +getScrollSize: (
    shadowNode: ShadowNode,
  ) => $ReadOnly<[/* scrollWidth: */ number, /* scrollHeight: */ number]>;

  /**
   * This is a method to access the inner size of a shadow node, to implement
   * these methods:
   *   - `Element.prototype.clientWidth`: see https://developer.mozilla.org/en-US/docs/Web/API/Element/clientWidth.
   *   - `Element.prototype.clientHeight`: see https://developer.mozilla.org/en-US/docs/Web/API/Element/clientHeight.
   *
   * It uses the version of the shadow node that is present in the current
   * revision of the shadow tree. If the node is not present, it is not
   * displayed (because any of its ancestors or itself have 'display: none'), or
   * it has an inline display, it returns `undefined`. Otherwise, it returns its
   * inner size.
   */
  +getInnerSize: (
    shadowNode: ShadowNode,
  ) => $ReadOnly<[/* width: */ number, /* height: */ number]>;

  /**
   * This is a method to access the border size of a shadow node, to implement
   * these methods:
   *   - `Element.prototype.clientLeft`: see https://developer.mozilla.org/en-US/docs/Web/API/Element/clientLeft.
   *   - `Element.prototype.clientTop`: see https://developer.mozilla.org/en-US/docs/Web/API/Element/clientTop.
   *
   * It uses the version of the shadow node that is present in the current
   * revision of the shadow tree. If the node is not present, it is not
   * displayed (because any of its ancestors or itself have 'display: none'), or
   * it has an inline display, it returns `undefined`. Otherwise, it returns its
   * border size.
   */
  +getBorderWidth: (
    shadowNode: ShadowNode,
  ) => $ReadOnly<
    [
      /* topWidth: */ number,
      /* rightWidth: */ number,
      /* bottomWidth: */ number,
      /* leftWidth: */ number,
    ],
  >;

  /**
   * This is a method to access the normalized tag name of a shadow node, to
   * implement `Element.prototype.tagName` (see https://developer.mozilla.org/en-US/docs/Web/API/Element/tagName).
   */
  +getTagName: (shadowNode: ShadowNode) => string;

  /**
   * Pointer Capture APIs
   */

  +hasPointerCapture: (shadowNode: ShadowNode, pointerId: number) => boolean;

  +setPointerCapture: (shadowNode: ShadowNode, pointerId: number) => void;

  +releasePointerCapture: (shadowNode: ShadowNode, pointerId: number) => void;

  /**
   * Legacy layout APIs
   */

  +measure: (
    shadowNode: ShadowNode,
    callback: MeasureOnSuccessCallback,
  ) => void;

  +measureInWindow: (
    shadowNode: ShadowNode,
    callback: MeasureInWindowOnSuccessCallback,
  ) => void;

  +measureLayout: (
    shadowNode: ShadowNode,
    relativeNode: ShadowNode,
    onFail: () => void,
    onSuccess: MeasureLayoutOnSuccessCallback,
  ) => void;
}

const NativeDOM: RefinedSpec = {
  getParentNode(shadowNode) {
    // $FlowExpectedError[incompatible-cast]
    return (nullthrows(RawNativeDOM).getParentNode(
      shadowNode,
    ): ?InstanceHandle);
  },

  getChildNodes(shadowNode) {
    // $FlowExpectedError[incompatible-cast]
    return (nullthrows(RawNativeDOM).getChildNodes(
      shadowNode,
    ): $ReadOnlyArray<InstanceHandle>);
  },

  isConnected(shadowNode) {
    return nullthrows(RawNativeDOM).isConnected(shadowNode);
  },

  compareDocumentPosition(shadowNode, otherShadowNode) {
    return nullthrows(RawNativeDOM).compareDocumentPosition(
      shadowNode,
      otherShadowNode,
    );
  },

  getTextContent(shadowNode) {
    return nullthrows(RawNativeDOM).getTextContent(shadowNode);
  },

  getBoundingClientRect(shadowNode, includeTransform: boolean) {
    // $FlowExpectedError[incompatible-cast]
    return (nullthrows(RawNativeDOM).getBoundingClientRect(
      shadowNode,
      includeTransform,
    ): $ReadOnly<
      [
        /* x: */ number,
        /* y: */ number,
        /* width: */ number,
        /* height: */ number,
      ],
    >);
  },

  getOffset(shadowNode) {
    // $FlowExpectedError[incompatible-cast]
    return (nullthrows(RawNativeDOM).getOffset(shadowNode): $ReadOnly<
      [
        /* offsetParent: */ ?InstanceHandle,
        /* top: */ number,
        /* left: */ number,
      ],
    >);
  },

  getScrollPosition(shadowNode) {
    // $FlowExpectedError[incompatible-cast]
    return (nullthrows(RawNativeDOM).getScrollPosition(shadowNode): $ReadOnly<
      [/* scrollLeft: */ number, /* scrollTop: */ number],
    >);
  },

  getScrollSize(shadowNode) {
    // $FlowExpectedError[incompatible-cast]
    return (nullthrows(RawNativeDOM).getScrollSize(shadowNode): $ReadOnly<
      [/* scrollWidth: */ number, /* scrollHeight: */ number],
    >);
  },

  getInnerSize(shadowNode) {
    // $FlowExpectedError[incompatible-cast]
    return (nullthrows(RawNativeDOM).getInnerSize(shadowNode): $ReadOnly<
      [/* width: */ number, /* height: */ number],
    >);
  },

  getBorderWidth(shadowNode) {
    // $FlowExpectedError[incompatible-cast]
    return (nullthrows(RawNativeDOM).getBorderWidth(shadowNode): $ReadOnly<
      [
        /* topWidth: */ number,
        /* rightWidth: */ number,
        /* bottomWidth: */ number,
        /* leftWidth: */ number,
      ],
    >);
  },

  getTagName(shadowNode) {
    return nullthrows(RawNativeDOM).getTagName(shadowNode);
  },

  hasPointerCapture(shadowNode, pointerId) {
    return nullthrows(RawNativeDOM).hasPointerCapture(shadowNode, pointerId);
  },

  setPointerCapture(shadowNode, pointerId) {
    return nullthrows(RawNativeDOM).setPointerCapture(shadowNode, pointerId);
  },

  releasePointerCapture(shadowNode, pointerId) {
    return nullthrows(RawNativeDOM).releasePointerCapture(
      shadowNode,
      pointerId,
    );
  },

  /**
   * Legacy layout APIs
   */

  measure(shadowNode, callback) {
    return nullthrows(RawNativeDOM).measure(shadowNode, callback);
  },

  measureInWindow(shadowNode, callback) {
    return nullthrows(RawNativeDOM).measureInWindow(shadowNode, callback);
  },

  measureLayout(shadowNode, relativeNode, onFail, onSuccess) {
    return nullthrows(RawNativeDOM).measureLayout(
      shadowNode,
      relativeNode,
      onFail,
      onSuccess,
    );
  },
};

export default NativeDOM;
