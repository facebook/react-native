/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/renderer/components/view/BaseViewProps.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerCommitHook.h>
#include "AnimatedProps.h"

namespace facebook::react {

struct PropsSnapshot {
  BaseViewProps props;
  std::unordered_set<PropName> propNames;
};

class AnimatedPropsRegistry {
 public:
  std::unordered_map<Tag, PropsSnapshot> map_;
  std::unordered_map<SurfaceId, std::unordered_set<const ShadowNodeFamily*>>
      surfaceToFamilies_;

  void update(
      std::unordered_map<Tag, AnimatedProps>& animatedPropsMap,
      std::unordered_set<const ShadowNodeFamily*>& families);
};

} // namespace facebook::react
