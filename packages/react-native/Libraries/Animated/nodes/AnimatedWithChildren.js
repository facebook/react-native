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

import type {PlatformConfig} from '../AnimatedPlatformConfig';

import NativeAnimatedHelper from '../NativeAnimatedHelper';
import AnimatedNode from './AnimatedNode';

export default class AnimatedWithChildren extends AnimatedNode {
  _children: Array<AnimatedNode>;

  constructor() {
    super();
    this._children = [];
  }

  __makeNative(platformConfig: ?PlatformConfig) {
    if (!this.__isNative) {
      this.__isNative = true;
      for (const child of this._children) {
        child.__makeNative(platformConfig);
        NativeAnimatedHelper.API.connectAnimatedNodes(
          this.__getNativeTag(),
          child.__getNativeTag(),
        );
      }
    }
    super.__makeNative(platformConfig);
  }

  __addChild(child: AnimatedNode): void {
    if (this._children.length === 0) {
      this.__attach();
    }
    this._children.push(child);
    if (this.__isNative) {
      // Only accept "native" animated nodes as children
      child.__makeNative(this.__getPlatformConfig());
      NativeAnimatedHelper.API.connectAnimatedNodes(
        this.__getNativeTag(),
        child.__getNativeTag(),
      );
    }
  }

  __removeChild(child: AnimatedNode): void {
    const index = this._children.indexOf(child);
    if (index === -1) {
      console.warn("Trying to remove a child that doesn't exist");
      return;
    }
    if (this.__isNative && child.__isNative) {
      NativeAnimatedHelper.API.disconnectAnimatedNodes(
        this.__getNativeTag(),
        child.__getNativeTag(),
      );
    }
    this._children.splice(index, 1);
    if (this._children.length === 0) {
      this.__detach();
    }
  }

  __getChildren(): $ReadOnlyArray<AnimatedNode> {
    return this._children;
  }

  __callListeners(value: number): void {
    super.__callListeners(value);
    if (!this.__isNative) {
      for (const child of this._children) {
        // $FlowFixMe[method-unbinding] added when improving typing for this parameters
        if (child.__getValue) {
          child.__callListeners(child.__getValue());
        }
      }
    }
  }
}
