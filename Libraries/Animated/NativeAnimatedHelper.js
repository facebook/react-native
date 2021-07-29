/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import NativeAnimatedNonTurboModule from './NativeAnimatedModule';
import NativeAnimatedTurboModule from './NativeAnimatedTurboModule';
import NativeEventEmitter from '../EventEmitter/NativeEventEmitter';
import Platform from '../Utilities/Platform';
import type {EventConfig} from './AnimatedEvent';
import type {
  EventMapping,
  AnimatedNodeConfig,
  AnimatingNodeConfig,
} from './NativeAnimatedModule';
import type {AnimationConfig, EndCallback} from './animations/Animation';
import type {InterpolationConfigType} from './nodes/AnimatedInterpolation';
import invariant from 'invariant';

// TODO T69437152 @petetheheat - Delete this fork when Fabric ships to 100%.
const NativeAnimatedModule =
  Platform.OS === 'ios' && global.RN$Bridgeless
    ? NativeAnimatedTurboModule
    : NativeAnimatedNonTurboModule;

let __nativeAnimatedNodeTagCount = 1; /* used for animated nodes */
let __nativeAnimationIdCount = 1; /* used for started animations */

let nativeEventEmitter;

let waitingForQueuedOperations = new Set();
let queueOperations = false;
let queue: Array<() => void> = [];

/**
 * Simple wrappers around NativeAnimatedModule to provide flow and autocomplete support for
 * the native module methods
 */
const API = {
  getValue: function(
    tag: number,
    saveValueCallback: (value: number) => void,
  ): void {
    invariant(NativeAnimatedModule, 'Native animated module is not available');
    if (NativeAnimatedModule.getValue) {
      NativeAnimatedModule.getValue(tag, saveValueCallback);
    }
  },
  setWaitingForIdentifier: function(id: string): void {
    waitingForQueuedOperations.add(id);
    queueOperations = true;
  },
  unsetWaitingForIdentifier: function(id: string): void {
    waitingForQueuedOperations.delete(id);

    if (waitingForQueuedOperations.size === 0) {
      queueOperations = false;
      API.disableQueue();
    }
  },
  disableQueue: function(): void {
    invariant(NativeAnimatedModule, 'Native animated module is not available');

    if (Platform.OS === 'android') {
      NativeAnimatedModule.startOperationBatch();
    }
    for (let q = 0, l = queue.length; q < l; q++) {
      queue[q]();
    }
    queue.length = 0;
    if (Platform.OS === 'android') {
      NativeAnimatedModule.finishOperationBatch();
    }
  },
  queueOperation: (fn: () => void): void => {
    if (queueOperations) {
      queue.push(fn);
    } else {
      fn();
    }
  },
  createAnimatedNode: function(tag: number, config: AnimatedNodeConfig): void {
    invariant(NativeAnimatedModule, 'Native animated module is not available');
    API.queueOperation(() =>
      NativeAnimatedModule.createAnimatedNode(tag, config),
    );
  },
  startListeningToAnimatedNodeValue: function(tag: number) {
    invariant(NativeAnimatedModule, 'Native animated module is not available');
    API.queueOperation(() =>
      NativeAnimatedModule.startListeningToAnimatedNodeValue(tag),
    );
  },
  stopListeningToAnimatedNodeValue: function(tag: number) {
    invariant(NativeAnimatedModule, 'Native animated module is not available');
    API.queueOperation(() =>
      NativeAnimatedModule.stopListeningToAnimatedNodeValue(tag),
    );
  },
  connectAnimatedNodes: function(parentTag: number, childTag: number): void {
    invariant(NativeAnimatedModule, 'Native animated module is not available');
    API.queueOperation(() =>
      NativeAnimatedModule.connectAnimatedNodes(parentTag, childTag),
    );
  },
  disconnectAnimatedNodes: function(parentTag: number, childTag: number): void {
    invariant(NativeAnimatedModule, 'Native animated module is not available');
    API.queueOperation(() =>
      NativeAnimatedModule.disconnectAnimatedNodes(parentTag, childTag),
    );
  },
  startAnimatingNode: function(
    animationId: number,
    nodeTag: number,
    config: AnimatingNodeConfig,
    endCallback: EndCallback,
  ): void {
    invariant(NativeAnimatedModule, 'Native animated module is not available');
    API.queueOperation(() =>
      NativeAnimatedModule.startAnimatingNode(
        animationId,
        nodeTag,
        config,
        endCallback,
      ),
    );
  },
  stopAnimation: function(animationId: number) {
    invariant(NativeAnimatedModule, 'Native animated module is not available');
    API.queueOperation(() => NativeAnimatedModule.stopAnimation(animationId));
  },
  setAnimatedNodeValue: function(nodeTag: number, value: number): void {
    invariant(NativeAnimatedModule, 'Native animated module is not available');
    API.queueOperation(() =>
      NativeAnimatedModule.setAnimatedNodeValue(nodeTag, value),
    );
  },
  setAnimatedNodeOffset: function(nodeTag: number, offset: number): void {
    invariant(NativeAnimatedModule, 'Native animated module is not available');
    API.queueOperation(() =>
      NativeAnimatedModule.setAnimatedNodeOffset(nodeTag, offset),
    );
  },
  flattenAnimatedNodeOffset: function(nodeTag: number): void {
    invariant(NativeAnimatedModule, 'Native animated module is not available');
    API.queueOperation(() =>
      NativeAnimatedModule.flattenAnimatedNodeOffset(nodeTag),
    );
  },
  extractAnimatedNodeOffset: function(nodeTag: number): void {
    invariant(NativeAnimatedModule, 'Native animated module is not available');
    API.queueOperation(() =>
      NativeAnimatedModule.extractAnimatedNodeOffset(nodeTag),
    );
  },
  connectAnimatedNodeToView: function(nodeTag: number, viewTag: number): void {
    invariant(NativeAnimatedModule, 'Native animated module is not available');
    API.queueOperation(() =>
      NativeAnimatedModule.connectAnimatedNodeToView(nodeTag, viewTag),
    );
  },
  disconnectAnimatedNodeFromView: function(
    nodeTag: number,
    viewTag: number,
  ): void {
    invariant(NativeAnimatedModule, 'Native animated module is not available');
    API.queueOperation(() =>
      NativeAnimatedModule.disconnectAnimatedNodeFromView(nodeTag, viewTag),
    );
  },
  restoreDefaultValues: function(nodeTag: number): void {
    invariant(NativeAnimatedModule, 'Native animated module is not available');
    // Backwards compat with older native runtimes, can be removed later.
    if (NativeAnimatedModule.restoreDefaultValues != null) {
      API.queueOperation(() =>
        NativeAnimatedModule.restoreDefaultValues(nodeTag),
      );
    }
  },
  dropAnimatedNode: function(tag: number): void {
    invariant(NativeAnimatedModule, 'Native animated module is not available');
    API.queueOperation(() => NativeAnimatedModule.dropAnimatedNode(tag));
  },
  addAnimatedEventToView: function(
    viewTag: number,
    eventName: string,
    eventMapping: EventMapping,
  ) {
    invariant(NativeAnimatedModule, 'Native animated module is not available');
    API.queueOperation(() =>
      NativeAnimatedModule.addAnimatedEventToView(
        viewTag,
        eventName,
        eventMapping,
      ),
    );
  },
  removeAnimatedEventFromView(
    viewTag: number,
    eventName: string,
    animatedNodeTag: number,
  ) {
    invariant(NativeAnimatedModule, 'Native animated module is not available');
    API.queueOperation(() =>
      NativeAnimatedModule.removeAnimatedEventFromView(
        viewTag,
        eventName,
        animatedNodeTag,
      ),
    );
  },
};

