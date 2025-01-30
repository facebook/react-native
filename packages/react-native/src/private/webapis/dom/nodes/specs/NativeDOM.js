/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RootTag} from '../../../../../../Libraries/ReactNative/RootTag';
import type {Node as ShadowNode} from '../../../../../../Libraries/Renderer/shims/ReactNativeTypes';
import type {TurboModule} from '../../../../../../Libraries/TurboModule/RCTExport';
import type {InstanceHandle} from '../internals/NodeInternals';

import * as TurboModuleRegistry from '../../../../../../Libraries/TurboModule/TurboModuleRegistry';
import nullthrows from 'nullthrows';

export opaque type NativeElementReference = ShadowNode;
export opaque type NativeTextReference = ShadowNode;

export type NativeNodeReference =
  | NativeElementReference
  | NativeTextReference
  | RootTag;

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
  /*
   * Methods from the `Node` interface (for `ReadOnlyNode`).
   */

  +compareDocumentPosition: (
    nativeNodeReference: mixed /* NativeNodeReference */,
    otherNativeNodeReference: mixed /* NativeNodeReference */,
  ) => number;

  +getChildNodes: (
    nativeNodeReference: mixed /* NativeNodeReference */,
  ) => $ReadOnlyArray<mixed> /* $ReadOnlyArray<InstanceHandle> */;

  +getParentNode: (
    nativeNodeReference: mixed /* NativeNodeReference */,
  ) => mixed /* ?InstanceHandle */;

  +isConnected: (
    nativeNodeReference: mixed /* NativeNodeReference */,
  ) => boolean;

  /*
   * Methods from the `Element` interface (for `ReactNativeElement`).
   */

  +getBorderWidth: (
    nativeElementReference: mixed /* NativeElementReference */,
  ) => $ReadOnlyArray<number> /* [topWidth: number, rightWidth: number, bottomWidth: number, leftWidth: number] */;

  +getBoundingClientRect: (
    nativeElementReference: mixed /* NativeElementReference */,
    includeTransform: boolean,
  ) => $ReadOnlyArray<number> /* [x: number, y: number, width: number, height: number] */;

  +getInnerSize: (
    nativeElementReference: mixed /* NativeElementReference */,
  ) => $ReadOnlyArray<number> /* [width: number, height: number] */;

  +getScrollPosition: (
    nativeElementReference: mixed /* NativeElementReference */,
  ) => $ReadOnlyArray<number> /* [scrollLeft: number, scrollTop: number] */;

  +getScrollSize: (
    nativeElementReference: mixed /* NativeElementReference */,
  ) => $ReadOnlyArray<number> /* [scrollWidth: number, scrollHeight: number] */;

  +getTagName: (
    nativeElementReference: mixed /* NativeElementReference */,
  ) => string;

  +getTextContent: (
    nativeElementReference: mixed /* NativeElementReference */,
  ) => string;

  +hasPointerCapture: (
    nativeElementReference: mixed /* NativeElementReference */,
    pointerId: number,
  ) => boolean;

  +releasePointerCapture: (
    nativeElementReference: mixed /* NativeElementReference */,
    pointerId: number,
  ) => void;

  +setPointerCapture: (
    nativeElementReference: mixed /* NativeElementReference */,
    pointerId: number,
  ) => void;

  /*
   * Methods from the `HTMLElement` interface (for `ReactNativeElement`).
   */

  +getOffset: (
    nativeElementReference: mixed /* NativeElementReference */,
  ) => $ReadOnlyArray<mixed> /* [offsetParent: ?InstanceHandle, top: number, left: number] */;

  /*
   * Special methods to handle the root node.
   */

  +linkRootNode?: (
    rootTag: number /* RootTag */,
    instanceHandle: mixed /* InstanceHandle */,
  ) => mixed /* ?NativeElementReference */;

  /**
   * Legacy layout APIs (for `ReactNativeElement`).
   */

  +measure: (
    nativeElementReference: mixed,
    callback: MeasureOnSuccessCallback,
  ) => void;

  +measureInWindow: (
    nativeElementReference: mixed,
    callback: MeasureInWindowOnSuccessCallback,
  ) => void;

  +measureLayout: (
    nativeElementReference: mixed,
    relativeNode: mixed,
    onFail: () => void,
    onSuccess: MeasureLayoutOnSuccessCallback,
  ) => void;
}

const RawNativeDOM = (TurboModuleRegistry.get<Spec>('NativeDOMCxx'): ?Spec);

// This is the actual interface of this module, but the native module codegen
// isn't expressive enough yet.
export interface RefinedSpec {
  /*
   * Methods from the `Node` interface (for `ReadOnlyNode`).
   */

