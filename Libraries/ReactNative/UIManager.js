/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {Spec} from './NativeUIManager';
import type {RootTag} from 'react-native/Libraries/Types/RootTagTypes';

export interface UIManagerJSInterface extends Spec {
  +getViewManagerConfig: (viewManagerName: string) => Object;
  +hasViewManagerConfig: (viewManagerName: string) => boolean;
  +createView: (
    reactTag: ?number,
    viewName: string,
    rootTag: RootTag,
    props: Object,
  ) => void;
  +updateView: (reactTag: number, viewName: string, props: Object) => void;
  +manageChildren: (
    containerTag: ?number,
    moveFromIndices: Array<number>,
    moveToIndices: Array<number>,
    addChildReactTags: Array<number>,
    addAtIndices: Array<number>,
    removeAtIndices: Array<number>,
  ) => void;
}

var UIManager: UIManagerJSInterface;
if (global.RN$Bridgeless === true) {
  // $FlowExpectedError[incompatible-type]
  UIManager = require('./DummyUIManager');
} else {
  const {unstable_UIManager} = require('./UIManagerInjection');
  UIManager = unstable_UIManager
    ? unstable_UIManager
    : require('./PaperUIManager');
}

module.exports = UIManager;
