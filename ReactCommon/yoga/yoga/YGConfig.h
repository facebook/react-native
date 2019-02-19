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
private:
  YGLogger logger_;

public:
  bool useWebDefaults = false;
  bool useLegacyStretchBehaviour = false;
  bool shouldDiffLayoutWithoutLegacyStretchBehaviour = false;
  bool printTree = false;
  float pointScaleFactor = 1.0f;
  YGCloneNodeFunc cloneNodeCallback = nullptr;
  std::array<bool, facebook::yoga::enums::count<YGExperimentalFeature>()>
      experimentalFeatures = {};
  void* context = nullptr;
  YGMarkerCallbacks markerCallbacks = {nullptr, nullptr};

  YGConfig(YGLogger logger);
  void log(YGConfig*, YGNode*, YGLogLevel, const char*, va_list);
  void setLogger(YGLogger logger) {
    logger_ = logger;
  }
};
