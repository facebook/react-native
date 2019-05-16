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

import type {TurboModule} from 'RCTExport';
import * as TurboModuleRegistry from 'TurboModuleRegistry';

interface Constants extends Object {
  [key: string]: Object;
  ViewManagerNames: Array<string>;
  LazyViewManagersEnabled: boolean;
  bubblingEventTypes: Array<string>;
  genericBubblingEventTypes: Array<string>;
  genericDirectEventTypes: Array<string>;
}

export interface Spec extends TurboModule {
  +getConstants: () => Constants;
  +getConstantsForViewManager: (viewManagerName: string) => Object;
  +getDefaultEventTypes: () => Array<string>;
  +playTouchSound: () => void;
  +lazilyLoadView: (name: string) => Object; // revisit return
  +createView: (
    reactTag: number,
    viewName: string,
    rootTag: number,
    props: Object,
  ) => void;
  +updateView: (reactTag: number, viewName: string, props: Object) => void;
  +focus: (reactTag: ?number) => void;
  +blur: (reactTag: ?number) => void;
  +findSubviewIn: (
    reactTag: ?number,
    point: [number, number],
    callback: (
      nativeViewTag: number,
      left: number,
      top: number,
      width: number,
      height: number,
    ) => void,
  ) => void;
  +dispatchViewManagerCommand: (
    reactTag: ?number,
    commandID: number,
    commandArgs: ?Array<string | number | boolean>, // is this best?
  ) => void;
  +measure: (
    reactTag: ?number,
    callback: (
      left: number,
      top: number,
      width: number,
      height: number,
      pageX: number,
      pageY: number,
    ) => void,
  ) => void;
  +measureInWindow: (
    reactTag: number,
    callback: (result: Array<number>) => void,
  ) => void;
  +viewIsDescendantOf: (
    reactTag: number,
    ancestorReactTag: number,
    callback: (result: Array<boolean>) => void,
  ) => void;
  +measureLayout: (
    reactTag: number,
    ancestorReactTag: ?number,
    errorCallback: (error: Object) => void,
    callback: (result: Array<number>) => void,
  ) => void;
  +measureLayoutRelativeToParent: (
    reactTag: number,
    errorCallback: (error: Object) => void,
    callback: (result: Array<number>) => void,
  ) => void;
  +setJSResponder: (reactTag: number, blockNativeResponder: boolean) => void;
  +clearJSResponder: () => void;
  +configureNextLayoutAnimation: (
    config: Object,
    callback: () => void, // check what is returned here
    errorCallback: (error: Object) => void,
  ) => void;
  +removeSubviewsFromContainerWithID: (containerID: number) => void;
  +replaceExistingNonRootView: (reactTag: number, newReactTag: number) => void;
  +setChildren: (containerTag: number, reactTags: Array<number>) => void;
  +manageChildren: (
    containerTag: number,
    moveFromIndices: Array<number>,
    moveToIndices: Array<number>,
    addChildReactTags: Array<number>,
    addAtIndices: Array<number>,
    removeAtIndices: Array<number>,
  ) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('UIManager');
