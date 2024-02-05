/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {FeatureFlagDefinitions} from './types';

const definitions: FeatureFlagDefinitions = {
  common: {
    // This is only used in unit tests for the feature flags system.
    commonTestFlag: {
      description: 'Common flag for testing. Do NOT modify.',
      defaultValue: false,
    },

    useModernRuntimeScheduler: {
      description:
        'When enabled, it uses the modern fork of RuntimeScheduler that allows scheduling tasks with priorities from any thread.',
      defaultValue: false,
    },
    enableMicrotasks: {
      description:
        'Enables the use of microtasks in Hermes (scheduling) and RuntimeScheduler (execution).',
      defaultValue: false,
    },
    batchRenderingUpdatesInEventLoop: {
      description:
        'When enabled, the RuntimeScheduler processing the event loop will batch all rendering updates and dispatch them together at the end of each iteration of the loop.',
      defaultValue: false,
    },
    enableSpannableBuildingUnification: {
      description:
        'Uses new, deduplicated logic for constructing Android Spannables from text fragments',
      defaultValue: false,
    },
    enableCustomDrawOrderFabric: {
      description:
        'When enabled, Fabric will use customDrawOrder in ReactViewGroup (similar to old architecture).',
      defaultValue: false,
    },
    enableFixForClippedSubviewsCrash: {
      description:
        'Attempt at fixing a crash related to subview clipping on Android. This is a kill switch for the fix',
      defaultValue: false,
    },
  },

  jsOnly: {
    // This is only used in unit tests for the feature flags system.
    jsOnlyTestFlag: {
      description: 'JS-only flag for testing. Do NOT modify.',
      defaultValue: false,
    },

    isLayoutAnimationEnabled: {
      description:
        'Function used to enable / disabled Layout Animations in React Native.',
      defaultValue: true,
    },
    animatedShouldDebounceQueueFlush: {
      description:
        'Enables an experimental flush-queue debouncing in Animated.js.',
      defaultValue: false,
    },
    animatedShouldUseSingleOp: {
      description:
        'Enables an experimental mega-operation for Animated.js that replaces many calls to native with a single call into native, to reduce JSI/JNI traffic.',
      defaultValue: false,
    },
    enableAccessToHostTreeInFabric: {
      description:
        'Enables access to the host tree in Fabric using DOM-compatible APIs.',
      defaultValue: false,
    },
    shouldUseAnimatedObjectForTransform: {
      description:
        'Enables use of AnimatedObject for animating transform values.',
      defaultValue: false,
    },
    shouldUseSetNativePropsInFabric: {
      description: 'Enables use of setNativeProps in JS driven animations.',
      defaultValue: true,
    },
    shouldUseRemoveClippedSubviewsAsDefaultOnIOS: {
      description:
        'removeClippedSubviews prop will be used as the default in FlatList on iOS to match Android',
      defaultValue: false,
    },
  },
};

export default definitions;
