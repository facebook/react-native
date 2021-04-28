/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {RootTag} from 'react-native/Libraries/Types/RootTagTypes';

module.exports = {
  getViewManagerConfig: (viewManagerName: string): mixed => {
    console.warn(
      'Attempting to get config for view manager: ' + viewManagerName,
    );
    if (viewManagerName === 'RCTVirtualText') {
      return {};
    }
    return null;
  },
  hasViewManagerConfig: (viewManagerName: string): boolean => {
    return viewManagerName === 'RCTVirtualText';
  },
  getConstants: (): {...} => ({}),
  getConstantsForViewManager: (viewManagerName: string) => {},
  getDefaultEventTypes: (): Array<$FlowFixMe> => [],
  lazilyLoadView: (name: string) => {},
  createView: (
    reactTag: ?number,
    viewName: string,
    rootTag: RootTag,
    props: Object,
  ) => {},
  updateView: (reactTag: number, viewName: string, props: Object) => {},
  focus: (reactTag: ?number) => {},
  blur: (reactTag: ?number) => {},
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
  ) => {},
  dispatchViewManagerCommand: (
    reactTag: ?number,
    commandID: number,
    commandArgs: ?Array<string | number | boolean>,
  ) => {},
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
  ) => {},
  measureInWindow: (
    reactTag: ?number,
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => {},
  viewIsDescendantOf: (
    reactTag: ?number,
    ancestorReactTag: ?number,
    callback: (result: Array<boolean>) => void,
  ) => {},
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
  ) => {},
  measureLayoutRelativeToParent: (
    reactTag: ?number,
    errorCallback: (error: Object) => void,
    callback: (
      left: number,
      top: number,
      width: number,
      height: number,
    ) => void,
  ) => {},
  setJSResponder: (reactTag: ?number, blockNativeResponder: boolean) => {},
  clearJSResponder: () => {},
  configureNextLayoutAnimation: (
    config: Object,
    callback: () => void,
    errorCallback: (error: Object) => void,
  ) => {},
  removeSubviewsFromContainerWithID: (containerID: number) => {},
  replaceExistingNonRootView: (reactTag: ?number, newReactTag: ?number) => {},
  setChildren: (containerTag: ?number, reactTags: Array<number>) => {},
  manageChildren: (
    containerTag: ?number,
    moveFromIndices: Array<number>,
    moveToIndices: Array<number>,
    addChildReactTags: Array<number>,
    addAtIndices: Array<number>,
    removeAtIndices: Array<number>,
  ) => {},

  // Android only
  setLayoutAnimationEnabledExperimental: (enabled: boolean) => {},
  sendAccessibilityEvent: (reactTag: ?number, eventType: number) => {},
  showPopupMenu: (
    reactTag: ?number,
    items: Array<string>,
    error: (error: Object) => void,
    success: (event: string, selected?: number) => void,
  ) => {},
  dismissPopupMenu: () => {},
};
