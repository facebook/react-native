/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';

export type MeasureOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
  pageX: number,
  pageY: number,
) => void;

export type MeasureInWindowOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
) => void;

export type MeasureLayoutOnSuccessCallback = (
  left: number,
  top: number,
  width: number,
  height: number,
) => void;

/**
 * NativeMethods provides methods to access the underlying native component directly.
 * This can be useful in cases when you want to focus a view or measure its on-screen dimensions,
 * for example.
 * The methods described here are available on most of the default components provided by React Native.
 * Note, however, that they are not available on composite components that aren't directly backed by a
 * native view. This will generally include most components that you define in your own app.
 * For more information, see [Direct Manipulation](https://reactnative.dev/docs/direct-manipulation).
 * @see https://github.com/facebook/react-native/blob/master/Libraries/Renderer/shims/ReactNativeTypes.js#L87
 */
export interface NativeMethods {
  /**
   * Determines the location on screen, width, and height of the given view and
   * returns the values via an async callback. If successful, the callback will
   * be called with the following arguments:
   *
   *  - x
   *  - y
   *  - width
   *  - height
   *  - pageX
   *  - pageY
   *
   * Note that these measurements are not available until after the rendering
   * has been completed in native. If you need the measurements as soon as
   * possible, consider using the [`onLayout`
   * prop](docs/view.html#onlayout) instead.
   */
  measure(callback: MeasureOnSuccessCallback): void;

  /**
   * Determines the location of the given view in the window and returns the
   * values via an async callback. If the React root view is embedded in
   * another native view, this will give you the absolute coordinates. If
   * successful, the callback will be called with the following
   * arguments:
   *
   *  - x
   *  - y
   *  - width
   *  - height
   *
   * Note that these measurements are not available until after the rendering
   * has been completed in native.
   */
  measureInWindow(callback: MeasureInWindowOnSuccessCallback): void;

  /**
   * Like [`measure()`](#measure), but measures the view relative an ancestor,
   * specified as `relativeToNativeComponentRef`. This means that the returned x, y
   * are relative to the origin x, y of the ancestor view.
   * _Can also be called with a relativeNativeNodeHandle but is deprecated._
   */
  measureLayout(
    relativeToNativeComponentRef: HostComponent<unknown> | number,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail: () => void /* currently unused */,
  ): void;

  /**
   * This function sends props straight to native. They will not participate in
   * future diff process - this means that if you do not include them in the
   * next render, they will remain active (see [Direct
   * Manipulation](https://reactnative.dev/docs/direct-manipulation)).
   */
  setNativeProps(nativeProps: object): void;

  /**
   * Requests focus for the given input or view. The exact behavior triggered
   * will depend on the platform and type of view.
   */
  focus(): void;

  /**
   * Removes focus from an input or view. This is the opposite of `focus()`.
   */
  blur(): void;

  refs: {
    [key: string]: React.Component<any, any>;
  };
}

/**
 * @deprecated Use NativeMethods instead.
 */
export type NativeMethodsMixin = NativeMethods;
/**
 * @deprecated Use NativeMethods instead.
 */
export type NativeMethodsMixinType = NativeMethods;

/**
 * Represents a native component, such as those returned from `requireNativeComponent`.
 *
 * @see https://github.com/facebook/react-native/blob/v0.62.0-rc.5/Libraries/Renderer/shims/ReactNativeTypes.js
 *
 * @todo This should eventually be defined as an AbstractComponent, but that
 *       should first be introduced in the React typings.
 */
export interface HostComponent<P>
  extends Pick<
    React.ComponentClass<P>,
    Exclude<keyof React.ComponentClass<P>, 'new'>
  > {
  new (props: P, context?: any): React.Component<P> & Readonly<NativeMethods>;
}