  /**
   * This is a React Native implementation of `Node.prototype.compareDocumentPosition`
   * (see https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition).
   *
   * It uses the version of the shadow nodes that are present in the current
   * revision of the shadow tree (if any). If any of the nodes is not present,
   * it just indicates they are disconnected.
   */
  +compareDocumentPosition: (
    nativeNodeReference: NativeNodeReference,
    otherNativeNodeReference: NativeNodeReference,
  ) => number;

  /**
   * This is a React Native implementation of `Node.prototype.childNodes`
   * (see https://developer.mozilla.org/en-US/docs/Web/API/Node/childNodes).
   *
   * If a version of the given shadow node is present in the current revision
   * of an active shadow tree, it returns an array of instance handles of its
   * children. Otherwise, it returns an empty array.
   */
  +getChildNodes: (
    nativeNodeReference: NativeNodeReference,
  ) => $ReadOnlyArray<InstanceHandle>;

  /**
   * This is a React Native implementation of `Node.prototype.parentNode`
   * (see https://developer.mozilla.org/en-US/docs/Web/API/Node/parentNode).
   *
   * If a version of the given shadow node is present in the current revision of
   * an active shadow tree, it returns the instance handle of its parent.
   * Otherwise, it returns `null`.
   */
  +getParentNode: (nativeNodeReference: NativeNodeReference) => ?InstanceHandle;

  /**
   * This is a React Native implementation of `Node.prototype.isConnected`
   * (see https://developer.mozilla.org/en-US/docs/Web/API/Node/isConnected).
   *
   * Indicates whether a version of the given shadow node is present in the
   * current revision of an active shadow tree.
   */
  +isConnected: (nativeNodeReference: NativeNodeReference) => boolean;

  /*
   * Methods from the `Element` interface (for `ReactNativeElement`).
   */

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
    nativeElementReference: NativeElementReference,
  ) => $ReadOnly<
    [
      /* topWidth: */ number,
      /* rightWidth: */ number,
      /* bottomWidth: */ number,
      /* leftWidth: */ number,
    ],
  >;

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
    nativeElementReference: NativeElementReference,
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
    nativeElementReference: NativeElementReference,
  ) => $ReadOnly<[/* width: */ number, /* height: */ number]>;

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
    nativeElementReference: NativeElementReference,
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
    nativeElementReference: NativeElementReference,
  ) => $ReadOnly<[/* scrollWidth: */ number, /* scrollHeight: */ number]>;

  /**
   * This is a method to access the normalized tag name of a shadow node, to
   * implement `Element.prototype.tagName` (see https://developer.mozilla.org/en-US/docs/Web/API/Element/tagName).
   */
  +getTagName: (nativeElementReference: NativeElementReference) => string;

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
  +getTextContent: (nativeNodeReference: NativeNodeReference) => string;

  +hasPointerCapture: (
    nativeElementReference: NativeElementReference,
    pointerId: number,
  ) => boolean;

  +releasePointerCapture: (
    nativeElementReference: NativeElementReference,
    pointerId: number,
  ) => void;

  +setPointerCapture: (
    nativeElementReference: NativeElementReference,
    pointerId: number,
  ) => void;

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
    nativeElementReference: NativeElementReference,
  ) => $ReadOnly<
    [
      /* offsetParent: */ ?InstanceHandle,
      /* top: */ number,
      /* left: */ number,
    ],
  >;

  /*
   * Special methods to handle the root node.
   */

  /**
   * In React Native, surfaces that represent trees (similar to a `Document` on
   * Web) are created in native first, and then populated from JavaScript.
   *
   * Because React does not create this special node, we need a way to link
   * the JavaScript instance with that node, which is what this method allows.
   *
   * It also allows the implementation of `Node.prototype.ownerDocument` and
   * `Node.prototype.getRootNode`
   * (see https://developer.mozilla.org/en-US/docs/Web/API/Node/ownerDocument and
   * https://developer.mozilla.org/en-US/docs/Web/API/Node/getRootNode).
   *
   * Returns a shadow node representing the root node if it is still mounted.
   */
  +linkRootNode: (
    rootTag: RootTag,
    instanceHandle: InstanceHandle,
  ) => ?NativeElementReference;

  /**
   * Legacy layout APIs
   */

  +measure: (
    nativeElementReference: NativeElementReference,
    callback: MeasureOnSuccessCallback,
  ) => void;

  +measureInWindow: (
    nativeElementReference: NativeElementReference,
    callback: MeasureInWindowOnSuccessCallback,
  ) => void;

  +measureLayout: (
    nativeElementReference: NativeElementReference,
    relativeNode: NativeElementReference,
    onFail: () => void,
    onSuccess: MeasureLayoutOnSuccessCallback,
  ) => void;
}

