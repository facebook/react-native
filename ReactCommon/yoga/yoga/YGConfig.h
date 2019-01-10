/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once
#include "YGMarker.h"
#include "Yoga-internal.h"
#include "Yoga.h"

struct YGConfig {
  std::array<bool, facebook::yoga::enums::count<YGExperimentalFeature>()>
      experimentalFeatures = {};
  bool useWebDefaults = false;
  bool useLegacyStretchBehaviour = false;
  bool shouldDiffLayoutWithoutLegacyStretchBehaviour = false;
  bool printTree = false;
  float pointScaleFactor = 1.0f;
  YGLogger logger;
  YGCloneNodeFunc cloneNodeCallback = nullptr;
  void* context = nullptr;
  YGMarkerCallbacks markerCallbacks = {nullptr, nullptr};

  YGConfig(YGLogger logger);
};
