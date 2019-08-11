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

import type {Spec} from './NativeUIManager';

interface UIManagerJSInterface extends Spec {
  +getViewManagerConfig: (viewManagerName: string) => Object;
  // The following are not marked read-only due to logic in UIManagerStatTracker.
  createView: (
    reactTag: ?number,
    viewName: string,
    rootTag: number,
    props: Object,
  ) => void;
  updateView: (reactTag: number, viewName: string, props: Object) => void;
  manageChildren: (
    containerTag: ?number,
    moveFromIndices: Array<number>,
    moveToIndices: Array<number>,
    addChildReactTags: Array<number>,
    addAtIndices: Array<number>,
    removeAtIndices: Array<number>,
  ) => void;
}

const UIManager: UIManagerJSInterface =
  global.RN$Bridgeless === true
    ? require('./DummyUIManager') // No UIManager in bridgeless mode
    : require('./PaperUIManager');

module.exports = UIManager;
