/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {EventSubscription} from '../vendor/emitter/EventEmitter';
import type {EventConfig} from './AnimatedEvent';
import type {AnimationConfig, EndCallback} from './animations/Animation';
import type {
  AnimatedNodeConfig,
  AnimatingNodeConfig,
  EventMapping,
} from './NativeAnimatedModule';
import type {InterpolationConfigType} from './nodes/AnimatedInterpolation';

import NativeEventEmitter from '../EventEmitter/NativeEventEmitter';
import RCTDeviceEventEmitter from '../EventEmitter/RCTDeviceEventEmitter';
import ReactNativeFeatureFlags from '../ReactNative/ReactNativeFeatureFlags';
import Platform from '../Utilities/Platform';
import NativeAnimatedNonTurboModule from './NativeAnimatedModule';
import NativeAnimatedTurboModule from './NativeAnimatedTurboModule';
import invariant from 'invariant';

// TODO T69437152 @petetheheat - Delete this fork when Fabric ships to 100%.
const NativeAnimatedModule =
  Platform.OS === 'ios' && global.RN$Bridgeless === true
    ? NativeAnimatedTurboModule
    : NativeAnimatedNonTurboModule;

let __nativeAnimatedNodeTagCount = 1; /* used for animated nodes */
let __nativeAnimationIdCount = 1; /* used for started animations */

let nativeEventEmitter;

let waitingForQueuedOperations = new Set<string>();
let queueOperations = false;
let queue: Array<() => void> = [];
// $FlowFixMe
let singleOpQueue: Array<any> = [];

const useSingleOpBatching =
  Platform.OS === 'android' &&
  !!NativeAnimatedModule?.queueAndExecuteBatchedOperations &&
  ReactNativeFeatureFlags.animatedShouldUseSingleOp();
let flushQueueTimeout = null;

const eventListenerGetValueCallbacks: {
  [$FlowFixMe | number]: ((value: number) => void) | void,
} = {};
const eventListenerAnimationFinishedCallbacks: {
  [$FlowFixMe | number]: EndCallback | void,
} = {};
let globalEventEmitterGetValueListener: ?EventSubscription = null;
let globalEventEmitterAnimationFinishedListener: ?EventSubscription = null;

