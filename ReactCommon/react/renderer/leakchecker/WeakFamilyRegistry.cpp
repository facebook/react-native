/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "WeakFamilyRegistry.h"

namespace facebook {
namespace react {

void WeakFamilyRegistry::add(
    ShadowNodeFamily::Shared const &shadowNodeFamily) const {
  std::lock_guard<std::mutex> lock(familiesMutex_);
  ShadowNodeFamily::Weak weakFamily = shadowNodeFamily;
  families_[shadowNodeFamily->getSurfaceId()].push_back(weakFamily);
}

void WeakFamilyRegistry::removeFamiliesWithSurfaceId(
    SurfaceId surfaceId) const {
  std::lock_guard<std::mutex> lock(familiesMutex_);
  families_.erase(surfaceId);
}

WeakFamilyRegistry::WeakFamilies WeakFamilyRegistry::weakFamiliesForSurfaceId(
    SurfaceId surfaceId) const {
  std::lock_guard<std::mutex> lock(familiesMutex_);
  if (families_.find(surfaceId) != families_.end()) {
    return families_[surfaceId];
  } else {
    return {};
  }
}

} // namespace react
} // namespace facebook
