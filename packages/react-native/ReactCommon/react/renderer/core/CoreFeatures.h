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
 * Some of them are temporary and may be eventualy phased out
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
};

} // namespace react
} // namespace facebook
