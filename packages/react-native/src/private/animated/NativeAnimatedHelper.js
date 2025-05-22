/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {EventConfig} from '../../../Libraries/Animated/AnimatedEvent';
import type {
  AnimationConfig,
  EndCallback,
} from '../../../Libraries/Animated/animations/Animation';
import type {
  AnimatedNodeConfig,
  EventMapping,
} from '../../../Libraries/Animated/NativeAnimatedModule';
import type {EventSubscription} from '../../../Libraries/vendor/emitter/EventEmitter';

import NativeAnimatedNonTurboModule from '../../../Libraries/Animated/NativeAnimatedModule';
import NativeAnimatedTurboModule from '../../../Libraries/Animated/NativeAnimatedTurboModule';
import NativeEventEmitter from '../../../Libraries/EventEmitter/NativeEventEmitter';
import RCTDeviceEventEmitter from '../../../Libraries/EventEmitter/RCTDeviceEventEmitter';
import Platform from '../../../Libraries/Utilities/Platform';
import * as ReactNativeFeatureFlags from '../featureflags/ReactNativeFeatureFlags';
import invariant from 'invariant';
import nullthrows from 'nullthrows';

// TODO T69437152 @petetheheat - Delete this fork when Fabric ships to 100%.
const NativeAnimatedModule: typeof NativeAnimatedTurboModule =
  NativeAnimatedNonTurboModule ?? NativeAnimatedTurboModule;

let __nativeAnimatedNodeTagCount = 1; /* used for animated nodes */
let __nativeAnimationIdCount = 1; /* used for started animations */

let nativeEventEmitter;

let waitingForQueuedOperations = new Set<string>();
let queueOperations = false;
let queue: Array<() => void> = [];
let singleOpQueue: Array<mixed> = [];

const isSingleOpBatching =
  Platform.OS === 'android' &&
  NativeAnimatedModule?.queueAndExecuteBatchedOperations != null &&
  ReactNativeFeatureFlags.animatedShouldUseSingleOp();
let flushQueueImmediate = null;

const eventListenerGetValueCallbacks: {
  [number]: (value: number) => void,
} = {};
const eventListenerAnimationFinishedCallbacks: {
  [number]: EndCallback,
} = {};
let globalEventEmitterGetValueListener: ?EventSubscription = null;
let globalEventEmitterAnimationFinishedListener: ?EventSubscription = null;

const shouldSignalBatch: boolean =
  ReactNativeFeatureFlags.animatedShouldSignalBatch() ||
  ReactNativeFeatureFlags.cxxNativeAnimatedEnabled();

