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

  // When enabled, RCTScrollViewComponentView will trigger ShadowTree state
  // updates for all changes in scroll position.
  static bool enableGranularScrollViewStateUpdatesIOS;

  // When enabled, rawProps in Props will not include Yoga specific props.
  static bool excludeYogaFromRawProps;
};

} // namespace facebook::react