const nativeOps: ?typeof NativeAnimatedModule = useSingleOpBatching
  ? ((function () {
      const apis = [
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
      return apis.reduce<{[string]: number}>((acc, functionName, i) => {
        // These indices need to be kept in sync with the indices in native (see NativeAnimatedModule in Java, or the equivalent for any other native platform).
        // $FlowFixMe[prop-missing]
        acc[functionName] = i + 1;
        return acc;
      }, {});
    })(): $FlowFixMe)
  : NativeAnimatedModule;

/**
 * Wrappers around NativeAnimatedModule to provide flow and autocomplete support for
 * the native module methods, and automatic queue management on Android
 */
const API = {
  getValue: function (
    tag: number,
    saveValueCallback: (value: number) => void,
  ): void {
    invariant(nativeOps, 'Native animated module is not available');
    if (useSingleOpBatching) {
      if (saveValueCallback) {
        eventListenerGetValueCallbacks[tag] = saveValueCallback;
      }
      // $FlowFixMe
      API.queueOperation(nativeOps.getValue, tag);
    } else {
      API.queueOperation(nativeOps.getValue, tag, saveValueCallback);
    }
  },
  setWaitingForIdentifier: function (id: string): void {
    waitingForQueuedOperations.add(id);
    queueOperations = true;
    if (
      ReactNativeFeatureFlags.animatedShouldDebounceQueueFlush() &&
      flushQueueTimeout
    ) {
      clearTimeout(flushQueueTimeout);
    }
  },
  unsetWaitingForIdentifier: function (id: string): void {
    waitingForQueuedOperations.delete(id);

    if (waitingForQueuedOperations.size === 0) {
      queueOperations = false;
      API.disableQueue();
    }
  },
  disableQueue: function (): void {
    invariant(nativeOps, 'Native animated module is not available');

    if (ReactNativeFeatureFlags.animatedShouldDebounceQueueFlush()) {
      const prevTimeout = flushQueueTimeout;
      clearImmediate(prevTimeout);
      flushQueueTimeout = setImmediate(API.flushQueue);
    } else {
      API.flushQueue();
    }
  },
  flushQueue: function (): void {
    // TODO: (T136971132)
    invariant(
      NativeAnimatedModule || process.env.NODE_ENV === 'test',
      'Native animated module is not available',
    );
    flushQueueTimeout = null;

    // Early returns before calling any APIs
    if (useSingleOpBatching && singleOpQueue.length === 0) {
      return;
    }
    if (!useSingleOpBatching && queue.length === 0) {
      return;
    }

    if (useSingleOpBatching) {
      // Set up event listener for callbacks if it's not set up
      if (
        !globalEventEmitterGetValueListener ||
        !globalEventEmitterAnimationFinishedListener
      ) {
        setupGlobalEventEmitterListeners();
      }
      // Single op batching doesn't use callback functions, instead we
      // use RCTDeviceEventEmitter. This reduces overhead of sending lots of
      // JSI functions across to native code; but also, TM infrastructure currently
      // does not support packing a function into native arrays.
      NativeAnimatedModule?.queueAndExecuteBatchedOperations?.(singleOpQueue);
      singleOpQueue.length = 0;
    } else {
      Platform.OS === 'android' &&
        NativeAnimatedModule?.startOperationBatch?.();

      for (let q = 0, l = queue.length; q < l; q++) {
        queue[q]();
      }
      queue.length = 0;
      Platform.OS === 'android' &&
        NativeAnimatedModule?.finishOperationBatch?.();
    }
  },
  queueOperation: <Args: $ReadOnlyArray<mixed>, Fn: (...Args) => void>(
    fn: Fn,
    ...args: Args
  ): void => {
    if (useSingleOpBatching) {
      // Get the command ID from the queued function, and push that ID and any arguments needed to execute the operation
      // $FlowFixMe: surprise, fn is actually a number
      singleOpQueue.push(fn, ...args);
      return;
    }

    // If queueing is explicitly on, *or* the queue has not yet
    // been flushed, use the queue. This is to prevent operations
    // from being executed out of order.
    if (queueOperations || queue.length !== 0) {
      queue.push(() => fn(...args));
    } else {
      fn(...args);
    }
  },
  createAnimatedNode: function (tag: number, config: AnimatedNodeConfig): void {
    invariant(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.createAnimatedNode, tag, config);
  },
  updateAnimatedNodeConfig: function (
    tag: number,
    config: AnimatedNodeConfig,
  ): void {
    invariant(nativeOps, 'Native animated module is not available');
    if (nativeOps.updateAnimatedNodeConfig) {
      API.queueOperation(nativeOps.updateAnimatedNodeConfig, tag, config);
    }
  },
  startListeningToAnimatedNodeValue: function (tag: number) {
    invariant(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.startListeningToAnimatedNodeValue, tag);
  },
  stopListeningToAnimatedNodeValue: function (tag: number) {
    invariant(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.stopListeningToAnimatedNodeValue, tag);
  },
  connectAnimatedNodes: function (parentTag: number, childTag: number): void {
    invariant(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.connectAnimatedNodes, parentTag, childTag);
  },
  disconnectAnimatedNodes: function (
    parentTag: number,
    childTag: number,
  ): void {
    invariant(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.disconnectAnimatedNodes, parentTag, childTag);
  },
  startAnimatingNode: function (
    animationId: number,
    nodeTag: number,
    config: AnimatingNodeConfig,
    endCallback: EndCallback,
  ): void {
    invariant(nativeOps, 'Native animated module is not available');
    if (useSingleOpBatching) {
      if (endCallback) {
        eventListenerAnimationFinishedCallbacks[animationId] = endCallback;
      }
      // $FlowFixMe
      API.queueOperation(
        // $FlowFixMe[incompatible-call]
        nativeOps.startAnimatingNode,
        animationId,
        nodeTag,
        config,
      );
    } else {
      API.queueOperation(
        nativeOps.startAnimatingNode,
        animationId,
        nodeTag,
        config,
        endCallback,
      );
    }
  },
  stopAnimation: function (animationId: number) {
    invariant(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.stopAnimation, animationId);
  },
  setAnimatedNodeValue: function (nodeTag: number, value: number): void {
    invariant(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.setAnimatedNodeValue, nodeTag, value);
  },
  setAnimatedNodeOffset: function (nodeTag: number, offset: number): void {
    invariant(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.setAnimatedNodeOffset, nodeTag, offset);
  },
  flattenAnimatedNodeOffset: function (nodeTag: number): void {
    invariant(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.flattenAnimatedNodeOffset, nodeTag);
  },
  extractAnimatedNodeOffset: function (nodeTag: number): void {
    invariant(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.extractAnimatedNodeOffset, nodeTag);
  },
  connectAnimatedNodeToView: function (nodeTag: number, viewTag: number): void {
    invariant(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.connectAnimatedNodeToView, nodeTag, viewTag);
  },
  disconnectAnimatedNodeFromView: function (
    nodeTag: number,
    viewTag: number,
  ): void {
    invariant(nativeOps, 'Native animated module is not available');
    API.queueOperation(
      nativeOps.disconnectAnimatedNodeFromView,
      nodeTag,
      viewTag,
    );
  },
  restoreDefaultValues: function (nodeTag: number): void {
    invariant(nativeOps, 'Native animated module is not available');
    // Backwards compat with older native runtimes, can be removed later.
    if (nativeOps.restoreDefaultValues != null) {
      API.queueOperation(nativeOps.restoreDefaultValues, nodeTag);
    }
  },
  dropAnimatedNode: function (tag: number): void {
    invariant(nativeOps, 'Native animated module is not available');
    API.queueOperation(nativeOps.dropAnimatedNode, tag);
  },
  addAnimatedEventToView: function (
    viewTag: number,
    eventName: string,
    eventMapping: EventMapping,
  ) {
    invariant(nativeOps, 'Native animated module is not available');
    API.queueOperation(
      nativeOps.addAnimatedEventToView,
      viewTag,
      eventName,
      eventMapping,
    );
  },
  removeAnimatedEventFromView(
    viewTag: number,
    eventName: string,
    animatedNodeTag: number,
  ) {
    invariant(nativeOps, 'Native animated module is not available');
    API.queueOperation(
      nativeOps.removeAnimatedEventFromView,
      viewTag,
      eventName,
      animatedNodeTag,
    );
  },
};

function setupGlobalEventEmitterListeners() {
  globalEventEmitterGetValueListener = RCTDeviceEventEmitter.addListener(
    'onNativeAnimatedModuleGetValue',
    function (params) {
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
      function (params) {
        const {animationId} = params;
        const callback = eventListenerAnimationFinishedCallbacks[animationId];
        if (!callback) {
          return;
        }
        callback(params);
        delete eventListenerAnimationFinishedCallbacks[animationId];
      },
    );
}

/**
 * Styles allowed by the native animated implementation.
 *
 * In general native animated implementation should support any numeric or color property that
 * doesn't need to be updated through the shadow view hierarchy (all non-layout properties).
 */
const SUPPORTED_COLOR_STYLES = {
  backgroundColor: true,
  borderBottomColor: true,
  borderColor: true,
  borderEndColor: true,
  borderLeftColor: true,
  borderRightColor: true,
  borderStartColor: true,
  borderTopColor: true,
  color: true,
  tintColor: true,
};

const SUPPORTED_STYLES = {
  ...SUPPORTED_COLOR_STYLES,
  borderBottomEndRadius: true,
  borderBottomLeftRadius: true,
  borderBottomRightRadius: true,
  borderBottomStartRadius: true,
  borderEndEndRadius: true,
  borderEndStartRadius: true,
  borderRadius: true,
  borderTopEndRadius: true,
  borderTopLeftRadius: true,
  borderTopRightRadius: true,
  borderTopStartRadius: true,
  borderStartEndRadius: true,
  borderStartStartRadius: true,
  elevation: true,
  opacity: true,
  transform: true,
  zIndex: true,
  /* ios styles */
  shadowOpacity: true,
  shadowRadius: true,
  /* legacy android transform properties */
  scaleX: true,
  scaleY: true,
  translateX: true,
  translateY: true,
};

const SUPPORTED_TRANSFORMS = {
  translateX: true,
  translateY: true,
  scale: true,
  scaleX: true,
  scaleY: true,
  rotate: true,
  rotateX: true,
  rotateY: true,
  rotateZ: true,
  perspective: true,
};

const SUPPORTED_INTERPOLATION_PARAMS = {
  inputRange: true,
  outputRange: true,
  extrapolate: true,
  extrapolateRight: true,
  extrapolateLeft: true,
};

function addWhitelistedStyleProp(prop: string): void {
  // $FlowFixMe[prop-missing]
  SUPPORTED_STYLES[prop] = true;
}

function addWhitelistedTransformProp(prop: string): void {
  // $FlowFixMe[prop-missing]
  SUPPORTED_TRANSFORMS[prop] = true;
}

function addWhitelistedInterpolationParam(param: string): void {
  // $FlowFixMe[prop-missing]
  SUPPORTED_INTERPOLATION_PARAMS[param] = true;
}

function isSupportedColorStyleProp(prop: string): boolean {
  return SUPPORTED_COLOR_STYLES.hasOwnProperty(prop);
}

function isSupportedStyleProp(prop: string): boolean {
  return SUPPORTED_STYLES.hasOwnProperty(prop);
}

function isSupportedTransformProp(prop: string): boolean {
  return SUPPORTED_TRANSFORMS.hasOwnProperty(prop);
}

function isSupportedInterpolationParam(param: string): boolean {
  return SUPPORTED_INTERPOLATION_PARAMS.hasOwnProperty(param);
}

function validateTransform(
  configs: Array<
    | {
        type: 'animated',
        property: string,
        nodeTag: ?number,
        ...
      }
    | {
        type: 'static',
        property: string,
        value: number | string,
        ...
      },
  >,
): void {
  configs.forEach(config => {
    if (!isSupportedTransformProp(config.property)) {
      throw new Error(
        `Property '${config.property}' is not supported by native animated module`,
      );
    }
  });
}

function validateStyles(styles: {[key: string]: ?number, ...}): void {
  for (const key in styles) {
    if (!isSupportedStyleProp(key)) {
      throw new Error(
        `Style property '${key}' is not supported by native animated module`,
      );
    }
  }
}

function validateInterpolation<OutputT: number | string>(
  config: InterpolationConfigType<OutputT>,
): void {
  for (const key in config) {
    if (!isSupportedInterpolationParam(key)) {
      throw new Error(
        `Interpolation property '${key}' is not supported by native animated module`,
      );
    }
  }
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
  config: $ReadOnly<{...AnimationConfig, ...}> | EventConfig,
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
  if (/deg$/.test(value)) {
    const degrees = parseFloat(value) || 0;
    const radians = (degrees * Math.PI) / 180.0;
    return radians;
  } else {
    return value;
  }
}

export default {
  API,
  isSupportedColorStyleProp,
  isSupportedStyleProp,
  isSupportedTransformProp,
  isSupportedInterpolationParam,
  addWhitelistedStyleProp,
  addWhitelistedTransformProp,
  addWhitelistedInterpolationParam,
  validateStyles,
  validateTransform,
  validateInterpolation,
  generateNewNodeTag,
  generateNewAnimationId,
  assertNativeAnimatedModule,
  shouldUseNativeDriver,
  transformDataType,
  // $FlowExpectedError[unsafe-getters-setters] - unsafe getter lint suppresion
  // $FlowExpectedError[missing-type-arg] - unsafe getter lint suppresion
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
