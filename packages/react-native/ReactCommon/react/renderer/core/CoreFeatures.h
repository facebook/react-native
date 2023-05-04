/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook {
namespace react {

/*
 * Contains the set of feature flags for the renderer core.
 * Some of them are temporary and may be eventually phased out
 * as soon as the feature is fully implemented.
 */
class CoreFeatures {
 public:
  // Specifies whether the iterator-style prop parsing is enabled.
  static bool enablePropIteratorSetter;

  // This is used as a feature flag for *all* PropsX structs.
  // For MapBuffer to be used for a particular component instance,
  // its ShadowNode traits must set the MapBuffer trait; and this
  // must be set to "true" globally.
  static bool enableMapBuffer;

  // When enabled, Fabric will block paint to allow for state updates in
  // useLayoutEffect hooks to be processed. This changes affects scheduling of
  // when a transaction is mounted.
  static bool blockPaintForUseLayoutEffect;

  // Whether to use Hermes' NativeState instead of HostObject
  // in simple data passing scenarios with JS
  static bool useNativeState;

  // Creating NSTextStorage is relatively expensive operation and we were
  // creating it twice. Once when measuring text and once when rendering it.
  // This flag caches it inside ParagraphState.
  static bool cacheNSTextStorage;

  // Yoga might measure multiple times the same Text with the same constraints
  // This flag enables a caching mechanism to avoid subsequents measurements
  // of the same Text with the same constrainst.
  static bool cacheLastTextMeasurement;

  // Fabric was not cancelling image downloads when <ImageView /> was removed
  // from view hierarchy. This feature flag enables this feature.
  static bool cancelImageDownloadsOnRecycle;
};

} // namespace react
} // namespace facebook
