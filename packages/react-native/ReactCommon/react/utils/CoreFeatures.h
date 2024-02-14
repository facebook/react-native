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

  // Yoga might measure multiple times the same Text with the same constraints
  // This flag enables a caching mechanism to avoid subsequents measurements
  // of the same Text with the same constrainst.
  // On iOS, we also cache NSTextStorage.
  static bool cacheLastTextMeasurement;

  // When enabled, RCTScrollViewComponentView will trigger ShadowTree state
  // updates for all changes in scroll position.
  static bool enableGranularScrollViewStateUpdatesIOS;

  // Report mount operations from the host platform to notify mount hooks.
  static bool enableMountHooks;

  // When enabled, the renderer would only fail commits when they propagate
  // state and the last commit that updated state changed before committing.
  static bool enableGranularShadowTreeStateReconciliation;

  // When enabled, Fabric will avoid cloning notes to perform state progression.
  static bool enableClonelessStateProgression;

  // When enabled, rawProps in Props will not include Yoga specific props.
  static bool excludeYogaFromRawProps;

  // Report paint time inside the Event Timing API implementation
  // (PerformanceObserver).
  static bool enableReportEventPaintTime;
};

} // namespace facebook::react
