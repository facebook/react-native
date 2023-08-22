/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {RootTag} from '../Types/RootTagTypes';

import {unstable_hasComponent} from '../NativeComponent/NativeComponentRegistryUnstable';

const errorMessageForMethod = (methodName: string): string =>
  "[ReactNative Architecture][JS] '" +
  methodName +
  "' is not available in the new React Native architecture.";

module.exports = {
  getViewManagerConfig: (viewManagerName: string): mixed => {
    console.error(
      errorMessageForMethod('getViewManagerConfig') +
        'Use hasViewManagerConfig instead. viewManagerName: ' +
        viewManagerName,
    );
    return null;
  },
  hasViewManagerConfig: (viewManagerName: string): boolean => {
    return unstable_hasComponent(viewManagerName);
  },
  getConstants: (): Object => {
    console.error(errorMessageForMethod('getConstants'));
    return {};
  },
  getConstantsForViewManager: (viewManagerName: string): Object => {
    console.error(errorMessageForMethod('getConstantsForViewManager'));
    return {};
  },
  getDefaultEventTypes: (): Array<string> => {
    console.error(errorMessageForMethod('getDefaultEventTypes'));
    return [];
  },
  lazilyLoadView: (name: string): Object => {
    console.error(errorMessageForMethod('lazilyLoadView'));
    return {};
  },
  createView: (
    reactTag: ?number,
    viewName: string,
    rootTag: RootTag,
    props: Object,
  ): void => console.error(errorMessageForMethod('createView')),
  updateView: (reactTag: number, viewName: string, props: Object): void =>
    console.error(errorMessageForMethod('updateView')),
  focus: (reactTag: ?number): void =>
    console.error(errorMessageForMethod('focus')),
  blur: (reactTag: ?number): void =>
    console.error(errorMessageForMethod('blur')),
  findSubviewIn: (
    reactTag: ?number,
    point: Array<number>,
    callback: (
      nativeViewTag: number,
      left: number,
      top: number,
      width: number,
      height: number,
    ) => void,
  ): void => console.error(errorMessageForMethod('findSubviewIn')),
  dispatchViewManagerCommand: (
    reactTag: ?number,
    commandID: number,
    commandArgs: ?Array<string | number | boolean>,
  ): void => console.error(errorMessageForMethod('dispatchViewManagerCommand')),
  measure: (
    reactTag: ?number,
    callback: (
      left: number,
      top: number,
      width: number,
      height: number,
      pageX: number,
      pageY: number,
    ) => void,
  ): void => console.error(errorMessageForMethod('measure')),
  measureInWindow: (
    reactTag: ?number,
    callback: (x: number, y: number, width: number, height: number) => void,
  ): void => console.error(errorMessageForMethod('measureInWindow')),
  viewIsDescendantOf: (
    reactTag: ?number,
    ancestorReactTag: ?number,
    callback: (result: Array<boolean>) => void,
  ): void => console.error(errorMessageForMethod('viewIsDescendantOf')),
  measureLayout: (
    reactTag: ?number,
    ancestorReactTag: ?number,
    errorCallback: (error: Object) => void,
    callback: (
      left: number,
      top: number,
      width: number,
      height: number,
    ) => void,
  ): void => console.error(errorMessageForMethod('measureLayout')),
  measureLayoutRelativeToParent: (
    reactTag: ?number,
    errorCallback: (error: Object) => void,
    callback: (
      left: number,
      top: number,
      width: number,
      height: number,
    ) => void,
  ): void =>
    console.error(errorMessageForMethod('measureLayoutRelativeToParent')),
  setJSResponder: (reactTag: ?number, blockNativeResponder: boolean): void =>
    console.error(errorMessageForMethod('setJSResponder')),
  clearJSResponder: (): void => {}, // Don't log error here because we're aware it gets called
  configureNextLayoutAnimation: (
    config: Object,
    callback: () => void,
    errorCallback: (error: Object) => void,
  ): void =>
    console.error(errorMessageForMethod('configureNextLayoutAnimation')),
  removeSubviewsFromContainerWithID: (containerID: number): void =>
    console.error(errorMessageForMethod('removeSubviewsFromContainerWithID')),
  replaceExistingNonRootView: (reactTag: ?number, newReactTag: ?number): void =>
    console.error(errorMessageForMethod('replaceExistingNonRootView')),
  setChildren: (containerTag: ?number, reactTags: Array<number>): void =>
    console.error(errorMessageForMethod('setChildren')),
  manageChildren: (
    containerTag: ?number,
    moveFromIndices: Array<number>,
    moveToIndices: Array<number>,
    addChildReactTags: Array<number>,
    addAtIndices: Array<number>,
    removeAtIndices: Array<number>,
  ): void => console.error(errorMessageForMethod('manageChildren')),

  // Android only
  setLayoutAnimationEnabledExperimental: (enabled: boolean): void => {
    console.error(
      errorMessageForMethod('setLayoutAnimationEnabledExperimental'),
    );
  },
  // Please use AccessibilityInfo.sendAccessibilityEvent instead.
  // See SetAccessibilityFocusExample in AccessibilityExample.js for a migration example.
  sendAccessibilityEvent: (reactTag: ?number, eventType: number): void =>
    console.error(errorMessageForMethod('sendAccessibilityEvent')),
  showPopupMenu: (
    reactTag: ?number,
    items: Array<string>,
    error: (error: Object) => void,
    success: (event: string, selected?: number) => void,
  ): void => console.error(errorMessageForMethod('showPopupMenu')),
  dismissPopupMenu: (): void =>
    console.error(errorMessageForMethod('dismissPopupMenu')),
};
