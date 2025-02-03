/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {RootTag} from '../../../../Libraries/TurboModule/RCTExport';
import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getConstants: () => Object;
  +createView: (
    reactTag: number,
    viewName: string,
    rootTag: RootTag,
    props: Object,
  ) => void;
  +updateView: (reactTag: number, viewName: string, props: Object) => void;
  +findSubviewIn: (
    reactTag: number,
    point: Array<number>,
    callback: (
      nativeViewTag: number,
      left: number,
      top: number,
      width: number,
      height: number,
    ) => void,
  ) => void;
  +dispatchViewManagerCommand: (
    reactTag: number,
    commandID: number, // number || string
    commandArgs: ?Array<any>,
  ) => void;
  +measure: (
    reactTag: number,
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
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
  +viewIsDescendantOf: (
    reactTag: number,
    ancestorReactTag: number,
    callback: (result: Array<boolean>) => void,
  ) => void;
  +measureLayout: (
    reactTag: number,
    ancestorReactTag: number,
    errorCallback: (error: Object) => void,
    callback: (
      left: number,
      top: number,
      width: number,
      height: number,
    ) => void,
  ) => void;
  +measureLayoutRelativeToParent: (
    reactTag: number,
    errorCallback: (error: Object) => void,
    callback: (
      left: number,
      top: number,
      width: number,
      height: number,
    ) => void,
  ) => void;
  +setJSResponder: (reactTag: number, blockNativeResponder: boolean) => void;
  +clearJSResponder: () => void;
  +configureNextLayoutAnimation: (
    config: Object,
    callback: () => void, // check what is returned here
    errorCallback: (error: Object) => void,
  ) => void;
  +setChildren: (containerTag: number, reactTags: Array<number>) => void;
  +manageChildren: (
    containerTag: number,
    moveFromIndices: Array<number>,
    moveToIndices: Array<number>,
    addChildReactTags: Array<number>,
    addAtIndices: Array<number>,
    removeAtIndices: Array<number>,
  ) => void;

  // Android only
  +getConstantsForViewManager?: (viewManagerName: string) => ?Object;
  +getDefaultEventTypes?: () => Array<string>;
  +setLayoutAnimationEnabledExperimental?: (enabled: boolean) => void;
  +sendAccessibilityEvent?: (reactTag: number, eventType: number) => void;

  // ios only
  +lazilyLoadView?: (name: string) => Object; // revisit return
  +focus?: (reactTag: number) => void;
  +blur?: (reactTag: number) => void;
}

export default (TurboModuleRegistry.getEnforcing<Spec>('UIManager'): Spec);