function createNativeOperations(): $NonMaybeType<typeof NativeAnimatedModule> {
  const methodNames = [
    'createAnimatedNode', // 1
    'updateAnimatedNodeConfig', // 2
    'getValue', // 3
    'startListeningToAnimatedNodeValue', // 4
    'stopListeningToAnimatedNodeValue', // 5
    'connectAnimatedNodes', // 6
    'disconnectAnimatedNodes', // 7
    'startAnimatingNode', // 8
    'stopAnimation', // 9
    'setAnimatedNodeValue', // 10
    'setAnimatedNodeOffset', // 11
    'flattenAnimatedNodeOffset', // 12
    'extractAnimatedNodeOffset', // 13
    'connectAnimatedNodeToView', // 14
    'disconnectAnimatedNodeFromView', // 15
    'restoreDefaultValues', // 16
    'dropAnimatedNode', // 17
    'addAnimatedEventToView', // 18
    'removeAnimatedEventFromView', // 19
    'addListener', // 20
    'removeListener', // 21
  ];
  const nativeOperations: {
    [$Values<typeof methodNames>]: (...$ReadOnlyArray<mixed>) => void,
  } = {};
  if (isSingleOpBatching) {
    for (let ii = 0, length = methodNames.length; ii < length; ii++) {
      const methodName = methodNames[ii];
      const operationID = ii + 1;
      nativeOperations[methodName] = (...args) => {
        // `singleOpQueue` is a flat array of operation IDs and arguments, which
        // is possible because # arguments is fixed for each operation. For more
        // details, see `NativeAnimatedModule.queueAndExecuteBatchedOperations`.
        singleOpQueue.push(operationID, ...args);
        if (shouldSignalBatch) {
          clearImmediate(flushQueueImmediate);
          flushQueueImmediate = setImmediate(API.flushQueue);
        }
      };
    }
  } else {
    for (let ii = 0, length = methodNames.length; ii < length; ii++) {
      const methodName = methodNames[ii];
      nativeOperations[methodName] = (...args) => {
        /* $FlowFixMe[prop-missing] Natural Inference rollout. See
         * https://fburl.com/workplace/6291gfvu */
        const method = nullthrows(NativeAnimatedModule)[methodName];
        // If queueing is explicitly on, *or* the queue has not yet
        // been flushed, use the queue. This is to prevent operations
        // from being executed out of order.
        if (queueOperations || queue.length !== 0) {
          // $FlowExpectedError[incompatible-call] - Dynamism.
          queue.push(() => method(...args));
        } else if (shouldSignalBatch) {
          // $FlowExpectedError[incompatible-call] - Dynamism.
          queue.push(() => method(...args));
          clearImmediate(flushQueueImmediate);
          flushQueueImmediate = setImmediate(API.flushQueue);
        } else {
          // $FlowExpectedError[incompatible-call] - Dynamism.
          method(...args);
        }
      };
    }
  }
  // $FlowExpectedError[incompatible-return] - Dynamism.
  return nativeOperations;
}

const NativeOperations = createNativeOperations();

/**
 * Wrappers around NativeAnimatedModule to provide flow and autocomplete support for
 * the native module methods, and automatic queue management on Android
 */