/**
 * Styles allowed by the native animated implementation.
 *
 * In general native animated implementation should support any numeric property that doesn't need
 * to be updated through the shadow view hierarchy (all non-layout properties).
 */
const SUPPORTED_STYLES = {
  opacity: true,
  transform: true,
  borderRadius: true,
  borderBottomEndRadius: true,
  borderBottomLeftRadius: true,
  borderBottomRightRadius: true,
  borderBottomStartRadius: true,
  borderTopEndRadius: true,
  borderTopLeftRadius: true,
  borderTopRightRadius: true,
  borderTopStartRadius: true,
  elevation: true,
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
  SUPPORTED_STYLES[prop] = true;
}

function addWhitelistedTransformProp(prop: string): void {
  SUPPORTED_TRANSFORMS[prop] = true;
}

function addWhitelistedInterpolationParam(param: string): void {
  SUPPORTED_INTERPOLATION_PARAMS[param] = true;
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
    if (!SUPPORTED_TRANSFORMS.hasOwnProperty(config.property)) {
      throw new Error(
        `Property '${config.property}' is not supported by native animated module`,
      );
    }
  });
}

function validateStyles(styles: {[key: string]: ?number, ...}): void {
  for (const key in styles) {
    if (!SUPPORTED_STYLES.hasOwnProperty(key)) {
      throw new Error(
        `Style property '${key}' is not supported by native animated module`,
      );
    }
  }
}

function validateInterpolation(config: InterpolationConfigType): void {
  for (const key in config) {
    if (!SUPPORTED_INTERPOLATION_PARAMS.hasOwnProperty(key)) {
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
  config: {...AnimationConfig, ...} | EventConfig,
): boolean {
  if (config.useNativeDriver == null) {
    console.warn(
      'Animated: `useNativeDriver` was not specified. This is a required ' +
        'option and must be explicitly set to `true` or `false`',
    );
  }

  if (config.useNativeDriver === true && !NativeAnimatedModule) {
    if (!_warnedMissingNativeAnimated) {
      console.warn(
        'Animated: `useNativeDriver` is not supported because the native ' +
          'animated module is missing. Falling back to JS-based animation. To ' +
          'resolve this, add `RCTAnimation` module to this app, or remove ' +
          '`useNativeDriver`. ' +
          'Make sure to run `pod install` first. Read more about autolinking: https://github.com/react-native-community/cli/blob/master/docs/autolinking.md',
      );
      _warnedMissingNativeAnimated = true;
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

module.exports = {
  API,
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
      nativeEventEmitter = new NativeEventEmitter(
        // T88715063: NativeEventEmitter only used this parameter on iOS. Now it uses it on all platforms, so this code was modified automatically to preserve its behavior
        // If you want to use the native module on other platforms, please remove this condition and test its behavior
        Platform.OS !== 'ios' ? null : NativeAnimatedModule,
      );
    }
    return nativeEventEmitter;
  },
};
