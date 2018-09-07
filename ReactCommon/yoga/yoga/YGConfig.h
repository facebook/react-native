/*
 *  Copyright (c) 2014-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#pragma once
#include "Yoga-internal.h"
#include "Yoga.h"

struct YGConfig {
  std::array<bool, YGExperimentalFeatureCount> experimentalFeatures;
  bool useWebDefaults;
  bool useLegacyStretchBehaviour;
  bool shouldDiffLayoutWithoutLegacyStretchBehaviour;
  float pointScaleFactor;
  YGLogger logger;
  YGCloneNodeFunc cloneNodeCallback;
  void* context;
  bool printTree;

  YGConfig(YGLogger logger);
};