const NativeDOM: RefinedSpec = {
  /*
   * Methods from the `Node` interface (for `ReadOnlyNode`).
   */

  compareDocumentPosition(nativeNodeReference, otherNativeNodeReference) {
    return nullthrows(RawNativeDOM).compareDocumentPosition(
      nativeNodeReference,
      otherNativeNodeReference,
    );
  },

  getChildNodes(nativeNodeReference) {
    // $FlowExpectedError[incompatible-cast]
    return (nullthrows(RawNativeDOM).getChildNodes(
      nativeNodeReference,
    ): $ReadOnlyArray<InstanceHandle>);
  },

  getParentNode(nativeNodeReference) {
    // $FlowExpectedError[incompatible-cast]
    return (nullthrows(RawNativeDOM).getParentNode(
      nativeNodeReference,
    ): ?InstanceHandle);
  },

  isConnected(nativeNodeReference) {
    return nullthrows(RawNativeDOM).isConnected(nativeNodeReference);
  },

  /*
   * Methods from the `Element` interface (for `ReactNativeElement`).
   */

  getBorderWidth(nativeNodeReference) {
    // $FlowExpectedError[incompatible-cast]
    return (nullthrows(RawNativeDOM).getBorderWidth(
      nativeNodeReference,
    ): $ReadOnly<
      [
        /* topWidth: */ number,
        /* rightWidth: */ number,
        /* bottomWidth: */ number,
        /* leftWidth: */ number,
      ],
    >);
  },

  getBoundingClientRect(nativeNodeReference, includeTransform: boolean) {
    // $FlowExpectedError[incompatible-cast]
    return (nullthrows(RawNativeDOM).getBoundingClientRect(
      nativeNodeReference,
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

  getInnerSize(nativeNodeReference) {
    // $FlowExpectedError[incompatible-cast]
    return (nullthrows(RawNativeDOM).getInnerSize(
      nativeNodeReference,
    ): $ReadOnly<[/* width: */ number, /* height: */ number]>);
  },

  getScrollPosition(nativeNodeReference) {
    // $FlowExpectedError[incompatible-cast]
    return (nullthrows(RawNativeDOM).getScrollPosition(
      nativeNodeReference,
    ): $ReadOnly<[/* scrollLeft: */ number, /* scrollTop: */ number]>);
  },

  getScrollSize(nativeNodeReference) {
    // $FlowExpectedError[incompatible-cast]
    return (nullthrows(RawNativeDOM).getScrollSize(
      nativeNodeReference,
    ): $ReadOnly<[/* scrollWidth: */ number, /* scrollHeight: */ number]>);
  },

  getTagName(nativeNodeReference) {
    return nullthrows(RawNativeDOM).getTagName(nativeNodeReference);
  },

  getTextContent(nativeNodeReference) {
    return nullthrows(RawNativeDOM).getTextContent(nativeNodeReference);
  },

  hasPointerCapture(nativeNodeReference, pointerId) {
    return nullthrows(RawNativeDOM).hasPointerCapture(
      nativeNodeReference,
      pointerId,
    );
  },

  releasePointerCapture(nativeNodeReference, pointerId) {
    return nullthrows(RawNativeDOM).releasePointerCapture(
      nativeNodeReference,
      pointerId,
    );
  },

  setPointerCapture(nativeNodeReference, pointerId) {
    return nullthrows(RawNativeDOM).setPointerCapture(
      nativeNodeReference,
      pointerId,
    );
  },

  /*
   * Methods from the `HTMLElement` interface (for `ReactNativeElement`).
   */

  getOffset(nativeNodeReference) {
    // $FlowExpectedError[incompatible-cast]
    return (nullthrows(RawNativeDOM).getOffset(nativeNodeReference): $ReadOnly<
      [
        /* offsetParent: */ ?InstanceHandle,
        /* top: */ number,
        /* left: */ number,
      ],
    >);
  },

  /*
   * Special methods to handle the root node.
   */

  linkRootNode(rootTag, instanceHandle) {
    // $FlowExpectedError[incompatible-cast]
    return (nullthrows(RawNativeDOM?.linkRootNode)(
      // $FlowExpectedError[incompatible-call]
      rootTag,
      instanceHandle,
    ): ?NativeElementReference);
  },

  /**
   * Legacy layout APIs
   */

  measure(nativeNodeReference, callback) {
    return nullthrows(RawNativeDOM).measure(nativeNodeReference, callback);
  },

  measureInWindow(nativeNodeReference, callback) {
    return nullthrows(RawNativeDOM).measureInWindow(
      nativeNodeReference,
      callback,
    );
  },

  measureLayout(nativeNodeReference, relativeNode, onFail, onSuccess) {
    return nullthrows(RawNativeDOM).measureLayout(
      nativeNodeReference,
      relativeNode,
      onFail,
      onSuccess,
    );
  },
};

export default NativeDOM;