const API = {
  getValue: (isSingleOpBatching
    ? (tag, saveValueCallback) => {
        if (saveValueCallback) {
          eventListenerGetValueCallbacks[tag] = saveValueCallback;
        }
        /* $FlowExpectedError[incompatible-call] - `saveValueCallback` is handled
            differently when `isSingleOpBatching` is enabled. */
        NativeOperations.getValue(tag);
      }
    : (tag, saveValueCallback) => {
        NativeOperations.getValue(tag, saveValueCallback);
      }) as $NonMaybeType<typeof NativeAnimatedModule>['getValue'],

  setWaitingForIdentifier(id: string): void {
    if (shouldSignalBatch) {
      return;
    }

    waitingForQueuedOperations.add(id);
    queueOperations = true;
    if (
      ReactNativeFeatureFlags.animatedShouldDebounceQueueFlush() &&
      flushQueueImmediate
    ) {
      clearImmediate(flushQueueImmediate);
    }
  },

  unsetWaitingForIdentifier(id: string): void {
    if (shouldSignalBatch) {
      return;
    }

    waitingForQueuedOperations.delete(id);

    if (waitingForQueuedOperations.size === 0) {
      queueOperations = false;
      API.disableQueue();
    }
  },

  disableQueue(): void {
    invariant(NativeAnimatedModule, 'Native animated module is not available');

    if (ReactNativeFeatureFlags.animatedShouldDebounceQueueFlush()) {
      const prevImmediate = flushQueueImmediate;
      clearImmediate(prevImmediate);
      flushQueueImmediate = setImmediate(API.flushQueue);
    } else {
      API.flushQueue();
    }
  },

  flushQueue: (isSingleOpBatching
    ? (): void => {
        invariant(
          NativeAnimatedModule,
          'Native animated module is not available',
        );
        flushQueueImmediate = null;

        if (singleOpQueue.length === 0) {
          return;
        }

        // Set up event listener for callbacks if it's not set up
        ensureGlobalEventEmitterListeners();

        // Single op batching doesn't use callback functions, instead we
        // use RCTDeviceEventEmitter. This reduces overhead of sending lots of
        // JSI functions across to native code; but also, TM infrastructure currently
        // does not support packing a function into native arrays.
        NativeAnimatedModule?.queueAndExecuteBatchedOperations?.(singleOpQueue);
        singleOpQueue.length = 0;
      }
    : (): void => {
        invariant(
          NativeAnimatedModule,
          'Native animated module is not available',
        );
        flushQueueImmediate = null;

        if (queue.length === 0) {
          return;
        }

        if (Platform.OS === 'android' || shouldSignalBatch) {
          NativeAnimatedModule?.startOperationBatch?.();
        }

        for (let q = 0, l = queue.length; q < l; q++) {
          queue[q]();
        }
        queue.length = 0;

        if (Platform.OS === 'android' || shouldSignalBatch) {
          NativeAnimatedModule?.finishOperationBatch?.();
        }
      }) as () => void,

  createAnimatedNode(tag: number, config: AnimatedNodeConfig): void {
    NativeOperations.createAnimatedNode(tag, config);
  },

  updateAnimatedNodeConfig(tag: number, config: AnimatedNodeConfig): void {
    NativeOperations.updateAnimatedNodeConfig?.(tag, config);
  },

  startListeningToAnimatedNodeValue(tag: number): void {
    NativeOperations.startListeningToAnimatedNodeValue(tag);
  },

  stopListeningToAnimatedNodeValue(tag: number): void {
    NativeOperations.stopListeningToAnimatedNodeValue(tag);
  },

  connectAnimatedNodes(parentTag: number, childTag: number): void {
    NativeOperations.connectAnimatedNodes(parentTag, childTag);
  },

  disconnectAnimatedNodes(parentTag: number, childTag: number): void {
    NativeOperations.disconnectAnimatedNodes(parentTag, childTag);
  },

  startAnimatingNode: (isSingleOpBatching
    ? (animationId, nodeTag, config, endCallback) => {
        if (endCallback) {
          eventListenerAnimationFinishedCallbacks[animationId] = endCallback;
        }
        /* $FlowExpectedError[incompatible-call] - `endCallback` is handled
            differently when `isSingleOpBatching` is enabled. */
        NativeOperations.startAnimatingNode(animationId, nodeTag, config);
      }
    : (animationId, nodeTag, config, endCallback) => {
        NativeOperations.startAnimatingNode(
          animationId,
          nodeTag,
          config,
          endCallback,
        );
      }) as $NonMaybeType<typeof NativeAnimatedModule>['startAnimatingNode'],

  stopAnimation(animationId: number) {
    NativeOperations.stopAnimation(animationId);
  },

  setAnimatedNodeValue(nodeTag: number, value: number): void {
    NativeOperations.setAnimatedNodeValue(nodeTag, value);
  },

  setAnimatedNodeOffset(nodeTag: number, offset: number): void {
    NativeOperations.setAnimatedNodeOffset(nodeTag, offset);
  },

  flattenAnimatedNodeOffset(nodeTag: number): void {
    NativeOperations.flattenAnimatedNodeOffset(nodeTag);
  },

  extractAnimatedNodeOffset(nodeTag: number): void {
    NativeOperations.extractAnimatedNodeOffset(nodeTag);
  },

  connectAnimatedNodeToView(nodeTag: number, viewTag: number): void {
    NativeOperations.connectAnimatedNodeToView(nodeTag, viewTag);
  },

  disconnectAnimatedNodeFromView(nodeTag: number, viewTag: number): void {
    NativeOperations.disconnectAnimatedNodeFromView(nodeTag, viewTag);
  },

  restoreDefaultValues(nodeTag: number): void {
    NativeOperations.restoreDefaultValues?.(nodeTag);
  },

  dropAnimatedNode(tag: number): void {
    NativeOperations.dropAnimatedNode(tag);
  },

  addAnimatedEventToView(
    viewTag: number,
    eventName: string,
    eventMapping: EventMapping,
  ) {
    NativeOperations.addAnimatedEventToView(viewTag, eventName, eventMapping);
  },

  removeAnimatedEventFromView(
    viewTag: number,
    eventName: string,
    animatedNodeTag: number,
  ) {
    NativeOperations.removeAnimatedEventFromView(
      viewTag,
      eventName,
      animatedNodeTag,
    );
  },
};

