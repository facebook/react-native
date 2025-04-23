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
  ViewConfig,
} from '../../../../../Libraries/Renderer/shims/ReactNativeTypes';
import type {
  HostInstance,
  MeasureInWindowOnSuccessCallback,
  MeasureLayoutOnSuccessCallback,
  MeasureOnSuccessCallback,
  NativeMethods,
} from '../../../types/HostInstance';
import type {InstanceHandle} from './internals/NodeInternals';
import type ReactNativeDocument from './ReactNativeDocument';

import TextInputState from '../../../../../Libraries/Components/TextInput/TextInputState';
import {getFabricUIManager} from '../../../../../Libraries/ReactNative/FabricUIManager';
import {create as createAttributePayload} from '../../../../../Libraries/ReactNative/ReactFabricPublicInstance/ReactNativeAttributePayload';
import warnForStyleProps from '../../../../../Libraries/ReactNative/ReactFabricPublicInstance/warnForStyleProps';
import {
  getNativeElementReference,
  getPublicInstanceFromInstanceHandle,
  setInstanceHandle,
  setOwnerDocument,
} from './internals/NodeInternals';
import ReadOnlyElement, {getBoundingClientRect} from './ReadOnlyElement';
import NativeDOM from './specs/NativeDOM';
import nullthrows from 'nullthrows';

const noop = () => {};

// Ideally, this class would be exported as-is, but this implementation is
// significantly slower than the existing `ReactFabricHostComponent`.
// This is a very hot code path (this class is instantiated once per rendered
// host component in the tree) and we can't regress performance here.
//
// This implementation is slower because this is a subclass and we have to call
// super(), which is a very slow operation the way that Babel transforms it at
// the moment.
//
// The optimization we're doing is using an old-style function constructor,
// where we're not required to use `super()`, and we make that constructor
// extend this class so it inherits all the methods and it sets the class
// hierarchy correctly.
//
// An alternative implementation was to implement the constructor as a function
// returning a manually constructed instance using `Object.create()` but that
// was slower than this method because the engine has to create an object than
// we then discard to create a new one.

class ReactNativeElement extends ReadOnlyElement implements NativeMethods {
  // These need to be accessible from `ReactFabricPublicInstanceUtils`.
  __nativeTag: number;
  __internalInstanceHandle: InstanceHandle;

  __viewConfig: ViewConfig;

  // This constructor isn't really used. See the `ReactNativeElement` function
  // below.
  constructor(
    tag: number,
    viewConfig: ViewConfig,
    instanceHandle: InstanceHandle,
    ownerDocument: ReactNativeDocument,
  ) {
    super(instanceHandle, ownerDocument);

    this.__nativeTag = tag;
    this.__internalInstanceHandle = instanceHandle;
    this.__viewConfig = viewConfig;
  }

  get offsetHeight(): number {
    return Math.round(
      getBoundingClientRect(this, {includeTransform: false}).height,
    );
  }

  get offsetLeft(): number {
    const node = getNativeElementReference(this);

    if (node != null) {
      const offset = NativeDOM.getOffset(node);
      return Math.round(offset[2]);
    }

    return 0;
  }

  get offsetParent(): ReadOnlyElement | null {
    const node = getNativeElementReference(this);

    if (node != null) {
      const offset = NativeDOM.getOffset(node);
      // For children of the root node we currently return offset data
      // but a `null` parent because the root node is not accessible
      // in JavaScript yet.
      if (offset[0] != null) {
        const offsetParentInstanceHandle = offset[0];
        const offsetParent = getPublicInstanceFromInstanceHandle(
          offsetParentInstanceHandle,
        );
        // $FlowExpectedError[incompatible-type] The value returned by `getOffset` is always an instance handle for `ReadOnlyElement`.
        const offsetParentElement: ReadOnlyElement | null = offsetParent;
        return offsetParentElement;
      }
    }

    return null;
  }

  get offsetTop(): number {
    const node = getNativeElementReference(this);

    if (node != null) {
      const offset = NativeDOM.getOffset(node);
      return Math.round(offset[1]);
    }

    return 0;
  }

