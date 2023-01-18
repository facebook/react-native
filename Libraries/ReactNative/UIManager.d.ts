/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';
import {
  MeasureInWindowOnSuccessCallback,
  MeasureLayoutOnSuccessCallback,
  MeasureOnSuccessCallback,
} from '../../types/public/ReactNativeTypes';

export interface UIManagerStatic {
  /**
   * Capture an image of the screen, window or an individual view. The image
   * will be stored in a temporary file that will only exist for as long as the
   * app is running.
   *
   * The `view` argument can be the literal string `window` if you want to
   * capture the entire window, or it can be a reference to a specific
   * React Native component.
   *
   * The `options` argument may include:
   * - width/height (number) - the width and height of the image to capture.
   * - format (string) - either 'png' or 'jpeg'. Defaults to 'png'.
   * - quality (number) - the quality when using jpeg. 0.0 - 1.0 (default).
   *
   * Returns a Promise<string> (tempFilePath)
   * @platform ios
   */
  takeSnapshot: (
    view?: 'window' | React.ReactElement | number,
    options?: {
      width?: number | undefined;
      height?: number | undefined;
      format?: 'png' | 'jpeg' | undefined;
      quality?: number | undefined;
    },
  ) => Promise<string>;

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
   *
   * @deprecated Use `ref.measure` instead.
   */
  measure(node: number, callback: MeasureOnSuccessCallback): void;

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
   *
   * @deprecated Use `ref.measureInWindow` instead.
   */
  measureInWindow(
    node: number,
    callback: MeasureInWindowOnSuccessCallback,
  ): void;

  /**
   * Like [`measure()`](#measure), but measures the view relative an ancestor,
   * specified as `relativeToNativeNode`. This means that the returned x, y
   * are relative to the origin x, y of the ancestor view.
   *
   * As always, to obtain a native node handle for a component, you can use
   * `React.findNodeHandle(component)`.
   *
   * @deprecated Use `ref.measureLayout` instead.
   */
  measureLayout(
    node: number,
    relativeToNativeNode: number,
    onFail: () => void /* currently unused */,
    onSuccess: MeasureLayoutOnSuccessCallback,
  ): void;

  /**
   * Automatically animates views to their new positions when the
   * next layout happens.
   *
   * A common way to use this API is to call it before calling `setState`.
   *
   * Note that in order to get this to work on **Android** you need to set the following flags via `UIManager`:
   *
   *     UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
   */
  setLayoutAnimationEnabledExperimental(value: boolean): void;

  /**
   * Used to display an Android PopupMenu. If a menu item is pressed, the success callback will
   * be called with the following arguments:
   *
   *  - item - the menu item.
   *  - index - index of the pressed item in array. Returns `undefined` if cancelled.
   *
   * To obtain a native node handle for a component, you can use
   * `React.findNodeHandle(component)`.
   *
   * Note that this works only on Android
   */
  showPopupMenu(
    node: number,
    items: string[],
    error: () => void /* currently unused */,
    success: (item: string, index: number | undefined) => void,
  ): void;

  getViewManagerConfig: (name: string) => {
    Commands: {[key: string]: number};
  };

  hasViewManagerConfig: (name: string) => boolean;

  /**
   * Used to call a native view method from JavaScript
   *
   * reactTag - Id of react view.
   * commandID - Id of the native method that should be called.
   * commandArgs - Args of the native method that we can pass from JS to native.
   */
  dispatchViewManagerCommand: (
    reactTag: number | null,
    commandID: number | string,
    commandArgs?: Array<any>,
  ) => void;
}

export const UIManager: UIManagerStatic;
export type UIManager = UIManagerStatic;
