/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import React from 'react';

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

type AttributeType =
  | true
  | $ReadOnly<{|
      diff?: <T>(arg1: T, arg2: T) => boolean,
      process?: (arg1: any) => any,
    |}>;

export type AttributeConfiguration<
  TProps = string,
  TStyleProps = string,
> = $ReadOnly<{
  [propName: TProps]: AttributeType,
  style: $ReadOnly<{
    [propName: TStyleProps]: AttributeType,
  }>,
}>;

export type ReactNativeBaseComponentViewConfig<
  TProps = string,
  TStyleProps = string,
> = $ReadOnly<{|
  baseModuleName?: string,
  bubblingEventTypes?: $ReadOnly<{
    [eventName: string]: $ReadOnly<{|
      phasedRegistrationNames: $ReadOnly<{|
        captured: string,
        bubbled: string,
      |}>,
    |}>,
  }>,
  Commands?: $ReadOnly<{
    [commandName: string]: number,
  }>,
  directEventTypes?: $ReadOnly<{
    [eventName: string]: $ReadOnly<{|
      registrationName: string,
    |}>,
  }>,
  NativeProps?: $ReadOnly<{
    [propName: string]: string,
  }>,
  uiViewClassName: string,
  validAttributes: AttributeConfiguration<TProps, TStyleProps>,
|}>;

export type ViewConfigGetter = () => ReactNativeBaseComponentViewConfig<>;

/**
 * Class only exists for its Flow type.
 */
class ReactNativeComponent<Props> extends React.Component<Props> {
  /**
   * Directly set netive properties on a component. See:
   *   https://facebook.github.io/react-native/docs/direct-manipulation
   *
   * This method is available on all native components.
   */
  setNativeProps(nativeProps: Object): void {}

  /**
   * The methods described here are available on most of the default components
   * provided by React Native. Note, however, that they are not available on
   * composite components that aren't directly backed by a native view. This
   * will generally include most components that you define in your own app.
   */

  /**
   * Removes focus from an input or view. This is the opposite of `focus()`.
   */
  blur(): void {}

  /**
   * Requests focus for the given input or view. The exact behavior triggered
   * will depend on the platform and type of view.
   */
  focus(): void {}

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
   * possible, consider using the `onLayout` instead.
   */
  measure(callback: MeasureOnSuccessCallback): void {}

  /**
   * Determines the location of the given view in the window and returns the
   * values via an async callback. If the React root view is embedded in another
   * native view, this will give you the absolute coordinates. If successful,
   * the callback will be called with the following arguments:
   *
   *  - x
   *  - y
   *  - width
   *  - height
   */
  measureInWindow(callback: MeasureInWindowOnSuccessCallback): void {}

  /**
   * Like `measure()`, but measures the view relative an ancestor, specified as
   * `relativeToNativeNode`. This means that the returned x, y are relative to
   * the origin x, y of the ancestor view.
   *
   * As always, to obtain a native node handle for a component, you can use
   * `ReactNative.findNodeHandle(component)`.
   */
  measureLayout(
    relativeToNativeNode: number,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail?: () => void,
  ): void {}
}

/**
 * This type keeps ReactNativeFiberHostComponent and NativeMethodsMixin in sync.
 * It can also provide types for ReactNative applications that use NMM or refs.
 */
export type NativeMethodsMixinType = {
  blur(): void,
  focus(): void,
  measure(callback: MeasureOnSuccessCallback): void,
  measureInWindow(callback: MeasureInWindowOnSuccessCallback): void,
  measureLayout(
    relativeToNativeNode: number,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail: () => void,
  ): void,
  setNativeProps(nativeProps: Object): void,
};

type SecretInternalsType = {
  NativeMethodsMixin: NativeMethodsMixinType,
  computeComponentStackForErrorReporting(tag: number): string,
  // TODO (bvaughn) Decide which additional types to expose here?
  // And how much information to fill in for the above types.
};

type SecretInternalsFabricType = {
  NativeMethodsMixin: NativeMethodsMixinType,
};

/**
 * Flat ReactNative renderer bundles are too big for Flow to parse efficiently.
 * Provide minimal Flow typing for the high-level RN API and call it a day.
 */
export type ReactNativeType = {
  NativeComponent: typeof ReactNativeComponent,
  findNodeHandle(componentOrHandle: any): ?number,
  render(
    element: React$Element<any>,
    containerTag: any,
    callback: ?Function,
  ): any,
  unmountComponentAtNode(containerTag: number): any,
  unmountComponentAtNodeAndRemoveContainer(containerTag: number): any,
  unstable_batchedUpdates: any, // TODO (bvaughn) Add types

  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: SecretInternalsType,
};

export type ReactFabricType = {
  NativeComponent: typeof ReactNativeComponent,
  findNodeHandle(componentOrHandle: any): ?number,
  render(
    element: React$Element<any>,
    containerTag: any,
    callback: ?Function,
  ): any,
  unmountComponentAtNode(containerTag: number): any,

  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: SecretInternalsFabricType,
};
