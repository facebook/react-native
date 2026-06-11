/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {EventSubscription} from '../../vendor/emitter/EventEmitter';
import type {PlatformConfig} from '../AnimatedPlatformConfig';
import type Animation from '../animations/Animation';
import type {EndCallback} from '../animations/Animation';
import type {
  InterpolationConfigSupportedOutputType,
  InterpolationConfigType,
} from './AnimatedInterpolation';
import type AnimatedNode from './AnimatedNode';
import type {AnimatedNodeConfig} from './AnimatedNode';
import type AnimatedTracking from './AnimatedTracking';

import NativeAnimatedHelper from '../../../src/private/animated/NativeAnimatedHelper';
import * as ReactNativeFeatureFlags from '../../../src/private/featureflags/ReactNativeFeatureFlags';
import AnimatedInterpolation from './AnimatedInterpolation';
import AnimatedWithChildren from './AnimatedWithChildren';

export type AnimatedValueConfig = Readonly<{
  ...AnimatedNodeConfig,
  useNativeDriver: boolean,
}>;

const NativeAnimatedAPI = NativeAnimatedHelper.API;

export function flushValue(rootNode: AnimatedNode): void {
  const leaves = new Set<{update: () => void, ...}>();
  function findAnimatedStyles(node: AnimatedNode) {
    if (typeof node.update === 'function') {
      leaves.add(node as any);
    } else {
      node.__getChildren().forEach(findAnimatedStyles);
    }
  }
  findAnimatedStyles(rootNode);
  leaves.forEach(leaf => leaf.update());
}

function _executeAsAnimatedBatch(id: string, operation: () => void) {
  NativeAnimatedAPI.setWaitingForIdentifier(id);
  operation();
  NativeAnimatedAPI.unsetWaitingForIdentifier(id);
}

export default class AnimatedValue extends AnimatedWithChildren {
  _listenerCount: number;
  _updateSubscription: ?EventSubscription;

  _value: number;
  _startingValue: number;
  _offset: number;
  _animation: ?Animation;
  _tracking: ?AnimatedTracking;
  __deferAnimationStart: boolean;

  constructor(value: number, config?: ?AnimatedValueConfig) {
    super(config);
    if (typeof value !== 'number') {
      throw new Error('AnimatedValue: Attempting to set value to undefined');
    }

    this._listenerCount = 0;
    this._updateSubscription = null;

    this._startingValue = this._value = value;
    this._offset = 0;
    this.__deferAnimationStart =
      ReactNativeFeatureFlags.animatedDeferStartOfTimingAnimations();
    this._animation = null;
    if (config && config.useNativeDriver) {
      this.__makeNative();
    }
  }

  __detach() {
    if (this.__isNative) {
      NativeAnimatedAPI.getValue(this.__getNativeTag(), value => {
        this._value = value - this._offset;
      });
    }
    this.stopAnimation();
    super.__detach();
  }

  __getValue(): number {
    return this._value + this._offset;
  }

  __makeNative(platformConfig: ?PlatformConfig): void {
    super.__makeNative(platformConfig);
    if (this._listenerCount > 0) {
      this.__ensureUpdateSubscriptionExists();
    }
  }

  addListener(callback: (value: any) => unknown): string {
    const id = super.addListener(callback);
    this._listenerCount++;
    if (this.__isNative) {
      this.__ensureUpdateSubscriptionExists();
    }
    return id;
  }

  removeListener(id: string): void {
    super.removeListener(id);
    // ফিক্সটি এখানে:
    this._listenerCount = Math.max(0, this._listenerCount - 1);
    if (this.__isNative && this._listenerCount === 0) {
      this._updateSubscription?.remove();
    }
  }

  removeAllListeners(): void {
    super.removeAllListeners();
    this._listenerCount = 0;
    if (this.__isNative) {
      this._updateSubscription?.remove();
    }
  }