function ensureGlobalEventEmitterListeners() {
  if (
    globalEventEmitterGetValueListener &&
    globalEventEmitterAnimationFinishedListener
  ) {
    return;
  }
  globalEventEmitterGetValueListener = RCTDeviceEventEmitter.addListener(
    'onNativeAnimatedModuleGetValue',
    params => {
      const {tag} = params;
      const callback = eventListenerGetValueCallbacks[tag];
      if (!callback) {
        return;
      }
      callback(params.value);
      delete eventListenerGetValueCallbacks[tag];
    },
  );
  globalEventEmitterAnimationFinishedListener =
    RCTDeviceEventEmitter.addListener(
      'onNativeAnimatedModuleAnimationFinished',
      params => {
        // TODO: remove Array.isArray once native changes have propagated
        const animations = Array.isArray(params) ? params : [params];
        for (const animation of animations) {
          const {animationId} = animation;
          const callback = eventListenerAnimationFinishedCallbacks[animationId];
          if (callback) {
            callback(animation);
            delete eventListenerAnimationFinishedCallbacks[animationId];
          }
        }
      },
    );
}

function generateNewNodeTag(): number {
  return __nativeAnimatedNodeTagCount++;
}

function generateNewAnimationId(): number {
  return __nativeAnimationIdCount++;
}

function assertNativeAnimatedModule(): void {
  invariant(NativeAnimatedModule, 'Native animated module is not available');
}

let _warnedMissingNativeAnimated = false;

function shouldUseNativeDriver(
  config: $ReadOnly<{...AnimationConfig, ...}> | EventConfig<mixed>,
): boolean {
  if (config.useNativeDriver == null) {
    console.warn(
      'Animated: `useNativeDriver` was not specified. This is a required ' +
        'option and must be explicitly set to `true` or `false`',
    );
  }

  if (config.useNativeDriver === true && !NativeAnimatedModule) {
    if (process.env.NODE_ENV !== 'test') {
      if (!_warnedMissingNativeAnimated) {
        console.warn(
          'Animated: `useNativeDriver` is not supported because the native ' +
            'animated module is missing. Falling back to JS-based animation. To ' +
            'resolve this, add `RCTAnimation` module to this app, or remove ' +
            '`useNativeDriver`. ' +
            'Make sure to run `bundle exec pod install` first. Read more about autolinking: https://github.com/react-native-community/cli/blob/master/docs/autolinking.md',
        );
        _warnedMissingNativeAnimated = true;
      }
    }
    return false;
  }

  return config.useNativeDriver || false;
}

function transformDataType(value: number | string): number | string {
  // Change the string type to number type so we can reuse the same logic in
  // iOS and Android platform
  if (typeof value !== 'string') {
    return value;
  }

  // Normalize degrees and radians to a number expressed in radians
  if (value.endsWith('deg')) {
    const degrees = parseFloat(value) || 0;
    return (degrees * Math.PI) / 180.0;
  } else if (value.endsWith('rad')) {
    return parseFloat(value) || 0;
  } else {
    return value;
  }
}

export default {
  API,
  generateNewNodeTag,
  generateNewAnimationId,
  assertNativeAnimatedModule,
  shouldUseNativeDriver,
  shouldSignalBatch,
  transformDataType,
  // $FlowExpectedError[unsafe-getters-setters] - unsafe getter lint suppression
  // $FlowExpectedError[missing-type-arg] - unsafe getter lint suppression
  get nativeEventEmitter(): NativeEventEmitter {
    if (!nativeEventEmitter) {
      // $FlowFixMe[underconstrained-implicit-instantiation]
      nativeEventEmitter = new NativeEventEmitter(
        // T88715063: NativeEventEmitter only used this parameter on iOS. Now it uses it on all platforms, so this code was modified automatically to preserve its behavior
        // If you want to use the native module on other platforms, please remove this condition and test its behavior
        Platform.OS !== 'ios' ? null : NativeAnimatedModule,
      );
    }
    return nativeEventEmitter;
  },
};
