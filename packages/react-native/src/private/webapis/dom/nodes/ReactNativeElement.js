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
  HostInstance,
  INativeMethods,
  InternalInstanceHandle,
  MeasureInWindowOnSuccessCallback,
  MeasureLayoutOnSuccessCallback,
  MeasureOnSuccessCallback,
  ViewConfig,
} from '../../../../../Libraries/Renderer/shims/ReactNativeTypes';

import TextInputState from '../../../../../Libraries/Components/TextInput/TextInputState';
import {getFabricUIManager} from '../../../../../Libraries/ReactNative/FabricUIManager';
import {create as createAttributePayload} from '../../../../../Libraries/ReactNative/ReactFabricPublicInstance/ReactNativeAttributePayload';
import warnForStyleProps from '../../../../../Libraries/ReactNative/ReactFabricPublicInstance/warnForStyleProps';
import ReadOnlyElement, {getBoundingClientRect} from './ReadOnlyElement';
import ReadOnlyNode from './ReadOnlyNode';
import {
  getPublicInstanceFromInternalInstanceHandle,
  getShadowNode,
} from './ReadOnlyNode';
import NativeDOM from './specs/NativeDOM';
import nullthrows from 'nullthrows';

const noop = () => {};

export default class ReactNativeElement
  extends ReadOnlyElement
  implements INativeMethods
{
  // These need to be accessible from `ReactFabricPublicInstanceUtils`.
  __nativeTag: number;
  __internalInstanceHandle: InternalInstanceHandle;

  #viewConfig: ViewConfig;

  constructor(
    tag: number,
    viewConfig: ViewConfig,
    internalInstanceHandle: InternalInstanceHandle,
  ) {
    super(internalInstanceHandle);

    this.__nativeTag = tag;
    this.__internalInstanceHandle = internalInstanceHandle;
    this.#viewConfig = viewConfig;
  }

  get offsetHeight(): number {
    return Math.round(
      getBoundingClientRect(this, {includeTransform: false}).height,
    );
  }

  get offsetLeft(): number {
    const node = getShadowNode(this);

    if (node != null) {
      const offset = NativeDOM.getOffset(node);
      return Math.round(offset[2]);
    }

    return 0;
  }

  get offsetParent(): ReadOnlyElement | null {
    const node = getShadowNode(this);

    if (node != null) {
      const offset = NativeDOM.getOffset(node);
      // For children of the root node we currently return offset data
      // but a `null` parent because the root node is not accessible
      // in JavaScript yet.
      if (offset[0] != null) {
        const offsetParentInstanceHandle = offset[0];
        const offsetParent = getPublicInstanceFromInternalInstanceHandle(
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
    const node = getShadowNode(this);

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
    // $FlowFixMe[incompatible-exact] Migrate all usages of `NativeMethods` to an interface to fix this.
    TextInputState.blurTextInput(this);
  }

  focus() {
    // $FlowFixMe[incompatible-exact] Migrate all usages of `NativeMethods` to an interface to fix this.
    TextInputState.focusTextInput(this);
  }

  measure(callback: MeasureOnSuccessCallback) {
    const node = getShadowNode(this);
    if (node != null) {
      nullthrows(getFabricUIManager()).measure(node, callback);
    }
  }

  measureInWindow(callback: MeasureInWindowOnSuccessCallback) {
    const node = getShadowNode(this);
    if (node != null) {
      nullthrows(getFabricUIManager()).measureInWindow(node, callback);
    }
  }

  measureLayout(
    relativeToNativeNode: number | HostInstance,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail?: () => void /* currently unused */,
  ) {
    if (!(relativeToNativeNode instanceof ReadOnlyNode)) {
      if (__DEV__) {
        console.error(
          'Warning: ref.measureLayout must be called with a ref to a native component.',
        );
      }

      return;
    }

    const toStateNode = getShadowNode(this);
    const fromStateNode = getShadowNode(relativeToNativeNode);

    if (toStateNode != null && fromStateNode != null) {
      nullthrows(getFabricUIManager()).measureLayout(
        toStateNode,
        fromStateNode,
        onFail != null ? onFail : noop,
        onSuccess != null ? onSuccess : noop,
      );
    }
  }

  setNativeProps(nativeProps: {...}): void {
    if (__DEV__) {
      warnForStyleProps(nativeProps, this.#viewConfig.validAttributes);
    }

    const updatePayload = createAttributePayload(
      nativeProps,
      this.#viewConfig.validAttributes,
    );

    const node = getShadowNode(this);

    if (node != null && updatePayload != null) {
      nullthrows(getFabricUIManager()).setNativeProps(node, updatePayload);
    }
  }
}
