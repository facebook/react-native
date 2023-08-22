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

import type {
  HostComponent,
  MeasureInWindowOnSuccessCallback,
  MeasureLayoutOnSuccessCallback,
  MeasureOnSuccessCallback,
} from '../../Renderer/shims/ReactNativeTypes';
import type {ElementRef} from 'react';

import ReadOnlyElement from './ReadOnlyElement';

export default class ReactNativeElement extends ReadOnlyElement {
  get offsetHeight(): number {
    throw new TypeError('Unimplemented');
  }

  get offsetLeft(): number {
    throw new TypeError('Unimplemented');
  }

  get offsetParent(): ReadOnlyElement | null {
    throw new TypeError('Unimplemented');
  }

  get offsetTop(): number {
    throw new TypeError('Unimplemented');
  }

  get offsetWidth(): number {
    throw new TypeError('Unimplemented');
  }

  /**
   * React Native compatibility methods
   */

  blur(): void {
    throw new TypeError('Unimplemented');
  }

  focus(): void {
    throw new TypeError('Unimplemented');
  }

  measure(callback: MeasureOnSuccessCallback): void {
    throw new TypeError('Unimplemented');
  }

  measureInWindow(callback: MeasureInWindowOnSuccessCallback): void {
    throw new TypeError('Unimplemented');
  }

  measureLayout(
    relativeToNativeNode: number | ElementRef<HostComponent<mixed>>,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail?: () => void /* currently unused */,
  ): void {
    throw new TypeError('Unimplemented');
  }

  setNativeProps(nativeProps: {...}): void {
    throw new TypeError('Unimplemented');
  }
}
