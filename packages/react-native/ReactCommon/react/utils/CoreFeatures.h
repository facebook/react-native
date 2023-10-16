/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook::react {

/*
 * Contains the set of feature flags for the renderer core.
 * Some of them are temporary and may be eventually phased out
 * as soon as the feature is fully implemented.
 */
class CoreFeatures {
 public:
  // Specifies whether the iterator-style prop parsing is enabled.
  static bool enablePropIteratorSetter;

  // When enabled, Fabric will block paint to allow for state updates in
  // useLayoutEffect hooks to be processed. This changes affects scheduling of
  // when a transaction is mounted.
  static bool blockPaintForUseLayoutEffect;

  // Whether to use Hermes' NativeState instead of HostObject
  // in simple data passing scenarios with JS
  static bool useNativeState;

  // Yoga might measure multiple times the same Text with the same constraints
  // This flag enables a caching mechanism to avoid subsequents measurements
  // of the same Text with the same constrainst.
  // On iOS, we also cache NSTextStorage.
  static bool cacheLastTextMeasurement;

  // Fabric was not cancelling image downloads when <ImageView /> was removed
  // from view hierarchy. This feature flag enables this feature.
  static bool cancelImageDownloadsOnRecycle;

  // When enabled, RCTScrollViewComponentView will trigger ShadowTree state
  // updates for all changes in scroll position.
  static bool enableGranularScrollViewStateUpdatesIOS;

  // Report mount operations from the host platform to notify mount hooks.
  static bool enableMountHooks;

  // Only swap left and right on Android in RTL scripts.
  static bool doNotSwapLeftAndRightOnAndroidInLTR;

  // Clean yoga node when <Text /> does not change.
  static bool enableCleanParagraphYogaNode;

  // Fire `onScroll` events continuously on iOS without a `scrollEventThrottle`
  // props, and provide continuous `onScroll` upates like other platforms.
  static bool disableScrollEventThrottleRequirement;

  // When enabled, the renderer would only fail commits when they propagate
  // state and the last commit that updated state changed before committing.
  static bool enableGranularShadowTreeStateReconciliation;

  // Default state updates and events to async batched priority.
  static bool enableDefaultAsyncBatchedPriority;

  // When enabled, Fabric will avoid cloning notes to perform state progression.
  static bool enableClonelessStateProgression;

  // When enabled, rawProps in Props will not include Yoga specific props.
  static bool excludeYogaFromRawProps;
};

} // namespace facebook::react
