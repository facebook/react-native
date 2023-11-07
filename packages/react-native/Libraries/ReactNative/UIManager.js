/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {UIManagerJSInterface} from '../Types/UIManagerJSInterface';

import {getFabricUIManager} from './FabricUIManager';
import nullthrows from 'nullthrows';

function isFabricReactTag(reactTag: number): boolean {
  // React reserves even numbers for Fabric.
  return reactTag % 2 === 0;
}

const UIManagerImpl: UIManagerJSInterface =
  global.RN$Bridgeless === true
    ? require('./BridgelessUIManager')
    : require('./PaperUIManager');

// $FlowFixMe[cannot-spread-interface]
const UIManager: UIManagerJSInterface = {
  ...UIManagerImpl,
  measure(
    reactTag: number,
    callback: (
      left: number,
      top: number,
      width: number,
      height: number,
      pageX: number,
      pageY: number,
    ) => void,
  ): void {
    if (isFabricReactTag(reactTag)) {
      const FabricUIManager = nullthrows(getFabricUIManager());
      const shadowNode =
        FabricUIManager.findShadowNodeByTag_DEPRECATED(reactTag);
      if (shadowNode) {
        FabricUIManager.measure(shadowNode, callback);
      } else {
        console.warn(`measure cannot find view with tag #${reactTag}`);
        // $FlowFixMe[incompatible-call]
        callback();
      }
    } else {
      // Paper
      UIManagerImpl.measure(reactTag, callback);
    }
  },

  measureInWindow(
    reactTag: number,
    callback: (
      left: number,
      top: number,
      width: number,
      height: number,
    ) => void,
  ): void {
    if (isFabricReactTag(reactTag)) {
      const FabricUIManager = nullthrows(getFabricUIManager());
      const shadowNode =
        FabricUIManager.findShadowNodeByTag_DEPRECATED(reactTag);
      if (shadowNode) {
        FabricUIManager.measureInWindow(shadowNode, callback);
      } else {
        console.warn(`measure cannot find view with tag #${reactTag}`);
        // $FlowFixMe[incompatible-call]
        callback();
      }
    } else {
      // Paper
      UIManagerImpl.measureInWindow(reactTag, callback);
    }
  },

  measureLayout(
    reactTag: number,
    ancestorReactTag: number,
    errorCallback: (error: Object) => void,
    callback: (
      left: number,
      top: number,
      width: number,
      height: number,
    ) => void,
  ): void {
    if (isFabricReactTag(reactTag)) {
      const FabricUIManager = nullthrows(getFabricUIManager());
      const shadowNode =
        FabricUIManager.findShadowNodeByTag_DEPRECATED(reactTag);
      const ancestorShadowNode =
        FabricUIManager.findShadowNodeByTag_DEPRECATED(ancestorReactTag);

      if (!shadowNode || !ancestorShadowNode) {
        return;
      }

      FabricUIManager.measureLayout(
        shadowNode,
        ancestorShadowNode,
        errorCallback,
        callback,
      );
    } else {
      // Paper
      UIManagerImpl.measureLayout(
        reactTag,
        ancestorReactTag,
        errorCallback,
        callback,
      );
    }
  },

  measureLayoutRelativeToParent(
    reactTag: number,
    errorCallback: (error: Object) => void,
    callback: (
      left: number,
      top: number,
      width: number,
      height: number,
    ) => void,
  ): void {
    if (isFabricReactTag(reactTag)) {
      console.warn(
        'RCTUIManager.measureLayoutRelativeToParent method is deprecated and it will not be implemented in newer versions of RN (Fabric) - T47686450',
      );
      const FabricUIManager = nullthrows(getFabricUIManager());
      const shadowNode =
        FabricUIManager.findShadowNodeByTag_DEPRECATED(reactTag);
      if (shadowNode) {
        FabricUIManager.measure(
          shadowNode,
          (left, top, width, height, pageX, pageY) => {
            callback(left, top, width, height);
          },
        );
      }
    } else {
      // Paper
      UIManagerImpl.measureLayoutRelativeToParent(
        reactTag,
        errorCallback,
        callback,
      );
    }
  },

  dispatchViewManagerCommand(
    reactTag: number,
    commandName: number | string,
    commandArgs: any[],
  ) {
    // Sometimes, libraries directly pass in the output of `findNodeHandle` to
    // this function without checking if it's null. This guards against that
    // case. We throw early here in Javascript so we can get a JS stacktrace
    // instead of a harder-to-debug native Java or Objective-C stacktrace.
    if (typeof reactTag !== 'number') {
      throw new Error('dispatchViewManagerCommand: found null reactTag');
    }

    if (isFabricReactTag(reactTag)) {
      const FabricUIManager = nullthrows(getFabricUIManager());
      const shadowNode =
        FabricUIManager.findShadowNodeByTag_DEPRECATED(reactTag);
      if (shadowNode) {
        // Transform the accidental CommandID into a CommandName which is the stringified number.
        // The interop layer knows how to convert this number into the right method name.
        // Stringify a string is a no-op, so it's safe.
        commandName = `${commandName}`;
        FabricUIManager.dispatchCommand(shadowNode, commandName, commandArgs);
      }
    } else {
      UIManagerImpl.dispatchViewManagerCommand(
        reactTag,
        // We have some legacy components that are actually already using strings. ¯\_(ツ)_/¯
        // $FlowFixMe[incompatible-call]
        commandName,
        commandArgs,
      );
    }
  },
};

module.exports = UIManager;
