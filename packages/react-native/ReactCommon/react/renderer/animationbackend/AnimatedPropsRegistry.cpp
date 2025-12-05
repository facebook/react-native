/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AnimatedPropsRegistry.h"
#include <react/renderer/core/PropsParserContext.h>
#include "AnimatedProps.h"

namespace facebook::react {

void AnimatedPropsRegistry::update(
    const std::unordered_map<SurfaceId, SurfaceUpdates>& surfaceUpdates) {
  auto lock = std::lock_guard(mutex_);
  for (const auto& [surfaceId, updates] : surfaceUpdates) {
    auto& surfaceContext = surfaceContexts_[surfaceId];
    auto& pendingMap = surfaceContext.pendingMap;
    auto& pendingFamilies = surfaceContext.pendingFamilies;

    auto& updatesMap = updates.propsMap;
    auto& updatesFamilies = updates.families;

    for (auto& family : updatesFamilies) {
      pendingFamilies.insert(family);
    }

    for (auto& [tag, animatedProps] : updatesMap) {
      auto it = pendingMap.find(tag);
      if (it == pendingMap.end()) {
        it = pendingMap.insert_or_assign(tag, std::make_unique<PropsSnapshot>())
                 .first;
      }
      auto& snapshot = it->second;
      auto& viewProps = snapshot->props;

      for (const auto& animatedProp : animatedProps.props) {
        snapshot->propNames.insert(animatedProp->propName);
        cloneProp(viewProps, *animatedProp);
      }
    }
  }
}

std::pair<std::unordered_set<const ShadowNodeFamily*>&, SnapshotMap&>
AnimatedPropsRegistry::getMap(SurfaceId surfaceId) {
  auto lock = std::lock_guard(mutex_);
  auto& [pendingMap, map, pendingFamilies, families] =
      surfaceContexts_[surfaceId];

  for (auto& family : pendingFamilies) {
    families.insert(family);
  }
  for (auto& [tag, propsSnapshot] : pendingMap) {
    auto currentIt = map.find(tag);
    if (currentIt == map.end()) {
      map.insert_or_assign(tag, std::move(propsSnapshot));
    } else {
      auto& currentSnapshot = currentIt->second;
      for (auto& propName : propsSnapshot->propNames) {
        currentSnapshot->propNames.insert(propName);
        updateProp(propName, currentSnapshot->props, *propsSnapshot);
      }
    }
  }
  pendingMap.clear();
  pendingFamilies.clear();

  return {families, map};
}

void AnimatedPropsRegistry::clear(SurfaceId surfaceId) {
  auto lock = std::lock_guard(mutex_);

  auto& surfaceContext = surfaceContexts_[surfaceId];
  surfaceContext.families.clear();
  surfaceContext.map.clear();
}

} // namespace facebook::react