  get offsetWidth(): number {
    return Math.round(
      getBoundingClientRect(this, {includeTransform: false}).width,
    );
  }

  /**
   * React Native compatibility methods
   */

  blur(): void {
    TextInputState.blurTextInput(this);
  }

  focus() {
    TextInputState.focusTextInput(this);
  }

  measure(callback: MeasureOnSuccessCallback) {
    const node = getNativeElementReference(this);
    if (node != null) {
      // $FlowExpectedError[incompatible-type] This is an element instance so the native node reference is always a shadow node.
      const shadowNode: ShadowNode = node;
      nullthrows(getFabricUIManager()).measure(shadowNode, callback);
    }
  }

  measureInWindow(callback: MeasureInWindowOnSuccessCallback) {
    const node = getNativeElementReference(this);
    if (node != null) {
      // $FlowExpectedError[incompatible-type] This is an element instance so the native node reference is always a shadow node.
      const shadowNode: ShadowNode = node;
      nullthrows(getFabricUIManager()).measureInWindow(shadowNode, callback);
    }
  }

  measureLayout(
    relativeToNativeNode: number | HostInstance,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail?: () => void /* currently unused */,
  ) {
    if (!(relativeToNativeNode instanceof ReactNativeElement)) {
      if (__DEV__) {
        console.error(
          'Warning: ref.measureLayout must be called with a ref to a native component.',
        );
      }

      return;
    }

    const toStateNode = getNativeElementReference(this);
    const fromStateNode = getNativeElementReference(relativeToNativeNode);

    if (toStateNode != null && fromStateNode != null) {
      // $FlowExpectedError[incompatible-type] This is an element instance so the native node reference is always a shadow node.
      const toStateShadowNode: ShadowNode = toStateNode;
      // $FlowExpectedError[incompatible-type] This is an element instance so the native node reference is always a shadow node.
      const fromStateShadowNode: ShadowNode = fromStateNode;

      nullthrows(getFabricUIManager()).measureLayout(
        toStateShadowNode,
        fromStateShadowNode,
        onFail != null ? onFail : noop,
        onSuccess != null ? onSuccess : noop,
      );
    }
  }

  setNativeProps(nativeProps: {...}): void {
    if (__DEV__) {
      warnForStyleProps(nativeProps, this.__viewConfig.validAttributes);
    }

    const updatePayload = createAttributePayload(
      nativeProps,
      this.__viewConfig.validAttributes,
    );

    const node = getNativeElementReference(this);

    if (node != null && updatePayload != null) {
      // $FlowExpectedError[incompatible-type] This is an element instance so the native node reference is always a shadow node.
      const shadowNode: ShadowNode = node;
      nullthrows(getFabricUIManager()).setNativeProps(
        shadowNode,
        updatePayload,
      );
    }
  }
}

type ReactNativeElementT = ReactNativeElement;

function replaceConstructorWithoutSuper(
  ReactNativeElementClass: Class<ReactNativeElementT>,
): Class<ReactNativeElementT> {
  // Alternative constructor just implemented to provide a better performance than
  // calling super() in the original class.
  // eslint-disable-next-line no-shadow
  function ReactNativeElement(
    this: ReactNativeElementT,
    tag: number,
    viewConfig: ViewConfig,
    internalInstanceHandle: InternalInstanceHandle,
    ownerDocument: ReactNativeDocument,
  ) {
    // Inlined from `ReadOnlyNode`
    setOwnerDocument(this, ownerDocument);
    setInstanceHandle(this, internalInstanceHandle);

    this.__nativeTag = tag;
    this.__internalInstanceHandle = internalInstanceHandle;
    this.__viewConfig = viewConfig;
  }

  ReactNativeElement.prototype = ReactNativeElementClass.prototype;

  // $FlowExpectedError[incompatible-return]
  return ReactNativeElement;
}

export default replaceConstructorWithoutSuper(
  ReactNativeElement,
) as typeof ReactNativeElement;
