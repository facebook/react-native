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
import type {UIManagerJSInterface} from '../Types/UIManagerJSInterface';

import {unstable_hasComponent} from '../NativeComponent/NativeComponentRegistryUnstable';
import Platform from '../Utilities/Platform';
import nullthrows from 'nullthrows';

function raiseSoftError(methodName: string, details?: string): void {
  console.error(
    `[ReactNative Architecture][JS] '${methodName}' is not available in the new React Native architecture.` +
      (details ? ` ${details}` : ''),
  );
}

const getUIManagerConstants: ?() => {[viewManagerName: string]: Object} =
  global.RN$LegacyInterop_UIManager_getConstants;

const getUIManagerConstantsCache = (function () {
  let wasCalledOnce = false;
  let result = {};
  return () => {
    if (!wasCalledOnce) {
      result = nullthrows(getUIManagerConstants)();
      wasCalledOnce = true;
    }
    return result;
  };
})();

/**
 * UIManager.js overrides these APIs.
 * Pull them out from the BridgelessUIManager implementation. So, we can ignore them.
 */
const UIManagerJSOverridenAPIs = {
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
  ): void => {
    raiseSoftError('measure');
  },
  measureInWindow: (
    reactTag: ?number,
    callback: (x: number, y: number, width: number, height: number) => void,
  ): void => {
    raiseSoftError('measureInWindow');
  },
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
  ): void => {
    raiseSoftError('measureLayout');
  },
  measureLayoutRelativeToParent: (
    reactTag: ?number,
    errorCallback: (error: Object) => void,
    callback: (
      left: number,
      top: number,
      width: number,
      height: number,
    ) => void,
  ): void => {
    raiseSoftError('measureLayoutRelativeToParent');
  },
  dispatchViewManagerCommand: (
    reactTag: ?number,
    commandID: number,
    commandArgs: ?Array<string | number | boolean>,
  ): void => {
    raiseSoftError('dispatchViewManagerCommand');
  },
};

const UIManagerJSPlatformAPIs = Platform.select({
  android: {
    getConstantsForViewManager: (viewManagerName: string): Object => {
      raiseSoftError('getConstantsForViewManager');
      return {};
    },
    getDefaultEventTypes: (): Array<string> => {
      raiseSoftError('getDefaultEventTypes');
      return [];
    },
    setLayoutAnimationEnabledExperimental: (enabled: boolean): void => {
      raiseSoftError('setLayoutAnimationEnabledExperimental');
    },
    // Please use AccessibilityInfo.sendAccessibilityEvent instead.
    // See SetAccessibilityFocusExample in AccessibilityExample.js for a migration example.
    sendAccessibilityEvent: (reactTag: ?number, eventType: number): void => {
      raiseSoftError('sendAccessibilityEvent');
    },
    showPopupMenu: (
      reactTag: ?number,
      items: Array<string>,
      error: (error: Object) => void,
      success: (event: string, selected?: number) => void,
    ): void => {
      raiseSoftError('showPopupMenu');
    },
    dismissPopupMenu: (): void => {
      raiseSoftError('dismissPopupMenu');
    },
  },
  ios: {
    lazilyLoadView: (name: string): Object => {
      raiseSoftError('lazilyLoadView');
      return {};
    },
    focus: (reactTag: ?number): void => {
      raiseSoftError('focus');
    },
    blur: (reactTag: ?number): void => {
      raiseSoftError('blur');
    },
  },
});

const UIManagerJS: UIManagerJSInterface & {[string]: any} = {
  ...UIManagerJSOverridenAPIs,
  ...UIManagerJSPlatformAPIs,
  getViewManagerConfig: (viewManagerName: string): mixed => {
    if (getUIManagerConstants) {
      return getUIManagerConstantsCache()[viewManagerName];
    } else {
      raiseSoftError(
        'getViewManagerConfig',
        `Use hasViewManagerConfig instead. viewManagerName: ${viewManagerName}`,
      );
      return null;
    }
  },
  hasViewManagerConfig: (viewManagerName: string): boolean => {
    return unstable_hasComponent(viewManagerName);
  },
  getConstants: (): Object => {
    if (getUIManagerConstants) {
      return getUIManagerConstantsCache();
    } else {
      raiseSoftError('getConstants');
      return null;
    }
  },
  createView: (
    reactTag: ?number,
    viewName: string,
    rootTag: RootTag,
    props: Object,
  ): void => {
    raiseSoftError('createView');
  },
  updateView: (reactTag: number, viewName: string, props: Object): void => {
    raiseSoftError('updateView');
  },
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
  ): void => {
    raiseSoftError('findSubviewIn');
  },
  viewIsDescendantOf: (
    reactTag: ?number,
    ancestorReactTag: ?number,
    callback: (result: Array<boolean>) => void,
  ): void => {
    raiseSoftError('viewIsDescendantOf');
  },
  setJSResponder: (reactTag: ?number, blockNativeResponder: boolean): void => {
    raiseSoftError('setJSResponder');
  },
  clearJSResponder: (): void => {
    // Don't log error here because we're aware it gets called
  },
  configureNextLayoutAnimation: (
    config: Object,
    callback: () => void,
    errorCallback: (error: Object) => void,
  ): void => {
    raiseSoftError('configureNextLayoutAnimation');
  },
  removeSubviewsFromContainerWithID: (containerID: number): void => {
    raiseSoftError('removeSubviewsFromContainerWithID');
  },
  replaceExistingNonRootView: (
    reactTag: ?number,
    newReactTag: ?number,
  ): void => {
    raiseSoftError('replaceExistingNonRootView');
  },
  setChildren: (containerTag: ?number, reactTags: Array<number>): void => {
    raiseSoftError('setChildren');
  },
  manageChildren: (
    containerTag: ?number,
    moveFromIndices: Array<number>,
    moveToIndices: Array<number>,
    addChildReactTags: Array<number>,
    addAtIndices: Array<number>,
    removeAtIndices: Array<number>,
  ): void => {
    raiseSoftError('manageChildren');
  },
};

if (getUIManagerConstants) {
  Object.keys(getUIManagerConstantsCache()).forEach(viewConfigName => {
    UIManagerJS[viewConfigName] = getUIManagerConstantsCache()[viewConfigName];
  });
}

module.exports = UIManagerJS;
