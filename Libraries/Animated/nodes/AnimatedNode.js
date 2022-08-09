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

const NativeAnimatedHelper = require('../NativeAnimatedHelper');

const NativeAnimatedAPI = NativeAnimatedHelper.API;
const invariant = require('invariant');

import type {PlatformConfig} from '../AnimatedPlatformConfig';

type ValueListenerCallback = (state: {value: number, ...}) => mixed;

let _uniqueId = 1;

// Note(vjeux): this would be better as an interface but flow doesn't
// support them yet
class AnimatedNode {
  _listeners: {[key: string]: ValueListenerCallback, ...};
  _platformConfig: ?PlatformConfig;
  __nativeAnimatedValueListener: ?any;
  __attach(): void {}
  __detach(): void {
    if (this.__isNative && this.__nativeTag != null) {
      NativeAnimatedHelper.API.dropAnimatedNode(this.__nativeTag);
      this.__nativeTag = undefined;
    }
  }
  __getValue(): any {}
  __getAnimatedValue(): any {
    return this.__getValue();
  }
  __addChild(child: AnimatedNode) {}
  __removeChild(child: AnimatedNode) {}
  __getChildren(): Array<AnimatedNode> {
    return [];
  }

  /* Methods and props used by native Animated impl */
  __isNative: boolean;
  __nativeTag: ?number;
  __shouldUpdateListenersForNewNativeTag: boolean;

  constructor() {
    this._listeners = {};
  }

  __makeNative(platformConfig: ?PlatformConfig) {
    if (!this.__isNative) {
      throw new Error('This node cannot be made a "native" animated node');
    }

    this._platformConfig = platformConfig;
    if (this.hasListeners()) {
      this._startListeningToNativeValueUpdates();
    }
  }

  /**
   * Adds an asynchronous listener to the value so you can observe updates from
   * animations.  This is useful because there is no way to
   * synchronously read the value because it might be driven natively.
   *
   * See https://reactnative.dev/docs/animatedvalue#addlistener
   */
  addListener(callback: (value: any) => mixed): string {
    const id = String(_uniqueId++);
    this._listeners[id] = callback;
    if (this.__isNative) {
      this._startListeningToNativeValueUpdates();
    }
    return id;
  }

  /**
   * Unregister a listener. The `id` param shall match the identifier
   * previously returned by `addListener()`.
   *
   * See https://reactnative.dev/docs/animatedvalue#removelistener
   */
  removeListener(id: string): void {
    delete this._listeners[id];
    if (this.__isNative && !this.hasListeners()) {
      this._stopListeningForNativeValueUpdates();
    }
  }

  /**
   * Remove all registered listeners.
   *
   * See https://reactnative.dev/docs/animatedvalue#removealllisteners
   */
  removeAllListeners(): void {
    this._listeners = {};
    if (this.__isNative) {
      this._stopListeningForNativeValueUpdates();
    }
  }

  hasListeners(): boolean {
    return !!Object.keys(this._listeners).length;
  }

  _startListeningToNativeValueUpdates() {
    if (
      this.__nativeAnimatedValueListener &&
      !this.__shouldUpdateListenersForNewNativeTag
    ) {
      return;
    }

    if (this.__shouldUpdateListenersForNewNativeTag) {
      this.__shouldUpdateListenersForNewNativeTag = false;
      this._stopListeningForNativeValueUpdates();
    }

    NativeAnimatedAPI.startListeningToAnimatedNodeValue(this.__getNativeTag());
    this.__nativeAnimatedValueListener =
      NativeAnimatedHelper.nativeEventEmitter.addListener(
        'onAnimatedValueUpdate',
        data => {
          if (data.tag !== this.__getNativeTag()) {
            return;
          }
          this._onAnimatedValueUpdateReceived(data.value);
        },
      );
  }

  _onAnimatedValueUpdateReceived(value: number) {
    this.__callListeners(value);
  }

  __callListeners(value: number): void {
    for (const key in this._listeners) {
      this._listeners[key]({value});
    }
  }

  _stopListeningForNativeValueUpdates() {
    if (!this.__nativeAnimatedValueListener) {
      return;
    }

    this.__nativeAnimatedValueListener.remove();
    this.__nativeAnimatedValueListener = null;
    NativeAnimatedAPI.stopListeningToAnimatedNodeValue(this.__getNativeTag());
  }

  __getNativeTag(): number {
    NativeAnimatedHelper.assertNativeAnimatedModule();
    invariant(
      this.__isNative,
      'Attempt to get native tag from node not marked as "native"',
    );

    const nativeTag =
      this.__nativeTag ?? NativeAnimatedHelper.generateNewNodeTag();

    if (this.__nativeTag == null) {
      this.__nativeTag = nativeTag;
      const config = this.__getNativeConfig();
      if (this._platformConfig) {
        config.platformConfig = this._platformConfig;
      }
      NativeAnimatedHelper.API.createAnimatedNode(nativeTag, config);
      this.__shouldUpdateListenersForNewNativeTag = true;
    }

    return nativeTag;
  }
  __getNativeConfig(): Object {
    throw new Error(
      'This JS animated node type cannot be used as native animated node',
    );
  }
  toJSON(): any {
    return this.__getValue();
  }

  __getPlatformConfig(): ?PlatformConfig {
    return this._platformConfig;
  }
  __setPlatformConfig(platformConfig: ?PlatformConfig) {
    this._platformConfig = platformConfig;
  }
}

module.exports = AnimatedNode;
