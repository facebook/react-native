/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import AnimatedNode from './AnimatedNode';
import NativeAnimatedHelper from '../../../src/private/animated/NativeAnimatedHelper';
import type {PlatformConfig} from '../AnimatedPlatformConfig';

const {connectAnimatedNodes, disconnectAnimatedNodes} =
  NativeAnimatedHelper.API;

export default class AnimatedWithChildren extends AnimatedNode {
  _children: Array<AnimatedNode> = [];
  _parents: Array<AnimatedNode> = [];

  // Public method to add a child
  addChild(child: AnimatedNode): void {
    this.__addChild(child);
  }

  // Public method to remove a child
  removeChild(child: AnimatedNode): void {
    this.__removeChild(child);
  }

  __addChild(child: AnimatedNode): void {
    if (this._children.length === 0) {
      this.__attach();
    }
    this._children.push(child);
    child.addParent(this); // Maintain bidirectional parent-child relationship
    if (this.__isNative) {
      child.__makeNative(this.__getPlatformConfig());
      connectAnimatedNodes(this.__getNativeTag(), child.__getNativeTag());
    }
  }

  __removeChild(child: AnimatedNode): void {
    const index = this._children.indexOf(child);
    if (index === -1) {
      console.warn("Trying to remove a child that doesn't exist");
      return;
    }
    child.removeParent(this); // Remove parent reference from the child
    if (this.__isNative && child.__isNative) {
      disconnectAnimatedNodes(this.__getNativeTag(), child.__getNativeTag());
    }
    this._children.splice(index, 1);
    if (this._children.length === 0) {
      this.__detach();
    }
  }

  // New method to add a parent
  addParent(parent: AnimatedNode): void {
    if (!this._parents.includes(parent)) {
      this._parents.push(parent);
    }
  }

  // New method to remove a parent
  removeParent(parent: AnimatedNode): void {
    const index = this._parents.indexOf(parent);
    if (index !== -1) {
      this._parents.splice(index, 1);
    }
  }

  __makeNative(platformConfig: ?PlatformConfig) {
    if (!this.__isNative) {
      this.__isNative = true;

      const children = this._children;
      let length = children.length;
      if (length > 0) {
        for (let ii = 0; ii < length; ii++) {
          const child = children[ii];
          child.__makeNative(platformConfig);
          connectAnimatedNodes(this.__getNativeTag(), child.__getNativeTag());
        }
      }
    }
    super.__makeNative(platformConfig);
  }

  __getChildren(): $ReadOnlyArray<AnimatedNode> {
    return this._children;
  }

  __callListeners(value: number): void {
    super.__callListeners(value);
    if (!this.__isNative) {
      const children = this._children;
      for (let ii = 0, length = children.length; ii < length; ii++) {
        const child = children[ii];
        if (child.__getValue) {
          child.__callListeners(child.__getValue());
        }
      }
    }
  }
}
