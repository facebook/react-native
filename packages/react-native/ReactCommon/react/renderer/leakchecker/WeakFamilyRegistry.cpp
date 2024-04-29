/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "WeakFamilyRegistry.h"

namespace facebook::react {

void WeakFamilyRegistry::add(
    const ShadowNodeFamily::Shared& shadowNodeFamily) const {
  std::scoped_lock lock(familiesMutex_);
  ShadowNodeFamily::Weak weakFamily = shadowNodeFamily;
  families_[shadowNodeFamily->getSurfaceId()].push_back(weakFamily);
}

void WeakFamilyRegistry::removeFamiliesWithSurfaceId(
    SurfaceId surfaceId) const {
  std::scoped_lock lock(familiesMutex_);
  families_.erase(surfaceId);
}

WeakFamilyRegistry::WeakFamilies WeakFamilyRegistry::weakFamiliesForSurfaceId(
    SurfaceId surfaceId) const {
  std::scoped_lock lock(familiesMutex_);
  if (families_.find(surfaceId) != families_.end()) {
    return families_[surfaceId];
  }
  return {};
}

} // namespace facebook::react