  __ensureUpdateSubscriptionExists(): void {
    if (this._updateSubscription != null) {
      return;
    }
    const nativeTag = this.__getNativeTag();
    NativeAnimatedAPI.startListeningToAnimatedNodeValue(nativeTag);
    const subscription: EventSubscription =
      NativeAnimatedHelper.nativeEventEmitter.addListener(
        'onAnimatedValueUpdate',
        data => {
          if (data.tag === nativeTag) {
            this.__onAnimatedValueUpdateReceived(data.value, data.offset);
          }
        },
      );

    this._updateSubscription = {
      remove: () => {
        if (this._updateSubscription == null) {
          return;
        }
        this._updateSubscription = null;
        subscription.remove();
        NativeAnimatedAPI.stopListeningToAnimatedNodeValue(nativeTag);
      },
    };
  }

  setValue(value: number): void {
    if (this._animation) {
      this._animation.stop();
      this._animation = null;
    }
    this._updateValue(
      value,
      !this.__isNative,
    );
    if (this.__isNative) {
      _executeAsAnimatedBatch(this.__getNativeTag().toString(), () =>
        NativeAnimatedAPI.setAnimatedNodeValue(this.__getNativeTag(), value),
      );
    }
  }

  setOffset(offset: number): void {
    this._offset = offset;
    if (this.__isNative) {
      NativeAnimatedAPI.setAnimatedNodeOffset(this.__getNativeTag(), offset);
    }
  }

  flattenOffset(): void {
    this._value += this._offset;
    this._offset = 0;
    if (this.__isNative) {
      NativeAnimatedAPI.flattenAnimatedNodeOffset(this.__getNativeTag());
    }
  }

  extractOffset(): void {
    this._offset += this._value;
    this._value = 0;
    if (this.__isNative) {
      _executeAsAnimatedBatch(this.__getNativeTag().toString(), () =>
        NativeAnimatedAPI.extractAnimatedNodeOffset(this.__getNativeTag()),
      );
    }
  }

  stopAnimation(callback?: ?(value: number) => void): void {
    this.stopTracking();
    this._animation && this._animation.stop();
    this._animation = null;
    if (callback) {
      if (this.__isNative) {
        NativeAnimatedAPI.getValue(this.__getNativeTag(), callback);
      } else {
        callback(this.__getValue());
      }
    }
  }

  resetAnimation(callback?: ?(value: number) => void): void {
    this.stopAnimation(callback);
    this._value = this._startingValue;
    if (this.__isNative) {
      NativeAnimatedAPI.setAnimatedNodeValue(
        this.__getNativeTag(),
        this._startingValue,
      );
    }
  }

  __onAnimatedValueUpdateReceived(value: number, offset?: number): void {
    this._updateValue(value, false);
    if (offset != null) {
      this._offset = offset;
    }
  }

  interpolate<OutputT extends InterpolationConfigSupportedOutputType>(
    config: InterpolationConfigType<OutputT>,
  ): AnimatedInterpolation<OutputT> {
    return new AnimatedInterpolation(this, config);
  }

  animate(animation: Animation, callback: ?EndCallback): void {
    const previousAnimation = this._animation;
    this._animation && this._animation.stop();
    this._animation = animation;
    animation.start(
      this._value,
      value => {
        this._updateValue(value, true);
      },
      result => {
        this._animation = null;
        callback && callback(result);
        if (this._animation == null) {
          this.__deferAnimationStart =
            ReactNativeFeatureFlags.animatedDeferStartOfTimingAnimations();
        }
      },
      previousAnimation,
      this,
    );
  }

  stopTracking(): void {
    this._tracking && this._tracking.__detach();
    this._tracking = null;
  }

  track(tracking: AnimatedTracking): void {
    this.stopTracking();
    this._tracking = tracking;
    this._tracking && this._tracking.update();
  }

  _updateValue(value: number, flush: boolean): void {
    if (value === undefined) {
      throw new Error('AnimatedValue: Attempting to set value to undefined');
    }

    this._value = value;
    if (flush) {
      flushValue(this);
    }
    this.__callListeners(this.__getValue());
  }

  __getNativeConfig(): Object {
    return {
      type: 'value',
      value: this._value,
      offset: this._offset,
      debugID: this.__getDebugID(),
    };
  }
}
