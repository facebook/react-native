/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {PlatformConfig} from '../AnimatedPlatformConfig';

import NativeAnimatedHelper from '../../../src/private/animated/NativeAnimatedHelper';
import invariant from 'invariant';

type ValueListenerCallback = (state: {value: number, ...}) => mixed;

export type AnimatedNodeConfig = $ReadOnly<{
  debugID?: string,
}>;

let _uniqueId = 1;
let _assertNativeAnimatedModule: ?() => void = () => {
  NativeAnimatedHelper.assertNativeAnimatedModule();
  // We only have to assert that the module exists once. After we've asserted
  // this, clear out the function so we know to skip it in the future.
  _assertNativeAnimatedModule = null;
};

export default class AnimatedNode {
  #listeners: Map<string, ValueListenerCallback> = new Map();

  _platformConfig: ?PlatformConfig = undefined;

  constructor(
    config?: ?$ReadOnly<{
      ...AnimatedNodeConfig,
      ...
    }>,
  ) {
    if (__DEV__) {
      this.__debugID = config?.debugID;
    }
  }

  __attach(): void {}
  __detach(): void {
    this.removeAllListeners();
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
  __getChildren(): $ReadOnlyArray<AnimatedNode> {
    return [];
  }

  /* Methods and props used by native Animated impl */
  __isNative: boolean = false;
  __nativeTag: ?number = undefined;

  __makeNative(platformConfig: ?PlatformConfig): void {
    // Subclasses are expected to set `__isNative` to true before this.
    invariant(
      this.__isNative,
      'This node cannot be made a "native" animated node',
    );

    this._platformConfig = platformConfig;
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
    this.#listeners.set(id, callback);
    return id;
  }

  /**
   * Unregister a listener. The `id` param shall match the identifier
   * previously returned by `addListener()`.
   *
   * See https://reactnative.dev/docs/animatedvalue#removelistener
   */
  removeListener(id: string): void {
    this.#listeners.delete(id);
  }

  /**
   * Remove all registered listeners.
   *
   * See https://reactnative.dev/docs/animatedvalue#removealllisteners
   */
  removeAllListeners(): void {
    this.#listeners.clear();
  }

  hasListeners(): boolean {
    return this.#listeners.size > 0;
  }

  __onAnimatedValueUpdateReceived(value: number): void {
    this.__callListeners(value);
  }

  __callListeners(value: number): void {
    const event = {value};
    this.#listeners.forEach(listener => {
      listener(event);
    });
  }

  __getNativeTag(): number {
    let nativeTag = this.__nativeTag;
    if (nativeTag == null) {
      _assertNativeAnimatedModule?.();

      // `__isNative` is initialized as false and only ever set to true. So we
      // only need to check it once here when initializing `__nativeTag`.
      invariant(
        this.__isNative,
        'Attempt to get native tag from node not marked as "native"',
      );

      nativeTag = NativeAnimatedHelper.generateNewNodeTag();
      this.__nativeTag = nativeTag;

      const config = this.__getNativeConfig();
      if (this._platformConfig) {
        config.platformConfig = this._platformConfig;
      }
      NativeAnimatedHelper.API.createAnimatedNode(nativeTag, config);
    }
    return nativeTag;
  }

  __getNativeConfig(): Object {
    throw new Error(
      'This JS animated node type cannot be used as native animated node',
    );
  }

  __getPlatformConfig(): ?PlatformConfig {
    return this._platformConfig;
  }

  __setPlatformConfig(platformConfig: ?PlatformConfig) {
    this._platformConfig = platformConfig;
  }

  /**
   * NOTE: This is intended to prevent `JSON.stringify` from throwing "cyclic
   * structure" errors in React DevTools. Avoid depending on this!
   */
  toJSON(): mixed {
    return this.__getValue();
  }

  __debugID: ?string = undefined;

  __getDebugID(): ?string {
    if (__DEV__) {
      return this.__debugID;
    }
    return undefined;
  }
}
